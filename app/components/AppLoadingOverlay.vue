<template>
  <Transition
    enter-active-class="transition-opacity duration-150"
    leave-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isVisible"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70 backdrop-blur-sm dark:bg-gray-950/70"
      role="status"
      aria-live="polite"
      aria-label="Đang tải"
    >
      <img
        src="/images/logo/logo.png"
        alt=""
        class="h-16 w-16 animate-pulse drop-shadow-lg"
      >
    </div>
  </Transition>
</template>

<script setup lang="ts">
const { isVisible } = useAppLoading()
</script>
