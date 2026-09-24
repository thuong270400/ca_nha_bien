<script setup lang="ts">
import type { PostCategory } from '#shared/types/content'

const toast = useToast()
const confirm = useConfirm()

const { data: categories, refresh } = useFetch<PostCategory[]>('/api/post-categories', { key: 'admin-post-categories' })

function errorMessage(err: unknown, fallback: string) {
  return (err as { data?: { message?: string } })?.data?.message ?? fallback
}

const open = ref(false)
const saving = ref(false)
const editing = ref<PostCategory | null>(null)
const form = reactive({
  name: '',
  slug: '',
  description: '',
  imageUrl: '',
  isActive: true,
  position: 0,
})
const slugTouched = ref(false)

watch(() => form.name, (name) => {
  if (!slugTouched.value) form.slug = slugify(name)
})

function openCreate() {
  editing.value = null
  form.name = ''
  form.slug = ''
  form.description = ''
  form.imageUrl = ''
  form.isActive = true
  form.position = Math.max(0, ...(categories.value ?? []).map(c => c.position)) + 1
  slugTouched.value = false
  open.value = true
}

function openEdit(category: PostCategory) {
  editing.value = category
  form.name = category.name
  form.slug = category.slug
  form.description = category.description ?? ''
  form.imageUrl = category.imageUrl ?? ''
  form.isActive = category.isActive
  form.position = category.position
  slugTouched.value = true
  open.value = true
}

defineExpose({ openCreate })

// ---- Image upload ----
const uploading = ref(false)
/** Image uploaded in the currently open modal and not saved yet — deleted if the modal is closed without saving or it's replaced again. */
const pendingUpload = ref<string | null>(null)

function discardPendingUpload() {
  if (pendingUpload.value) deleteUploadedImage(pendingUpload.value)
  pendingUpload.value = null
}

async function onImageSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const body = new FormData()
    body.append('file', file)
    body.append('folder', 'post-categories')
    const res = await $fetch<{ url: string }>('/api/admin/uploads', { method: 'POST', body })
    discardPendingUpload()
    pendingUpload.value = res.url
    form.imageUrl = res.url
  } catch (err) {
    toast.add({ title: 'Lỗi', description: errorMessage(err, 'Tải ảnh thất bại'), color: 'error' })
  } finally {
    uploading.value = false
    input.value = ''
  }
}

watch(open, (isOpen) => {
  if (!isOpen) discardPendingUpload()
})

async function save() {
  saving.value = true
  try {
    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description.trim() || null,
      imageUrl: form.imageUrl || null,
      isActive: form.isActive,
      position: form.position,
    }
    if (editing.value) {
      await $fetch(`/api/post-categories/${editing.value.id}`, { method: 'PATCH', body: payload })
    } else {
      await $fetch('/api/post-categories', { method: 'POST', body: payload })
    }
    pendingUpload.value = null // saved — now owned by the category
    toast.add({ title: 'Đã lưu danh mục bài viết', color: 'success' })
    open.value = false
    await refresh()
  } catch (err) {
    toast.add({ title: 'Lỗi', description: errorMessage(err, 'Không thể lưu danh mục'), color: 'error' })
  } finally {
    saving.value = false
  }
}

const deletingId = ref<string | null>(null)
async function remove(category: PostCategory) {
  const ok = await confirm({ title: `Xoá danh mục "${category.name}"?` })
  if (!ok) return
  deletingId.value = category.id
  try {
    await $fetch(`/api/post-categories/${category.id}`, { method: 'DELETE' })
    toast.add({ title: 'Đã xoá danh mục', color: 'success' })
    await refresh()
  } catch (err) {
    toast.add({ title: 'Lỗi', description: errorMessage(err, 'Không thể xoá danh mục'), color: 'error' })
  } finally {
    deletingId.value = null
  }
}

const reorderingId = ref<string | null>(null)
async function move(category: PostCategory, direction: 'up' | 'down') {
  const list = categories.value ?? []
  const index = list.findIndex(c => c.id === category.id)
  const target = list[direction === 'up' ? index - 1 : index + 1]
  if (!target) return

  reorderingId.value = category.id
  try {
    await Promise.all([
      $fetch(`/api/post-categories/${category.id}`, { method: 'PATCH', body: { position: target.position } }),
      $fetch(`/api/post-categories/${target.id}`, { method: 'PATCH', body: { position: category.position } }),
    ])
    await refresh()
  } catch (err) {
    toast.add({ title: 'Lỗi', description: errorMessage(err, 'Không thể thay đổi thứ tự'), color: 'error' })
  } finally {
    reorderingId.value = null
  }
}
</script>

<template>
  <div class="space-y-3">
    <p class="text-sm text-muted">
      Danh mục bài viết hiển thị ở mục <NuxtLink to="/goc-bien" target="_blank" class="font-medium text-primary hover:underline">
        Góc Biển
      </NuxtLink> trên cửa hàng. Gán danh mục cho từng bài trong trang sửa bài viết.
    </p>

    <div class="overflow-x-auto rounded-xl border border-default">
      <table class="w-full text-sm">
        <thead class="bg-elevated text-left text-xs uppercase text-muted">
          <tr>
            <th class="px-4 py-3">
              Thứ tự
            </th>
            <th class="px-4 py-3">
              Tên
            </th>
            <th class="px-4 py-3">
              Slug
            </th>
            <th class="px-4 py-3">
              Bài viết
            </th>
            <th class="px-4 py-3">
              Trạng thái
            </th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr v-for="(category, i) in categories ?? []" :key="category.id">
            <td class="px-4 py-3">
              <div class="flex items-center gap-1">
                <span class="w-6 text-muted">{{ category.position }}</span>
                <UButton
                  icon="i-lucide-chevron-up"
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  :disabled="i === 0"
                  :loading="reorderingId === category.id"
                  @click="move(category, 'up')"
                />
                <UButton
                  icon="i-lucide-chevron-down"
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  :disabled="i === (categories?.length ?? 0) - 1"
                  :loading="reorderingId === category.id"
                  @click="move(category, 'down')"
                />
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-elevated">
                  <img v-if="category.imageUrl" :src="category.imageUrl" alt="" class="size-full object-cover">
                  <UIcon v-else name="i-lucide-folder" class="size-5 text-muted" />
                </div>
                <span class="font-medium text-highlighted">{{ category.name }}</span>
              </div>
            </td>
            <td class="px-4 py-3 text-muted">
              {{ category.slug }}
            </td>
            <td class="px-4 py-3">
              <NuxtLink :to="{ path: '/admin/posts', query: { categoryId: category.id } }" class="text-primary hover:underline">
                {{ category.postCount }} bài
              </NuxtLink>
            </td>
            <td class="px-4 py-3">
              <UBadge :color="category.isActive ? 'success' : 'neutral'">
                {{ category.isActive ? 'Hiển thị' : 'Ẩn' }}
              </UBadge>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex justify-end gap-2">
                <UButton icon="i-lucide-pencil" size="sm" variant="ghost" @click="openEdit(category)" />
                <UButton
                  icon="i-lucide-trash-2"
                  size="sm"
                  variant="ghost"
                  color="error"
                  :loading="deletingId === category.id"
                  @click="remove(category)"
                />
              </div>
            </td>
          </tr>
          <tr v-if="!categories?.length">
            <td colspan="6" class="px-4 py-10 text-center text-muted">
              Chưa có danh mục bài viết nào
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UModal v-model:open="open" :title="editing ? 'Sửa danh mục bài viết' : 'Thêm danh mục bài viết'">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Tên danh mục" required>
            <UInput v-model="form.name" class="w-full" />
          </UFormField>
          <UFormField label="Slug" required>
            <UInput v-model="form.slug" class="w-full" @input="slugTouched = true" />
          </UFormField>
          <UFormField label="Mô tả">
            <UTextarea v-model="form.description" :rows="3" :maxlength="500" class="w-full" />
          </UFormField>
          <UFormField label="Ảnh đại diện">
            <div class="flex items-center gap-3">
              <div class="flex h-16 w-28 items-center justify-center overflow-hidden rounded-md border border-default bg-elevated">
                <img v-if="form.imageUrl" :src="form.imageUrl" alt="" class="size-full object-cover">
                <UIcon v-else name="i-lucide-image" class="size-6 text-muted" />
              </div>
              <label class="cursor-pointer">
                <UButton :loading="uploading" icon="i-lucide-upload" size="sm" variant="outline" as="span">
                  {{ form.imageUrl ? 'Đổi ảnh' : 'Tải ảnh lên' }}
                </UButton>
                <input type="file" accept="image/*" class="hidden" @change="onImageSelected">
              </label>
              <UButton
                v-if="form.imageUrl"
                icon="i-lucide-x"
                size="sm"
                color="neutral"
                variant="ghost"
                aria-label="Gỡ ảnh"
                @click="form.imageUrl = ''"
              />
            </div>
          </UFormField>
          <UFormField label="Thứ tự hiển thị" description="Số nhỏ hơn hiển thị trước">
            <UInputNumber v-model="form.position" :min="0" />
          </UFormField>
          <UCheckbox v-model="form.isActive" label="Hiển thị trên cửa hàng" />
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="outline" @click="open = false">
            Huỷ
          </UButton>
          <UButton :loading="saving" @click="save">
            Lưu
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
