import rateLimit from 'express-rate-limit';
import { rateLimiterService, RateLimiterService, RateLimitConfig } from '../services/rateLimiterService';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after a few minutes.',
    errorCode: 'RATE_LIMIT_EXCEEDED',
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 attempts per 15 min for auth endpoints
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
    errorCode: 'AUTH_RATE_LIMIT_EXCEEDED',
  },
});

// Campaign Creation Rate Limiter: Max 3 campaigns per 5 mins, 10s cooldown
export const campaignRateLimiter = rateLimiterService.createMiddleware(
  RateLimiterService.PRESETS.CAMPAIGN_CREATION
);

// Exchange & Sub4Sub Actions Rate Limiter: Max 10 per 60s, 3s cooldown
export const exchangeActionRateLimiter = rateLimiterService.createMiddleware(
  RateLimiterService.PRESETS.EXCHANGE_ACTION
);

// Watch Action Rate Limiter: Max 6 view rewards per 60s
export const watchActionRateLimiter = rateLimiterService.createMiddleware(
  RateLimiterService.PRESETS.WATCH_ACTION
);

// Task Challenge Start Limiter: Max 8 starts per 60s
export const challengeStartRateLimiter = rateLimiterService.createMiddleware(
  RateLimiterService.PRESETS.CHALLENGE_START
);

// Discovery Action Rate Limiter: Max 15 per 60s
export const discoveryActionRateLimiter = rateLimiterService.createMiddleware(
  RateLimiterService.PRESETS.DISCOVERY_ACTION
);

// Custom Rate Limiter Factory
export const createRateLimiter = (config: RateLimitConfig) =>
  rateLimiterService.createMiddleware(config);

