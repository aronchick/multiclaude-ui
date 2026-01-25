"""
Example CLI demonstrating multiclaude-tool usage.

This is a simple example showing how to use the DaemonClient and StateReader.
Customize this for your own tool's needs.
"""

import argparse
import sys

from multiclaude_tool.client import DaemonClient, DaemonError
from multiclaude_tool.state import StateReader, get_active_workers


def cmd_status(args: argparse.Namespace) -> int:
    """Show daemon status."""
    client = DaemonClient()

    if not client.ping():
        print("Daemon is not running")
        return 1

    status = client.status()
    print(f"Daemon running (PID: {status.pid})")
    print(f"  Repositories: {status.repos}")
    print(f"  Agents: {status.agents}")
    print(f"  Socket: {status.socket_path}")
    return 0


def cmd_agents(args: argparse.Namespace) -> int:
    """List all agents."""
    reader = StateReader()

    if not reader.exists():
        print("No state file found - is multiclaude running?")
        return 1

    state = reader.read()

    if not state.repos:
        print("No repositories tracked")
        return 0

    for repo_name, repo in state.repos.items():
        print(f"\n{repo_name}:")
        if not repo.agents:
            print("  (no agents)")
            continue

        for agent_name, agent in repo.agents.items():
            status = "running" if agent.pid > 0 else "stopped"
            task_info = f" - {agent.task[:50]}..." if agent.task else ""
            print(f"  {agent_name} ({agent.type}) [{status}]{task_info}")

    return 0


def cmd_workers(args: argparse.Namespace) -> int:
    """List active workers."""
    reader = StateReader()

    if not reader.exists():
        print("No state file found")
        return 1

    state = reader.read()
    workers = get_active_workers(state)

    if not workers:
        print("No active workers")
        return 0

    print(f"Active workers: {len(workers)}\n")
    for w in workers:
        print(f"  {w['name']} ({w['repo']})")
        if w.get("task"):
            print(f"    Task: {w['task'][:60]}...")

    return 0


def cmd_spawn(args: argparse.Namespace) -> int:
    """Spawn a new worker."""
    client = DaemonClient()

    if not client.ping():
        print("Daemon is not running")
        return 1

    try:
        worker_name = client.spawn_worker(
            task=args.task,
            repo=args.repo,
        )
        print(f"Spawned worker: {worker_name}")
        return 0
    except DaemonError as e:
        print(f"Error: {e}")
        return 1


def cmd_watch(args: argparse.Namespace) -> int:
    """Watch for state changes."""
    import asyncio

    reader = StateReader()

    async def watch_state() -> None:
        print("Watching for state changes (Ctrl+C to stop)...")
        async for state in reader.watch():
            workers = get_active_workers(state)
            print(f"State updated: {len(state.repos)} repos, {len(workers)} active workers")

    try:
        asyncio.run(watch_state())
    except KeyboardInterrupt:
        print("\nStopped")

    return 0


def main() -> int:
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Example tool for interacting with multiclaude daemon",
        prog="multiclaude-tool",
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # status command
    subparsers.add_parser("status", help="Show daemon status")

    # agents command
    subparsers.add_parser("agents", help="List all agents")

    # workers command
    subparsers.add_parser("workers", help="List active workers")

    # spawn command
    spawn_parser = subparsers.add_parser("spawn", help="Spawn a new worker")
    spawn_parser.add_argument("task", help="Task description")
    spawn_parser.add_argument("--repo", help="Repository name")

    # watch command
    subparsers.add_parser("watch", help="Watch for state changes")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return 0

    commands = {
        "status": cmd_status,
        "agents": cmd_agents,
        "workers": cmd_workers,
        "spawn": cmd_spawn,
        "watch": cmd_watch,
    }

    return commands[args.command](args)


if __name__ == "__main__":
    sys.exit(main())
