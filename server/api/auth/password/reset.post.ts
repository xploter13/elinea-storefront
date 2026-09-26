import { forwardPasswordRequest } from '../../../utils/password-reset'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ token?: string, email?: string, password?: string, password_confirmation?: string }>(event)
  return forwardPasswordRequest(event, 'reset', {
    token: String(body?.token || ''),
    email: String(body?.email || ''),
    password: String(body?.password || ''),
    password_confirmation: String(body?.password_confirmation || ''),
  })
})
