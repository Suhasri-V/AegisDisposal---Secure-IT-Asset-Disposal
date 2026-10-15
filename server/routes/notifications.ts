import { Router, Response } from 'express';
import { db } from '../db/store';
import {
  authenticateToken,
  AuthenticatedRequest,
} from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

// GET /api/notifications
router.get('/', (req: AuthenticatedRequest, res: Response): void => {
  const notifications = db.getNotifications();
  res.json({
    success: true,
    count: notifications.length,
    notifications,
  });
});

// PUT /api/notifications/:id/read
router.put('/:id/read', (req: AuthenticatedRequest, res: Response): void => {
  db.markNotificationAsRead(req.params.id);
  res.json({ success: true });
});

// PUT /api/notifications/read-all
router.put('/read-all', (req: AuthenticatedRequest, res: Response): void => {
  db.markAllNotificationsAsRead();
  res.json({ success: true });
});

export default router;
