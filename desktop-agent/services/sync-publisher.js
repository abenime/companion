const axios = require('axios');
const config = require('../config');

class SyncPublisher {
    constructor(localDBInstance) {
        this.db = localDBInstance;
    }

    async forceSync() {
        let pending = [];
        try {
            pending = await this.db.getPendingSignals();
        } catch (err) {
            console.error("Failed to fetch pending signals from local cache:", err.message);
            return;
        }

        if (pending.length === 0) {
            return;
        }

        console.log(`Preparing to batch sync ${pending.length} metrics to: ${config.SERVER_URL}`);

        // Extract native database ids so we can delete them on HTTP success
        const dbIds = pending.map(x => x._id);
        
        // Map payloads to server expectations (strip nedb auto _id property)
        const payloads = pending.map(x => {
            const copy = { ...x };
            delete copy._id;
            return copy;
        });

        try {
            const response = await axios.post(`${config.SERVER_URL}/api/v1/signals/desktop`, {
                signals: payloads
            }, {
                headers: {
                    'Authorization': `Bearer ${config.AUTH_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                timeout: 5000 // Prevent hanging connections on offline servers
            });

            if (response.status === 200 || response.status === 201) {
                console.log(`Ingestion server synced successfully. HTTP ${response.status}`);
                await this.db.clearSyncedBatch(dbIds);
            }
        } catch (error) {
            console.warn(`Desktop telemetry sync offline: ${error.message}. Telemetry safe inside local database buffer.`);
        }
    }
}

module.exports = SyncPublisher;
