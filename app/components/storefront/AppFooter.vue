<script setup lang="ts">
const year = new Date().getFullYear()
const { contact } = useAppConfig()
</script>

<template>
  <UFooter>
    <template #top>
      <UContainer>
        <div class="grid grid-cols-1 gap-8 py-8 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <div class="flex items-center gap-2 text-lg font-bold text-primary">
              <img src="/images/logo/logo.png" alt="Cá Nhà Biển" class="size-8 object-contain">
              Cá Nhà Biển
            </div>
            <p class="mt-3 text-sm text-muted">
              Cá tươi, hải sản tươi sống đánh bắt trong ngày — giao tận nhà mỗi sáng.
            </p>
          </div>

          <div>
            <h3 class="mb-3 text-sm font-semibold text-highlighted">
              Thông tin
            </h3>
            <ul class="space-y-2 text-sm text-muted">
              <li><NuxtLink to="/about" class="hover:text-primary">Giới thiệu</NuxtLink></li>
              <li><NuxtLink to="/contact" class="hover:text-primary">Liên hệ</NuxtLink></li>
              <li><NuxtLink to="/policy#giao-hang" class="hover:text-primary">Chính sách giao hàng</NuxtLink></li>
              <li><NuxtLink to="/policy#doi-tra" class="hover:text-primary">Chính sách đổi trả</NuxtLink></li>
              <li><NuxtLink to="/faq" class="hover:text-primary">Câu hỏi thường gặp</NuxtLink></li>
              <li><NuxtLink to="/blog" class="hover:text-primary">Tin tức</NuxtLink></li>
              <li><NuxtLink to="/recipes" class="hover:text-primary">Tư vấn món ngon</NuxtLink></li>
            </ul>
          </div>

          <div>
            <h3 class="mb-3 text-sm font-semibold text-highlighted">
              Cam kết
            </h3>
            <ul class="space-y-2 text-sm text-muted">
              <li class="flex items-center gap-2">
                <UIcon name="i-lucide-badge-check" class="size-4 text-primary" /> Cá tươi trong ngày
              </li>
              <li class="flex items-center gap-2">
                <UIcon name="i-lucide-snowflake" class="size-4 text-primary" /> Bảo quản lạnh đạt chuẩn
              </li>
            </ul>
          </div>

          <div>
            <h3 class="mb-3 text-sm font-semibold text-highlighted">
              Khu vực giao hàng
            </h3>
            <p class="text-sm text-muted">
              Giao hàng tận nơi tại TP.HCM và các tỉnh thành lân cận qua đối tác vận chuyển.
            </p>
          </div>

          <div>
            <h3 class="mb-3 text-sm font-semibold text-highlighted">
              Liên hệ
            </h3>
            <ul class="space-y-2 text-sm text-muted">
              <li class="flex items-center gap-2">
                <UIcon name="i-lucide-phone" class="size-4" /> {{ contact.hotline }}
              </li>
              <li class="flex items-center gap-2">
                <UIcon name="i-lucide-mail" class="size-4" /> {{ contact.email }}
              </li>
              <li class="flex items-center gap-2">
                <UIcon name="i-lucide-map-pin" class="size-4" /> {{ contact.address }}
              </li>
            </ul>
          </div>
        </div>
      </UContainer>
    </template>

    <template #left>
      <p class="text-sm text-muted">
        © {{ year }} Cá Nhà Biển. All rights reserved.
      </p>
    </template>
  </UFooter>
</template>
