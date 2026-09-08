import { deleteBanner } from '../../../services/banner.service'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  await deleteBanner(id)
  return { success: true }
})
