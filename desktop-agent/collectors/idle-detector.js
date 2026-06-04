let desktopIdle = null;

try {
    desktopIdle = require('desktop-idle');
} catch (err) {
    console.warn("desktop-idle native module failed to load. Initiating keyboard/mouse activity fallback idle poller.", err.message);
}

class IdleDetector {
    constructor(idleThresholdMs = 300000) { // Default 5 minutes
        this.idleThresholdMs = idleThresholdMs;
        this.isCurrentlyIdle = false;
        this.idleStartTime = null;
        this.fallbackLastInputTime = Date.now();
    }

    // Call this if iohook reports activity to feed fallback tracker when native module is absent
    registerActivity() {
        this.fallbackLastInputTime = Date.now();
    }

    checkIdleState(onIdleChange) {
        let idleTimeMs = 0;

        if (desktopIdle) {
            try {
                idleTimeMs = desktopIdle.getIdleTime() * 1000; // Returns seconds, convert to ms
            } catch (err) {
                // Fallback to time delta since last registered activity
                idleTimeMs = Date.now() - this.fallbackLastInputTime;
            }
        } else {
            idleTimeMs = Date.now() - this.fallbackLastInputTime;
        }

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
