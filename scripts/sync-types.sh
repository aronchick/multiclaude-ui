#!/usr/bin/env bash
#
# sync-types.sh - Check TypeScript types against Go source
#
# This script compares type definitions between:
#   - Go source: multiclaude/internal/state/state.go
#   - TypeScript: packages/core/src/types.ts
#
# Usage:
#   ./scripts/sync-types.sh           # Check for discrepancies
#   ./scripts/sync-types.sh --verbose # Show detailed comparison
#   ./scripts/sync-types.sh --help    # Show help

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
GO_SOURCE="${ROOT_DIR}/multiclaude/internal/state/state.go"
TS_TARGET="${ROOT_DIR}/packages/core/src/types.ts"

# Parse arguments
VERBOSE=false
HELP=false

for arg in "$@"; do
    case $arg in
        --verbose|-v)
            VERBOSE=true
            ;;
        --help|-h)
            HELP=true
            ;;
    esac
done

if $HELP; then
    echo "sync-types.sh - Check TypeScript types against Go source"
    echo ""
    echo "Usage:"
    echo "  ./scripts/sync-types.sh           Check for discrepancies"
    echo "  ./scripts/sync-types.sh --verbose Show detailed comparison"
    echo "  ./scripts/sync-types.sh --help    Show this help"
    echo ""
    echo "Files:"
    echo "  Go source:   multiclaude/internal/state/state.go"
    echo "  TypeScript:  packages/core/src/types.ts"
    echo ""
    echo "Exit codes:"
    echo "  0 - Types are in sync"
    echo "  1 - Discrepancies found or error occurred"
    exit 0
fi

# Check if files exist
check_files() {
    local missing=false

    if [[ ! -f "$GO_SOURCE" ]]; then
        echo -e "${RED}Error:${NC} Go source not found: $GO_SOURCE"
        echo "  Try: git submodule update --init"
        missing=true
    fi

    if [[ ! -f "$TS_TARGET" ]]; then
        echo -e "${RED}Error:${NC} TypeScript file not found: $TS_TARGET"
        echo "  Try: npm install && npm run build"
        missing=true
    fi

    if $missing; then
        exit 1
    fi
}

# Extract Go type names (structs and type aliases)
extract_go_types() {
    # Extract struct names: "type Foo struct"
    grep -E '^type [A-Z][a-zA-Z]+ struct' "$GO_SOURCE" | \
        sed 's/type \([A-Za-z]*\) struct.*/\1/' | sort
}

# Extract Go const type names: "type Foo string" for enums
extract_go_const_types() {
    grep -E '^type [A-Z][a-zA-Z]+ string$' "$GO_SOURCE" | \
        sed 's/type \([A-Za-z]*\) string/\1/' | sort
}

# Extract Go const values for a type
extract_go_const_values() {
    local type_name="$1"
    # Look for const blocks with the type
    grep -E "^\s+[A-Za-z]+\s+${type_name}\s*=" "$GO_SOURCE" | \
        sed 's/.*= "\([^"]*\)".*/\1/' | sort
}

# Extract TypeScript interface names
extract_ts_interfaces() {
    grep -E '^export (interface|type) [A-Z]' "$TS_TARGET" | \
        sed -E 's/^export (interface|type) ([A-Za-z]+).*/\2/' | sort
}

# Extract TypeScript type union values (handles both single-line and multi-line)
extract_ts_type_values() {
    local type_name="$1"
    # Use awk to capture from "export type <name> =" until ";"
    awk -v name="$type_name" '
        $0 ~ "^export type " name " =" { capture=1 }
        capture { content = content $0 }
        capture && /;/ { print content; exit }
    ' "$TS_TARGET" | grep -oE "'[^']+'" | tr -d "'" | sort
}

# Compare two sorted lists
compare_lists() {
    local name="$1"
    local go_list="$2"
    local ts_list="$3"

    local go_only
    local ts_only

    go_only=$(comm -23 <(echo "$go_list") <(echo "$ts_list") || true)
    ts_only=$(comm -13 <(echo "$go_list") <(echo "$ts_list") || true)

    local has_diff=false

    if [[ -n "$go_only" ]]; then
        echo -e "${YELLOW}  Go-only (missing in TypeScript):${NC}"
        echo "$go_only" | sed 's/^/    - /'
        has_diff=true
    fi

    if [[ -n "$ts_only" ]]; then
        echo -e "${YELLOW}  TypeScript-only (not in Go):${NC}"
        echo "$ts_only" | sed 's/^/    - /'
        has_diff=true
    fi

    if ! $has_diff; then
        return 0
    fi
    return 1
}

# Main comparison
main() {
    echo -e "${BLUE}Comparing Go types with TypeScript types...${NC}"
    echo ""

    check_files

    local all_synced=true

    # Compare struct/interface types
    echo -e "${BLUE}Checking struct/interface types...${NC}"
    go_types=$(extract_go_types)
    ts_types=$(extract_ts_interfaces)

    if $VERBOSE; then
        echo "  Go structs found:"
        echo "$go_types" | sed 's/^/    /'
        echo "  TypeScript interfaces found:"
        echo "$ts_types" | sed 's/^/    /'
    fi

    # Known mappings: Go struct -> TS interface (same names expected)
    # Filter to exported types only (State has unexported fields we skip)
    expected_types="Agent ForkConfig MergeQueueConfig PRShepherdConfig Repository State TaskHistoryEntry"

    for type_name in $expected_types; do
        if echo "$go_types" | grep -q "^${type_name}$"; then
            if ! echo "$ts_types" | grep -q "^${type_name}$"; then
                echo -e "${RED}Missing:${NC} TypeScript interface '${type_name}'"
                all_synced=false
            elif $VERBOSE; then
                echo -e "${GREEN}  ✓${NC} ${type_name}"
            fi
        fi
    done

    # Check enum types
    echo ""
    echo -e "${BLUE}Checking enum types...${NC}"

    # AgentType
    go_agent_types=$(extract_go_const_values "AgentType")
    ts_agent_types=$(extract_ts_type_values "AgentType")

    if $VERBOSE; then
        echo "  AgentType values:"
        echo "    Go: $(echo $go_agent_types | tr '\n' ' ')"
        echo "    TS: $(echo $ts_agent_types | tr '\n' ' ')"
    fi

    if ! compare_lists "AgentType" "$go_agent_types" "$ts_agent_types" 2>/dev/null; then
        echo -e "${RED}Mismatch:${NC} AgentType values differ"
        compare_lists "AgentType" "$go_agent_types" "$ts_agent_types"
        all_synced=false
    elif $VERBOSE; then
        echo -e "${GREEN}  ✓${NC} AgentType"
    fi

    # TrackMode
    go_track_modes=$(extract_go_const_values "TrackMode")
    ts_track_modes=$(extract_ts_type_values "TrackMode")

    if $VERBOSE; then
        echo "  TrackMode values:"
        echo "    Go: $(echo $go_track_modes | tr '\n' ' ')"
        echo "    TS: $(echo $ts_track_modes | tr '\n' ' ')"
    fi

    if ! compare_lists "TrackMode" "$go_track_modes" "$ts_track_modes" 2>/dev/null; then
        echo -e "${RED}Mismatch:${NC} TrackMode values differ"
        compare_lists "TrackMode" "$go_track_modes" "$ts_track_modes"
        all_synced=false
    elif $VERBOSE; then
        echo -e "${GREEN}  ✓${NC} TrackMode"
    fi

    # TaskStatus
    go_task_statuses=$(extract_go_const_values "TaskStatus")
    ts_task_statuses=$(extract_ts_type_values "TaskStatus")

    if $VERBOSE; then
        echo "  TaskStatus values:"
        echo "    Go: $(echo $go_task_statuses | tr '\n' ' ')"
        echo "    TS: $(echo $ts_task_statuses | tr '\n' ' ')"
    fi

    if ! compare_lists "TaskStatus" "$go_task_statuses" "$ts_task_statuses" 2>/dev/null; then
        echo -e "${RED}Mismatch:${NC} TaskStatus values differ"
        compare_lists "TaskStatus" "$go_task_statuses" "$ts_task_statuses"
        all_synced=false
    elif $VERBOSE; then
        echo -e "${GREEN}  ✓${NC} TaskStatus"
    fi

    # Summary
    echo ""
    if $all_synced; then
        echo -e "${GREEN}✓ All types are in sync!${NC}"
        exit 0
    else
        echo -e "${RED}✗ Type discrepancies found.${NC}"
        echo ""
        echo "To fix:"
        echo "  1. Check multiclaude submodule for updates:"
        echo "     git submodule update --remote multiclaude"
        echo ""
        echo "  2. Update packages/core/src/types.ts to match Go source"
        echo ""
        echo "  3. Run this script again to verify"
        exit 1
    fi
}

main
