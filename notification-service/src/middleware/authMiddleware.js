// const jwt = require('jsonwebtoken');

// module.exports = (req, res, next) => {
//   const token = req.headers.authorization?.split(' ')[1];
//   if (!token) return res.status(401).json({ message: 'No token provided' });
//   try {
//     req.user = jwt.verify(token, process.env.JWT_SECRET);
//     next();
//   } catch {
//     res.status(401).json({ message: 'Invalid or expired token' });
//   }
// };



// notification-service/src/middleware/authMiddleware.js
const axios = require('axios');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  try {
    const validateUrl = `${process.env.USER_AUTH_URL}/api/auth/validate`;
    const response = await axios.get(validateUrl, {
      headers: { Authorization: authHeader },
      timeout: 5000,
    });

    // attach decoded user to req for downstream handlers if needed
    req.user = response.data.user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};