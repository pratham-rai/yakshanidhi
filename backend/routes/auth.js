const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { auth, adminOnly, masterAdminOnly } = require('../middleware/auth');

const router = express.Router();

// Email transporter (configured via env)
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

function generateToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function userResponse(user, token) {
  return {
    token,
    user: {
      uid: user._id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    },
  };
}

function generateResetCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email: email.toLowerCase(), password: hashed, displayName });
    const token = generateToken(user);

    res.status(201).json(userResponse(user, token));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid email or password' });

    const token = generateToken(user);
    res.json(userResponse(user, token));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/forgot-password — send reset code
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists
      return res.json({ message: 'If this email is registered, a reset code has been sent.' });
    }

    // Block master admin
    if (user.role === 'masterAdmin') {
      return res.status(403).json({ error: 'Master Admin password cannot be reset this way. Contact the system administrator.' });
    }

    const code = generateResetCode();
    user.resetCode = code;
    user.resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    // Send email
    if (transporter) {
      await transporter.sendMail({
        from: `"YakshaNidhi" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: '🎭 YakshaNidhi — Password Reset Code',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#1a1a2e;color:#eee;border-radius:12px">
            <div style="text-align:center;margin-bottom:24px">
              <div style="font-size:48px">🎭</div>
              <h2 style="color:#F4A623;margin:8px 0">YakshaNidhi</h2>
            </div>
            <p>Hi <strong>${user.displayName}</strong>,</p>
            <p>You requested a password reset. Use this code:</p>
            <div style="text-align:center;margin:24px 0">
              <div style="display:inline-block;background:#E8751A;color:#fff;font-size:32px;font-weight:bold;letter-spacing:8px;padding:16px 32px;border-radius:8px">${code}</div>
            </div>
            <p style="color:#999;font-size:14px">This code expires in <strong>15 minutes</strong>.</p>
            <p style="color:#999;font-size:14px">If you didn't request this, ignore this email.</p>
            <hr style="border:1px solid #333;margin:24px 0">
            <p style="color:#666;font-size:12px;text-align:center">YakshaNidhi — The Digital Treasure of Yakshagana Events</p>
          </div>
        `,
      });
      console.log(`📧 Reset code sent to ${user.email}`);
    } else {
      // If no email configured, log to console (dev mode)
      console.log(`🔑 Reset code for ${user.email}: ${code} (no SMTP configured — showing in console)`);
    }

    res.json({ message: 'If this email is registered, a reset code has been sent.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/reset-password — verify code & set new password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, code, and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ error: 'Invalid email or code' });
    if (user.role === 'masterAdmin') return res.status(403).json({ error: 'Cannot reset Master Admin password' });

    if (!user.resetCode || user.resetCode !== code) {
      return res.status(400).json({ error: 'Invalid reset code' });
    }
    if (!user.resetCodeExpiry || new Date() > user.resetCodeExpiry) {
      return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetCode = null;
    user.resetCodeExpiry = null;
    await user.save();

    console.log(`✅ Password reset for ${user.email}`);
    res.json({ message: 'Password reset successfully! You can now log in.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, (req, res) => {
  res.json({
    uid: req.user._id,
    email: req.user.email,
    displayName: req.user.displayName,
    role: req.user.role,
  });
});

// GET /api/auth/users — list all users (master admin only)
router.get('/users', auth, masterAdminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users.map(u => ({
      uid: u._id,
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      createdAt: u.createdAt,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/auth/users/:uid/role — toggle admin role (master admin only)
router.patch('/users/:uid/role', auth, masterAdminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.uid);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'masterAdmin') return res.status(400).json({ error: 'Cannot change Master Admin role' });
    if (user._id.equals(req.user._id)) return res.status(400).json({ error: 'Cannot change your own role' });

    user.role = user.role === 'admin' ? 'user' : 'admin';
    await user.save();
    res.json({ uid: user._id, email: user.email, displayName: user.displayName, role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// POST /api/auth/change-password — change own password (all roles)
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    console.log(`🔐 Password changed for ${user.email}`);
    res.json({ message: 'Password changed successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
