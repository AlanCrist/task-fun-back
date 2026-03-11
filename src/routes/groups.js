const express = require('express');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Group = require('../models/Group');
const auth = require('../authMiddleware');
const { clean, cleanMany } = require('../db');

const router = express.Router();

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// POST /groups
router.post('/', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome do grupo é obrigatório' });

    const user = await User.findOne({ id: req.userId }).lean();
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    if (user.groupId) return res.status(400).json({ error: 'Você já pertence a um grupo. Saia antes de criar outro.' });

    const group = {
      id: uuidv4(),
      name,
      code: generateCode(),
      memberIds: [req.userId],
      createdAt: new Date().toISOString(),
    };

    await new Group(group).save();
    await User.updateOne({ id: req.userId }, { $set: { groupId: group.id } });

    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /groups/join
router.post('/join', auth, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Código do grupo é obrigatório' });

    const user = await User.findOne({ id: req.userId }).lean();
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    if (user.groupId) return res.status(400).json({ error: 'Você já pertence a um grupo. Saia antes de entrar em outro.' });

    const group = await Group.findOne({ code: code.toUpperCase() }).lean();
    if (!group) return res.status(404).json({ error: 'Grupo não encontrado com esse código' });

    await Group.updateOne({ id: group.id }, { $push: { memberIds: req.userId } });
    await User.updateOne({ id: req.userId }, { $set: { groupId: group.id } });

    const updatedGroup = await Group.findOne({ id: group.id }).lean();
    res.json(clean(updatedGroup));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /groups/my
router.get('/my', auth, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.userId }).lean();
    if (!user || !user.groupId) return res.status(404).json({ error: 'Você não pertence a nenhum grupo' });

    const group = await Group.findOne({ id: user.groupId }).lean();
    if (!group) return res.status(404).json({ error: 'Grupo não encontrado' });

    const members = await User.find({ id: { $in: group.memberIds } }).lean();
    const membersPublic = members.map(({ password, ...u }) => clean(u));

    res.json({ ...clean(group), members: membersPublic });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /groups/my/name
router.put('/my/name', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome é obrigatório' });

    const user = await User.findOne({ id: req.userId }).lean();
    if (!user || !user.groupId) return res.status(404).json({ error: 'Você não pertence a nenhum grupo' });

    await Group.updateOne({ id: user.groupId }, { $set: { name } });
    const group = await Group.findOne({ id: user.groupId }).lean();
    res.json(clean(group));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /groups/my/leave
router.delete('/my/leave', auth, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.userId }).lean();
    if (!user || !user.groupId) return res.status(400).json({ error: 'Você não pertence a nenhum grupo' });

    const group = await Group.findOne({ id: user.groupId }).lean();
    const newMembers = group.memberIds.filter(id => id !== req.userId);

    if (newMembers.length === 0) {
      await Group.deleteOne({ id: group.id });
    } else {
      await Group.updateOne({ id: group.id }, { $set: { memberIds: newMembers } });
    }

    await User.updateOne({ id: req.userId }, { $set: { groupId: null } });
    res.json({ message: 'Você saiu do grupo' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /groups/:id/ranking
router.get('/:id/ranking', auth, async (req, res) => {
  try {
    const group = await Group.findOne({ id: req.params.id }).lean();
    if (!group) return res.status(404).json({ error: 'Grupo não encontrado' });

    const members = await User.find({ id: { $in: group.memberIds } })
      .sort({ totalPoints: -1 })
      .lean();

    const membersPublic = members.map(({ password, ...u }) => clean(u));
    res.json(membersPublic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
