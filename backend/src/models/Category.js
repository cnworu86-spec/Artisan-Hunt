const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  icon: { type: String, default: 'Wrench' },
  status: {
    type: String,
    enum: ['active', 'disabled'],
    default: 'active'
  },
  displayOrder: { type: Number, default: 0 }
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
