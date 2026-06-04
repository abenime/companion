"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseConnection = void 0;
const pg_1 = __importDefault(require("pg"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const { Pool } = pg_1.default;
class DatabaseConnection {
    static instance = null;
    pool;
    constructor() {
        const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/wellness_companion';
        this.pool = new Pool({
            connectionString,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
        this.pool.on('error', (err) => {
            console.error('Unexpected error on idle database client', err);
        });
    }
    static getInstance() {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }
    // Query helper that returns rows directly
    async query(text, params) {
        return this.pool.query(text, params);
    }
    // Direct client checkout helper for transactions
    async getClient() {
        return this.pool.connect();
    }
    // End the pool connection
    async close() {
        await this.pool.end();
    }
}
exports.DatabaseConnection = DatabaseConnection;
