const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const { clean } = require('../db');

const router = express.Router();

const AVATARS = ['🧑', '👩', '👨', '👧', '👦', '🧓', '👴', '👵', '🧒', '🦸'];

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, avatar } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }

    const exists = await User.findOne({ email }).lean();
    if (exists) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = {
      id: uuidv4(),
      name,
      email,
      password: hash,
      avatar: avatar || AVATARS[Math.floor(Math.random() * AVATARS.length)],
      points: 0,
      totalPoints: 0,
      groupId: null,
      createdAt: new Date().toISOString(),
    };

    await new User(user).save();

    const { password: _p, ...userPublic } = user;
    const token = signToken(user.id);

    res.status(201).json({ token, user: userPublic });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const user = await User.findOne({ email }).lean();
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const { password: _p, ...userPublic } = clean(user);
    const token = signToken(user.id);

    res.json({ token, user: userPublic });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
