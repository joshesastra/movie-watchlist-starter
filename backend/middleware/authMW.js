const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Akses ditolak! Token tidak ditemukan.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = verified;
    
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token tidak valid atau telah kedaluwarsa!' });
  }
};

module.exports = authenticateToken;