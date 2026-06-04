# 💻 Desktop Telemetry Agent — Node.js System Service Specification

## 1. Agent Architecture & Execution Model

The desktop component is designed as a **low-footprint daemon (background process)** rather than a heavy GUI app. It runs headlessly in the background, starting automatically upon system boot. For an MVP/Hackathon dashboard presentation, it can optionally be wrapped in a **System Tray wrapper (such as Electron or a lightweight library like `systray` / `node-tray`)** to allow manual sync overrides and pause options.

```text
       +───────────────────────────────────────+
       │           Node.js Runtime             │
       │    - Single-threaded event loop       │
       │    - Low baseline footprint (<40MB)   │
       +──────────────────┬────────────────────+
                          │
       +──────────────────▼────────────────────+
       │          Telemetry Core Loop          │
       │  - Schedules sub-second polls         │
       │  - Registers system hooks on thread   │
       +──────┬──────────────────────────┬─────+
              │                          │
              ▼ Sensors                  ▼ Sync Buffer
+──────────────────────────+  +──────────────────────────+
│    Platform Native C++   │  │   Local NeDB / JSON      │
│  - Active-win bridges    │  │ - Buffers metrics raw    │
│  - Global input hooks    │  │ - HTTPS REST Sync client │
+──────────────────────────+  +──────────────────────────+
```

---

## 2. Active Window Tracking

Active window tracking relies on native OS bindings that wrap systemic APIs (such as `GetForegroundWindow` on Windows, `CGWindowListCopyWindowInfo` on macOS, and `xprop` on Linux). The library `active-win` dynamically abstracts these bindings.

### 2.1 Window Polling Service

```javascript
const activeWin = require('active-win');

class WindowTracker {
    constructor(callback, intervalMs = 5000) {
        this.callback = callback;
        this.intervalMs = intervalMs;
        this.timer = null;
        this.lastWindow = null;
    }

    start() {
        this.timer = setInterval(async () => {
            try {
                const win = await activeWin();
                if (win) {
                    const currentWindowPayload = {
                        title: win.title,
                        appName: win.owner.name,
                        processId: win.owner.processId,
                        timestamp: Date.now()
                    };

                    // Detect app transition
                    if (!this.lastWindow || this.lastWindow.appName !== currentWindowPayload.appName) {
                        this.callback('transition', currentWindowPayload);
                    } else {
                        this.callback('pulse', currentWindowPayload);
                    }
                    this.lastWindow = currentWindowPayload;
                }
            } catch (err) {
                console.error("Window tracking hook failed: ", err.message);
            }
        }, this.intervalMs);
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
}

module.exports = WindowTracker;
```

---

## 3. Keyboard & Mouse Metadata Collector (Privacy First)

To compile interaction speeds and fatigue indicators without compromising security, we listen to hardware hooks but **immediately filter out the key values**. We record only *time-deltas* between events, *backspace counts*, and *mouse velocity*.

```javascript
const ioHook = require('iohook'); // Global hooks for keyboard and mouse

class InputTelemetry {
    constructor() {
        this.keystrokeCount = 0;
        this.backspaceCount = 0;
        this.lastKeystrokeTime = Date.now();
        this.keystrokeIntervals = []; // Buffers typing cadence (latencies in ms)
        this.mouseMovements = 0;
        this.mouseClicks = 0;
    }

    start() {
        // Register Global Hooks
        ioHook.on('keydown', (event) => {
            const currentTime = Date.now();
            const latency = currentTime - this.lastKeystrokeTime;
            
            this.keystrokeCount++;
            this.lastKeystrokeTime = currentTime;

            // Track backspaces (keycode 14 on Windows/Linux, 51 on macOS usually)
            // Note: Keycodes vary slightly by platform; map systematically.
            if (event.keycode === 14 || event.keycode === 51 || event.rawcode === 8) {
                this.backspaceCount++;
            } else {
                // Store latency profile to analyze typing rhythmic cadence
                this.keystrokeIntervals.push(latency);
                if (this.keystrokeIntervals.length > 200) {
                    this.keystrokeIntervals.shift(); // Bound memory footprint
                }
            }
        });

        ioHook.on('mousemove', () => {
            this.mouseMovements++;
        });

        ioHook.on('mousedown', () => {
            this.mouseClicks++;
        });

        ioHook.start();
    }

    flushMetrics() {
        const avgLatency = this.keystrokeIntervals.length > 0 
            ? this.keystrokeIntervals.reduce((a, b) => a + b, 0) / this.keystrokeIntervals.length 
            : 0;

        const metrics = {
            keystrokeCount: this.keystrokeCount,
            backspaceCount: this.backspaceCount,
            averageCadenceMs: avgLatency,
            mouseMovementScore: this.mouseMovements,
            mouseClickCount: this.mouseClicks,
            timestamp: Date.now()
        };

        // Reset local collectors for next telemetry cycle
        this.keystrokeCount = 0;
        this.backspaceCount = 0;
        this.mouseMovements = 0;
        this.mouseClicks = 0;

        return metrics;
    }

    stop() {
        ioHook.stop();
    }
}

module.exports = InputTelemetry;
```

---

## 4. Passive Idle & Break Tracking

Idle state detection queries OS level APIs to retrieve the duration in milliseconds since the last hardware interaction (keyboard tap or mouse move). In Node.js, we invoke this through a native platform wrapper or an extension library like `desktop-idle`.

```javascript
const desktopIdle = require('desktop-idle');

class IdleDetector {
    constructor(idleThresholdMs = 300000) { // Default 5 minutes
        this.idleThresholdMs = idleThresholdMs;
        this.isCurrentlyIdle = false;
        this.idleStartTime = null;
    }

    checkIdleState(onIdleChange) {
        const idleTimeMs = desktopIdle.getIdleTime() * 1000; // Returns seconds, convert to ms

        if (idleTimeMs >= this.idleThresholdMs) {
            if (!this.isCurrentlyIdle) {
                this.isCurrentlyIdle = true;
                this.idleStartTime = Date.now() - idleTimeMs;
                onIdleChange('idle', this.idleStartTime);
            }
        } else {
            if (this.isCurrentlyIdle) {
                this.isCurrentlyIdle = false;
                const idleDuration = Date.now() - this.idleStartTime;
                onIdleChange('active', idleDuration);
                this.idleStartTime = null;
            }
        }
    }
}

module.exports = IdleDetector;
```

---

## 5. Local Buffering & REST Sync Client

Desktop metrics are saved locally in a lightweight JSON store or SQLite memory instance to support offline operation. Periodically, a background client parses, serializes, and pushes the buffer to the primary Express ingestion server.

```javascript
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class TelemetryPublisher {
    constructor(serverUrl, authToken) {
        this.serverUrl = serverUrl;
        this.authToken = authToken;
        this.bufferPath = path.join(__dirname, 'telemetry_buffer.json');
    }

    saveToBuffer(metrics) {
        let buffer = [];
        if (fs.existsSync(this.bufferPath)) {
            try {
                buffer = JSON.parse(fs.readFileSync(this.bufferPath, 'utf8'));
            } catch (e) {
                buffer = [];
            }
        }
        buffer.push(metrics);
        fs.writeFileSync(this.bufferPath, JSON.stringify(buffer, null, 2));
    }

    async forceSync() {
        if (!fs.existsSync(this.bufferPath)) return;

        let buffer = [];
        try {
            buffer = JSON.parse(fs.readFileSync(this.bufferPath, 'utf8'));
        } catch (e) {
            return;
        }

        if (buffer.length === 0) return;

        try {
            console.log(`Syncing ${buffer.length} records to backend...`);
            const response = await axios.post(`${this.serverUrl}/api/v1/signals/desktop`, {
                signals: buffer
            }, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200 || response.status === 201) {
                // Clear buffer on success
                fs.writeFileSync(this.bufferPath, JSON.stringify([]));
                console.log("Telemetry sync completed successfully.");
            }
        } catch (error) {
            console.error("Telemetry sync failed (offline or server error). Will retry next loop.");
        }
    }
}

module.exports = TelemetryPublisher;
```
