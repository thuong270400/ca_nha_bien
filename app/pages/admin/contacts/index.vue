<script setup lang="ts">
interface ContactMessage {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string | null
  message: string
  isRead: boolean
  createdAt: string
}

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const router = useRouter()
const toast = useToast()

const query = computed(() => ({
  page: route.query.page ? Number(route.query.page) : 1,
  limit: 20,
}))

const { data, refresh } = await useFetch<{ data: ContactMessage[], meta: { page: number, limit: number, total: number, totalPages: number } }>(
  '/api/admin/contacts',
  { key: 'admin-contacts', query },
)

function setPage(page: number) {
  router.push({ path: '/admin/contacts', query: { ...route.query, page } })
}

const open = ref(false)
const viewing = ref<ContactMessage | null>(null)

async function view(message: ContactMessage) {
  viewing.value = message
  open.value = true
  if (!message.isRead) {
    try {
      await $fetch(`/api/admin/contacts/${message.id}`, { method: 'PATCH', body: { isRead: true } })
      await refresh()
    } catch {
      // best-effort — not marking as read shouldn't block viewing the message
    }
  }
}

const deletingId = ref<string | null>(null)
async function remove(message: ContactMessage) {
  deletingId.value = message.id
  try {
    await $fetch(`/api/admin/contacts/${message.id}`, { method: 'DELETE' })
    toast.add({ title: 'Đã xoá tin nhắn', color: 'success' })
    open.value = false
    await refresh()
  } catch (err) {
    const message_ = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể xoá tin nhắn'
    toast.add({ title: 'Lỗi', description: message_, color: 'error' })
  } finally {
    deletingId.value = null
  }
}

useSeoMeta({ title: 'Liên hệ - Cá nhà biển Admin' })
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <h1 class="text-xl font-bold text-highlighted">
      Tin nhắn liên hệ
    </h1>

    <div class="overflow-x-auto rounded-xl border border-default">
      <table class="w-full text-sm">
        <thead class="bg-elevated text-left text-xs uppercase text-muted">
          <tr>
            <th class="px-4 py-3">
              Người gửi
            </th>
            <th class="px-4 py-3">
              Nội dung
            </th>
            <th class="px-4 py-3">
              Ngày gửi
            </th>
            <th class="px-4 py-3">
              Trạng thái
            </th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr
            v-for="msg in data?.data ?? []"
            :key="msg.id"
            class="cursor-pointer hover:bg-elevated"
            @click="view(msg)"
          >
            <td class="px-4 py-3">
              <p class="font-medium text-highlighted">
                {{ msg.name }}
              </p>
              <p class="text-xs text-muted">
                {{ msg.email }}
              </p>
            </td>
            <td class="max-w-xs truncate px-4 py-3 text-muted">
              {{ msg.message }}
            </td>
            <td class="px-4 py-3 text-muted">
              {{ new Date(msg.createdAt).toLocaleDateString('vi-VN') }}
            </td>
            <td class="px-4 py-3">
              <UBadge :color="msg.isRead ? 'neutral' : 'primary'">
                {{ msg.isRead ? 'Đã đọc' : 'Chưa đọc' }}
              </UBadge>
            </td>
            <td class="px-4 py-3 text-right" @click.stop>
              <UButton
                icon="i-lucide-trash-2"
                size="sm"
                variant="ghost"
                color="error"
                :loading="deletingId === msg.id"
                @click="remove(msg)"
              />
            </td>
          </tr>
          <tr v-if="!data?.data.length">
            <td colspan="5" class="px-4 py-10 text-center text-muted">
              Chưa có tin nhắn nào
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="data && data.meta.totalPages > 1" class="flex justify-center">
      <UPagination
        :page="data.meta.page"
        :total="data.meta.total"
        :items-per-page="data.meta.limit"
        @update:page="setPage"
      />
    </div>

    <UModal v-model:open="open" title="Chi tiết liên hệ">
      <template #body>
        <div v-if="viewing" class="space-y-3 text-sm">
          <p><span class="font-medium text-highlighted">Họ tên:</span> {{ viewing.name }}</p>
          <p><span class="font-medium text-highlighted">Email:</span> {{ viewing.email }}</p>
          <p v-if="viewing.phone"><span class="font-medium text-highlighted">Điện thoại:</span> {{ viewing.phone }}</p>
          <p v-if="viewing.subject"><span class="font-medium text-highlighted">Chủ đề:</span> {{ viewing.subject }}</p>
          <div>
            <p class="font-medium text-highlighted">
              Nội dung:
            </p>
            <p class="mt-1 whitespace-pre-line text-muted">
              {{ viewing.message }}
            </p>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
