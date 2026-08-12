import { Promotion } from '../../types';

export interface RankingFactors {
  budgetWeight: number; // 0.35
  freshnessWeight: number; // 0.25
  reputationWeight: number; // 0.20
  engagementWeight: number; // 0.20
}

export function rankPromotions(
  promotions: Promotion[],
  filter?: { category?: string; platform?: string; country?: string; search?: string }
): Promotion[] {
  let list = promotions.filter((p) => p.status === 'active');

  // Apply filters
  if (filter?.category && filter.category !== 'All') {
    list = list.filter((p) => p.creatorCategory.toLowerCase() === filter.category!.toLowerCase());
  }
  if (filter?.platform && filter.platform !== 'All') {
    list = list.filter((p) => p.platform.toLowerCase() === filter.platform!.toLowerCase());
  }
  if (filter?.country && filter.country !== 'All') {
    list = list.filter((p) => p.country.toLowerCase() === filter.country!.toLowerCase());
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    list = list.filter(
      (p) =>
        p.creatorDisplayName.toLowerCase().includes(q) ||
        p.creatorUsername.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }

  const now = Date.now();

  // Score each promotion
  const scored = list.map((p) => {
    // 1. Budget Score (higher budget + higher reward per discovery)
    const budgetScore = Math.min(100, (p.budgetCredits / 100) + p.rewardPerDiscovery * 5);

    // 2. Freshness Score (newer promotions get a boost)
    const ageInHours = (now - new Date(p.createdAt).getTime()) / (1000 * 60 * 60);
    const freshnessScore = Math.max(0, 100 - ageInHours * 2);

    // 3. Sponsored Boost
    const sponsoredBonus = p.isSponsored ? 50 : 0;

    // 4. Engagement Score inside SubLoop (clicks vs budget ratio)
    const engagementScore = Math.min(100, p.uniqueDiscoveries * 10);

    const totalScore =
      budgetScore * 0.35 +
      freshnessScore * 0.25 +
      engagementScore * 0.25 +
      sponsoredBonus;

    return { promotion: p, score: totalScore };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  return scored.map((s) => s.promotion);
}
