const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

router.use(protect);

// Get User Transactions
router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add Transaction
router.post('/', async (req, res) => {
  try {
    const { text, amount, category } = req.body;
    if (!text || amount === undefined) {
      return res.status(400).json({ message: 'Please provide text and amount' });
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      text,
      amount,
      category: category || 'General'
    });

    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete Transaction
router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    await transaction.deleteOne();
    res.status(200).json({ message: 'Transaction removed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;