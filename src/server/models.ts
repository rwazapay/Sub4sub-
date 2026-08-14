import { UserRole, AccountStatus, PlatformType, PromotionStatus, Sub4SubStatus } from '../types';

// TypeScript Entity Interfaces for Firebase Firestore Data Models

export interface IUserDocument {
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
  referralCount: number;
  referralRewardsEarned: number;
  referredBy?: string;
  streakDays: number;
  dailyRewardClaimedToday: boolean;
  dailyDiscoveryCountToday: number;
  lastLoginDate?: string;
  lastRewardClaimDate?: string;
  nextRewardAvailableAt?: string;
  riskScore: number;
  isPro: boolean;
  isAiVerified?: boolean;
  aiVerificationData?: any;
  passwordHash?: string;
  createdAt: string;
}

export interface ICreatorProfileDocument {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  country?: string;
  category?: string;
  reputation: number;
  level: number;
  profileViews: number;
  totalDiscoveries: number;
  isPro: boolean;
  socialChannelsCount: number;
  isAiVerified?: boolean;
  aiVerificationData?: any;
  createdAt: string;
}

export interface ISocialChannelDocument {
  id: string;
  userId: string;
  platform: PlatformType;
  channelName: string;
  url: string;
  category?: string;
  description?: string;
  thumbnail?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface IPromotionDocument {
  id: string;
  userId: string;
  creatorUsername: string;
  creatorDisplayName: string;
  creatorAvatar?: string;
  creatorCategory?: string;
  country?: string;
  channelId?: string;
  platform: PlatformType;
  channelUrl: string;
  title: string;
  description?: string;
  budgetCredits: number;
  spentCredits: number;
  rewardPerDiscovery: number;
  durationDays: number;
  status: PromotionStatus;
  impressions: number;
  clicks: number;
  uniqueDiscoveries: number;
  isSponsored: boolean;
  videoEmbedUrl?: string;
  requiredStaySeconds?: number;
  isCreativeCommons?: boolean;
  licenseType?: string;
  createdAt: string;
}

export interface ISub4SubRequestDocument {
  id: string;
  followerUserId: string;
  followerUsername: string;
  followerDisplayName: string;
  followerAvatar?: string;
  followerPlatform: string;
  followerChannelUrl: string;
  targetUserId: string;
  targetUsername: string;
  targetDisplayName: string;
  targetAvatar?: string;
  targetPlatform: string;
  targetChannelUrl: string;
  status: Sub4SubStatus;
  rewardCredits: number;
  createdAt: string;
  completedAt?: string;
}

export interface ICreditTransactionDocument {
  id: string;
  userId: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  referenceId?: string;
  createdAt: string;
}
