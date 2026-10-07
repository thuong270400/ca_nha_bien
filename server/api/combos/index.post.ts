import { createCombo } from '../../services/combo.service'
import { comboCreateSchema } from '../../utils/schemas/combo.schema'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const input = await readValidatedBody(event, comboCreateSchema.parse)
  return createCombo(input)
})
