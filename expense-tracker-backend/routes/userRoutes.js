// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const isAuth = require('../middleware/auth');

// Route to get profile info
router.get('/profile', isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('fullName avatar');

    if (!user) return res.status(404).json({ error: 'User not found' });

    let avatarBase64 = null;

    if (user.avatar && user.avatar.data) {
      avatarBase64 = `data:${user.avatar.contentType};base64,${user.avatar.data.toString('base64')}`;
    }

    res.json({
      fullName: user.fullName,
      avatar: avatarBase64,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving profile data' });
  }
});

// Logout route
// routes/userRoutes.js
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});


module.exports = router;
