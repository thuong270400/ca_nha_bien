<script setup lang="ts">
import { loginSchema } from '#shared/schemas/auth.schema'
import type { LoginInput } from '#shared/schemas/auth.schema'

const { fetch: refreshSession } = useUserSession()
const router = useRouter()
const route = useRoute()
const toast = useToast()
const loading = ref(false)

const fields = [
  { name: 'email', type: 'text' as const, label: 'Email', placeholder: 'you@example.com', required: true },
  { name: 'password', type: 'password' as const, label: 'Mật khẩu', placeholder: '••••••••', required: true },
]

async function onSubmit(payload: { data: LoginInput }) {
  loading.value = true
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: payload.data })
    await refreshSession()
    await useCartStore().fetchCart()
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.push(redirect)
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Đăng nhập thất bại'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    loading.value = false
  }
}

useSeoMeta({ title: 'Đăng nhập - Cá Nhà Biển' })
</script>

<template>
  <UContainer class="flex min-h-[70vh] items-center justify-center py-12">
    <UAuthForm
      :schema="loginSchema"
      :fields="fields"
      title="Đăng nhập"
      description="Đăng nhập để theo dõi đơn hàng và mua sắm nhanh hơn"
      icon="i-lucide-fish"
      :loading="loading"
      :submit="{ label: 'Đăng nhập', block: true }"
      @submit="onSubmit"
    >
      <template #footer>
        Chưa có tài khoản?
        <ULink to="/register" class="font-medium text-primary">
          Đăng ký ngay
        </ULink>
      </template>
    </UAuthForm>
  </UContainer>
</template>
