import { updateSettings } from '../../services/setting.service'
import { settingUpdateSchema } from '../../utils/schemas/setting.schema'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const input = await readValidatedBody(event, settingUpdateSchema.parse)
  return updateSettings(input)
})
