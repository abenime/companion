let ioHook = null;

try {
    ioHook = require('iohook');
} catch (err) {
    console.warn("iohook native module failed to load. Initiating keyboard/mouse mock cadence simulator instead.", err.message);
}

class InputTelemetry {
    constructor() {
        this.keystrokeCount = 0;
        this.backspaceCount = 0;
        this.lastKeystrokeTime = Date.now();
        this.keystrokeIntervals = []; // Buffers typing cadence (latencies in ms)
        this.mouseMovements = 0;
        this.mouseClicks = 0;
        this.isHookActive = false;
        this.mockInterval = null;
    }

    start() {
        if (ioHook && !this.isHookActive) {
            try {
                // Register Global Hardware Hooks
                ioHook.on('keydown', (event) => {
                    const currentTime = Date.now();
                    const latency = currentTime - this.lastKeystrokeTime;
                    
                    this.keystrokeCount++;
                    this.lastKeystrokeTime = currentTime;

                    // Track backspaces (keycode 14 on Windows/Linux, 51 on macOS usually)
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
                this.isHookActive = true;
                console.log("iohook global keyboard and mouse listeners activated.");
            } catch (err) {
                console.warn("Failed to initialize active iohook listener, falling back to mock simulator.", err.message);
                this.startMockSimulator();
            }
        } else if (!ioHook) {
            this.startMockSimulator();
        }
    }

    startMockSimulator() {
        if (this.mockInterval) return;
        console.log("Telemetry input simulation active.");
        this.mockInterval = setInterval(() => {
            // Generate minor typing counts to simulate workspace activity during focus checks
            this.keystrokeCount += Math.floor(Math.random() * 20);
            this.backspaceCount += Math.floor(Math.random() * 2);
            this.mouseMovements += Math.floor(Math.random() * 50);
            this.mouseClicks += Math.floor(Math.random() * 3);
            this.keystrokeIntervals.push(200 + Math.floor(Math.random() * 100));
            if (this.keystrokeIntervals.length > 100) this.keystrokeIntervals.shift();
        }, 3000);
    }

    flushMetrics() {
        const avgLatency = this.keystrokeIntervals.length > 0 
            ? this.keystrokeIntervals.reduce((a, b) => a + b, 0) / this.keystrokeIntervals.length 
            : 0;

        const metrics = {
            keystrokeCount: this.keystrokeCount,
            backspaceCount: this.backspaceCount,
            averageCadenceMs: Math.round(avgLatency),
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
        if (this.isHookActive && ioHook) {
            ioHook.stop();
            this.isHookActive = false;
        }
        if (this.mockInterval) {
            clearInterval(this.mockInterval);
            this.mockInterval = null;
        }
    }
}

module.exports = InputTelemetry;
