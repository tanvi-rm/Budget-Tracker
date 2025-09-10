const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Expense = require('../models/Expense');
const isAuth = require('../middleware/auth');

// Add expense
router.post('/expense/add', isAuth, async (req, res) => {
  try {
    const { source, category, amount, date } = req.body;

    const newExpense = new Expense({
      userId: req.session.user.id,
      source,
      category,
      amount,
      date
    });

    await newExpense.save();
    res.status(201).json({ message: 'Expense added successfully' });
  } catch (err) {
    console.error('Add expense error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all expenses for logged-in user
router.get('/expense/all', isAuth, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.session.user.id }).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    console.error('Fetch expense error:', err);
    res.status(500).json({ error: 'Failed to load expenses' });
  }
});

// ✅ Get category-wise expense stats for the current month
router.get('/expense/stats/category-wise', isAuth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.session.user.id);

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const stats = await Expense.aggregate([
      {
        $match: {
          userId,
          date: {
            $gte: firstDay,
            $lt: firstDayNextMonth
          }
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
    console.error('Error in stats route:', err);
    res.status(500).json({ error: 'Failed to fetch expense stats' });
  }
});

module.exports = router;
