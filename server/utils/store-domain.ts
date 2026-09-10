import { createError, getRequestHost, type H3Event } from 'h3'

const localHosts = new Set(['localhost', '127.0.0.1', '[::1]'])

export function resolveStoreDomain(event: H3Event, fallback: string, trustProxyHeaders: unknown): string {
  const rawHost = getRequestHost(event, { xForwardedHost: trustProxyHeaders === true || trustProxyHeaders === 'true' || trustProxyHeaders === '1' })
    .split(',')[0]
    ?.trim()

  let hostname = ''

  try {
    hostname = new URL(`http://${rawHost}`).hostname.toLowerCase().replace(/\.$/, '')
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Domínio inválido', message: 'O domínio informado não é válido.' })
  }

  if (localHosts.has(hostname)) {
    return fallback
  }

  if (!hostname || !/^[a-z0-9.-]+$/.test(hostname)) {
    throw createError({ statusCode: 400, statusMessage: 'Domínio inválido', message: 'O domínio informado não é válido.' })
  }

  return hostname
}
