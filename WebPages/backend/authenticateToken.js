const jwt = require('jsonwebtoken');
require('dotenv').config({ path: "../../.env" });

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token.' });
        }

        // Attach user info to request for use in routes
        req.user = user;
        next();
    });
}

module.exports = authenticateToken;
