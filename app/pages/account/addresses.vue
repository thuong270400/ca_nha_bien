<script setup lang="ts">
import { addressSchema } from '#shared/schemas/address.schema'
import type { AddressView } from '#shared/types/order'

definePageMeta({ middleware: 'auth' })

const { data: addresses, refresh } = await useFetch<AddressView[]>('/api/addresses', { key: 'account-addresses' })

const toast = useToast()
const open = ref(false)
const saving = ref(false)
const editing = ref<AddressView | null>(null)
const formRef = ref<{ submit: () => void } | null>(null)

const form = reactive({
  fullName: '',
  phone: '',
  province: '',
  district: '',
  ward: '',
  addressLine: '',
  note: '',
  isDefault: false,
})

function openCreate() {
  editing.value = null
  form.fullName = ''
  form.phone = ''
  form.province = ''
  form.district = ''
  form.ward = ''
  form.addressLine = ''
  form.note = ''
  form.isDefault = false
  open.value = true
}

function openEdit(address: AddressView) {
  editing.value = address
  form.fullName = address.fullName
  form.phone = address.phone
  form.province = address.province
  form.district = address.district
  form.ward = address.ward
  form.addressLine = address.addressLine
  form.note = address.note ?? ''
  form.isDefault = address.isDefault
  open.value = true
}

async function save() {
  saving.value = true
  try {
    const payload = { ...form, note: form.note || undefined }
    if (editing.value) {
      await $fetch(`/api/addresses/${editing.value.id}`, { method: 'PATCH', body: payload })
    } else {
      await $fetch('/api/addresses', { method: 'POST', body: payload })
    }
    toast.add({ title: 'Đã lưu địa chỉ', color: 'success' })
    open.value = false
    await refresh()
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể lưu địa chỉ'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    saving.value = false
  }
}

const confirm = useConfirm()
const deletingId = ref<string | null>(null)
async function remove(address: AddressView) {
  const ok = await confirm({ title: 'Xoá địa chỉ này?' })
  if (!ok) return
  deletingId.value = address.id
  try {
    await $fetch(`/api/addresses/${address.id}`, { method: 'DELETE' })
    toast.add({ title: 'Đã xoá địa chỉ', color: 'success' })
    await refresh()
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể xoá địa chỉ'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    deletingId.value = null
  }
}

const settingDefaultId = ref<string | null>(null)
async function setDefault(address: AddressView) {
  settingDefaultId.value = address.id
  try {
    await $fetch(`/api/addresses/${address.id}`, { method: 'PATCH', body: { isDefault: true } })
    await refresh()
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể đặt làm mặc định'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    settingDefaultId.value = null
  }
}

useSeoMeta({ title: 'Sổ địa chỉ - Cá Nhà Biển' })
</script>

<template>
  <UContainer class="py-8">
    <h1 class="mb-6 text-2xl font-bold text-highlighted">
      Sổ địa chỉ
    </h1>
    <div class="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
      <AccountNav />

      <div>
        <UButton icon="i-lucide-plus" class="mb-4" @click="openCreate">
          Thêm địa chỉ
        </UButton>

        <div v-if="!addresses?.length" class="rounded-xl border border-dashed border-default py-16 text-center">
          <p class="text-muted">
            Bạn chưa có địa chỉ nào.
          </p>
        </div>

        <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div v-for="address in addresses" :key="address.id" class="rounded-xl border border-default p-4">
            <div class="mb-2 flex items-center justify-between">
              <p class="font-medium text-highlighted">
                {{ address.fullName }}
              </p>
              <UBadge v-if="address.isDefault" color="primary">
                Mặc định
              </UBadge>
            </div>
            <p class="text-sm text-muted">
              {{ address.phone }}
            </p>
            <p class="text-sm text-muted">
              {{ address.addressLine }}, {{ address.ward }}, {{ address.district }}, {{ address.province }}
            </p>
            <p v-if="address.note" class="mt-1 text-xs text-muted">
              Ghi chú: {{ address.note }}
            </p>
            <div class="mt-3 flex flex-wrap gap-2">
              <UButton
                v-if="!address.isDefault"
                size="xs"
                variant="outline"
                :loading="settingDefaultId === address.id"
                @click="setDefault(address)"
              >
                Đặt làm mặc định
              </UButton>
              <UButton size="xs" variant="ghost" icon="i-lucide-pencil" @click="openEdit(address)">
                Sửa
              </UButton>
              <UButton
                size="xs"
                variant="ghost"
                color="error"
                icon="i-lucide-trash-2"
                :loading="deletingId === address.id"
                @click="remove(address)"
              >
                Xoá
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <UModal v-model:open="open" :title="editing ? 'Sửa địa chỉ' : 'Thêm địa chỉ'">
      <template #body>
        <UForm ref="formRef" :schema="addressSchema" :state="form" class="space-y-4" @submit="save">
          <UFormField label="Họ tên người nhận" name="fullName" required>
            <UInput v-model="form.fullName" class="w-full" />
          </UFormField>
          <UFormField label="Số điện thoại" name="phone" required>
            <UInput v-model="form.phone" class="w-full" />
          </UFormField>
          <UFormField label="Tỉnh/Thành phố" name="province" required>
            <UInput v-model="form.province" class="w-full" />
          </UFormField>
          <UFormField label="Quận/Huyện" name="district" required>
            <UInput v-model="form.district" class="w-full" />
          </UFormField>
          <UFormField label="Phường/Xã" name="ward" required>
            <UInput v-model="form.ward" class="w-full" />
          </UFormField>
          <UFormField label="Địa chỉ chi tiết" name="addressLine" required>
            <UInput v-model="form.addressLine" placeholder="Số nhà, tên đường..." class="w-full" />
          </UFormField>
          <UFormField label="Ghi chú" name="note">
            <UTextarea v-model="form.note" class="w-full" :rows="2" />
          </UFormField>
          <UCheckbox v-model="form.isDefault" label="Đặt làm địa chỉ mặc định" />
        </UForm>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="outline" @click="open = false">
            Huỷ
          </UButton>
          <UButton :loading="saving" @click="formRef?.submit()">
            Lưu
          </UButton>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
