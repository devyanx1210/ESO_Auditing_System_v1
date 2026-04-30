module.exports = {
    apps: [
        {
            name: "eso-server",
            script: "dist/server.js",
            cwd: "./server",
        },
        {
            name: "eso-tunnel",
            script: "tunnel.cjs",
            cwd: "./server",
        },
    ],
};
