import { updateCombo } from '../../services/combo.service'
import { comboUpdateSchema } from '../../utils/schemas/combo.schema'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const input = await readValidatedBody(event, comboUpdateSchema.parse)
  return updateCombo(id, input)
})
