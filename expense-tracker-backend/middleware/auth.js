function isAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ✅ Attach session user to req.user so routes can use it
  req.user = req.session.user;
  next();
}

module.exports = isAuth;
