import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the base URL from request headers or environment variable
 */
export function getBaseUrl(req?: { headers: { get: (key: string) => string | null } } | Headers): string {
  // Check environment variable first (for production)
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL
  }

  // Try to get from request headers
  if (req) {
    const headersObj = req instanceof Headers ? req : req.headers
    const host = headersObj.get('host')
    const protocol = headersObj.get('x-forwarded-proto') || 
                    headersObj.get('x-forwarded-protocol') ||
                    'https'
    
    if (host) {
      // Remove port from host if present (for cleaner URLs)
      const hostWithoutPort = host.split(':')[0]
      return `${protocol === 'https' || protocol === 'https:' ? 'https' : 'http'}://${host}`
    }
  }

  // Fallback to localhost for development
  return process.env.NODE_ENV === 'production' 
    ? 'https://your-production-domain.com' // Replace with actual production URL or set NEXTAUTH_URL env var
    : 'http://localhost:3000'
}
