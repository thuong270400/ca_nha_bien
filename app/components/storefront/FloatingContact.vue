<script setup lang="ts">
const { contact } = useAppConfig()
const { y } = useWindowScroll()
const showScrollTop = computed(() => y.value > 400)

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="fixed bottom-6 right-4 z-50 flex flex-col items-center gap-3 sm:right-6">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0 translate-y-2"
    >
      <UButton
        v-if="showScrollTop"
        icon="i-lucide-arrow-up"
        color="neutral"
        variant="solid"
        size="lg"
        class="rounded-full shadow-lg"
        aria-label="Lên đầu trang"
        @click="scrollToTop"
      />
    </Transition>

    <UButton
      :to="`https://zalo.me/${contact.hotline}`"
      target="_blank"
      rel="noopener noreferrer"
      icon="i-simple-icons-zalo"
      color="primary"
      variant="solid"
      size="lg"
      class="rounded-full shadow-lg"
      aria-label="Chat Zalo"
    />

    <UButton
      to="https://m.me/fiship"
      target="_blank"
      rel="noopener noreferrer"
      icon="i-simple-icons-messenger"
      color="neutral"
      variant="solid"
      size="lg"
      class="rounded-full shadow-lg"
      aria-label="Chat Messenger"
    />
  </div>
</template>
