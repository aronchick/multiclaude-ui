#!/usr/bin/env node
/**
 * Example multiclaude tool demonstrating @multiclaude/core usage.
 *
 * This template shows how to:
 * - Connect to the multiclaude daemon via socket API
 * - Query daemon status and repository state
 * - Spawn workers and manage agents
 * - Watch state changes in real-time
 *
 * Customize this file to build your own multiclaude integrations,
 * such as Slack bots, web dashboards, or automation scripts.
 */

import {
  DaemonClient,
  DaemonError,
  StateReader,
  MessageReader,
  type DaemonStatus,
  type State,
  type Message,
} from '@multiclaude/core';

/**
 * Main entry point - demonstrates various multiclaude integrations.
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] ?? 'help';

  const client = new DaemonClient();

  try {
    switch (command) {
      case 'status':
        await showStatus(client);
        break;
      case 'repos':
        await listRepos(client);
        break;
      case 'workers':
        await listWorkers(client, args[1]);
        break;
      case 'spawn':
        await spawnWorker(client, args[1], args.slice(2).join(' '));
        break;
      case 'watch':
        await watchState();
        break;
      case 'messages':
        await watchMessages(args[1]);
        break;
      case 'help':
      default:
        showHelp();
    }
  } catch (error) {
    if (error instanceof DaemonError) {
      console.error(`Error: ${error.message}`);
      if (error.code === 'DAEMON_NOT_RUNNING') {
        console.error('Hint: Start the daemon with "multiclaude start"');
      }
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Show daemon status.
 */
async function showStatus(client: DaemonClient): Promise<void> {
  const isAlive = await client.ping();
  if (!isAlive) {
    console.log('Daemon is not running');
    return;
  }

  const status: DaemonStatus = await client.status();
  console.log('Daemon Status:');
  console.log(`  PID: ${status.pid}`);
  console.log(`  Repositories: ${status.repos}`);
  console.log(`  Agents: ${status.agents}`);
  console.log(`  Socket: ${status.socket_path}`);
}

/**
 * List all tracked repositories.
 */
async function listRepos(client: DaemonClient): Promise<void> {
  const repos = await client.listRepos();

  if (repos.length === 0) {
    console.log('No repositories tracked');
    console.log('Hint: Initialize a repo with "multiclaude init <github-url>"');
    return;
  }

  console.log('Tracked Repositories:');
  for (const repo of repos) {
    console.log(`  - ${repo}`);
  }
}

/**
 * List workers for a repository.
 */
async function listWorkers(client: DaemonClient, repo?: string): Promise<void> {
  if (!repo) {
    // Try to get current repo
    try {
      repo = await client.getCurrentRepo();
    } catch {
      console.error('Usage: my-multiclaude-tool workers <repo>');
      console.error('  or set current repo with: multiclaude repo use <name>');
      process.exit(1);
    }
  }

  const agents = await client.listAgents(repo);

  const workers = Object.entries(agents).filter(
    ([, agent]) => (agent as { type: string }).type === 'worker'
  );

  if (workers.length === 0) {
    console.log(`No workers in ${repo}`);
    return;
  }

  console.log(`Workers in ${repo}:`);
  for (const [name, agent] of workers) {
    const workerAgent = agent as { task?: string; pid?: number };
    const status = workerAgent.pid ? 'running' : 'stopped';
    console.log(`  ${name} [${status}]`);
    if (workerAgent.task) {
      console.log(`    Task: ${workerAgent.task}`);
    }
  }
}

/**
 * Spawn a new worker.
 */
async function spawnWorker(
  client: DaemonClient,
  repo: string | undefined,
  task: string
): Promise<void> {
  if (!repo || !task) {
    console.error('Usage: my-multiclaude-tool spawn <repo> <task description>');
    process.exit(1);
  }

  // Generate a simple random name (in practice, multiclaude generates better names)
  const adjectives = ['swift', 'brave', 'clever', 'keen', 'bold'];
  const animals = ['fox', 'owl', 'wolf', 'hawk', 'bear'];
  const name = `${adjectives[Math.floor(Math.random() * adjectives.length)]}-${
    animals[Math.floor(Math.random() * animals.length)]
  }`;

  await client.addAgent(repo, name, 'worker', task);
  console.log(`Spawned worker: ${name}`);
  console.log(`  Repo: ${repo}`);
  console.log(`  Task: ${task}`);
}

/**
 * Watch state changes in real-time.
 */
async function watchState(): Promise<void> {
  console.log('Watching state.json for changes (Ctrl+C to stop)...\n');

  const reader = new StateReader();

  reader.on('change', (state: State) => {
    const repoCount = Object.keys(state.repos).length;
    let agentCount = 0;
    for (const repo of Object.values(state.repos)) {
      agentCount += Object.keys(repo.agents).length;
    }

    console.log(`[${new Date().toISOString()}] State updated:`);
    console.log(`  Repos: ${repoCount}, Agents: ${agentCount}`);

    if (state.current_repo) {
      console.log(`  Current: ${state.current_repo}`);
    }
    console.log();
  });

  reader.on('error', (error: Error) => {
    console.error(`State reader error: ${error.message}`);
  });

  await reader.start();

  // Keep process alive
  process.on('SIGINT', () => {
    console.log('\nStopping state watcher...');
    reader.stop();
    process.exit(0);
  });
}

/**
 * Watch messages for an agent.
 */
async function watchMessages(repo?: string): Promise<void> {
  if (!repo) {
    console.error('Usage: my-multiclaude-tool messages <repo>');
    process.exit(1);
  }

  console.log(`Watching messages for ${repo} (Ctrl+C to stop)...\n`);

  const reader = new MessageReader({ repo });

  reader.on('message', (message: Message) => {
    console.log(`[${new Date().toISOString()}] New message:`);
    console.log(`  From: ${message.from}`);
    console.log(`  To: ${message.to}`);
    console.log(`  Content: ${message.content}`);
    console.log();
  });

  reader.on('error', (error: Error) => {
    console.error(`Message reader error: ${error.message}`);
  });

  await reader.start();

  // Keep process alive
  process.on('SIGINT', () => {
    console.log('\nStopping message watcher...');
    reader.stop();
    process.exit(0);
  });
}

/**
 * Show help message.
 */
function showHelp(): void {
  console.log(`
my-multiclaude-tool - Example multiclaude integration

Usage:
  my-multiclaude-tool <command> [options]

Commands:
  status              Show daemon status
  repos               List tracked repositories
  workers <repo>      List workers in a repository
  spawn <repo> <task> Spawn a new worker
  watch               Watch state.json for changes
  messages <repo>     Watch messages for a repository
  help                Show this help message

Examples:
  my-multiclaude-tool status
  my-multiclaude-tool repos
  my-multiclaude-tool workers my-app
  my-multiclaude-tool spawn my-app "Add authentication feature"
  my-multiclaude-tool watch
  my-multiclaude-tool messages my-app

For more information, see:
  https://github.com/dlorenc/multiclaude
`);
}

// Run main
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
