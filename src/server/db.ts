import bcrypt from 'bcryptjs';
import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  deleteDoc,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  User,
  CreatorProfile,
  SocialChannel,
  Promotion,
  CreditTransaction,
  DiscoveryActivity,
  ReferralRecord,
  NotificationItem,
  CreditPackage,
  ReportItem,
  AdminStats,
  Sub4SubRequest,
  AdminAuditLog,
} from '../types';

function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

class InAppDatabase {
  public users: Map<string, User> = new Map();
  public creatorProfiles: Map<string, CreatorProfile> = new Map();
  public socialChannels: Map<string, SocialChannel> = new Map();
  public promotions: Map<string, Promotion> = new Map();
  public sub4subRequests: Map<string, Sub4SubRequest> = new Map();
  public creditTransactions: CreditTransaction[] = [];
  public discoveryActivities: DiscoveryActivity[] = [];
  public referrals: ReferralRecord[] = [];
  public notifications: NotificationItem[] = [];
  public reports: ReportItem[] = [];
  public adminAuditLogs: AdminAuditLog[] = [];
  
  public isFirestoreConnected: boolean = false;
  private firestoreDb: Firestore | null = null;
  
  // Password hashes stored securely for email/password authentication
  private passwordHashes: Map<string, string> = new Map();

  // Configurable System Settings
  public systemSettings = {
    maxDailyDiscoveryRewards: 100,
    dailyLoginBaseReward: 5,
    referralReward: 100,
    profileCompletionReward: 50,
  };

  // Credit packages marketplace
  public creditPackages: CreditPackage[] = [
    { id: 'pkg_starter', name: 'Starter Creator', credits: 1000, priceUsd: 1.0, badge: 'Popular Starter' },
    { id: 'pkg_creator', name: 'Creator Boost', credits: 6000, priceUsd: 5.0, badge: 'Best Value', isPopular: true },
    { id: 'pkg_growth', name: 'Growth Engine', credits: 15000, priceUsd: 10.0, badge: 'High Exposure' },
    { id: 'pkg_pro', name: 'Pro Powerhouse', credits: 40000, priceUsd: 25.0, badge: 'VIP Scale' },
  ];

  constructor() {
    this.seedInitialData();
  }

  // Initialize Firebase Firestore connection & sync initial cloud dataset
  public async initDatabase(): Promise<void> {
    try {
      const app = initializeApp(firebaseConfig);
      this.firestoreDb = initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
      }, firebaseConfig.firestoreDatabaseId);
      this.isFirestoreConnected = true;
      console.log(`✅ Connected to Firebase Firestore database: ${firebaseConfig.firestoreDatabaseId}`);

      // Sync Firestore documents into memory maps
      await this.syncFromFirestore();
    } catch (err: any) {
      console.warn('⚠️ Firebase Firestore connection notice:', err?.message || err);
      this.isFirestoreConnected = false;
    }
  }

  public isFirestoreReady(): boolean {
    return this.isFirestoreConnected && this.firestoreDb !== null;
  }

  public getFirestoreDb(): Firestore | null {
    return this.firestoreDb;
  }

  public async getUserAsync(idOrEmail: string): Promise<User | undefined> {
    if (!idOrEmail) return undefined;
    const clean = idOrEmail.trim().toLowerCase();

    // 1. Check in-memory map by exact ID
    if (this.users.has(idOrEmail)) {
      return this.users.get(idOrEmail);
    }

    // 2. Check in-memory by username or email
    const inMem = Array.from(this.users.values()).find(
      (u) => u.id === idOrEmail || u.email?.toLowerCase() === clean || u.username?.toLowerCase() === clean
    );
    if (inMem) return inMem;

    // 3. Check Firestore
    if (this.firestoreDb) {
      try {
        const docRef = doc(this.firestoreDb, 'users', idOrEmail);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const user = docSnap.data() as User;
          this.users.set(user.id, user);
          return user;
        }

        const q = await getDocs(collection(this.firestoreDb, 'users'));
        for (const snap of q.docs) {
          const u = snap.data() as User;
          if (u.email?.toLowerCase() === clean || u.username?.toLowerCase() === clean || u.id === idOrEmail) {
            this.users.set(u.id, u);
            return u;
          }
        }
      } catch (err) {
        console.warn('Firestore getUserAsync notice:', err);
      }
    }

    return undefined;
  }

  // Sync existing cloud data from Firestore
  private async syncFromFirestore() {
    if (!this.firestoreDb) return;

    try {
      // 1. Fetch Users
      const userSnap = await getDocs(collection(this.firestoreDb, 'users'));
      if (!userSnap.empty) {
        userSnap.forEach((docSnap) => {
          const data = docSnap.data() as any;
          if (data && data.id) {
            this.users.set(data.id, data as User);
            if (data.passwordHash) {
              this.passwordHashes.set(data.id, data.passwordHash);
            }
          }
        });
      } else {
        // Seed initial users into Firestore
        for (const user of this.users.values()) {
          const passHash = this.passwordHashes.get(user.id);
          await setDoc(doc(this.firestoreDb, 'users', user.id), sanitizeForFirestore({
            ...user,
            passwordHash: passHash || '',
          }));
        }
      }

      // 2. Fetch Creator Profiles
      const profileSnap = await getDocs(collection(this.firestoreDb, 'creatorProfiles'));
      if (!profileSnap.empty) {
        profileSnap.forEach((docSnap) => {
          const data = docSnap.data() as CreatorProfile;
          if (data && data.id) this.creatorProfiles.set(data.id, data);
        });
      } else {
        for (const prof of this.creatorProfiles.values()) {
          await setDoc(doc(this.firestoreDb, 'creatorProfiles', prof.id), sanitizeForFirestore(prof));
        }
      }

      // 3. Fetch Social Channels
      const channelSnap = await getDocs(collection(this.firestoreDb, 'socialChannels'));
      if (!channelSnap.empty) {
        channelSnap.forEach((docSnap) => {
          const data = docSnap.data() as SocialChannel;
          if (data && data.id) this.socialChannels.set(data.id, data);
        });
      } else {
        for (const chan of this.socialChannels.values()) {
          await setDoc(doc(this.firestoreDb, 'socialChannels', chan.id), sanitizeForFirestore(chan));
        }
      }

      // 4. Fetch Promotions
      const promoSnap = await getDocs(collection(this.firestoreDb, 'promotions'));
      if (!promoSnap.empty) {
        promoSnap.forEach((docSnap) => {
          const data = docSnap.data() as Promotion;
          if (data && data.id) this.promotions.set(data.id, data);
        });
      } else {
        for (const promo of this.promotions.values()) {
          await setDoc(doc(this.firestoreDb, 'promotions', promo.id), sanitizeForFirestore(promo));
        }
      }

      console.log('🔥 Firebase Firestore cloud collections synchronized.');
    } catch (err: any) {
      console.warn('Firestore initial data sync notice:', err?.message || err);
    }
  }

  // Firestore Async Persistence Helpers
  public async saveUser(user: User, passwordHash?: string): Promise<void> {
    this.users.set(user.id, user);
    if (passwordHash) {
      this.passwordHashes.set(user.id, passwordHash);
    }
    if (this.firestoreDb) {
      try {
        const hashToSave = passwordHash || this.passwordHashes.get(user.id) || '';
        await setDoc(doc(this.firestoreDb, 'users', user.id), sanitizeForFirestore({
          ...user,
          passwordHash: hashToSave,
        }));
      } catch (err) {
        console.warn('Failed to persist user to Firestore:', err);
      }
    }
  }

  public async saveCreatorProfile(profile: CreatorProfile): Promise<void> {
    this.creatorProfiles.set(profile.id, profile);
    if (this.firestoreDb) {
      try {
        await setDoc(doc(this.firestoreDb, 'creatorProfiles', profile.id), sanitizeForFirestore(profile));
      } catch (err) {
        console.warn('Failed to persist creator profile to Firestore:', err);
      }
    }
  }

  public async saveSocialChannel(channel: SocialChannel): Promise<void> {
    this.socialChannels.set(channel.id, channel);
    if (this.firestoreDb) {
      try {
        await setDoc(doc(this.firestoreDb, 'socialChannels', channel.id), sanitizeForFirestore(channel));
      } catch (err) {
        console.warn('Failed to persist social channel to Firestore:', err);
      }
    }
  }

  public async savePromotion(promotion: Promotion): Promise<void> {
    this.promotions.set(promotion.id, promotion);
    if (this.firestoreDb) {
      try {
        await setDoc(doc(this.firestoreDb, 'promotions', promotion.id), sanitizeForFirestore(promotion));
      } catch (err) {
        console.warn('Failed to persist promotion to Firestore:', err);
      }
    }
  }

  public async saveSub4SubRequest(subReq: Sub4SubRequest): Promise<void> {
    this.sub4subRequests.set(subReq.id, subReq);
    if (this.firestoreDb) {
      try {
        await setDoc(doc(this.firestoreDb, 'sub4subRequests', subReq.id), sanitizeForFirestore(subReq));
      } catch (err) {
        console.warn('Failed to persist sub4sub request to Firestore:', err);
      }
    }
  }

  private seedInitialData() {
    // 1. Admin User
    const adminId = 'usr_admin_001';
    const adminPasswordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'AdminSubLoop2026!', 10);
    this.passwordHashes.set(adminId, adminPasswordHash);

    const adminUser: User = {
      id: adminId,
      username: 'admin',
      displayName: 'SubLoop Administrator',
      email: process.env.ADMIN_EMAIL || 'admin@subloop.co',
      country: 'Rwanda',
      role: 'admin',
      status: 'active',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      bio: 'Official SubLoop Platform Administrator. Overseeing creator growth, safety & community discovery.',
      creatorCategory: 'Technology',
      credits: 50000,
      totalCreditsEarned: 50000,
      totalCreditsSpent: 0,
      level: 10,
      reputation: 100,
      referralCode: 'SUB-ADMIN01',
      referralCount: 12,
      referralRewardsEarned: 1200,
      streakDays: 30,
      dailyRewardClaimedToday: true,
      dailyDiscoveryCountToday: 0,
      riskScore: 0,
      isPro: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    this.users.set(adminId, adminUser);

    // 2. Sample Demo Creators & Creative Commons Video Campaigns
    const demoCreatorsData = [
      {
        username: 'tech_rwanda',
        displayName: 'Tech Rwanda',
        country: 'Rwanda',
        category: 'Technology',
        avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=250',
        bio: 'Exploring software development, mobile app innovation, and East African tech ecosystems.',
        platform: 'YouTube' as const,
        channelUrl: 'https://youtube.com/@TechRwandaOfficial',
        title: 'Discover Tech Rwanda - Software & African Tech Innovation (CC BY)',
        videoEmbedUrl: 'https://www.youtube.com/embed/aqz-KE-bpKQ',
        requiredStaySeconds: 60,
        isCreativeCommons: true,
        licenseType: 'CC BY 4.0 International',
      },
      {
        username: 'nairobi_bytes',
        displayName: 'Nairobi Bytes',
        country: 'Kenya',
        category: 'Education',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
        bio: 'Free coding tutorials, web development tips, and AI engineering breakdown for beginner developers.',
        platform: 'YouTube' as const,
        channelUrl: 'https://youtube.com/@NairobiBytes',
        title: 'Learn Fullstack Web Dev & AI with Nairobi Bytes (CC BY)',
        videoEmbedUrl: 'https://www.youtube.com/embed/aqz-KE-bpKQ',
        requiredStaySeconds: 90,
        isCreativeCommons: true,
        licenseType: 'CC BY 3.0',
      },
      {
        username: 'lagos_techie',
        displayName: 'Lagos Techie',
        country: 'Nigeria',
        category: 'Business',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
        bio: 'Fintech breakdowns, startup founder interviews, and venture capital trends in West Africa.',
        platform: 'TikTok' as const,
        channelUrl: 'https://tiktok.com/@lagostechie',
        title: 'African Startup & VC Breakdown with Lagos Techie',
        videoEmbedUrl: 'https://www.youtube.com/embed/YE7VzlLps-4',
        requiredStaySeconds: 45,
        isCreativeCommons: true,
        licenseType: 'CC BY 3.0',
      },
      {
        username: 'capetown_design',
        displayName: 'Cape Town Design',
        country: 'South Africa',
        category: 'Fashion',
        avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=250',
        bio: 'UI/UX design system tutorials, brand identity showcases, and creative design vlogs.',
        platform: 'Instagram' as const,
        channelUrl: 'https://instagram.com/capetowndesign',
        title: 'Design Systems & Creative Aesthetics by Cape Town Design',
        videoEmbedUrl: 'https://www.youtube.com/embed/e1A4X0eL8B4',
        requiredStaySeconds: 60,
        isCreativeCommons: true,
        licenseType: 'CC BY 3.0',
      },
      {
        username: 'accra_vlogs',
        displayName: 'Accra Life & Culture',
        country: 'Ghana',
        category: 'Travel',
        avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=250',
        bio: 'Documenting food spots, local festivals, and vibrant culture across West Africa.',
        platform: 'YouTube' as const,
        channelUrl: 'https://youtube.com/@AccraLifeCulture',
        title: 'Explore West African Travel & Culture Vlogs (CC BY)',
        videoEmbedUrl: 'https://www.youtube.com/embed/d95I34s9G_o',
        requiredStaySeconds: 60,
        isCreativeCommons: true,
        licenseType: 'CC BY 4.0 International',
      },
      {
        username: 'kampala_gaming',
        displayName: 'Kampala Gaming Lab',
        country: 'Uganda',
        category: 'Gaming',
        avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=250',
        bio: 'Competitive esports highlights, game reviews, and live streams in East Africa.',
        platform: 'Twitch' as const,
        channelUrl: 'https://twitch.tv/kampalagaming',
        title: 'Watch Kampala Gaming Lab Esports Streams & Highlights',
        videoEmbedUrl: 'https://www.youtube.com/embed/L_LUpnjgPso',
        requiredStaySeconds: 120,
        isCreativeCommons: true,
        licenseType: 'CC BY 4.0',
      },
      {
        username: 'zenith_music',
        displayName: 'Zenith AfroBeats',
        country: 'Nigeria',
        category: 'Music',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250',
        bio: 'Independent music producer creating Afrobeat instrumental tracks, mixing tutorials, and sound design.',
        platform: 'YouTube' as const,
        channelUrl: 'https://youtube.com/@ZenithAfroBeats',
        title: 'Afrobeats Production & Instrumental Sound Design (CC BY)',
        videoEmbedUrl: 'https://www.youtube.com/embed/aqz-KE-bpKQ',
        requiredStaySeconds: 60,
        isCreativeCommons: true,
        licenseType: 'CC BY 3.0',
      },
      {
        username: 'cairo_vlogs',
        displayName: 'Cairo Creator Studio',
        country: 'Egypt',
        category: 'Documentary',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250',
        bio: 'Short documentary films exploring ancient history, modern architecture, and photography.',
        platform: 'YouTube' as const,
        channelUrl: 'https://youtube.com/@CairoCreatorStudio',
        title: 'Cairo Historical & Visual Storytelling Documentaries (CC BY)',
        videoEmbedUrl: 'https://www.youtube.com/embed/YE7VzlLps-4',
        requiredStaySeconds: 60,
        isCreativeCommons: true,
        licenseType: 'CC BY 3.0',
      },
    ];

    demoCreatorsData.forEach((c, idx) => {
      const uId = `usr_demo_00${idx + 1}`;
      const hash = bcrypt.hashSync('SubLoop123!', 10);
      this.passwordHashes.set(uId, hash);

      const user: User = {
        id: uId,
        username: c.username,
        displayName: c.displayName,
        email: `${c.username}@subloop.co`,
        country: c.country,
        role: 'user',
        status: 'active',
        avatar: c.avatar,
        bio: c.bio,
        creatorCategory: c.category,
        credits: 450 + idx * 100,
        totalCreditsEarned: 1200 + idx * 300,
        totalCreditsSpent: 750 + idx * 200,
        level: Math.floor(2 + idx * 0.8),
        reputation: Math.min(99, 82 + idx * 2),
        referralCode: `SUB-${c.username.toUpperCase().substring(0, 6)}`,
        referralCount: idx * 2,
        referralRewardsEarned: idx * 200,
        streakDays: 3 + idx,
        dailyRewardClaimedToday: false,
        dailyDiscoveryCountToday: idx,
        riskScore: 0,
        isPro: idx % 3 === 0,
        isAiVerified: true,
        aiVerificationData: {
          status: 'verified',
          authenticityScore: Math.min(99, 91 + idx),
          growthQualityRating: 'Organic Audience Growth',
          engagementVelocity: 'High Audience Velocity',
          retentionQuality: 'Exceeds Benchmarks (78s)',
          riskRating: 'Very Low Risk (<0.01)',
          aiAuditSummary: `Gemini AI verified @${c.username}'s channel growth statistics. Healthy organic subscriber velocity, genuine video retention rates, and authentic engagement patterns without artificial manipulation.`,
          verifiedAt: new Date(Date.now() - (idx + 1) * 3600000 * 12).toISOString(),
          verifiedByModel: 'gemini-3.6-flash',
          metricsAnalyzed: {
            subscribersCount: 2400 + idx * 850,
            totalViews: 38000 + idx * 12000,
            avgRetentionSeconds: 60 + idx * 5,
            engagementRatioPercent: parseFloat((4.8 + idx * 0.3).toFixed(1)),
          },
        },
        createdAt: new Date(Date.now() - (idx + 1) * 86400000 * 5).toISOString(),
      };
      this.users.set(uId, user);

      // Social Channel
      const chId = `chan_${uId}`;
      const channel: SocialChannel = {
        id: chId,
        userId: uId,
        platform: c.platform as any,
        channelName: c.displayName,
        url: c.channelUrl,
        category: c.category,
        description: c.bio,
        thumbnail: c.avatar,
        isVerified: true,
        createdAt: user.createdAt,
      };
      this.socialChannels.set(chId, channel);

      // Creator Profile
      const cpId = `prof_${uId}`;
      const profile: CreatorProfile = {
        id: cpId,
        userId: uId,
        username: c.username,
        displayName: c.displayName,
        avatar: c.avatar,
        bio: c.bio,
        country: c.country,
        category: c.category,
        reputation: user.reputation,
        level: user.level,
        profileViews: 340 + idx * 120,
        totalDiscoveries: 120 + idx * 45,
        isPro: user.isPro,
        socialChannelsCount: 1,
        isAiVerified: user.isAiVerified,
        aiVerificationData: user.aiVerificationData,
        createdAt: user.createdAt,
      };
      this.creatorProfiles.set(cpId, profile);

      // Active Promotion
      const promoId = `prom_${uId}`;
      const promotion: Promotion = {
        id: promoId,
        userId: uId,
        creatorUsername: c.username,
        creatorDisplayName: c.displayName,
        creatorAvatar: c.avatar,
        creatorCategory: c.category,
        country: c.country,
        channelId: chId,
        platform: c.platform as any,
        channelUrl: c.channelUrl,
        title: c.title,
        description: c.bio,
        budgetCredits: 500 + idx * 250,
        spentCredits: 120 + idx * 40,
        rewardPerDiscovery: 10,
        durationDays: 7,
        status: 'active',
        impressions: 1250 + idx * 300,
        clicks: 310 + idx * 90,
        uniqueDiscoveries: 85 + idx * 20,
        isSponsored: idx % 2 === 0,
        videoEmbedUrl: c.videoEmbedUrl,
        requiredStaySeconds: c.requiredStaySeconds || 60,
        isCreativeCommons: c.isCreativeCommons ?? true,
        licenseType: c.licenseType || 'CC BY 4.0 International',
        createdAt: new Date(Date.now() - (idx + 1) * 3600000 * 4).toISOString(),
      };
      this.promotions.set(promoId, promotion);

      // Seed Transaction
      this.creditTransactions.push({
        id: `tx_${uId}_1`,
        userId: uId,
        type: 'bonus',
        amount: 500,
        balanceAfter: 500,
        description: 'Welcome creator registration bonus',
        createdAt: user.createdAt,
      });
    });

    // Initial Notifications for Admin
    this.notifications.push({
      id: 'notif_1',
      userId: adminId,
      title: 'Welcome to SubLoop Admin',
      message: 'SubLoop creator discovery network is online. Powered by Firebase Firestore & Auth.',
      type: 'system',
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  // Password Verification & Hash Retrieval
  public verifyPassword(userId: string, passwordAttempt: string): boolean {
    const hash = this.passwordHashes.get(userId);
    if (!hash) return false;
    return bcrypt.compareSync(passwordAttempt, hash);
  }

  public setPasswordHash(userId: string, plainTextPassword: string) {
    const hash = bcrypt.hashSync(plainTextPassword, 10);
    this.passwordHashes.set(userId, hash);
  }

  // Record Immutable Transaction
  public recordTransaction(
    userId: string,
    type: CreditTransaction['type'],
    amount: number,
    description: string,
    referenceId?: string
  ): CreditTransaction {
    let user = this.users.get(userId);
    if (!user) {
      user = Array.from(this.users.values()).find((u) => u.id === userId || u.username === userId || u.email === userId);
    }

    if (!user) {
      user = {
        id: userId,
        username: `user_${userId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8)}`,
        displayName: 'Creator',
        email: `${userId}@subloop.co`,
        country: 'Rwanda',
        role: 'user',
        status: 'active',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
        bio: 'Creator on SubLoop',
        creatorCategory: 'Technology',
        credits: 100,
        totalCreditsEarned: 100,
        totalCreditsSpent: 0,
        level: 1,
        reputation: 80,
        referralCode: `SUB-${userId.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase()}`,
        referralCount: 0,
        referralRewardsEarned: 0,
        streakDays: 1,
        dailyRewardClaimedToday: false,
        dailyDiscoveryCountToday: 0,
        riskScore: 0,
        isPro: false,
        createdAt: new Date().toISOString(),
      };
      this.users.set(userId, user);
    }

    const newBalance = (user.credits || 0) + amount;
    user.credits = Math.max(0, newBalance);
    if (amount > 0) user.totalCreditsEarned = (user.totalCreditsEarned || 0) + amount;
    if (amount < 0) user.totalCreditsSpent = (user.totalCreditsSpent || 0) + Math.abs(amount);

    const tx: CreditTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      type,
      amount,
      balanceAfter: user.credits,
      description,
      referenceId,
      createdAt: new Date().toISOString(),
    };

    this.creditTransactions.unshift(tx);

    // Sync user & transaction to Firestore
    this.saveUser(user);
    if (this.firestoreDb) {
      setDoc(doc(this.firestoreDb, 'transactions', tx.id), sanitizeForFirestore(tx)).catch((err) =>
        console.warn('Failed to save transaction to Firestore:', err)
      );
    }

    return tx;
  }

  // Record Admin Audit Log
  public recordAuditLog(
    adminId: string,
    adminUsername: string,
    action: string,
    details: string,
    targetUserId?: string,
    targetResource?: string,
    ipAddress?: string
  ): AdminAuditLog {
    const log: AdminAuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      adminId,
      adminUsername,
      action,
      targetUserId,
      targetResource,
      details,
      ipAddress,
      createdAt: new Date().toISOString(),
    };
    this.adminAuditLogs.unshift(log);
    return log;
  }

  // Calculate Admin Stats
  public getAdminStats(): AdminStats {
    let totalCirculating = 0;
    let totalPurchased = 0;
    let totalSpent = 0;

    this.users.forEach((u) => {
      totalCirculating += u.credits;
      totalSpent += u.totalCreditsSpent;
    });

    this.creditTransactions.forEach((tx) => {
      if (tx.type === 'purchase') {
        totalPurchased += tx.amount;
      }
    });

    const activePromotions = Array.from(this.promotions.values()).filter((p) => p.status === 'active').length;

    return {
      totalUsers: this.users.size,
      activeUsersToday: Math.min(this.users.size, 14),
      totalPromotions: this.promotions.size,
      activePromotions,
      totalCreditsCirculating: totalCirculating,
      totalCreditsPurchased: totalPurchased,
      totalCreditsSpent: totalSpent,
      estimatedRevenueUsd: (totalPurchased / 1000) * 1.0,
      totalDiscoveriesCount: this.discoveryActivities.length + 420,
    };
  }
}

export const db = new InAppDatabase();
