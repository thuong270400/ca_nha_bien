<template>
  <div class="flex min-h-screen flex-col bg-muted">
    <StorefrontAppHeader />
    <main class="flex-1">
      <slot />
    </main>
    <StorefrontAppFooter />
    <StorefrontFloatingContact />
  </div>
</template>
