<script setup lang="ts">
import type { CouponView } from '#shared/types/coupon'

definePageMeta({ layout: 'admin', middleware: 'admin' })

interface CouponList {
  data: CouponView[]
  meta: { page: number, limit: number, total: number, totalPages: number }
}

const route = useRoute()
const router = useRouter()
const toast = useToast()

const query = computed(() => ({
  page: route.query.page ? Number(route.query.page) : 1,
  limit: 20,
}))

const { data, refresh } = await useFetch<CouponList>('/api/admin/coupons', {
  key: 'admin-coupons',
  query,
})

function setPage(page: number) {
  router.push({ path: '/admin/coupons', query: { ...route.query, page } })
}

const typeOptions = [
  { label: 'Phần trăm (%)', value: 'PERCENTAGE' },
  { label: 'Số tiền cố định (đ)', value: 'FIXED' },
]

const open = ref(false)
const saving = ref(false)
const editing = ref<CouponView | null>(null)

const form = reactive({
  code: '',
  type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
  value: 0,
  minOrderValue: undefined as number | undefined,
  maxDiscount: undefined as number | undefined,
  usageLimit: undefined as number | undefined,
  startsAt: '',
  expiresAt: '',
  isActive: true,
})

function toDateInput(value: string | null) {
  return value ? value.slice(0, 10) : ''
}

function openCreate() {
  editing.value = null
  form.code = ''
  form.type = 'PERCENTAGE'
  form.value = 0
  form.minOrderValue = undefined
  form.maxDiscount = undefined
  form.usageLimit = undefined
  form.startsAt = ''
  form.expiresAt = ''
  form.isActive = true
  open.value = true
}

function openEdit(coupon: CouponView) {
  editing.value = coupon
  form.code = coupon.code
  form.type = coupon.type
  form.value = Number(coupon.value)
  form.minOrderValue = coupon.minOrderValue ? Number(coupon.minOrderValue) : undefined
  form.maxDiscount = coupon.maxDiscount ? Number(coupon.maxDiscount) : undefined
  form.usageLimit = coupon.usageLimit ?? undefined
  form.startsAt = toDateInput(coupon.startsAt)
  form.expiresAt = toDateInput(coupon.expiresAt)
  form.isActive = coupon.isActive
  open.value = true
}

async function save() {
  saving.value = true
  try {
    const payload = {
      code: form.code,
      type: form.type,
      value: form.value,
      minOrderValue: form.minOrderValue,
      maxDiscount: form.maxDiscount,
      usageLimit: form.usageLimit,
      startsAt: form.startsAt || undefined,
      expiresAt: form.expiresAt || undefined,
      isActive: form.isActive,
    }
    if (editing.value) {
      await $fetch(`/api/admin/coupons/${editing.value.id}`, { method: 'PATCH', body: payload })
    } else {
      await $fetch('/api/admin/coupons', { method: 'POST', body: payload })
    }
    toast.add({ title: 'Đã lưu mã giảm giá', color: 'success' })
    open.value = false
    await refresh()
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể lưu mã giảm giá'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    saving.value = false
  }
}

const togglingId = ref<string | null>(null)
async function toggleActive(coupon: CouponView) {
  togglingId.value = coupon.id
  try {
    await $fetch(`/api/admin/coupons/${coupon.id}`, { method: 'PATCH', body: { isActive: !coupon.isActive } })
    await refresh()
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể cập nhật mã giảm giá'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    togglingId.value = null
  }
}

const deletingId = ref<string | null>(null)
async function remove(coupon: CouponView) {
  deletingId.value = coupon.id
  try {
    await $fetch(`/api/admin/coupons/${coupon.id}`, { method: 'DELETE' })
    toast.add({ title: 'Đã xoá mã giảm giá', color: 'success' })
    await refresh()
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể xoá mã giảm giá'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    deletingId.value = null
  }
}

function formatValue(coupon: CouponView) {
  return coupon.type === 'PERCENTAGE' ? `${Number(coupon.value)}%` : formatVnd(coupon.value)
}

useSeoMeta({ title: 'Mã giảm giá - Cá nhà biển Admin' })
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-xl font-bold text-highlighted">
        Mã giảm giá
      </h1>
      <UButton icon="i-lucide-plus" @click="openCreate">
        Thêm mã giảm giá
      </UButton>
    </div>

    <div class="overflow-x-auto rounded-xl border border-default">
      <table class="w-full text-sm">
        <thead class="bg-elevated text-left text-xs uppercase text-muted">
          <tr>
            <th class="px-4 py-3">
              Mã
            </th>
            <th class="px-4 py-3">
              Giá trị
            </th>
            <th class="px-4 py-3">
              Đã dùng / Giới hạn
            </th>
            <th class="px-4 py-3">
              Hạn dùng
            </th>
            <th class="px-4 py-3">
              Trạng thái
            </th>
            <th class="px-4 py-3" />
          </tr>
        </thead>
        <tbody class="divide-y divide-default">
          <tr v-for="coupon in data?.data ?? []" :key="coupon.id">
            <td class="px-4 py-3 font-medium text-highlighted">
              {{ coupon.code }}
            </td>
            <td class="px-4 py-3 text-muted">
              {{ formatValue(coupon) }}
            </td>
            <td class="px-4 py-3 text-muted">
              {{ coupon.usedCount }} / {{ coupon.usageLimit ?? '∞' }}
            </td>
            <td class="px-4 py-3 text-muted">
              {{ coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString('vi-VN') : 'Không giới hạn' }}
            </td>
            <td class="px-4 py-3">
              <UBadge :color="coupon.isActive ? 'success' : 'neutral'">
                {{ coupon.isActive ? 'Hoạt động' : 'Vô hiệu' }}
              </UBadge>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex justify-end gap-2">
                <UButton
                  size="sm"
                  variant="ghost"
                  :color="coupon.isActive ? 'neutral' : 'success'"
                  :loading="togglingId === coupon.id"
                  @click="toggleActive(coupon)"
                >
                  {{ coupon.isActive ? 'Vô hiệu hoá' : 'Kích hoạt' }}
                </UButton>
                <UButton icon="i-lucide-pencil" size="sm" variant="ghost" @click="openEdit(coupon)" />
                <UButton
                  icon="i-lucide-trash-2"
                  size="sm"
                  variant="ghost"
                  color="error"
                  :loading="deletingId === coupon.id"
                  @click="remove(coupon)"
                />
              </div>
            </td>
          </tr>
          <tr v-if="!data?.data.length">
            <td colspan="6" class="px-4 py-10 text-center text-muted">
              Chưa có mã giảm giá nào
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

    <UModal v-model:open="open" :title="editing ? 'Sửa mã giảm giá' : 'Thêm mã giảm giá'">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Mã" required>
            <UInput v-model="form.code" placeholder="VD: FISH10" class="w-full" />
          </UFormField>
          <UFormField label="Loại" required>
            <USelect v-model="form.type" :items="typeOptions" class="w-full" />
          </UFormField>
          <UFormField :label="form.type === 'PERCENTAGE' ? 'Phần trăm giảm (%)' : 'Số tiền giảm (đ)'" required>
            <UInputNumber v-model="form.value" :min="0" :max="form.type === 'PERCENTAGE' ? 100 : undefined" class="w-full" />
          </UFormField>
          <UFormField v-if="form.type === 'PERCENTAGE'" label="Giảm tối đa (đ, không bắt buộc)">
            <UInputNumber v-model="form.maxDiscount" :min="0" class="w-full" />
          </UFormField>
          <UFormField label="Đơn tối thiểu (đ, không bắt buộc)">
            <UInputNumber v-model="form.minOrderValue" :min="0" class="w-full" />
          </UFormField>
          <UFormField label="Giới hạn lượt dùng (không bắt buộc)">
            <UInputNumber v-model="form.usageLimit" :min="1" class="w-full" />
          </UFormField>
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Bắt đầu">
              <UInput v-model="form.startsAt" type="date" class="w-full" />
            </UFormField>
            <UFormField label="Kết thúc">
              <UInput v-model="form.expiresAt" type="date" class="w-full" />
            </UFormField>
          </div>
          <UCheckbox v-model="form.isActive" label="Kích hoạt" />
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
