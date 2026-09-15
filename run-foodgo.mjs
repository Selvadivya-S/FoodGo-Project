import { spawn } from "node:child_process";
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const children = [];
function start(name, args, cwd) {
  const child = spawn(npm, args, { cwd, stdio: "inherit", env: process.env });
  children.push(child);
  child.on("exit", (code, signal) => {
    if (signal) console.log(`${name} stopped (${signal})`);
    else if (code !== 0) console.log(`${name} exited with code ${code}`);
  });
  return child;
}
console.log("Starting FoodGo backend and frontend...");
console.log("Backend:  http://localhost:5000");
console.log("Frontend: http://localhost:5173");
start("Backend", ["run", "dev"], "backend");
start("Frontend", ["run", "dev"], "frontend");
function shutdown() {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
