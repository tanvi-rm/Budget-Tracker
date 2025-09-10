const express = require('express');
const router = express.Router();
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const isAuth = require('../middleware/auth');

router.get('/recent-transactions', isAuth, async (req, res) => {
  try {
    const userId = req.session.userId;

    const [incomes, expenses] = await Promise.all([
      Income.find({ user: userId }).select('source category amount date').lean(),
      Expense.find({ userId }).select('source category amount date').lean()
    ]);

    const transactions = [
      ...incomes.map(t => ({ ...t, type: 'income' })),
      ...expenses.map(t => ({ ...t, type: 'expense' }))
    ];

    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recent = transactions.slice(0, 5);



    res.json(recent);
  } catch (err) {
    console.error('Error fetching recent transactions:', err);
    res.status(500).json({ error: 'Failed to fetch recent transactions' });
  }
});



module.exports = router;
