import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export class DatabaseConnection {
    private static instance: DatabaseConnection | null = null;
    private pool: pg.Pool;

    private constructor() {
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

    public static getInstance(): DatabaseConnection {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }

    // Query helper that returns rows directly
    public async query<T extends pg.QueryResultRow = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> {
        return this.pool.query<T>(text, params);
    }

    // Direct client checkout helper for transactions
    public async getClient(): Promise<pg.PoolClient> {
        return this.pool.connect();
    }

    // End the pool connection
    public async close(): Promise<void> {
        await this.pool.end();
    }
}
