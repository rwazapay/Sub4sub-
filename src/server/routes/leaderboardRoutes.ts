import { Router } from 'express';
import { db } from '../db';

const router = Router();

// GET /api/leaderboard - Top creators ranked by activity, reputation, and profile views
router.get('/', (req, res) => {
  const { tab = 'discoverers' } = req.query;

  const usersList = Array.from(db.users.values()).filter((u) => u.role !== 'admin');

  let sorted = [...usersList];

  if (tab === 'discoverers') {
    // Rank by total credits earned / discoveries
    sorted.sort((a, b) => b.totalCreditsEarned - a.totalCreditsEarned);
  } else if (tab === 'reputation') {
    // Rank by reputation score
    sorted.sort((a, b) => b.reputation - a.reputation);
  } else if (tab === 'promoters') {
    // Rank by total credits spent on promotion
    sorted.sort((a, b) => b.totalCreditsSpent - a.totalCreditsSpent);
  }

  const leaderboard = sorted.slice(0, 20).map((u, rank) => ({
    rank: rank + 1,
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatar: u.avatar,
    country: u.country,
    category: u.creatorCategory,
    level: u.level,
    reputation: u.reputation,
    streakDays: u.streakDays,
    isPro: u.isPro,
    totalEarned: u.totalCreditsEarned,
    totalSpent: u.totalCreditsSpent,
  }));

  return res.json({
    success: true,
    data: {
      leaderboard,
    },
  });
});

export default router;
