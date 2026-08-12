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

export function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = db.users.get(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session or user no longer exists.',
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
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token expired or invalid signature.',
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
