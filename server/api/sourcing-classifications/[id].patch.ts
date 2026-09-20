import { updateSourcingClassification } from '../../services/sourcing-classification.service'
import { sourcingClassificationUpdateSchema } from '../../utils/schemas/sourcing-classification.schema'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const input = await readValidatedBody(event, sourcingClassificationUpdateSchema.parse)
  return updateSourcingClassification(id, input)
})
