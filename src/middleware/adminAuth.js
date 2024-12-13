const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('Authorization').replace('Bearer ', '');

  // Check if not token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, 'secret');
    if (decoded.admin && decoded.admin.role === 'admin') {
      req.admin = decoded.admin;
      next();
    } else {
      res.status(403).json({ msg: 'Access denied' });
    }
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};