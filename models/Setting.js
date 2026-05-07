const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  heroMode: { type: String, enum: ['carousel', 'static'], default: 'carousel' },
  heroImages: { type: [String], default: [] },
  heroInterval: { type: Number, default: 5000 },
  heroStaticImage: { type: String, default: '' }
});

module.exports = mongoose.model('Setting', settingSchema);
