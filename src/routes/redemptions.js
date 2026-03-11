const express = require('express');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Reward = require('../models/Reward');
const Redemption = require('../models/Redemption');
const auth = require('../authMiddleware');
const { clean } = require('../db');

const router = express.Router();

// POST /redemptions
router.post('/', auth, async (req, res) => {
  try {
    const { rewardId } = req.body;
    if (!rewardId) return res.status(400).json({ error: 'rewardId é obrigatório' });

    const reward = await Reward.findOne({ id: rewardId }).lean();
    if (!reward) return res.status(404).json({ error: 'Recompensa não encontrada' });

    const user = await User.findOne({ id: req.userId }).lean();
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    if (user.points < reward.cost) {
      return res.status(400).json({ error: `Pontos insuficientes. Você tem ${user.points} pontos, precisa de ${reward.cost}` });
    }

    if (reward.stock === 0) {
      return res.status(400).json({ error: 'Recompensa esgotada' });
    }

    const redemption = {
      id: uuidv4(),
      rewardId,
      userId: req.userId,
      redeemedAt: new Date().toISOString(),
      pointsSpent: reward.cost,
    };

    await new Redemption(redemption).save();
    await User.updateOne({ id: req.userId }, { $set: { points: user.points - reward.cost } });

    if (reward.stock > 0) {
      await Reward.updateOne({ id: rewardId }, { $set: { stock: reward.stock - 1 } });
    }

    const updatedUser = await User.findOne({ id: req.userId }).lean();
    const { password: _p, ...userPublic } = clean(updatedUser);

    res.status(201).json({ redemption, user: userPublic });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /redemptions
router.get('/', auth, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const redemptions = await Redemption.find({ userId: req.userId })
      .sort({ redeemedAt: -1 })
      .limit(Number(limit))
      .lean();

    const enriched = await Promise.all(redemptions.map(async (r) => {
      const reward = await Reward.findOne({ id: r.rewardId }).lean();
      return { ...clean(r), reward: reward ? clean(reward) : null };
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
