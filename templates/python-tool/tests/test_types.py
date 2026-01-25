"""Tests for multiclaude_tool.types module."""

import pytest
from datetime import datetime

from multiclaude_tool.types import (
    Agent,
    AgentType,
    DaemonStatus,
    ForkConfig,
    MergeQueueConfig,
    PRShepherdConfig,
    Repository,
    SocketRequest,
    SocketResponse,
    State,
    TaskHistoryEntry,
    TaskStatus,
    TrackMode,
    default_merge_queue_config,
    default_pr_shepherd_config,
    is_persistent_agent_type,
)


class TestAgentType:
    """Tests for AgentType literal."""

    def test_valid_types(self) -> None:
        """All agent types should be valid."""
        valid_types: list[AgentType] = [
            "supervisor",
            "worker",
            "merge-queue",
            "pr-shepherd",
            "workspace",
            "review",
            "generic-persistent",
        ]
        for t in valid_types:
            agent = Agent(
                type=t,
                worktree_path="/tmp/test",
                tmux_window="test:0",
                session_id="sess-123",
                created_at=datetime.now(),
            )
            assert agent.type == t


class TestTrackMode:
    """Tests for TrackMode literal."""

    def test_valid_modes(self) -> None:
        """All track modes should be valid."""
        valid_modes: list[TrackMode] = ["all", "author", "assigned"]
        for mode in valid_modes:
            config = MergeQueueConfig(enabled=True, track_mode=mode)
            assert config.track_mode == mode


class TestMergeQueueConfig:
    """Tests for MergeQueueConfig model."""

    def test_defaults(self) -> None:
        """Test default values."""
        config = MergeQueueConfig()
        assert config.enabled is True
        assert config.track_mode == "all"

    def test_custom_values(self) -> None:
        """Test custom configuration."""
        config = MergeQueueConfig(enabled=False, track_mode="author")
        assert config.enabled is False
        assert config.track_mode == "author"


class TestAgent:
    """Tests for Agent model."""

    def test_minimal_agent(self) -> None:
        """Test agent with minimal required fields."""
        agent = Agent(
            type="worker",
            worktree_path="/home/user/repo",
            tmux_window="mc-repo:worker-1",
            session_id="session-abc123",
            created_at=datetime(2024, 1, 15, 10, 30, 0),
        )
        assert agent.type == "worker"
        assert agent.pid == 0
        assert agent.task is None
        assert agent.ready_for_cleanup is None

    def test_full_worker_agent(self) -> None:
        """Test worker agent with all fields."""
        agent = Agent(
            type="worker",
            worktree_path="/home/user/repo",
            tmux_window="mc-repo:clever-fox",
            session_id="session-xyz789",
            pid=12345,
            task="Implement new feature X",
            summary="Added feature X with tests",
            created_at=datetime(2024, 1, 15, 10, 30, 0),
            last_nudge=datetime(2024, 1, 15, 11, 0, 0),
            ready_for_cleanup=True,
        )
        assert agent.pid == 12345
        assert agent.task == "Implement new feature X"
        assert agent.ready_for_cleanup is True


class TestRepository:
    """Tests for Repository model."""

    def test_minimal_repository(self) -> None:
        """Test repository with minimal required fields."""
        repo = Repository(
            github_url="https://github.com/user/repo",
            tmux_session="mc-repo",
        )
        assert repo.agents == {}
        assert repo.task_history is None
        assert repo.target_branch is None

    def test_repository_with_agents(self) -> None:
        """Test repository with agents."""
        agent = Agent(
            type="supervisor",
            worktree_path="/tmp/test",
            tmux_window="test:0",
            session_id="sess-1",
            created_at=datetime.now(),
        )
        repo = Repository(
            github_url="https://github.com/user/repo",
            tmux_session="mc-repo",
            agents={"supervisor": agent},
            target_branch="main",
        )
        assert "supervisor" in repo.agents
        assert repo.target_branch == "main"


class TestState:
    """Tests for State model."""

    def test_empty_state(self) -> None:
        """Test empty state."""
        state = State()
        assert state.repos == {}
        assert state.current_repo is None

    def test_state_with_repos(self) -> None:
        """Test state with repositories."""
        repo = Repository(
            github_url="https://github.com/user/repo",
            tmux_session="mc-repo",
        )
        state = State(repos={"my-repo": repo}, current_repo="my-repo")
        assert "my-repo" in state.repos
        assert state.current_repo == "my-repo"


class TestSocketModels:
    """Tests for socket API models."""

    def test_socket_request(self) -> None:
        """Test SocketRequest model."""
        request = SocketRequest(command="ping")
        assert request.command == "ping"
        assert request.args is None

        request_with_args = SocketRequest(
            command="spawn_worker",
            args={"task": "Do something", "repo": "my-repo"},
        )
        assert request_with_args.args is not None
        assert request_with_args.args["task"] == "Do something"

    def test_socket_response_success(self) -> None:
        """Test successful SocketResponse."""
        response = SocketResponse(success=True, data={"name": "clever-fox"})
        assert response.success is True
        assert response.data is not None
        assert response.error is None

    def test_socket_response_error(self) -> None:
        """Test error SocketResponse."""
        response = SocketResponse(success=False, error="Repository not found")
        assert response.success is False
        assert response.data is None
        assert response.error == "Repository not found"


class TestHelperFunctions:
    """Tests for helper functions."""

    def test_is_persistent_agent_type(self) -> None:
        """Test persistent agent type detection."""
        assert is_persistent_agent_type("supervisor") is True
        assert is_persistent_agent_type("merge-queue") is True
        assert is_persistent_agent_type("pr-shepherd") is True
        assert is_persistent_agent_type("workspace") is True
        assert is_persistent_agent_type("generic-persistent") is True
        assert is_persistent_agent_type("worker") is False
        assert is_persistent_agent_type("review") is False

    def test_default_configs(self) -> None:
        """Test default configuration factories."""
        mq_config = default_merge_queue_config()
        assert mq_config.enabled is True
        assert mq_config.track_mode == "all"

        ps_config = default_pr_shepherd_config()
        assert ps_config.enabled is True
        assert ps_config.track_mode == "author"
