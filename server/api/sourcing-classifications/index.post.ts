import { createSourcingClassification } from '../../services/sourcing-classification.service'
import { sourcingClassificationCreateSchema } from '../../utils/schemas/sourcing-classification.schema'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const input = await readValidatedBody(event, sourcingClassificationCreateSchema.parse)
  return createSourcingClassification(input)
})
