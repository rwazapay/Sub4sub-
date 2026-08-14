import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/auth';
import { paymentProvider } from '../services/paymentAdapter';

const router = Router();

// GET /api/wallet - Get balance & transaction history
router.get('/', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  db.syncUserDailyState(user);
  const userTransactions = db.creditTransactions.filter((tx) => tx.userId === user.id);

  return res.json({
    success: true,
    data: {
      credits: user.credits,
      totalEarned: user.totalCreditsEarned,
      totalSpent: user.totalCreditsSpent,
      streakDays: user.streakDays,
      dailyRewardClaimedToday: user.dailyRewardClaimedToday,
      nextRewardAvailableAt: user.nextRewardAvailableAt,
      packages: db.creditPackages,
      transactions: userTransactions,
    },
  });
});

// POST /api/wallet/daily-claim - Claim daily bonus coins
router.post('/daily-claim', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  try {
    const claimResult = await db.claimDailyRewardAtomic(user);
    return res.json({
      success: true,
      message: claimResult.message,
      data: {
        user: claimResult.user,
        newBalance: claimResult.user.credits,
        bonusCoins: claimResult.rewardAmount,
        streakDays: claimResult.streakDays,
        dailyRewardClaimedToday: claimResult.user.dailyRewardClaimedToday,
        nextClaimAvailableAt: claimResult.nextClaimAvailableAt,
        alreadyClaimed: claimResult.alreadyClaimed,
      },
    });
  } catch (err: any) {
    console.error('Wallet daily claim error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to claim daily check-in bonus.',
      errorCode: 'CLAIM_FAILED',
    });
  }
});

// POST /api/wallet/transfer - Transfer / Gift coins to another creator
router.post('/transfer', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  const sender = req.user!;
  const { recipientUsername, amount, note } = req.body;

  const numAmount = parseInt(amount, 10);
  if (!recipientUsername || isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid recipient username and positive coin amount.',
      errorCode: 'INVALID_INPUT',
    });
  }

  if (sender.credits < numAmount) {
    return res.status(400).json({
      success: false,
      message: `Insufficient coins. You have ${sender.credits} coins available.`,
      errorCode: 'INSUFFICIENT_FUNDS',
    });
  }

  const cleanRecipientName = recipientUsername.trim().toLowerCase().replace('@', '');

  if (cleanRecipientName === sender.username.toLowerCase()) {
    return res.status(400).json({
      success: false,
      message: 'You cannot transfer coins to yourself.',
      errorCode: 'SELF_TRANSFER',
    });
  }

  // Find recipient
  const recipient = Array.from(db.users.values()).find(
    (u) => u.username.toLowerCase() === cleanRecipientName
  );

  if (!recipient) {
    return res.status(404).json({
      success: false,
      message: `Creator '@${cleanRecipientName}' was not found.`,
      errorCode: 'USER_NOT_FOUND',
    });
  }

  // Deduct from sender
  sender.credits -= numAmount;
  sender.totalCreditsSpent += numAmount;

  db.recordTransaction(
    sender.id,
    'promotion_spend',
    -numAmount,
    `Gifted ${numAmount} Coins to @${recipient.username}${note ? `: "${note}"` : ''}`
  );

  // Add to recipient
  recipient.credits += numAmount;
  recipient.totalCreditsEarned += numAmount;

  db.recordTransaction(
    recipient.id,
    'bonus',
    numAmount,
    `Received ${numAmount} Coins gift from @${sender.username}${note ? `: "${note}"` : ''}`
  );

  // Send notification to recipient
  db.notifications.unshift({
    id: `notif_${Date.now()}`,
    userId: recipient.id,
    title: '🎁 Received Coin Gift!',
    message: `@${sender.username} sent you a gift of +${numAmount} Coins!`,
    type: 'credit',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  return res.json({
    success: true,
    message: `Successfully transferred ${numAmount} coins to @${recipient.username}!`,
    data: {
      newBalance: sender.credits,
      transferredAmount: numAmount,
      recipientUsername: recipient.username,
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
