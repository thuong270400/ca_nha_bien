<script setup lang="ts">
import type { SafeUser } from '#shared/types/user'

definePageMeta({ middleware: 'auth' })

const { fetch: refreshSession } = useUserSession()
const toast = useToast()
const loading = ref(false)

const { data: profile } = await useFetch<SafeUser>('/api/auth/me', { key: 'me-profile' })

const form = reactive({ name: '', phone: '' })
watchEffect(() => {
  if (profile.value) {
    form.name = profile.value.name
    form.phone = profile.value.phone ?? ''
  }
})

async function save() {
  loading.value = true
  try {
    await $fetch('/api/auth/me', {
      method: 'PATCH',
      body: { name: form.name, phone: form.phone || undefined },
    })
    await refreshSession()
    toast.add({ title: 'Đã cập nhật thông tin', color: 'success', icon: 'i-lucide-check-circle' })
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể cập nhật thông tin'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    loading.value = false
  }
}

useSeoMeta({ title: 'Tài khoản của tôi - Cá nhà biển' })
</script>

<template>
  <UContainer class="py-8">
    <h1 class="mb-6 text-2xl font-bold text-highlighted">
      Tài khoản của tôi
    </h1>
    <div class="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
      <AccountNav />

      <div class="max-w-lg rounded-xl border border-default p-6">
        <h2 class="mb-4 font-semibold text-highlighted">
          Thông tin cá nhân
        </h2>
        <UForm :state="form" class="space-y-4" @submit="save">
          <UFormField label="Email">
            <UInput :model-value="profile?.email" disabled class="w-full" />
          </UFormField>
          <UFormField label="Họ tên" name="name">
            <UInput v-model="form.name" class="w-full" />
          </UFormField>
          <UFormField label="Số điện thoại" name="phone">
            <UInput v-model="form.phone" placeholder="09xxxxxxxx" class="w-full" />
          </UFormField>
          <UButton type="submit" :loading="loading">
            Lưu thay đổi
          </UButton>
        </UForm>
      </div>
    </div>
  </UContainer>
</template>
