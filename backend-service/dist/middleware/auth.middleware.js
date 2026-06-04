"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = authenticateJWT;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authenticateJWT(req, res, next) {
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
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        next();
    }
    catch (err) {
        console.error('JWT Verification error:', err);
        res.status(403).json({ error: 'Invalid or expired authentication token' });
    }
}
