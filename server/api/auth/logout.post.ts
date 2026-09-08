export default defineApiHandler(async (event) => {
  await clearUserSession(event)
  return { success: true }
})
