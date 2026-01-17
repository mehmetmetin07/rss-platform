const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const JWTService = require('../services/jwtService');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const existing = User.findByEmail(email);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = User.create({ email, password_hash, full_name });
    const token = JWTService.generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const user = User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    User.updateLastLogin(user.id);
    const token = JWTService.generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
