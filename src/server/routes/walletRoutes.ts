import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';
import { paymentProvider } from '../services/paymentAdapter';

const router = Router();

// GET /api/wallet - Get balance & transaction history
router.get('/', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const userTransactions = db.creditTransactions.filter((tx) => tx.userId === user.id);

  return res.json({
    success: true,
    data: {
      credits: user.credits,
      totalEarned: user.totalCreditsEarned,
      totalSpent: user.totalCreditsSpent,
      packages: db.creditPackages,
      transactions: userTransactions,
    },
  });
});

// POST /api/wallet/purchase - Purchase credit package
router.post('/purchase', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { packageId } = req.body;

  const pkg = db.creditPackages.find((p) => p.id === packageId);
  if (!pkg) {
    return res.status(400).json({
      success: false,
      message: 'Invalid credit package selected.',
      errorCode: 'INVALID_PACKAGE',
    });
  }

  try {
    // 1. Create payment session via PaymentProvider abstraction
    const payment = await paymentProvider.createPayment({
      userId: user.id,
      packageId: pkg.id,
      amountUsd: pkg.priceUsd,
      credits: pkg.credits,
    });

    // 2. Simulate instant credit fulfillment for test mode
    db.recordTransaction(
      user.id,
      'purchase',
      pkg.credits,
      `Purchased ${pkg.name} (${pkg.credits.toLocaleString()} Credits for $${pkg.priceUsd})`,
      payment.paymentId
    );

    // Send notification
    db.notifications.unshift({
      id: `notif_${Date.now()}`,
      userId: user.id,
      title: '💳 Credits Purchased Successfully!',
      message: `Added +${pkg.credits.toLocaleString()} Credits to your wallet. You can now boost your promotions!`,
      type: 'credit',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: `Successfully purchased ${pkg.credits.toLocaleString()} Credits! New balance: ${user.credits} Credits.`,
      data: {
        newBalance: user.credits,
        payment,
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Payment processing failed.',
      errorCode: 'PAYMENT_FAILED',
    });
  }
});

export default router;
