import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { createConnection } from 'net';
import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

const MULTICLAUDE_DIR = join(homedir(), '.multiclaude');
const STATE_PATH = join(MULTICLAUDE_DIR, 'state.json');
const SOCKET_PATH = join(MULTICLAUDE_DIR, 'daemon.sock');

/**
 * Send a command to the multiclaude daemon via Unix socket.
 */
function sendDaemonCommand(command: string, args?: Record<string, unknown>): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (!existsSync(SOCKET_PATH)) {
      reject(new Error('Daemon not running (socket not found)'));
      return;
    }

    const client = createConnection(SOCKET_PATH);
    const request = JSON.stringify({ command, args }) + '\n';
    let data = '';

    client.on('connect', () => client.write(request));
    client.on('data', (chunk) => {
      data += chunk.toString();
      try {
        const response = JSON.parse(data);
        client.end();
        if (!response.success) {
          reject(new Error(response.error || 'Command failed'));
        } else {
          resolve(response.data);
        }
      } catch {
        // Incomplete JSON, wait for more
      }
    });
    client.on('error', reject);
    client.on('timeout', () => reject(new Error('Socket timeout')));
    client.setTimeout(10000);
  });
}

/**
 * Parse JSON body from request.
 */
function parseBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Vite plugin for multiclaude API endpoints.
 */
function multiclaueApiPlugin(): Plugin {
  return {
    name: 'multiclaude-api',
    configureServer(server) {
      // GET /api/state - Read state.json
      server.middlewares.use('/api/state', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');

        if (!existsSync(STATE_PATH)) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'state.json not found' }));
          return;
        }

        try {
          res.end(readFileSync(STATE_PATH, 'utf-8'));
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(err) }));
        }
      });

      // POST /api/daemon - Send command to daemon
      server.middlewares.use('/api/daemon', async (req: IncomingMessage, res: ServerResponse) => {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        try {
          const body = await parseBody(req);
          const command = body.command as string;
          const args = body.args as Record<string, unknown> | undefined;

          if (!command) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing command' }));
            return;
          }

          const result = await sendDaemonCommand(command, args);
          res.end(JSON.stringify({ success: true, data: result }));
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(err instanceof Error ? err.message : err) }));
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), multiclaueApiPlugin()],
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
