const activeWin = require('active-win');

class WindowTracker {
    constructor(callback, intervalMs = 5000) {
        this.callback = callback;
        this.intervalMs = intervalMs;
        this.timer = null;
        this.lastWindow = null;
    }

    start() {
        if (this.timer) return;
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

                    // Detect app context-switching transitions
                    if (!this.lastWindow || this.lastWindow.appName !== currentWindowPayload.appName) {
                        this.callback('transition', currentWindowPayload);
                    } else {
                        this.callback('pulse', currentWindowPayload);
                    }
                    this.lastWindow = currentWindowPayload;
                }
            } catch (err) {
                console.warn("Foreground active window hook failed: ", err.message);
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
