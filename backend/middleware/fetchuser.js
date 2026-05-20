const jwt = require('jsonwebtoken');

// Read JWT_SECRET from environment variable (set in .env or by docker-compose)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const fetchuser = (req, res, next) => {
    // getting user from JWT token & add ID to req object
    const token = req.header('auth-token');
    if(!token) {
        return res.status(401).send({ error: "Please authenticate using a Valid token" })
    }
    try {
        const data = jwt.verify(token , JWT_SECRET);
        req.user = data.user;
        next();
    } catch (error) {
        return res.status(401).send({ error: "Please authenticate using a Valid token" })
    }
};

module.exports = fetchuser;