import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateJWT, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Apply auth & admin role checks to all admin endpoints
router.use(authenticateJWT);
router.use(requireRole(['admin', 'superadmin']));

// GET /api/admin/dashboard - High level stats
router.get('/dashboard', (req: AuthenticatedRequest, res: Response) => {
  const stats = db.getAdminStats();
  return res.json({
    success: true,
    data: {
      stats,
    },
  });
});

// GET /api/admin/users - List users with search & filters
router.get('/users', (req: AuthenticatedRequest, res: Response) => {
  const { search, status, page = '1', limit = '15' } = req.query;

  let usersList = Array.from(db.users.values());

  if (status && status !== 'All') {
    usersList = usersList.filter((u) => u.status === status);
  }

  if (search) {
    const q = (search as string).toLowerCase();
    usersList = usersList.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }

  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 15;
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

// PUT /api/admin/users/:id/status - Update user status (active, restricted, suspended, banned)
router.put('/users/:id/status', (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const { id } = req.params;
  const { status } = req.body;

  const user = db.users.get(id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found.',
      errorCode: 'NOT_FOUND',
    });
  }

  const oldStatus = user.status;
  user.status = status;

  db.recordAuditLog(
    admin.id,
    admin.username,
    'UPDATE_USER_STATUS',
    `Changed user @${user.username} status from ${oldStatus} to ${status}`,
    user.id,
    'user',
    req.ip
  );

  return res.json({
    success: true,
    message: `User status updated to ${status}.`,
    data: { user },
  });
});

// POST /api/admin/users/:id/credits - Manual admin credit adjustment
router.post('/users/:id/credits', (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const { id } = req.params;
  const { amount, reason } = req.body;

  const user = db.users.get(id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found.',
      errorCode: 'NOT_FOUND',
    });
  }

  const creditDelta = parseInt(amount, 10);
  if (isNaN(creditDelta) || creditDelta === 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid non-zero credit amount required.',
      errorCode: 'INVALID_AMOUNT',
    });
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
    'user',
    req.ip
  );

  return res.json({
    success: true,
    message: `Adjusted user credits by ${creditDelta > 0 ? '+' : ''}${creditDelta}. New balance: ${user.credits}`,
    data: { user },
  });
});

// GET /api/admin/promotions - List & moderate promotions
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
    data: {
      promotions: list,
    },
  });
});

// PUT /api/admin/promotions/:id/status - Moderate promotion (approve, reject, pause, active)
router.put('/promotions/:id/status', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const promotion = db.promotions.get(id);
  if (!promotion) {
    return res.status(404).json({
      success: false,
      message: 'Promotion not found.',
      errorCode: 'NOT_FOUND',
    });
  }

  promotion.status = status;

  if (status === 'rejected') {
    // Refund unspent credits
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

  return res.json({
    success: true,
    message: `Promotion status set to ${status}.`,
    data: { promotion },
  });
});

// GET /api/admin/transactions - Immutable credit ledger audit
router.get('/transactions', (req: AuthenticatedRequest, res: Response) => {
  return res.json({
    success: true,
    data: {
      transactions: db.creditTransactions.slice(0, 100),
    },
  });
});

// GET /api/admin/reports - User/promotion reports
router.get('/reports', (req: AuthenticatedRequest, res: Response) => {
  return res.json({
    success: true,
    data: {
      reports: db.reports,
    },
  });
});

// PUT /api/admin/settings - Update platform settings (e.g., max daily rewards)
router.put('/settings', (req: AuthenticatedRequest, res: Response) => {
  const { maxDailyDiscoveryRewards, dailyLoginBaseReward, referralReward } = req.body;

  if (maxDailyDiscoveryRewards) db.systemSettings.maxDailyDiscoveryRewards = parseInt(maxDailyDiscoveryRewards, 10);
  if (dailyLoginBaseReward) db.systemSettings.dailyLoginBaseReward = parseInt(dailyLoginBaseReward, 10);
  if (referralReward) db.systemSettings.referralReward = parseInt(referralReward, 10);

  return res.json({
    success: true,
    message: 'System settings updated.',
    data: {
      systemSettings: db.systemSettings,
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
