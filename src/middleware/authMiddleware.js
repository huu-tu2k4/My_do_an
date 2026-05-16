import jwt from 'jsonwebtoken';
import logger from '../utils/logger';
require('dotenv').config();

const jwtSecret = process.env.JWT_SECRET;

const extractBearer = (authHeader) => {
    if (!authHeader) return null;
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') return parts[1];
    return null;
}

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const token = extractBearer(authHeader);
    if (!token) {
        logger.warn(`No token provided - ${req.method} ${req.originalUrl} from ${req.ip}`);
        return res.status(401).json({ errCode: 1, errMessage: 'No token provided' });
    }

    jwt.verify(token, jwtSecret, (err, decoded) => {
        if (err) {
            logger.warn(`Invalid token for ${req.method} ${req.originalUrl} from ${req.ip}: ${err.message}`);
            return res.status(403).json({ errCode: 1, errMessage: 'Invalid token' });
        }
        logger.info(`Token verified for user ${decoded.id} (${decoded.email}) on ${req.method} ${req.originalUrl}`);
        req.user = decoded;
        next();
    });
};

export default authenticateToken;
