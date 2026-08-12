import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/notifications - List user's notifications
router.get('/', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const userNotifications = db.notifications.filter((n) => n.userId === user.id);

  return res.json({
    success: true,
    data: {
      notifications: userNotifications,
      unreadCount: userNotifications.filter((n) => !n.isRead).length,
    },
  });
});

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  db.notifications.forEach((n) => {
    if (n.userId === user.id) {
      n.isRead = true;
    }
  });

  return res.json({
    success: true,
    message: 'All notifications marked as read.',
  });
});

// PUT /api/notifications/:id/read - Mark single notification as read
router.put('/:id/read', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { id } = req.params;

  const notif = db.notifications.find((n) => n.id === id && n.userId === user.id);
  if (notif) {
    notif.isRead = true;
  }

  return res.json({
    success: true,
  });
});

// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { id } = req.params;

  const initialCount = db.notifications.length;
  db.notifications = db.notifications.filter((n) => !(n.id === id && n.userId === user.id));

  return res.json({
    success: true,
    message: db.notifications.length < initialCount ? 'Notification deleted.' : 'Notification not found.',
  });
});

// DELETE /api/notifications - Clear all user notifications
router.delete('/', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  db.notifications = db.notifications.filter((n) => n.userId !== user.id);

  return res.json({
    success: true,
    message: 'All notifications cleared.',
  });
});

export default router;
