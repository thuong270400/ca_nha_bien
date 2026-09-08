<script setup lang="ts">
const toast = useToast()
const sending = ref(false)

const form = reactive({
  name: '',
  email: '',
  phone: '',
  message: '',
})

async function submit() {
  sending.value = true
  try {
    await $fetch('/api/contact', {
      method: 'POST',
      body: { ...form, phone: form.phone || undefined },
    })
    toast.add({ title: 'Đã gửi liên hệ', description: 'Cá nhà biển sẽ phản hồi bạn sớm nhất.', color: 'success' })
    form.name = ''
    form.email = ''
    form.phone = ''
    form.message = ''
  } catch (err) {
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Không thể gửi liên hệ'
    toast.add({ title: 'Lỗi', description: message, color: 'error' })
  } finally {
    sending.value = false
  }
}

useSeoMeta({
  title: 'Liên hệ - Cá nhà biển',
  description: 'Thông tin liên hệ Cá nhà biển - hotline, email, địa chỉ.',
})
useCanonical('/contact')
</script>

<template>
  <UContainer class="py-12">
    <div class="mx-auto max-w-lg">
      <h1 class="mb-6 text-2xl font-bold text-highlighted">
        Liên hệ với chúng tôi
      </h1>
      <p class="mb-6 text-sm text-muted">
        Có câu hỏi về sản phẩm, đơn hàng hoặc muốn hợp tác? Cá nhà biển luôn sẵn sàng hỗ trợ bạn.
      </p>

      <div class="space-y-4 rounded-xl border border-default p-5">
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-phone" class="size-5 text-primary" />
          <div>
            <p class="text-xs text-muted">
              Hotline
            </p>
            <p class="font-medium text-highlighted">
              1900 1234
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-mail" class="size-5 text-primary" />
          <div>
            <p class="text-xs text-muted">
              Email
            </p>
            <p class="font-medium text-highlighted">
              hotro@fiship.vn
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-map-pin" class="size-5 text-primary" />
          <div>
            <p class="text-xs text-muted">
              Địa chỉ
            </p>
            <p class="font-medium text-highlighted">
              TP. Hồ Chí Minh, Việt Nam
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-clock" class="size-5 text-primary" />
          <div>
            <p class="text-xs text-muted">
              Giờ làm việc
            </p>
            <p class="font-medium text-highlighted">
              7:00 - 21:00, tất cả các ngày trong tuần
            </p>
          </div>
        </div>
      </div>

      <form class="mt-8 space-y-4" @submit.prevent="submit">
        <h2 class="font-semibold text-highlighted">
          Gửi tin nhắn cho chúng tôi
        </h2>
        <UFormField label="Họ tên" required>
          <UInput v-model="form.name" class="w-full" />
        </UFormField>
        <UFormField label="Email" required>
          <UInput v-model="form.email" type="email" class="w-full" />
        </UFormField>
        <UFormField label="Số điện thoại">
          <UInput v-model="form.phone" class="w-full" />
        </UFormField>
        <UFormField label="Nội dung" required>
          <UTextarea v-model="form.message" :rows="4" class="w-full" />
        </UFormField>
        <UButton type="submit" :loading="sending" block>
          Gửi liên hệ
        </UButton>
      </form>
    </div>
  </UContainer>
</template>
