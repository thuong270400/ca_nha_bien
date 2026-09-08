/**
 * Best-effort cleanup for an image that was uploaded to R2 but never got saved to
 * a product/post/banner (removed or replaced before the form's Save was clicked).
 * Never throws — the caller has already moved on in the UI regardless of outcome.
 */
export async function deleteUploadedImage(url: string) {
  try {
    await $fetch('/api/admin/uploads', { method: 'DELETE', body: { url } })
  } catch {
    // orphaned object in R2 at worst; not worth surfacing to the admin
  }
}
