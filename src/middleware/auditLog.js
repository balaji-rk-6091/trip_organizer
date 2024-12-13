const AuditLog = require('../models/auditLogModel');

const auditLog = async (req, res, next) => {
  const { email, dob } = req.method === 'GET' ? req.query : req.body;
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  console.log(`Audit Log - Email: ${email}, DOB: ${dob}, IP: ${ip}, Endpoint: ${req.originalUrl}, Method: ${req.method}`);

  try {
    await AuditLog.create({
      email,
      dob,
      ip,
      endpoint: req.originalUrl,
      method: req.method,
    });
  } catch (err) {
    console.error('Failed to log audit data:', err.message);
  }

  next();
};

module.exports = auditLog;