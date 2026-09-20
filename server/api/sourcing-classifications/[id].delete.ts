import { deleteSourcingClassification } from '../../services/sourcing-classification.service'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  await deleteSourcingClassification(id)
  return { success: true }
})
