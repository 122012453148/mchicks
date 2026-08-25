const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'mchicks-dev-secret-change-in-production';

/**
 * Auth middleware — verifies JWT token from Authorization header.
 * Returns 401 if missing/invalid, 403 if expired.
 */
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please login.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }
    return res.status(401).json({ error: 'Invalid session token. Please login.' });
  }
};

module.exports = { requireAuth, JWT_SECRET };
