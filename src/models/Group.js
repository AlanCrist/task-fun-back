const { Schema, model } = require('mongoose');

const groupSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  memberIds: [String],
  createdAt: String,
}, { versionKey: false });

module.exports = model('Group', groupSchema);
