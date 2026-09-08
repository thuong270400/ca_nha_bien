import { getDashboardStats } from '../../services/dashboard.service'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  return getDashboardStats()
})
