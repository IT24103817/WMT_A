/**
 * ADMIN-ONLY MIDDLEWARE
 * =====================
 *
 * Drop into any route after `auth` to require an admin role.
 * Example: router.post('/api/inventory', auth, adminOnly, controller.create)
 *
 * Returns:
 *   - 401 if no user attached (auth wasn't run first)
 *   - 403 if user role isn't 'admin'
 */
module.exports = function adminOnly(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
};
