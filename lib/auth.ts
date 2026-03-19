import { cookies } from 'next/headers'
import { createHmac } from 'crypto'

const secretKey = process.env.NEXTAUTH_SECRET || 'your-secret-key-change-this'

export interface SessionPayload {
  email: string
  iat: number
  exp: number
}

// Simple session token using HMAC
function createToken(email: string): string {
  const timestamp = Date.now()
  const data = `${email}:${timestamp}`
  const signature = createHmac('sha256', secretKey).update(data).digest('hex')
  return Buffer.from(`${data}:${signature}`).toString('base64')
}

function verifyToken(token: string): SessionPayload | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const [email, timestamp, signature] = decoded.split(':')
    
    if (!email || !timestamp || !signature) return null
    
    const data = `${email}:${timestamp}`
    const expectedSignature = createHmac('sha256', secretKey).update(data).digest('hex')
    
    if (signature !== expectedSignature) return null
    
    const iat = parseInt(timestamp)
    const exp = iat + 24 * 60 * 60 * 1000 // 24 hours
    
    if (Date.now() > exp) return null
    
    return { email, iat, exp }
  } catch {
    return null
  }
}

export async function encrypt(payload: Omit<SessionPayload, 'iat' | 'exp'>) {
  return createToken(payload.email)
}

export async function decrypt(session: string | undefined = ''): Promise<SessionPayload | null> {
  if (!session) return null
  return verifyToken(session)
}

export async function createSession(email: string) {
  const session = await encrypt({ email })
  const cookieStore = await cookies()
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
  })
}

export async function getSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  if (!session) return null
  return await decrypt(session)
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

// Developer credentials
export const DEV_EMAIL = 'agsdev@allianceglobalsolutions.com'
export const DEV_PASSWORD = 'ags2026@@'

// In-memory user store (in production, use database)
const users: Map<string, string> = new Map([
  [DEV_EMAIL, DEV_PASSWORD],
])

export function validateCredentials(email: string, password: string): boolean {
  const storedPassword = users.get(email)
  return storedPassword === password
}
