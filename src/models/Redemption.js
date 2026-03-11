const { Schema, model } = require('mongoose');

const redemptionSchema = new Schema({
  id: { type: String, required: true, unique: true },
  rewardId: { type: String, required: true },
  userId: { type: String, required: true },
  redeemedAt: String,
  pointsSpent: Number,
}, { versionKey: false });

module.exports = model('Redemption', redemptionSchema);
