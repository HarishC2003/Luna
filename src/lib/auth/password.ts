import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const COST_FACTOR = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST_FACTOR);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function generateSecureToken(): string {
  return `${crypto.randomUUID()}-${crypto.randomBytes(16).toString('hex')}`;
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
