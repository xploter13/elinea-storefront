import { forwardPasswordRequest } from '../../../utils/password-reset'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string }>(event)
  return forwardPasswordRequest(event, 'forgot', { email: String(body?.email || '') })
})
