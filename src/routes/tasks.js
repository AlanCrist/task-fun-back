const express = require('express');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Task = require('../models/Task');
const auth = require('../authMiddleware');
const { clean, cleanMany } = require('../db');

const router = express.Router();

// GET /tasks
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.userId }).lean();
    const tasks = await Task.find({
      $or: [{ groupId: null }, { groupId: user?.groupId || '__none__' }],
    }).lean();
    res.json(cleanMany(tasks));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /tasks
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, points, icon, category, isRecurring } = req.body;

    if (!title || !points) {
      return res.status(400).json({ error: 'Título e pontos são obrigatórios' });
    }

    const user = await User.findOne({ id: req.userId }).lean();
    if (!user || !user.groupId) {
      return res.status(400).json({ error: 'Você precisa pertencer a um grupo para criar tarefas' });
    }

    const task = {
      id: uuidv4(),
      title,
      description: description || '',
      points: Number(points),
      icon: icon || '✅',
      category: category || 'Geral',
      isRecurring: isRecurring !== false,
      groupId: user.groupId,
      createdBy: req.userId,
      createdAt: new Date().toISOString(),
    };

    await new Task(task).save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /tasks/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ id: req.params.id }).lean();
    if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' });
    if (!task.groupId) return res.status(403).json({ error: 'Tarefas padrão não podem ser removidas' });

    const user = await User.findOne({ id: req.userId }).lean();
    if (task.groupId !== user.groupId) {
      return res.status(403).json({ error: 'Sem permissão para remover esta tarefa' });
    }

    await Task.deleteOne({ id: req.params.id });
    res.json({ message: 'Tarefa removida' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
