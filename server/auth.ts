import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getUserById, UserEntity } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'cryptopulse_jwt_super_secret_demo_key_2026';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: UserEntity;
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Требуется авторизация (отсутствует Bearer токен)' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    res.status(401).json({ error: 'Недействительный или истекший токен сессии' });
    return;
  }

  const user = getUserById(decoded.userId);
  if (!user) {
    res.status(401).json({ error: 'Пользователь не найден' });
    return;
  }

  req.userId = user.id;
  req.user = user;
  next();
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (decoded) {
      const user = getUserById(decoded.userId);
      if (user) {
        req.userId = user.id;
        req.user = user;
      }
    }
  }
  next();
}
