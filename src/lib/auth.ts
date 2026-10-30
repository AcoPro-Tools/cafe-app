import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

export interface UserSession {
  userId: number
  name: string
  email: string
  role: 'ADMIN' | 'CASHIER'
}

const secretKey = process.env.JWT_SECRET || 'cafe-super-secret-key-2026-specialty-auth-token'
const encodedKey = new TextEncoder().encode(secretKey)

export const COOKIE_NAME = 'cafe_token'

export async function signSession(payload: UserSession): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)
}

export async function verifySession(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ['HS256'],
    })
    return {
      userId: Number(payload.userId),
      name: String(payload.name),
      email: String(payload.email),
      role: payload.role as 'ADMIN' | 'CASHIER',
    }
  } catch (err) {
    return null
  }
}

export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null
    return await verifySession(token)
  } catch (err) {
    return null
  }
}
