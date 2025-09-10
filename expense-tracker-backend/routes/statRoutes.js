const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const isAuth = require('../middleware/auth');

// 👇 FIXED THIS LINE — only '/summary' is needed
router.get('/summary', isAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [totalIncomeResult, totalExpenseResult] = await Promise.all([
      Income.aggregate([
        { $match: { user: userObjectId } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Expense.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const totalIncome = totalIncomeResult[0]?.total || 0;
    const totalExpense = totalExpenseResult[0]?.total || 0;
    const totalBalance = totalIncome - totalExpense;

    res.json({ totalIncome, totalExpense, totalBalance });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
