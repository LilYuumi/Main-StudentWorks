// Authentication middleware
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  req.flash('error', 'Silakan login terlebih dahulu.');
  res.redirect('/login');
}

// Role-based middleware
function hasRole(...roles) {
  return (req, res, next) => {
    if (req.session && req.session.user && roles.includes(req.session.user.role)) {
      return next();
    }
    req.flash('error', 'Anda tidak memiliki akses ke halaman tersebut.');
    res.redirect('/login');
  };
}

module.exports = { isAuthenticated, hasRole };
