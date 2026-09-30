export default defineEventHandler(async (event) => {
  try {
    return { data: await createServerElineaClient(event).checkout.shippingProviders() }
  } catch (error) {
    rethrowElineaError(error)
  }
})
