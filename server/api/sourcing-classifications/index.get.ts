import { listSourcingClassifications } from '../../services/sourcing-classification.service'

export default defineApiHandler(async () => {
  return listSourcingClassifications()
})
