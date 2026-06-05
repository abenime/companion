const config = require('./config');
const LocalDB = require('./services/local-db');
const SyncPublisher = require('./services/sync-publisher');
const WindowTracker = require('./collectors/window-tracker');
const InputTelemetry = require('./collectors/input-telemetry');
const IdleDetector = require('./collectors/idle-detector');

console.log("=================================================");
console.log("    PASSIVE AI WELLNESS - DESKTOP AGENT V1.0     ");
console.log("=================================================");
console.log(`Endpoint URL: ${config.SERVER_URL}`);
console.log("-------------------------------------------------");

// 1. Initialize core persistence and network drivers
const localDB = new LocalDB();
const publisher = new SyncPublisher(localDB);

// 2. Initialize telemetry collectors
const inputCollector = new InputTelemetry();
const idleDetector = new IdleDetector(config.IDLE_THRESHOLD_MS);

// Store context metrics locally before flush
let currentContext = {
    active_app: 'Idle',
    active_window_time_seconds: 0,
    context_switches: 0
};

// 3. Setup window tracking callback
const windowTracker = new WindowTracker((event, winPayload) => {
    // Notify the idle detector that active system navigation represents input activity
    idleDetector.registerActivity();

    if (event === 'transition') {
        // Record details from the outgoing application before swapping context
        flushCurrentAppContext();

        currentContext.active_app = winPayload.appName;
        currentContext.active_window_time_seconds = 0;
        currentContext.context_switches++;
        console.log(`[Window Switch] Active context changed to: ${winPayload.appName}`);
    } else if (event === 'pulse') {
        // Increment continuous attention duration
        currentContext.active_window_time_seconds += (config.WINDOW_POLL_INTERVAL_MS / 1000);
    }
}, config.WINDOW_POLL_INTERVAL_MS, config.IGNORED_APPS);

// Flush the currently active foreground application state into a structural database row
function flushCurrentAppContext() {
    if (currentContext.active_window_time_seconds > 0 && currentContext.active_app !== 'Idle') {
        const payload = {
            active_app: currentContext.active_app,
            active_window_time_seconds: Math.round(currentContext.active_window_time_seconds),
            context_switches: currentContext.context_switches,
            timestamp: Date.now()
        };
        localDB.saveSignals(payload).catch(err => {
            console.error("Local database buffering failed:", err.message);
        });

        // Reset continuous workspace parameters, keep total context switch incrementing
        currentContext.active_window_time_seconds = 0;
        currentContext.context_switches = 0;
    }
}

// 4. Register Idle state callback
const idleCheckTimer = setInterval(() => {
    idleDetector.checkIdleState((state, triggerTimeOrDuration) => {
        if (state === 'idle') {
            console.log(`[System State] User has gone IDLE. Saving trailing window metrics.`);
            flushCurrentAppContext();
            
            // Log idle signal
            localDB.saveSignals({
                idle_time_seconds: config.IDLE_THRESHOLD_MS / 1000,
                timestamp: triggerTimeOrDuration
            });

            currentContext.active_app = 'Idle';
        } else if (state === 'active') {
            console.log(`[System State] User returned active. Idle duration was: ${Math.round(triggerTimeOrDuration / 1000)}s`);
            inputCollector.start();
        }
    });
}, config.IDLE_CHECK_INTERVAL_MS);

// 5. Periodic hardware input metric flusher
const flushInputMetricsTimer = setInterval(() => {
    // If the system is currently idle, don't flush zeroed input metrics
    if (idleDetector.isCurrentlyIdle) return;

    // Feed idle detector to sync with keyboard activity
    const metrics = inputCollector.flushMetrics();
    if (metrics.keystrokeCount > 0 || metrics.mouseMovementScore > 0) {
        idleDetector.registerActivity();
        localDB.saveSignals(metrics).catch(err => {
            console.error("Failed to cache hardware input telemetry:", err.message);
        });
    }
}, config.SYNC_INTERVAL_MS);

// 6. Periodic batch server-sync
const serverSyncTimer = setInterval(async () => {
    // Flush active context into DB first to ensure we upload current metrics
    flushCurrentAppContext();
    await publisher.forceSync();
}, config.SYNC_INTERVAL_MS);

// 7. Core startup routines
inputCollector.start();
windowTracker.start();

// Graceful exit handlers
process.on('SIGINT', () => {
    console.log("\nHalting telemetry loops, shutting down gracefully...");
    clearInterval(idleCheckTimer);
    clearInterval(flushInputMetricsTimer);
    clearInterval(serverSyncTimer);
    inputCollector.stop();
    windowTracker.stop();
    flushCurrentAppContext();
    process.exit(0);
});
