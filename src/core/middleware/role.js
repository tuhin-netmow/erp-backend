// core/middleware/role.js
module.exports = (allowedRoles = []) => {
  return (req, res, next) => {
    const user = req.user; // from auth middleware
    if (!user) return res.status(401).json({ status: false, message: 'Unauthorized' });

    // Example: user.role_id could be a number or string
    if (allowedRoles.length && !allowedRoles.includes(user.role_id)) {
      return res.status(403).json({ status: false, message: 'Forbidden: insufficient role' });
    }

    next();
  };
};
