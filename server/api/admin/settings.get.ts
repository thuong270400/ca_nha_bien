import { getSettings } from '../../services/setting.service'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  return getSettings()
})
