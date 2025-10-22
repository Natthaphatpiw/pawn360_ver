import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'pawn360-super-secret-jwt-key-2024';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  store_id?: string;
}

export function verifyToken(request: NextRequest): AuthUser | null {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    return {
      id: decoded.sub,
      email: decoded.email || '',
      full_name: decoded.full_name || '',
      role: decoded.role || 'user',
      store_id: decoded.store_id
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export function createToken(user: AuthUser): string {
  const payload = {
    sub: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    store_id: user.store_id
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function getUserIdFromToken(request: NextRequest): string | null {
  const user = verifyToken(request);
  return user ? user.id : null;
}
