import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateJWT, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { antiFraudEngine } from '../services/antiFraudEngine';
import { SystemSettings, UserRole } from '../../types';

const router = Router();

// Apply auth & admin role checks to all admin endpoints
router.use(authenticateJWT);
router.use(requireRole(['admin', 'superadmin']));

// GET /api/admin/dashboard - High level platform statistics & radar
router.get('/dashboard', (req: AuthenticatedRequest, res: Response) => {
  const stats = db.getAdminStats();
  const recentIncidents = db.spamIncidents.slice(0, 5);
  const recentAuditLogs = db.adminAuditLogs.slice(0, 5);

  return res.json({
    success: true,
    data: {
      stats,
      recentIncidents,
      recentAuditLogs,
      systemSettings: db.systemSettings,
    },
  });
});

// GET /api/admin/users - List users with search & filters
router.get('/users', (req: AuthenticatedRequest, res: Response) => {
  const { search, status, role, isLocked, page = '1', limit = '20' } = req.query;

  let usersList = Array.from(db.users.values());

  if (status && status !== 'All') {
    usersList = usersList.filter((u) => u.status === status);
  }

  if (role && role !== 'All') {
    usersList = usersList.filter((u) => u.role === role);
  }

  if (isLocked === 'true') {
    usersList = usersList.filter((u) => u.isLocked || u.status === 'restricted' || u.status === 'suspended' || u.status === 'banned');
  }

  if (search) {
    const q = (search as string).toLowerCase().trim();
    usersList = usersList.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.referralCode && u.referralCode.toLowerCase().includes(q))
    );
  }

  // Sort: High risk and locked users first, then by creation date
  usersList.sort((a, b) => {
    if ((b.riskScore || 0) !== (a.riskScore || 0)) {
      return (b.riskScore || 0) - (a.riskScore || 0);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 20;
  const total = usersList.length;
  const paginated = usersList.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  return res.json({
    success: true,
    data: {
      users: paginated,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

// GET /api/admin/users/:id/details - Deep Inspector for User
router.get('/users/:id/details', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = db.users.get(id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  const channels = Array.from(db.socialChannels.values()).filter((c) => c.userId === user.id);
  const promotions = Array.from(db.promotions.values()).filter((p) => p.userId === user.id);
  const transactions = db.creditTransactions.filter((tx) => tx.userId === user.id).slice(0, 15);
  const referrals = db.referrals.filter((r) => r.referrerUserId === user.id);
  const userIncidents = db.spamIncidents.filter((s) => s.userId === user.id);

  return res.json({
    success: true,
    data: {
      user,
      channels,
      promotions,
      transactions,
      referrals,
      userIncidents,
    },
  });
});

// PUT /api/admin/users/:id/status - Update user status
router.put('/users/:id/status', (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const { id } = req.params;
  const { status } = req.body;

  const user = db.users.get(id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  const oldStatus = user.status;
  user.status = status;
  if (status === 'active') {
    user.isLocked = false;
    user.lockoutReason = undefined;
  } else if (status === 'suspended' || status === 'banned') {
    user.isLocked = true;
    user.canEarn = false;
    user.canPromote = false;
  }

  db.recordAuditLog(
    admin.id,
    admin.username,
    'UPDATE_USER_STATUS',
    `Changed @${user.username} status from ${oldStatus} to ${status}`,
    user.id,
    'users',
    req.ip
  );

  db.saveUser(user);

  return res.json({
    success: true,
    message: `User status updated to ${status}.`,
    data: { user },
  });
});

// PUT /api/admin/users/:id/lock - Lock user account with reason and duration
router.put('/users/:id/lock', (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const { id } = req.params;
  const { reason, durationHours = 24 } = req.body;

  const result = db.lockUserAccount(
    id,
    reason || 'Administratively locked for abnormal activity review',
    durationHours,
    `Admin @${admin.username}`
  );

  if (!result.success || !result.user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  return res.json({
    success: true,
    message: `Account for @${result.user.username} locked for ${durationHours} hours.`,
    data: { user: result.user },
  });
});

// PUT /api/admin/users/:id/unlock - Restore user account
router.put('/users/:id/unlock', (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const { id } = req.params;
  const { reason } = req.body;

  const result = db.unlockUserAccount(id, admin.id, admin.username, reason || 'Admin clearance');
  if (!result.success || !result.user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  return res.json({
    success: true,
    message: `Account for @${result.user.username} has been unlocked and restored!`,
    data: { user: result.user },
  });
});

// PUT /api/admin/users/:id/role - Change user role
router.put('/users/:id/role', (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const { id } = req.params;
  const { role } = req.body as { role: UserRole };

  if (!['user', 'moderator', 'admin', 'superadmin'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid user role.' });
  }

  const user = db.users.get(id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  const oldRole = user.role;
  user.role = role;
  db.saveUser(user);

  db.recordAuditLog(
    admin.id,
    admin.username,
    'UPDATE_USER_ROLE',
    `Changed @${user.username} role from ${oldRole} to ${role}`,
    user.id,
    'users',
    req.ip
  );

  return res.json({
    success: true,
    message: `User @${user.username} role changed to ${role}.`,
    data: { user },
  });
});

// PUT /api/admin/users/:id/permissions - Override granular feature permissions
router.put('/users/:id/permissions', (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const { id } = req.params;
  const { canEarn, canPromote, canRefer, canTransfer } = req.body;

  const user = db.updateUserPermissions(id, { canEarn, canPromote, canRefer, canTransfer });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  db.recordAuditLog(
    admin.id,
    admin.username,
    'UPDATE_PERMISSIONS',
    `Updated feature permissions for @${user.username} (Earn: ${canEarn}, Promote: ${canPromote}, Refer: ${canRefer})`,
    user.id,
    'users',
    req.ip
  );

  return res.json({
    success: true,
    message: `Feature permissions updated for @${user.username}.`,
    data: { user },
  });
});

// PUT /api/admin/users/:id/pro - Toggle VIP Pro status
router.put('/users/:id/pro', (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const { id } = req.params;
  const { isPro } = req.body;

  const user = db.users.get(id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  user.isPro = !!isPro;
  if (user.isPro) {
    user.proExpiresAt = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();
  } else {
    user.proExpiresAt = undefined;
  }
  db.saveUser(user);

  db.recordAuditLog(
    admin.id,
    admin.username,
    'TOGGLE_PRO_STATUS',
    `Set VIP Pro status to ${user.isPro} for @${user.username}`,
    user.id,
    'users',
    req.ip
  );

  return res.json({
    success: true,
    message: `VIP Pro status updated for @${user.username}.`,
    data: { user },
  });
});

// POST /api/admin/users/:id/reset-risk - Reset risk score
router.post('/users/:id/reset-risk', (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const { id } = req.params;

  const user = db.resetUserRiskScore(id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  db.recordAuditLog(
    admin.id,
    admin.username,
    'RESET_RISK_SCORE',
    `Cleared abuse flags and reset risk score to 0 for @${user.username}`,
    user.id,
    'users',
    req.ip
  );

  return res.json({
    success: true,
    message: `Risk score reset to 0 for @${user.username}.`,
    data: { user },
  });
});

// POST /api/admin/users/:id/credits - Adjust credits
router.post('/users/:id/credits', (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const { id } = req.params;
  const { amount, reason } = req.body;

  const user = db.users.get(id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  const creditDelta = parseInt(amount, 10);
  if (isNaN(creditDelta) || creditDelta === 0) {
    return res.status(400).json({ success: false, message: 'Valid non-zero credit amount required.' });
  }

  db.recordTransaction(
    user.id,
    'admin_adjustment',
    creditDelta,
    reason ? `Admin adjustment: ${reason}` : 'Admin manual credit adjustment'
  );

  db.recordAuditLog(
    admin.id,
    admin.username,
    'ADJUST_USER_CREDITS',
    `Adjusted user @${user.username} credits by ${creditDelta > 0 ? '+' : ''}${creditDelta}. Reason: ${reason || 'N/A'}`,
    user.id,
    'users',
    req.ip
  );

  return res.json({
    success: true,
    message: `Adjusted user credits by ${creditDelta > 0 ? '+' : ''}${creditDelta}. New balance: ${user.credits}`,
    data: { user },
  });
});

// GET /api/admin/promotions - List promotions
router.get('/promotions', (req: AuthenticatedRequest, res: Response) => {
  const { status, search } = req.query;
  let list = Array.from(db.promotions.values());

  if (status && status !== 'All') {
    list = list.filter((p) => p.status === status);
  }

  if (search) {
    const q = (search as string).toLowerCase();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.creatorDisplayName.toLowerCase().includes(q) ||
        p.creatorUsername.toLowerCase().includes(q)
    );
  }

  return res.json({
    success: true,
    data: { promotions: list },
  });
});

// PUT /api/admin/promotions/:id/status - Moderate promotion
router.put('/promotions/:id/status', (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const { id } = req.params;
  const { status } = req.body;

  const promotion = db.promotions.get(id);
  if (!promotion) {
    return res.status(404).json({ success: false, message: 'Promotion not found.' });
  }

  const oldStatus = promotion.status;
  promotion.status = status;

  if (status === 'rejected') {
    const unspentRefund = Math.max(0, promotion.budgetCredits - promotion.spentCredits);
    if (unspentRefund > 0) {
      db.recordTransaction(
        promotion.userId,
        'refund',
        unspentRefund,
        `Refund for rejected promotion: "${promotion.title}"`
      );
    }
  }

  db.savePromotion(promotion);

  db.recordAuditLog(
    admin.id,
    admin.username,
    'MODERATE_PROMOTION',
    `Promotion "${promotion.title}" status changed from ${oldStatus} to ${status}`,
    promotion.userId,
    'promotions',
    req.ip
  );

  return res.json({
    success: true,
    message: `Promotion status set to ${status}.`,
    data: { promotion },
  });
});

// GET /api/admin/spam-incidents - List spam incidents
router.get('/spam-incidents', (req: AuthenticatedRequest, res: Response) => {
  const { status, severity, actionType } = req.query;
  let incidents = [...db.spamIncidents];

  if (status && status !== 'All') {
    incidents = incidents.filter((s) => s.status === status);
  }
  if (severity && severity !== 'All') {
    incidents = incidents.filter((s) => s.severity === severity);
  }
  if (actionType && actionType !== 'All') {
    incidents = incidents.filter((s) => s.actionType === actionType);
  }

  return res.json({
    success: true,
    data: { incidents },
  });
});

// PUT /api/admin/spam-incidents/:id/resolve - Resolve incident
router.put('/spam-incidents/:id/resolve', (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const { id } = req.params;
  const { action, resolutionNote } = req.body; // 'cleared' | 'reviewed' | 'banned'

  const incident = db.spamIncidents.find((s) => s.id === id);
  if (!incident) {
    return res.status(404).json({ success: false, message: 'Spam incident not found.' });
  }

  incident.status = action || 'reviewed';

  if (action === 'cleared') {
    // Also unlock user if locked
    db.unlockUserAccount(incident.userId, admin.id, admin.username, `False positive cleared: ${resolutionNote || 'Spam incident dismissed'}`);
  } else if (action === 'banned') {
    const user = db.users.get(incident.userId);
    if (user) {
      user.status = 'banned';
      user.isLocked = true;
      user.lockoutReason = `Banned for repeated fraud: ${incident.details}`;
      db.saveUser(user);
    }
  }

  db.recordAuditLog(
    admin.id,
    admin.username,
    'RESOLVE_SPAM_INCIDENT',
    `Resolved incident ${incident.id} (${incident.actionType}) with action: ${action}. Note: ${resolutionNote || 'N/A'}`,
    incident.userId,
    'spamIncidents',
    req.ip
  );

  return res.json({
    success: true,
    message: `Spam incident status marked as ${incident.status}.`,
    data: { incident },
  });
});

// GET /api/admin/settings - Return whole website configuration
router.get('/settings', (req: AuthenticatedRequest, res: Response) => {
  return res.json({
    success: true,
    data: {
      systemSettings: db.systemSettings,
    },
  });
});

// PUT /api/admin/settings - Update whole website configuration
router.put('/settings', (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const updates = req.body as Partial<SystemSettings>;

  // Merge updates
  db.systemSettings = {
    ...db.systemSettings,
    ...updates,
  };

  db.recordAuditLog(
    admin.id,
    admin.username,
    'UPDATE_SYSTEM_SETTINGS',
    `Updated platform settings: ${Object.keys(updates).join(', ')}`,
    undefined,
    'settings',
    req.ip
  );

  return res.json({
    success: true,
    message: 'Global website settings updated successfully!',
    data: {
      systemSettings: db.systemSettings,
    },
  });
});

// GET /api/admin/exchanges - Sub4Sub mutual exchanges monitor
router.get('/exchanges', (req: AuthenticatedRequest, res: Response) => {
  const list = Array.from(db.sub4subRequests.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return res.json({
    success: true,
    data: { exchanges: list.slice(0, 100) },
  });
});

// GET /api/admin/transactions - Ledger audit
router.get('/transactions', (req: AuthenticatedRequest, res: Response) => {
  return res.json({
    success: true,
    data: {
      transactions: db.creditTransactions.slice(0, 150),
    },
  });
});

// GET /api/admin/reports - User reports
router.get('/reports', (req: AuthenticatedRequest, res: Response) => {
  return res.json({
    success: true,
    data: {
      reports: db.reports,
    },
  });
});

// GET /api/admin/audit-logs - Security & Administrative Audit Logs
router.get('/audit-logs', (req: AuthenticatedRequest, res: Response) => {
  return res.json({
    success: true,
    data: {
      logs: db.adminAuditLogs.slice(0, 100),
    },
  });
});

export default router;
