import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DatabaseConnection } from '../config/database';

export class AuthController {
    
    public static async register(req: Request, res: Response): Promise<void> {
        const { name, email, password, profile, connections } = req.body;

        if (!name || !email || !password || !profile) {
            res.status(400).json({ error: 'Missing required signup fields' });
            return;
        }

        const { age, gender, work_status } = profile;
        if (age === undefined || !gender || !work_status) {
            res.status(400).json({ error: 'Missing required demographic profile properties' });
            return;
        }

        const db = DatabaseConnection.getInstance();
        const client = await db.getClient();

        try {
            await client.query('BEGIN');

            // 1. Check if user already exists
            const existingQuery = 'SELECT id FROM users WHERE email = $1';
            const existingCheck = await client.query(existingQuery, [email]);
            if (existingCheck.rows.length > 0) {
                res.status(409).json({ error: 'User with this email already exists' });
                await client.query('ROLLBACK');
                return;
            }

            // 2. Hash password
            const passwordHash = await bcrypt.hash(password, 10);

            // 3. Insert into core users table
            const userInsert = `
                INSERT INTO users (name, email, password_hash)
                VALUES ($1, $2, $3)
                RETURNING id, name, email
            `;
            const userResult = await client.query(userInsert, [name, email, passwordHash]);
            const newUser = userResult.rows[0];
            const userId = newUser.id;

            // 4. Insert into user_profiles table (demographics)
            const profileInsert = `
                INSERT INTO user_profiles (user_id, age, gender, work_status)
                VALUES ($1, $2, $3, $4)
            `;
            await client.query(profileInsert, [userId, age, gender, work_status]);

            // 5. Insert into user_connections table (integrations)
            const calendarSync = connections?.calendar_sync_enabled ?? false;
            const externalSync = connections?.external_sync_enabled ?? false;
            const connectionsInsert = `
                INSERT INTO user_connections (user_id, calendar_sync_enabled, external_sync_enabled)
                VALUES ($1, $2, $3)
            `;
            await client.query(connectionsInsert, [userId, calendarSync, externalSync]);

            // 6. Pre-initialize default baseline values for user
            const baselineInsert = `
                INSERT INTO user_baselines (user_id)
                VALUES ($1)
            `;
            await client.query(baselineInsert, [userId]);

            await client.query('COMMIT');

            // 7. Sign JWT token
            const jwtSecret = process.env.JWT_SECRET || 'wellness_companion_secret_key';
            const token = jwt.sign({ userId, email: newUser.email }, jwtSecret, { expiresIn: '30d' });

            res.status(201).json({
                message: 'Registration completed successfully',
                token,
                user: {
                    id: userId,
                    name: newUser.name,
                    email: newUser.email,
                    profile: { age, gender, work_status },
                    connections: { calendar_sync_enabled: calendarSync, external_sync_enabled: externalSync }
                }
            });

        } catch (error: any) {
            await client.query('ROLLBACK');
            console.error('Registration transaction rolled back with error:', error);
            res.status(500).json({ error: 'Internal server error during registration' });
        } finally {
            client.release();
        }
    }

    public static async login(req: Request, res: Response): Promise<void> {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Missing email or password' });
            return;
        }

        const db = DatabaseConnection.getInstance();

        try {
            // Fetch core user credentials and sub-relations
            const userQuery = `
                SELECT u.id, u.name, u.email, u.password_hash,
                       p.age, p.gender, p.work_status,
                       c.calendar_sync_enabled, c.external_sync_enabled
                FROM users u
                LEFT JOIN user_profiles p ON p.user_id = u.id
                LEFT JOIN user_connections c ON c.user_id = u.id
                WHERE u.email = $1
            `;
            const result = await db.query(userQuery, [email]);
            if (result.rows.length === 0) {
                res.status(401).json({ error: 'Invalid email or password' });
                return;
            }

            const dbUser = result.rows[0];

            // Verify password hash
            const isMatch = await bcrypt.compare(password, dbUser.password_hash);
            if (!isMatch) {
                res.status(401).json({ error: 'Invalid email or password' });
                return;
            }

            const jwtSecret = process.env.JWT_SECRET || 'wellness_companion_secret_key';
            const token = jwt.sign({ userId: dbUser.id, email: dbUser.email }, jwtSecret, { expiresIn: '30d' });

            res.status(200).json({
                message: 'Login successful',
                token,
                user: {
                    id: dbUser.id,
                    name: dbUser.name,
                    email: dbUser.email,
                    profile: {
                        age: dbUser.age,
                        gender: dbUser.gender,
                        work_status: dbUser.work_status
                    },
                    connections: {
                        calendar_sync_enabled: dbUser.calendar_sync_enabled,
                        external_sync_enabled: dbUser.external_sync_enabled
                    }
                }
            });

        } catch (error: any) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Internal server error during login' });
        }
    }

    public static async getConnections(req: any, res: Response): Promise<void> {
        const userId = req.userId;
        const db = DatabaseConnection.getInstance();

        try {
            const query = `SELECT calendar_sync_enabled, external_sync_enabled FROM user_connections WHERE user_id = $1`;
            const result = await db.query(query, [userId]);
            if (result.rows.length === 0) {
                res.status(404).json({ error: 'Connections record not found' });
                return;
            }
            res.status(200).json(result.rows[0]);
        } catch (error: any) {
            console.error('Fetch connections error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    public static async updateConnections(req: any, res: Response): Promise<void> {
        const userId = req.userId;
        const { calendar_sync_enabled, external_sync_enabled } = req.body;
        const db = DatabaseConnection.getInstance();

        try {
            const updateFields: string[] = [];
            const params: any[] = [userId];
            let paramCounter = 2;

            if (calendar_sync_enabled !== undefined) {
                updateFields.push(`calendar_sync_enabled = $${paramCounter++}`);
                params.push(calendar_sync_enabled);
            }
            if (external_sync_enabled !== undefined) {
                updateFields.push(`external_sync_enabled = $${paramCounter++}`);
                params.push(external_sync_enabled);
            }

            if (updateFields.length === 0) {
                res.status(400).json({ error: 'No fields provided to update' });
                return;
            }

            const query = `
                UPDATE user_connections 
                SET ${updateFields.join(', ')} 
                WHERE user_id = $1
                RETURNING calendar_sync_enabled, external_sync_enabled
            `;
            const result = await db.query(query, params);
            if (result.rows.length === 0) {
                res.status(404).json({ error: 'Connections record not found' });
                return;
            }

            res.status(200).json({
                message: 'Connections updated successfully',
                connections: result.rows[0]
            });
        } catch (error: any) {
            console.error('Update connections error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
