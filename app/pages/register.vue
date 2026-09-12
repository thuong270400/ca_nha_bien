<script setup lang="ts">
import { registerSchema } from '#shared/schemas/auth.schema'
import type { RegisterInput } from '#shared/schemas/auth.schema'

const { fetch: refreshSession } = useUserSession()
const router = useRouter()
const toast = useToast()
const loading = ref(false)

const fields = [
  { name: 'name', type: 'text' as const, label: 'Họ tên', placeholder: 'Nguyễn Văn A', required: true },
  { name: 'email', type: 'text' as const, label: 'Email', placeholder: 'you@example.com', required: true },
  { name: 'phone', type: 'text' as const, label: 'Số điện thoại', placeholder: '09xxxxxxxx' },
  { name: 'password', type: 'password' as const, label: 'Mật khẩu', placeholder: 'Tối thiểu 8 ký tự', required: true },
]

async function onSubmit(payload: { data: RegisterInput }) {
  loading.value = true
  try {
    await $fetch('/api/auth/register', { method: 'POST', body: payload.data })
    await refreshSession()
    await useCartStore().fetchCart()
    router.push('/')
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Đăng ký thất bại'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    loading.value = false
  }
}

useSeoMeta({ title: 'Đăng ký - Cá Nhà Biển' })
</script>

<template>
  <UContainer class="flex min-h-[70vh] items-center justify-center py-12">
    <UAuthForm
      :schema="registerSchema"
      :fields="fields"
      title="Tạo tài khoản"
      description="Đăng ký để lưu địa chỉ và theo dõi đơn hàng dễ dàng"
      icon="i-lucide-fish"
      :loading="loading"
      :submit="{ label: 'Đăng ký', block: true }"
      @submit="onSubmit"
    >
      <template #footer>
        Đã có tài khoản?
        <ULink to="/login" class="font-medium text-primary">
          Đăng nhập
        </ULink>
      </template>
    </UAuthForm>
  </UContainer>
</template>
