export type UserRole = 'user' | 'moderator' | 'admin' | 'superadmin';
export type AccountStatus = 'active' | 'restricted' | 'suspended' | 'banned';

export interface UserFeaturePermissions {
  canEarn: boolean;
  canPromote: boolean;
  canRefer: boolean;
  canTransfer: boolean;
}

export interface AiVerificationData {
  status: 'verified' | 'pending' | 'flagged';
  authenticityScore: number;
  growthQualityRating: string;
  engagementVelocity: string;
  retentionQuality: string;
  riskRating: string;
  aiAuditSummary: string;
  verifiedAt: string;
  verifiedByModel: string;
  metricsAnalyzed?: {
    subscribersCount: number;
    totalViews: number;
    avgRetentionSeconds: number;
    engagementRatioPercent: number;
  };
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  country: string;
  role: UserRole;
  status: AccountStatus;
  avatar: string;
  bio: string;
  creatorCategory: string;
  credits: number;
  totalCreditsEarned: number;
  totalCreditsSpent: number;
  level: number;
  reputation: number;
  referralCode: string;
  referredBy?: string;
  referralCount: number;
  referralRewardsEarned: number;
  streakDays: number;
  lastLoginDate?: string;
  lastRewardClaimDate?: string;
  nextRewardAvailableAt?: string;
  dailyRewardClaimedToday: boolean;
  dailyDiscoveryCountToday: number;
  riskScore: number;
  isPro: boolean;
  proExpiresAt?: string;
  isEmailVerified?: boolean;
  emailVerifiedAt?: string;
  emailVerificationCode?: string;
  emailVerificationCodeExpiresAt?: string;
  isAiVerified?: boolean;
  aiVerificationData?: AiVerificationData;
  // Anti-Spam & Lockout attributes
  isLocked?: boolean;
  lockoutReason?: string;
  lockedAt?: string;
  lockoutExpiresAt?: string;
  spamStrikes?: number;
  canEarn?: boolean;
  canPromote?: boolean;
  canRefer?: boolean;
  permissionsOverride?: Partial<UserFeaturePermissions>;
  recentAbuseFlags?: string[];
  createdAt: string;
}

export interface CreatorProfile {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  country: string;
  category: string;
  reputation: number;
  level: number;
  profileViews: number;
  totalDiscoveries: number;
  isPro: boolean;
  socialChannelsCount: number;
  isAiVerified?: boolean;
  aiVerificationData?: AiVerificationData;
  createdAt: string;
}

export type PlatformType = 'YouTube' | 'TikTok' | 'Instagram' | 'Facebook' | 'X';

export interface SocialChannel {
  id: string;
  userId: string;
  platform: PlatformType;
  channelName: string;
  url: string;
  category: string;
  description: string;
  thumbnail: string;
  isVerified: boolean;
  createdAt: string;
}

export type PromotionStatus = 'draft' | 'pending' | 'active' | 'paused' | 'completed' | 'rejected' | 'cancelled';

export interface Promotion {
  id: string;
  userId: string;
  creatorUsername: string;
  creatorDisplayName: string;
  creatorAvatar: string;
  creatorCategory: string;
  country: string;
  channelId?: string;
  platform: PlatformType;
  channelUrl: string;
  title: string;
  description: string;
  budgetCredits: number;
  spentCredits: number;
  rewardPerDiscovery: number;
  durationDays: number;
  status: PromotionStatus;
  impressions: number;
  clicks: number;
  uniqueDiscoveries: number;
  startDate?: string;
  endDate?: string;
  isSponsored: boolean;
  videoEmbedUrl?: string;
  requiredStaySeconds?: number;
  isCreativeCommons?: boolean;
  licenseType?: string;
  createdAt: string;
}

export type TransactionType = 'earning' | 'promotion_spend' | 'purchase' | 'bonus' | 'refund' | 'admin_adjustment' | 'referral';

export interface CreditTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number; // positive for gain, negative for spend
  balanceAfter: number;
  description: string;
  referenceId?: string;
  createdAt: string;
}

export interface DiscoveryActivity {
  id: string;
  userId: string;
  creatorId: string;
  promotionId?: string;
  activityType: 'view_creator' | 'explore_channel' | 'daily_discovery' | 'milestone';
  rewardCredits: number;
  completedAt: string;
}

export interface ReferralRecord {
  id: string;
  referrerUserId: string;
  referredUserId: string;
  referredUsername: string;
  status: 'pending' | 'completed';
  rewardCredits: number;
  createdAt: string;
}

export type Sub4SubStatus = 'pending' | 'mutual' | 'unsubscribed';

export interface Sub4SubRequest {
  id: string;
  followerUserId: string;
  followerUsername: string;
  followerDisplayName: string;
  followerAvatar: string;
  followerPlatform: PlatformType;
  followerChannelUrl: string;
  targetUserId: string;
  targetUsername: string;
  targetDisplayName: string;
  targetAvatar: string;
  targetPlatform: PlatformType;
  targetChannelUrl: string;
  status: Sub4SubStatus;
  rewardCredits: number;
  createdAt: string;
  completedAt?: string;
}

export type AppNotification = NotificationItem;
export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'promotion' | 'credit' | 'system';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceUsd: number;
  badge?: string;
  isPopular?: boolean;
}

export interface ReportItem {
  id: string;
  reporterUserId: string;
  reporterUsername: string;
  targetType: 'creator' | 'promotion' | 'activity' | 'spam';
  targetId: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed' | 'action_taken';
  createdAt: string;
}

export interface SpamIncident {
  id: string;
  userId: string;
  username: string;
  actionType: 'subscribe_spam' | 'view_botting' | 'referral_fraud' | 'velocity_abuse' | 'token_tampering' | 'multiple_accounts';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  ipAddress?: string;
  riskScoreBefore: number;
  riskScoreAfter: number;
  accountLocked: boolean;
  status: 'flagged' | 'reviewed' | 'cleared' | 'banned';
  createdAt: string;
}

export interface SystemSettings {
  // Feature toggles
  enableSub4Sub: boolean;
  enableVideoEarn: boolean;
  enableReferralProgram: boolean;
  enableComboPurchases: boolean;
  enableRegistration: boolean;
  maintenanceMode: boolean;
  
  // Economy and rewards
  maxDailyDiscoveryRewards: number;
  dailyLoginBaseReward: number;
  referralReward: number;
  sub4subBaseReward: number;
  sub4subMutualBonus: number;
  videoWatchReward: number;
  minWatchStaySeconds: number;
  profileCompletionReward: number;
  
  // Spam detection & Lockout thresholds
  autoLockoutRiskThreshold: number;
  autoLockoutDurationHours: number;
  maxClaimsPerMinute: number;
  maxSubscribesPerHour: number;
  minChallengeWaitSeconds: number;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminUsername: string;
  action: string;
  targetUserId?: string;
  targetResource?: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsersToday: number;
  lockedUsersCount: number;
  totalPromotions: number;
  activePromotions: number;
  totalCreditsCirculating: number;
  totalCreditsPurchased: number;
  totalCreditsSpent: number;
  estimatedRevenueUsd: number;
  totalDiscoveriesCount: number;
  totalSpamIncidents: number;
  unresolvedSpamCount: number;
}
