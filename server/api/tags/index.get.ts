import { listTags } from '../../services/tag.service'

export default defineApiHandler(async () => {
  return listTags()
})
