const express = require('express');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Task = require('../models/Task');
const Group = require('../models/Group');
const Completion = require('../models/Completion');
const auth = require('../authMiddleware');
const { clean } = require('../db');

const router = express.Router();

// POST /completions
router.post('/', auth, async (req, res) => {
  try {
    const { taskId } = req.body;
    if (!taskId) return res.status(400).json({ error: 'taskId é obrigatório' });

    const task = await Task.findOne({ id: taskId }).lean();
    if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' });

    const user = await User.findOne({ id: req.userId }).lean();

    if (!task.isRecurring) {
      const alreadyDone = await Completion.findOne({ taskId, userId: req.userId }).lean();
      if (alreadyDone) {
        return res.status(400).json({ error: 'Você já completou esta tarefa' });
      }
    }

    const completion = {
      id: uuidv4(),
      taskId,
      userId: req.userId,
      completedAt: new Date().toISOString(),
      pointsEarned: task.points,
    };

    await new Completion(completion).save();
    await User.updateOne({ id: req.userId }, {
      $set: {
        points: user.points + task.points,
        totalPoints: user.totalPoints + task.points,
      },
    });

    const updatedUser = await User.findOne({ id: req.userId }).lean();
    const { password: _p, ...userPublic } = clean(updatedUser);

    res.status(201).json({ completion, user: userPublic });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /completions
router.get('/', auth, async (req, res) => {
  try {
    const { userId, limit = 20 } = req.query;
    const filterUserId = userId || req.userId;

    const completions = await Completion.find({ userId: filterUserId })
      .sort({ completedAt: -1 })
      .limit(Number(limit))
      .lean();

    const enriched = await Promise.all(completions.map(async (c) => {
      const task = await Task.findOne({ id: c.taskId }).lean();
      const u = await User.findOne({ id: c.userId }).lean();
      const { password: _p, ...userPub } = u ? clean(u) : {};
      return { ...clean(c), task: task ? clean(task) : null, user: u ? userPub : null };
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /completions/group
router.get('/group', auth, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const user = await User.findOne({ id: req.userId }).lean();
    if (!user || !user.groupId) return res.json([]);

    const group = await Group.findOne({ id: user.groupId }).lean();
    if (!group) return res.json([]);

    const completions = await Completion.find({ userId: { $in: group.memberIds } })
      .sort({ completedAt: -1 })
      .limit(Number(limit))
      .lean();

    const enriched = await Promise.all(completions.map(async (c) => {
      const task = await Task.findOne({ id: c.taskId }).lean();
      const u = await User.findOne({ id: c.userId }).lean();
      const { password: _p, ...userPub } = u ? clean(u) : {};
      return { ...clean(c), task: task ? clean(task) : null, user: u ? userPub : null };
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
