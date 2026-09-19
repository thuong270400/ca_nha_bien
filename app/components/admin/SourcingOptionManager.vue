<script setup lang="ts">
interface SourcingOptionRow {
  id?: string
  label: string
  catchProcess: string
  expectedAvailability: string
  expectedAvailabilityDays: number | undefined
  depositPercent: number | undefined
}

const PRESET_LABELS = ['Có sẵn', 'Theo mùa/chuyến', 'Đặc biệt']

const options = defineModel<SourcingOptionRow[]>({ default: () => [] })

const toast = useToast()
const modalOpen = ref(false)
const editingIndex = ref<number | null>(null)

function blankForm(): SourcingOptionRow {
  return {
    label: '',
    catchProcess: '',
    expectedAvailability: '',
    expectedAvailabilityDays: undefined,
    depositPercent: undefined,
  }
}

const form = reactive<SourcingOptionRow>(blankForm())

function openCreate(presetLabel?: string) {
  editingIndex.value = null
  Object.assign(form, blankForm())
  if (presetLabel) form.label = presetLabel
  modalOpen.value = true
}

function openEdit(idx: number) {
  const option = options.value[idx]
  if (!option) return
  editingIndex.value = idx
  Object.assign(form, {
    label: option.label,
    catchProcess: option.catchProcess,
    expectedAvailability: option.expectedAvailability,
    expectedAvailabilityDays: option.expectedAvailabilityDays,
    depositPercent: option.depositPercent,
  })
  modalOpen.value = true
}

function saveOption() {
  const label = form.label.trim()
  if (!label) {
    toast.add({ title: 'Lỗi', description: 'Vui lòng nhập tên phân loại', color: 'error' })
    return
  }

  const row: SourcingOptionRow = {
    label,
    catchProcess: form.catchProcess.trim(),
    expectedAvailability: form.expectedAvailability.trim(),
    expectedAvailabilityDays: form.expectedAvailabilityDays,
    depositPercent: form.depositPercent,
  }

  if (editingIndex.value !== null) {
    const existing = options.value[editingIndex.value]
    options.value.splice(editingIndex.value, 1, { id: existing?.id, ...row })
  } else {
    options.value.push(row)
  }
  modalOpen.value = false
}

async function removeOption(idx: number) {
  const option = options.value[idx]
  if (!option) return
  const ok = await useConfirm()({ title: `Xoá phân loại "${option.label}"?` })
  if (!ok) return
  options.value.splice(idx, 1)
}

function moveUp(idx: number) {
  if (idx <= 0) return
  const arr = options.value
  const tmp = arr[idx - 1]!
  arr[idx - 1] = arr[idx]!
  arr[idx] = tmp
}

function moveDown(idx: number) {
  const arr = options.value
  if (idx >= arr.length - 1) return
  const tmp = arr[idx + 1]!
  arr[idx + 1] = arr[idx]!
  arr[idx] = tmp
}
</script>

<template>
  <UCard>
    <template #header>
      <div>
        <h2 class="font-semibold text-highlighted">
          Phân loại nguồn cá
        </h2>
        <p class="text-sm text-muted">
          Tuỳ chọn — mô tả các nguồn/loại cá cho sản phẩm này (vd cá có sẵn, cá theo chuyến đánh bắt). Hiển thị cho khách ở trang sản phẩm; thời gian dự kiến/cọc còn dùng để đánh dấu đơn hàng. Giá bán vẫn lấy từ mục "Biến thể / Đơn vị bán" ở trên, không khai báo giá riêng ở đây.
        </p>
      </div>
    </template>

    <div class="space-y-3">
      <div v-if="!options.length" class="py-6 text-center text-sm text-muted">
        Chưa có phân loại nào
      </div>
      <div
        v-for="(option, idx) in options"
        :key="option.id ?? `new-${idx}`"
        class="flex items-center gap-3 rounded-lg border border-default p-3"
      >
        <div class="min-w-0 flex-1">
          <p class="truncate font-medium text-highlighted">
            {{ option.label }}
          </p>
          <p class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span v-if="option.expectedAvailability">Dự kiến: {{ option.expectedAvailability }}</span>
            <span v-if="option.depositPercent">Cọc trước: {{ option.depositPercent }}%</span>
          </p>
        </div>
        <div class="flex shrink-0 items-center gap-1">
          <UButton icon="i-lucide-chevron-up" size="sm" variant="ghost" :disabled="idx === 0" @click="moveUp(idx)" />
          <UButton icon="i-lucide-chevron-down" size="sm" variant="ghost" :disabled="idx === options.length - 1" @click="moveDown(idx)" />
          <UButton icon="i-lucide-pencil" size="sm" variant="ghost" @click="openEdit(idx)" />
          <UButton icon="i-lucide-trash-2" size="sm" variant="ghost" color="error" @click="removeOption(idx)" />
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        <UButton
          v-for="preset in PRESET_LABELS"
          :key="preset"
          icon="i-lucide-plus"
          variant="outline"
          size="sm"
          @click="openCreate(preset)"
        >
          {{ preset }}
        </UButton>
        <UButton icon="i-lucide-plus" variant="outline" size="sm" @click="openCreate()">
          Phân loại khác...
        </UButton>
      </div>
    </div>

    <UModal v-model:open="modalOpen" :title="editingIndex !== null ? 'Sửa phân loại' : 'Thêm phân loại'">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Tên phân loại" required>
            <UInput v-model="form.label" placeholder="Vd: Có sẵn, Theo mùa/chuyến, Đặc biệt..." class="w-full" />
          </UFormField>
          <UFormField label="Mô tả quy trình lấy cá" hint="Vd: đánh bắt ngoài khơi, chuyển về trong ngày...">
            <UTextarea v-model="form.catchProcess" :rows="3" class="w-full" />
          </UFormField>
          <UFormField label="Thời gian dự kiến có cá" hint="Vd: 3-5 ngày sau khi đặt cọc">
            <UInput v-model="form.expectedAvailability" class="w-full" />
          </UFormField>
          <UFormField label="Số ngày dự kiến (tối đa)" hint="Vd: 5 — dùng để tính thời gian giao hàng dự kiến khi khách đặt nhiều sản phẩm, để trống nếu không cần tính">
            <UInputNumber v-model="form.expectedAvailabilityDays" :min="0" />
          </UFormField>
          <UFormField label="Cọc trước (%)" hint="Để trống nếu không yêu cầu cọc">
            <UInputNumber v-model="form.depositPercent" :min="0" :max="100" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="outline" @click="modalOpen = false">
            Huỷ
          </UButton>
          <UButton @click="saveOption">
            Lưu
          </UButton>
        </div>
      </template>
    </UModal>
  </UCard>
</template>
