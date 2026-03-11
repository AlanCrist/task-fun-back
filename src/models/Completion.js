const { Schema, model } = require('mongoose');

const completionSchema = new Schema({
  id: { type: String, required: true, unique: true },
  taskId: { type: String, required: true },
  userId: { type: String, required: true },
  completedAt: String,
  pointsEarned: Number,
}, { versionKey: false });

module.exports = model('Completion', completionSchema);
