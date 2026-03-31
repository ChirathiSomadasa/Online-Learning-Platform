const User   = require('../models/User');
const jwt    = require('jsonwebtoken');
const axios  = require('axios');
const bcrypt = require('bcryptjs');

// Input sanitizer helper
const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return null;
  const trimmed = email.trim().toLowerCase();

  // FIXED: Replaced '+' with bounded length limits {1,256} and {2,64} to prevent ReDoS
  const emailRegex = /^[^\s@]{1,256}@[^\s@]{1,256}\.[^\s@]{2,64}$/;

  return emailRegex.test(trimmed) ? trimmed : null;
};

const sanitizeString = (value) => {
  if (typeof value !== 'string') return null;
  return value.trim();
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, securityQuestion, securityAnswer } = req.body;

    // Sanitize inputs
    const cleanEmail    = sanitizeEmail(email);
    const cleanName     = sanitizeString(name);
    const cleanRole     = sanitizeString(role);
    const cleanQuestion = sanitizeString(securityQuestion);
    const cleanAnswer   = sanitizeString(securityAnswer);

    // Validate required fields
    if (!cleanEmail)    return res.status(400).json({ message: 'Invalid email address' });
    if (!cleanName)     return res.status(400).json({ message: 'Name is required' });
    if (!password || typeof password !== 'string' || password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    // Validate role — only student or instructor allowed
    if (cleanRole && !['student', 'instructor'].includes(cleanRole))
      return res.status(400).json({ message: 'Role must be student or instructor' });

    // securityQuestion and securityAnswer  required
    if (!cleanQuestion) return res.status(400).json({ message: 'Security question is required' });
    if (!cleanAnswer)   return res.status(400).json({ message: 'Security answer is required' });

    // Use sanitized email in DB query — prevents NoSQL injection
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const hashedAnswer   = await bcrypt.hash(cleanAnswer.toLowerCase(), 12);

    const user = await User.create({
      name:             cleanName,
      email:            cleanEmail,
      password:         hashedPassword,
      role:             cleanRole || 'student',
      securityQuestion: cleanQuestion,
      securityAnswer:   hashedAnswer
    });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    try {
      await axios.post(
        `${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/send`,
        { to: cleanEmail, type: 'welcome', userName: cleanName,
          message: `Welcome to the Online Learning Platform, ${cleanName}!` }
      );
    } catch (notifyErr) {
      console.warn('Notification service unavailable:', notifyErr.message);
    }

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user._id, name: cleanName, email: cleanEmail, role: cleanRole || 'student' }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/auth/forgot-password/question
exports.getSecurityQuestion = async (req, res) => {
  try {
    const cleanEmail = sanitizeEmail(req.body.email);
    if (!cleanEmail) return res.status(400).json({ message: 'Invalid email address' });

    const user = await User.findOne({ email: cleanEmail });
    if (!user) return res.status(404).json({ message: 'No account found with this email' });
    if (!user.securityQuestion)
      return res.status(400).json({ message: 'No security question set for this account' });

    res.json({ securityQuestion: user.securityQuestion });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/auth/forgot-password/reset
exports.resetPasswordWithQuestion = async (req, res) => {
  try {
    const { email, securityAnswer, newPassword } = req.body;

    const cleanEmail  = sanitizeEmail(email);
    const cleanAnswer = sanitizeString(securityAnswer);

    if (!cleanEmail)  return res.status(400).json({ message: 'Invalid email address' });
    if (!cleanAnswer) return res.status(400).json({ message: 'Security answer is required' });
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const user = await User.findOne({ email: cleanEmail });
    if (!user) return res.status(404).json({ message: 'No account found with this email' });

    const isMatch = await bcrypt.compare(
      cleanAnswer.toLowerCase(),
      user.securityAnswer
    );
    if (!isMatch) return res.status(401).json({ message: 'Incorrect answer. Please try again.' });

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ message: 'Password reset successfully. You can now login.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const cleanEmail = sanitizeEmail(email);
    if (!cleanEmail) return res.status(400).json({ message: 'Invalid email address' });
    if (!password || typeof password !== 'string')
      return res.status(400).json({ message: 'Password is required' });

    const user = await User.findOne({ email: cleanEmail });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: cleanEmail, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/auth/validate
exports.validate = (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ valid: false, message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch {
    res.status(401).json({ valid: false, message: 'Invalid or expired token' });
  }
};

// GET /api/auth/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -securityAnswer');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const cleanEmail = sanitizeEmail(req.body.email);
    const cleanName  = sanitizeString(req.body.name);

    if (!cleanEmail) return res.status(400).json({ message: 'Invalid email address' });
    if (!cleanName)  return res.status(400).json({ message: 'Name is required' });

    const existing = await User.findOne({ email: cleanEmail, _id: { $ne: req.user.id } });
    if (existing) return res.status(400).json({ message: 'Email already in use' });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name: cleanName, email: cleanEmail },
      { new: true, runValidators: true }
    ).select('-password -securityAnswer');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Profile updated successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/auth/profile/password
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || typeof currentPassword !== 'string')
      return res.status(400).json({ message: 'Current password is required' });
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6)
      return res.status(400).json({ message: 'New password must be at least 6 characters' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/auth/profile
exports.deleteProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};