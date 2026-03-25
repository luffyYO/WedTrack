import jwt from 'jsonwebtoken';

export const verifyAdmin = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized', message: 'No admin token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret_admin_jwt_key_wedtrack');
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden', message: 'Not an active admin session' });
        }

        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired admin token' });
    }
};
