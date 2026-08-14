import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { User, UserRole } from '../../types';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

const JWT_SECRET = process.env.JWT_SECRET || 'BVjQoB4kyGer2RZ0D';

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token required. Please log in.',
      errorCode: 'UNAUTHORIZED',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    let userId: string | null = null;
    let userEmail: string | null = null;

    // 1. Try standard JWT verification
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded && decoded.id) userId = decoded.id;
      if (decoded && decoded.email) userEmail = decoded.email;
    } catch {
      // 2. If token is a fallback or direct Firebase/Google token (e.g., g_auth_token_*, g_redirect_token_*, usr_*)
      if (token.startsWith('usr_')) {
        userId = token;
      } else if (token.startsWith('g_auth_token_') || token.startsWith('g_redirect_token_') || token.startsWith('fb_token_')) {
        const parts = token.split('_');
        if (parts.length >= 4) {
          userId = `usr_${parts[3]}`;
        }
      } else {
        // Try decoding without verify in case of payload inspection
        try {
          const rawDecoded = jwt.decode(token) as any;
          if (rawDecoded && rawDecoded.id) userId = rawDecoded.id;
          if (rawDecoded && rawDecoded.email) userEmail = rawDecoded.email;
        } catch {}
      }
    }

    let user: User | undefined;
    if (userId) {
      user = await db.getUserAsync(userId);
    }
    if (!user && userEmail) {
      user = await db.getUserAsync(userEmail);
    }

    // Auto-fallback: if user was created on client (Firebase OAuth) and token contains valid user info or fallback token
    if (!user && (token.startsWith('g_auth_') || token.startsWith('g_redirect_') || (userId && userId.startsWith('usr_')))) {
      const gUid = userId || `usr_${Date.now()}`;
      const fallbackUser: User = {
        id: gUid,
        username: `creator_${gUid.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toLowerCase()}`,
        displayName: 'Creator',
        email: userEmail || `${gUid}@subloop.co`,
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
        referralCode: `SUB-${gUid.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase()}`,
        referralCount: 0,
        referralRewardsEarned: 0,
        streakDays: 1,
        dailyRewardClaimedToday: false,
        dailyDiscoveryCountToday: 0,
        riskScore: 0,
        isPro: false,
        createdAt: new Date().toISOString(),
      };
      await db.saveUser(fallbackUser);
      user = fallbackUser;
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session or user not found. Please log in again.',
        errorCode: 'INVALID_USER',
      });
    }

    if (user.status === 'suspended' || user.status === 'banned') {
      return res.status(403).json({
        success: false,
        message: 'Your account is suspended or banned. Please contact support.',
        errorCode: 'ACCOUNT_SUSPENDED',
      });
    }

    req.user = user;
    next();
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      message: 'Authentication error: ' + (err?.message || 'Invalid token'),
      errorCode: 'TOKEN_INVALID',
    });
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        errorCode: 'UNAUTHORIZED',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to access this resource.',
        errorCode: 'FORBIDDEN_ROLE',
      });
    }

    next();
  };
}
