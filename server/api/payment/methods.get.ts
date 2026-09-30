export default defineEventHandler(async (event) => {
  try {
    return { data: await createServerElineaClient(event).payments.methods() }
  } catch (error) {
    rethrowElineaError(error)
  }
})
