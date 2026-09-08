import { getCategoryById } from '../../services/category.service'

export default defineApiHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  return getCategoryById(id)
})
