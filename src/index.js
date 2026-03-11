require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const groupRoutes = require('./routes/groups');
const taskRoutes = require('./routes/tasks');
const rewardRoutes = require('./routes/rewards');
const completionRoutes = require('./routes/completions');
const redemptionRoutes = require('./routes/redemptions');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/groups', groupRoutes);
app.use('/tasks', taskRoutes);
app.use('/rewards', rewardRoutes);
app.use('/completions', completionRoutes);
app.use('/redemptions', redemptionRoutes);

app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Tarefas Fun API rodando em http://0.0.0.0:${PORT}`);
  });
}).catch(err => {
  console.error('❌ Falha ao conectar MongoDB:', err);
  process.exit(1);
});
