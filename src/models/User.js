const { Schema, model } = require('mongoose');

const userSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: String,
  points: { type: Number, default: 0 },
  totalPoints: { type: Number, default: 0 },
  groupId: { type: String, default: null },
  createdAt: String,
}, { versionKey: false });

module.exports = model('User', userSchema);
