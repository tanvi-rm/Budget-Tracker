const express = require('express');
const router = express.Router();
const multer = require('multer');
const User = require('../models/User');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/signup', upload.single('avatar'), async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    const newUser = new User({
      fullName,
      email,
      password,
      avatar: req.file
        ? {
            data: req.file.buffer,
            contentType: req.file.mimetype,
          }
        : undefined,
    });

    await newUser.save();
    return res.status(201).json({ message: 'User registered successfully' });

  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ error: 'Invalid email or password.' });

    // ✅ Regenerate session to avoid session fixation
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regeneration error:', err);
        return res.status(500).json({ error: 'Session error' });
      }
      req.session.userId = user._id; // ✅ Add this

      req.session.user = {
        id: user._id,
        name: user.fullName,
        email: user.email
      };

      return res.status(200).json({ message: 'Login successful' });
    });

  } catch (err) {
    console.error('Signin error:', err);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
});


module.exports = router;
