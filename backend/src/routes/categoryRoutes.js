const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// @desc    Get all active service categories
// @route   GET /api/categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ status: 'active' }).select('name icon');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
