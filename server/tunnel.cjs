const { spawn } = require("child_process");
const proc = spawn("cloudflared", ["tunnel", "--url", "http://localhost:5000"], {
    stdio: "inherit",
    shell: true,
    windowsHide: true,
});
proc.on("exit", code => process.exit(code ?? 0));
