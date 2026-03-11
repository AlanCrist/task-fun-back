const { Schema, model } = require('mongoose');

const taskSchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  points: { type: Number, required: true },
  icon: { type: String, default: '✅' },
  category: { type: String, default: 'Geral' },
  isRecurring: { type: Boolean, default: true },
  groupId: { type: String, default: null },
  createdBy: String,
  createdAt: String,
}, { versionKey: false });

module.exports = model('Task', taskSchema);
