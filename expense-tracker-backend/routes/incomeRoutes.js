const express = require('express');
const Income = require('../models/Income');
const router = express.Router();
const { Types } = require('mongoose');


function isAuth(req, res, next) {
  if (req.session.user) return next();
  return res.status(401).json({ error: 'Not authenticated' });
}

// Add new income
router.post('/income/add', isAuth, async (req, res) => {
  const { source, category, amount, date } = req.body;
  if (!source || !category || !amount || !date) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const income = new Income({
      user: req.session.user.id,
      source,
      category,
      amount,
      date
    });
    await income.save();
    res.json({ message: 'Income added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save income' });
  }
});

// Get all income entries
router.get('/income/all', isAuth, async (req, res) => {
  try {
    const incomes = await Income.find({ user: req.session.user.id }).sort({ date: -1 });
    res.json(incomes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch income' });
  }
});

router.get('/income/stats/category-wise', isAuth, async (req, res) => {
  try {
    const stats = await Income.aggregate([
      {
        $match: {
          user: new Types.ObjectId(req.session.user.id)
        }
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    res.json(stats);
  } catch (err) {
    console.error('Error fetching income stats:', err);
    res.status(500).json({ error: 'Failed to fetch income stats' });
  }
});




module.exports = router;
