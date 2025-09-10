require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// ===== Middleware =====
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ===== MongoDB Connection =====
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// ===== Session Middleware =====
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret123',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: { secure: false } // Set to true only if using HTTPS
}));

// ===== Prevent Caching for Protected Routes =====
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// ===== Static Files =====
app.use(express.static(path.join(__dirname, 'public')));

// ===== Middleware for Auth Check =====
const isAuth = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/signin');
  }
};

// ===== Page Routes =====
app.get('/', (req, res) => res.redirect('/signup'));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'public', 'signup.html')));
app.get('/signin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'signin.html')));
app.get('/dashboard', isAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// ===== API Routes =====
const authRoutes = require('./routes/authRoutes');
const incomeRoutes = require('./routes/incomeRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const userRoutes = require('./routes/userRoutes');
const statRoutes = require('./routes/statRoutes');
const statsRoutes = require('./routes/statsRoutes'); // keep this only if separate from statRoutes

app.use('/api', authRoutes);
app.use('/api', incomeRoutes);
app.use('/api', expenseRoutes);
app.use('/api/user', userRoutes);
app.use('/api/stats', statRoutes);
app.use('/api/stats', statsRoutes); // delete if same as statRoutes

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
