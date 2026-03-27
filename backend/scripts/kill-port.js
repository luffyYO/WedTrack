/**
 * scripts/kill-port.js
 * Frees the given TCP port before dev server startup to prevent EADDRINUSE.
 * Usage: node scripts/kill-port.js <port>
 */
import { execSync } from 'child_process';

const port = process.argv[2] || '5000';

try {
  if (process.platform === 'win32') {
    const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    const lines = output.trim().split('\n');
    const pids = new Set();
    for (const line of lines) {
      if (line.match(new RegExp(`\\b0\\.0\\.0\\.0:${port}\\b|\\[::]:${port}\\b`))) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') pids.add(pid);
      }
    }
    for (const pid of pids) {
      try { execSync(`taskkill /PID ${pid} /F`, { stdio: 'pipe' }); } catch {}
    }
    if (pids.size > 0) console.log(`[kill-port] Freed port ${port}.`);
    else console.log(`[kill-port] Port ${port} is free.`);
  } else {
    const output = execSync(`lsof -ti tcp:${port}`, { encoding: 'utf8' }).trim();
    if (output) { execSync(`kill -9 ${output}`, { stdio: 'pipe' }); }
    console.log(`[kill-port] Port ${port} freed.`);
  }
} catch {
  console.log(`[kill-port] Port ${port} is free.`);
}
