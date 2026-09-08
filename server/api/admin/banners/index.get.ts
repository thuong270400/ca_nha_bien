import { listBanners } from '../../../services/banner.service'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  return listBanners()
})
