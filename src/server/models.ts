import mongoose, { Schema, Document } from 'mongoose';
import { UserRole, AccountStatus, PlatformType, PromotionStatus, Sub4SubStatus } from '../types';

// 1. User Schema
export interface IUserDocument extends Document {
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
  riskScore: number;
  isPro: boolean;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    displayName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    country: { type: String, default: 'Rwanda' },
    role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user', index: true },
    status: { type: String, enum: ['active', 'restricted', 'suspended', 'banned'], default: 'active', index: true },
    avatar: { type: String, default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250' },
    bio: { type: String, default: 'Creator on SubLoop' },
    creatorCategory: { type: String, default: 'Technology', index: true },
    credits: { type: Number, default: 100, min: 0 },
    totalCreditsEarned: { type: Number, default: 100, min: 0 },
    totalCreditsSpent: { type: Number, default: 0, min: 0 },
    level: { type: Number, default: 1 },
    reputation: { type: Number, default: 80 },
    referralCode: { type: String, required: true, unique: true, index: true },
    referralCount: { type: Number, default: 0 },
    referralRewardsEarned: { type: Number, default: 0 },
    referredBy: { type: String, index: true },
    streakDays: { type: Number, default: 1 },
    dailyRewardClaimedToday: { type: Boolean, default: false },
    dailyDiscoveryCountToday: { type: Number, default: 0 },
    lastLoginDate: { type: String },
    riskScore: { type: Number, default: 0, min: 0, max: 100 },
    isPro: { type: Boolean, default: false },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

// 2. Creator Profile Schema
const CreatorProfileSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, lowercase: true },
    displayName: { type: String, required: true },
    avatar: { type: String },
    bio: { type: String },
    country: { type: String, index: true },
    category: { type: String, index: true },
    reputation: { type: Number, default: 80 },
    level: { type: Number, default: 1 },
    profileViews: { type: Number, default: 0 },
    totalDiscoveries: { type: Number, default: 0 },
    isPro: { type: Boolean, default: false },
    socialChannelsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// 3. Social Channel Schema
const SocialChannelSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    platform: { type: String, enum: ['YouTube', 'TikTok', 'Instagram', 'Facebook', 'X'], required: true, index: true },
    channelName: { type: String, required: true },
    url: { type: String, required: true },
    category: { type: String },
    description: { type: String },
    thumbnail: { type: String },
    isVerified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// 4. Promotion Schema
const PromotionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    creatorUsername: { type: String, required: true },
    creatorDisplayName: { type: String, required: true },
    creatorAvatar: { type: String },
    creatorCategory: { type: String, index: true },
    country: { type: String, index: true },
    channelId: { type: String },
    platform: { type: String, enum: ['YouTube', 'TikTok', 'Instagram', 'Facebook', 'X'], required: true, index: true },
    channelUrl: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    budgetCredits: { type: Number, required: true, min: 1 },
    spentCredits: { type: Number, default: 0, min: 0 },
    rewardPerDiscovery: { type: Number, default: 10 },
    durationDays: { type: Number, default: 7 },
    status: { type: String, enum: ['active', 'paused', 'completed', 'cancelled', 'rejected'], default: 'active', index: true },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    uniqueDiscoveries: { type: Number, default: 0 },
    isSponsored: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// 5. Sub4Sub Request Schema
const Sub4SubRequestSchema = new Schema(
  {
    followerUserId: { type: String, required: true, index: true },
    followerUsername: { type: String, required: true },
    followerDisplayName: { type: String, required: true },
    followerAvatar: { type: String },
    followerPlatform: { type: String, required: true },
    followerChannelUrl: { type: String, required: true },
    targetUserId: { type: String, required: true, index: true },
    targetUsername: { type: String, required: true },
    targetDisplayName: { type: String, required: true },
    targetAvatar: { type: String },
    targetPlatform: { type: String, required: true },
    targetChannelUrl: { type: String, required: true },
    status: { type: String, enum: ['pending', 'mutual', 'rejected'], default: 'pending', index: true },
    rewardCredits: { type: Number, default: 20 },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

// Unique compound index to prevent duplicate Sub4Sub relationships
Sub4SubRequestSchema.index({ followerUserId: 1, targetUserId: 1 }, { unique: true });

// 6. Credit Transaction Schema (Immutable Ledger)
const CreditTransactionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['earning', 'spending', 'promotion_spend', 'purchase', 'bonus', 'referral', 'refund', 'admin_adjustment'],
      required: true,
      index: true,
    },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true, min: 0 },
    description: { type: String, required: true },
    referenceId: { type: String, index: true },
  },
  { timestamps: true }
);

// 7. Discovery Activity Schema
const DiscoveryActivitySchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    creatorId: { type: String, required: true, index: true },
    promotionId: { type: String, required: true, index: true },
    activityType: { type: String, default: 'view_creator' },
    rewardCredits: { type: Number, default: 10 },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Unique index to prevent duplicate reward for same user and promotion
DiscoveryActivitySchema.index({ userId: 1, promotionId: 1 }, { unique: true });

// 8. Referral Record Schema
const ReferralRecordSchema = new Schema(
  {
    referrerUserId: { type: String, required: true, index: true },
    referredUserId: { type: String, required: true, unique: true, index: true },
    referredUsername: { type: String, required: true },
    status: { type: String, enum: ['pending', 'completed'], default: 'completed' },
    rewardCredits: { type: Number, default: 100 },
  },
  { timestamps: true }
);

// 9. Admin Audit Log Schema
const AdminAuditLogSchema = new Schema(
  {
    adminId: { type: String, required: true, index: true },
    adminUsername: { type: String, required: true },
    action: { type: String, required: true, index: true },
    targetUserId: { type: String, index: true },
    targetResource: { type: String },
    details: { type: String, required: true },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

// Export Mongoose Models
export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
export const CreatorProfileModel = mongoose.models.CreatorProfile || mongoose.model('CreatorProfile', CreatorProfileSchema);
export const SocialChannelModel = mongoose.models.SocialChannel || mongoose.model('SocialChannel', SocialChannelSchema);
export const PromotionModel = mongoose.models.Promotion || mongoose.model('Promotion', PromotionSchema);
export const Sub4SubRequestModel = mongoose.models.Sub4SubRequest || mongoose.model('Sub4SubRequest', Sub4SubRequestSchema);
export const CreditTransactionModel = mongoose.models.CreditTransaction || mongoose.model('CreditTransaction', CreditTransactionSchema);
export const DiscoveryActivityModel = mongoose.models.DiscoveryActivity || mongoose.model('DiscoveryActivity', DiscoveryActivitySchema);
export const ReferralRecordModel = mongoose.models.ReferralRecord || mongoose.model('ReferralRecord', ReferralRecordSchema);
export const AdminAuditLogModel = mongoose.models.AdminAuditLog || mongoose.model('AdminAuditLog', AdminAuditLogSchema);
