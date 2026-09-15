import { execFileSync } from 'node:child_process';
import process from 'node:process';
const port = Number(process.env.PORT || 5000);
function getPidsWindows() {
  try {
    const output = execFileSync('netstat', ['-ano', '-p', 'tcp'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return [...new Set(output.split(/\r?\n/)
      .filter((line) => line.includes(`:${port}`) && /LISTENING\s+\d+/.test(line))
      .map((line) => line.trim().split(/\s+/).pop())
      .filter((pid) => pid && /^\d+$/.test(pid) && pid !== String(process.pid)))];
  } catch {
    return [];
  }
}
function getPidsUnix() {
  try {
    const output = execFileSync('sh', ['-c', `lsof -ti tcp:${port} -sTCP:LISTEN 2>/dev/null || true`], { encoding: 'utf8' });
    return [...new Set(output.split(/\r?\n/).map((p) => p.trim()).filter((p) => /^\d+$/.test(p) && p !== String(process.pid)))];
  } catch {
    return [];
  }
}
const pids = process.platform === 'win32' ? getPidsWindows() : getPidsUnix();
for (const pid of pids) {
  try {
    if (process.platform === 'win32') {
      execFileSync('taskkill', ['/PID', pid, '/T', '/F'], { stdio: 'ignore' });
    } else {
      process.kill(Number(pid), 'SIGTERM');
    }
    console.log(`Freed port ${port} by stopping process ${pid}.`);
  } catch {
  }
}
if (!pids.length) {
  console.log(`Port ${port} is available.`);
}
