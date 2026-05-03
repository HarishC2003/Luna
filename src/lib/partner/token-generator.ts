import crypto from 'crypto'

export function generatePartnerToken(): string {
  return crypto.randomBytes(16).toString('hex')
}

export function getPartnerShareUrl(token: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}/partner/${token}`
}
