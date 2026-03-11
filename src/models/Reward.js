const { Schema, model } = require('mongoose');

const rewardSchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  cost: { type: Number, required: true },
  icon: { type: String, default: '🎁' },
  stock: { type: Number, default: -1 },
  groupId: { type: String, required: true },
  createdBy: String,
  createdAt: String,
}, { versionKey: false });

module.exports = model('Reward', rewardSchema);
