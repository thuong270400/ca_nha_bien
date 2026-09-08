import { saveImage, UPLOAD_FOLDERS, type UploadFolder } from '../../services/upload.service'

export default defineApiHandler(async (event) => {
  await requireAdmin(event)
  const parts = await readMultipartFormData(event)
  const file = parts?.find(p => p.name === 'file' && p.filename)
  if (!file) throw Errors.badRequest('Vui lòng chọn file ảnh')

  const folderField = parts?.find(p => p.name === 'folder')
  const folderValue = folderField?.data.toString('utf-8') as UploadFolder | undefined
  const folder = folderValue && (UPLOAD_FOLDERS as readonly string[]).includes(folderValue) ? folderValue : 'products'

  return saveImage({ type: file.type, filename: file.filename, data: file.data }, folder)
})
