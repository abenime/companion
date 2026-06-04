import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authenticateJWT(req: any, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).json({ error: 'Authorization header is missing' });
        return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Token is missing from authorization header' });
        return;
    }

    const jwtSecret = process.env.JWT_SECRET || 'wellness_companion_secret_key';

    try {
        const decoded = jwt.verify(token, jwtSecret) as { userId: string; email: string };
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        next();
    } catch (err) {
        console.error('JWT Verification error:', err);
        res.status(403).json({ error: 'Invalid or expired authentication token' });
    }
}
