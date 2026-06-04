const Datastore = require('nedb');
const path = require('path');

class LocalDB {
    constructor() {
        const dbPath = path.join(__dirname, '../data/telemetry.db');
        this.db = new Datastore({ filename: dbPath, autoload: true });
    }

    // Save a metrics batch locally
    saveSignals(metrics) {
        return new Promise((resolve, reject) => {
            this.db.insert(metrics, (err, newDoc) => {
                if (err) {
                    console.error("Local DB cache insert failed: ", err);
                    reject(err);
                } else {
                    resolve(newDoc);
                }
            });
        });
    }

    // Query all cached entries to prepare for syncing
    getPendingSignals() {
        return new Promise((resolve, reject) => {
            this.db.find({}).sort({ timestamp: 1 }).exec((err, docs) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(docs);
                }
            });
        });
    }

    // Clear records that were successfully synced
    clearSyncedBatch(ids) {
        return new Promise((resolve, reject) => {
            this.db.remove({ _id: { $in: ids } }, { multi: true }, (err, numRemoved) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(`Cleared ${numRemoved} records from local sqlite/nedb buffer cache.`);
                    resolve(numRemoved);
                }
            });
        });
    }
}

module.exports = LocalDB;
