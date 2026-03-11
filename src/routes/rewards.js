const express = require('express');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Reward = require('../models/Reward');
const auth = require('../authMiddleware');
const { clean, cleanMany } = require('../db');

const router = express.Router();

// GET /rewards
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.userId }).lean();
    if (!user || !user.groupId) return res.json([]);

    const rewards = await Reward.find({ groupId: user.groupId }).lean();
    res.json(cleanMany(rewards));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /rewards
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, cost, icon, stock } = req.body;

    if (!title || !cost) {
      return res.status(400).json({ error: 'Título e custo são obrigatórios' });
    }

    const user = await User.findOne({ id: req.userId }).lean();
    if (!user || !user.groupId) {
      return res.status(400).json({ error: 'Você precisa pertencer a um grupo para criar recompensas' });
    }

    const reward = {
      id: uuidv4(),
      title,
      description: description || '',
      cost: Number(cost),
      icon: icon || '🎁',
      stock: stock !== undefined ? Number(stock) : -1,
      groupId: user.groupId,
      createdBy: req.userId,
      createdAt: new Date().toISOString(),
    };

    await new Reward(reward).save();
    res.status(201).json(reward);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /rewards/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const reward = await Reward.findOne({ id: req.params.id }).lean();
    if (!reward) return res.status(404).json({ error: 'Recompensa não encontrada' });

    const user = await User.findOne({ id: req.userId }).lean();
    if (reward.groupId !== user.groupId) {
      return res.status(403).json({ error: 'Sem permissão para remover esta recompensa' });
    }

    await Reward.deleteOne({ id: req.params.id });
    res.json({ message: 'Recompensa removida' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
