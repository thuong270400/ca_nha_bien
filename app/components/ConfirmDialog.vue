<script setup lang="ts">
withDefaults(defineProps<{
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  color?: 'error' | 'primary' | 'warning' | 'neutral' | 'success' | 'info'
}>(), {
  title: 'Xác nhận xoá',
  description: 'Hành động này không thể hoàn tác.',
  confirmLabel: 'Xoá',
  cancelLabel: 'Huỷ',
  color: 'error',
})

const emit = defineEmits<{ close: [boolean] }>()
</script>

<template>
  <UModal :title="title" :description="description">
    <template #footer>
      <div class="flex w-full justify-end gap-3">
        <UButton color="neutral" variant="outline" @click="emit('close', false)">
          {{ cancelLabel }}
        </UButton>
        <UButton :color="color" @click="emit('close', true)">
          {{ confirmLabel }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
