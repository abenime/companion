const activeWin = require('active-win');

class WindowTracker {
    constructor(callback, intervalMs = 5000, ignoredApps = []) {
        this.callback = callback;
        this.intervalMs = intervalMs;
        this.ignoredApps = ignoredApps;
        this.timer = null;
        this.lastWindow = null;
    }

    start() {
        if (this.timer) return;
        this.timer = setInterval(async () => {
            try {
                const win = await activeWin();
                if (win) {
                    let appName = win.owner.name;
                    let title = win.title;

                    // Mask sensitive applications under privacy ignore list
                    const isIgnored = this.ignoredApps.some(ignored => {
                        const term = ignored.trim().toLowerCase();
                        if (!term) return false;
                        return appName.toLowerCase().includes(term) || title.toLowerCase().includes(term);
                    });

                    if (isIgnored) {
                        appName = 'Ignored Workspace';
                        title = 'Ignored Workspace';
                    }

                    const currentWindowPayload = {
                        title: title,
                        appName: appName,
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
