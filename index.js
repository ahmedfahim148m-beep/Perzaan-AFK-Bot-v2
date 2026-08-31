const mineflayer = require('mineflayer');
const { Movements, pathfinder, goals } = require('mineflayer-pathfinder');
const { GoalBlock } = goals;
const config = require('./settings.json');
const express = require('express');
const https = require('https');

// ============================================================
// EXPRESS SERVER - Keep Render/Always alive
// ============================================================
const app = express();
const PORT = process.env.PORT || 5000;

// Bot state tracking
let botState = {
    connected: false,
    lastActivity: Date.now(),
    reconnectAttempts: 0,
    startTime: Date.now(),
    errors: []
};

// Health check endpoint for monitoring
app.get('/ping', (req, res) => res.send('pong'));

app.listen(PORT, '0.0.0.0', () => {
    console.log([Server] HTTP server started on port ${PORT});
});

function formatUptime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return ${h}h ${m}m ${s}s;
}

// ============================================================
// SELF-PING - Prevent Render from sleeping
// ============================================================
const SELF_PING_INTERVAL = 10 * 60 * 1000; // 10 minutes

const https = require('https');

function startSelfPing() {
    setInterval(() => {
        const url = process.env.RENDER_EXTERNAL_URL || http://localhost:${PORT};
        const protocol = url.startsWith('https') ? https : http;

        protocol.get(${url}/ping, (res) => {
            console.log([KeepAlive] Self-ping: ${res.statusCode}); // Optional: reduce spam
        }).on('error', (err) => {
            console.log([KeepAlive] Self-ping failed: ${err.message});
        });
    }, SELF_PING_INTERVAL);

    console.log('[KeepAlive] Self-ping system started (every 10 min)');
}

startSelfPing();

// ============================================================
// MEMORY MONITORING
// ============================================================
setInterval(() => {
    const mem = process.memoryUsage();
    const heapMB = (mem.heapUsed / 1024 / 1024).toFixed(2);
    console.log([Memory] Heap: ${heapMB} MB);
}, 5 * 60 * 1000); // Every 5 minutes

// ============================================================
// BOT CREATION WITH RECONNECTION LOGIC
// ============================================================
let bot = null;
let activeIntervals = [];
let reconnectTimeout = null;
let isReconnecting = false;


// ============================================================
// RANDOM JUMP
// ============================================================
function startRandomJump(bot) {
    addInterval(() => {
        if (!bot || !botState.connected) return;

        try {
            bot.setControlState('jump', true);
            setTimeout(() => {
                if (bot) bot.setControlState('jump', false);
            }, 300);

            botState.lastActivity = Date.now();
        } catch (e) {
            console.log('[RandomJump] Error:', e.message);
        }
    }, config.movement['random-jump'].interval);
}

// ============================================================
// LOOK AROUND
// ============================================================
function startLookAround(bot) {
    addInterval(() => {
        if (!bot || !botState.connected) return;

        try {
            const yaw = Math.random() * Math.PI * 2;
