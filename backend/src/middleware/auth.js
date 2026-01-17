const JWTService = require('../services/jwtService');

const auth = (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization required' });
    }

    const token = header.substring(7);
    const decoded = JWTService.verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Authorization failed' });
  }
};

module.exports = { auth };
