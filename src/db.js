const mongoose = require('mongoose');
const Task = require('./models/Task');

const DEFAULT_TASKS = [
  { id: 't1', title: 'Lavar a louça', description: 'Lavar e secar toda a louça', points: 10, icon: '🍽️', category: 'Cozinha', isRecurring: true },
  { id: 't2', title: 'Varrer a sala', description: 'Varrer e deixar a sala limpa', points: 15, icon: '🧹', category: 'Limpeza', isRecurring: true },
  { id: 't3', title: 'Limpar o banheiro', description: 'Limpar pia, vaso e chão', points: 25, icon: '🚿', category: 'Limpeza', isRecurring: true },
  { id: 't4', title: 'Passar pano no chão', description: 'Passar pano em todos os cômodos', points: 20, icon: '🪣', category: 'Limpeza', isRecurring: true },
  { id: 't5', title: 'Lavar roupas', description: 'Colocar roupa na máquina e estender', points: 20, icon: '👕', category: 'Lavanderia', isRecurring: true },
  { id: 't6', title: 'Dobrar roupas', description: 'Dobrar e guardar as roupas secas', points: 15, icon: '🧺', category: 'Lavanderia', isRecurring: true },
  { id: 't7', title: 'Fazer as compras', description: 'Ir ao mercado com a lista', points: 30, icon: '🛒', category: 'Compras', isRecurring: true },
  { id: 't8', title: 'Cozinhar o almoço', description: 'Preparar o almoço para a família', points: 35, icon: '🍳', category: 'Cozinha', isRecurring: true },
  { id: 't9', title: 'Cozinhar o jantar', description: 'Preparar o jantar para a família', points: 35, icon: '🍲', category: 'Cozinha', isRecurring: true },
  { id: 't10', title: 'Tirar o lixo', description: 'Recolher e levar o lixo para fora', points: 10, icon: '🗑️', category: 'Limpeza', isRecurring: true },
  { id: 't11', title: 'Organizar a geladeira', description: 'Limpar e organizar a geladeira', points: 20, icon: '❄️', category: 'Cozinha', isRecurring: false },
  { id: 't12', title: 'Limpar janelas', description: 'Limpar os vidros das janelas', points: 25, icon: '🪟', category: 'Limpeza', isRecurring: false },
  { id: 't13', title: 'Regar as plantas', description: 'Regar todas as plantas da casa', points: 10, icon: '🌿', category: 'Jardim', isRecurring: true },
  { id: 't14', title: 'Passear com o pet', description: 'Levar o bichinho para passear', points: 15, icon: '🐕', category: 'Pets', isRecurring: true },
  { id: 't15', title: 'Organizar quarto', description: 'Arrumar cama e organizar o quarto', points: 15, icon: '🛏️', category: 'Organização', isRecurring: true },
];

async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB conectado');

  const count = await Task.countDocuments({ groupId: null });
  if (count === 0) {
    await Task.insertMany(DEFAULT_TASKS);
    console.log('✅ Tarefas padrão inseridas');
  }
}

function clean(doc) {
  if (!doc) return doc;
  const { _id, __v, ...rest } = doc;
  return rest;
}

function cleanMany(docs) {
  return docs.map(clean);
}

module.exports = { connectDB, clean, cleanMany };
