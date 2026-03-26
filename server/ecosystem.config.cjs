module.exports = {
    apps: [{
        name:      "eso-api",
        script:    "./dist/server.js",
        instances: "max",          // one process per CPU core
        exec_mode: "cluster",      // share port across all instances
        max_memory_restart: "500M",

        env_production: {
            NODE_ENV:  "production",
            PORT:      5000,
        },
    }],
};
