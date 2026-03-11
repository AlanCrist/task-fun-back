const express = require('express');
const User = require('../models/User');
const auth = require('../authMiddleware');
const { clean } = require('../db');

const router = express.Router();

// GET /users/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.userId }).lean();
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    const { password: _p, ...userPublic } = clean(user);
    res.json(userPublic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /users/me
router.put('/me', auth, async (req, res) => {
  try {
    const { name, avatar } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (avatar) updates.avatar = avatar;

    await User.updateOne({ id: req.userId }, { $set: updates });

    const updated = await User.findOne({ id: req.userId }).lean();
    if (!updated) return res.status(404).json({ error: 'Usuário não encontrado' });

    const { password: _p, ...userPublic } = clean(updated);
    res.json(userPublic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
