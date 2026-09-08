import { getDateRangeReport } from '../../services/report.service'
import { reportQuerySchema } from '../../utils/schemas/report.schema'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const { from, to, groupBy } = await getValidatedQuery(event, reportQuerySchema.parse)
  return getDateRangeReport(from, to, groupBy)
})
