<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <UFooter>
    <template #top>
      <UContainer>
        <div class="grid grid-cols-1 gap-8 py-8 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <div class="flex items-center gap-2 text-lg font-bold text-primary">
              <img src="/images/logo/logo.png" alt="Cá nhà biển" class="size-8 object-contain">
              Cá nhà biển
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
              <li class="flex items-center gap-2">
                <UIcon name="i-lucide-undo-2" class="size-4 text-primary" /> Đổi trả nếu không tươi
              </li>
            </ul>
          </div>

          <div>
            <h3 class="mb-3 text-sm font-semibold text-highlighted">
              Khu vực giao hàng
            </h3>
            <p class="text-sm text-muted">
              Nội thành TP.HCM: giao trong 2 giờ.<br>
              Các tỉnh thành khác: 1-3 ngày qua đối tác vận chuyển.
            </p>
          </div>

          <div>
            <h3 class="mb-3 text-sm font-semibold text-highlighted">
              Liên hệ
            </h3>
            <ul class="space-y-2 text-sm text-muted">
              <li class="flex items-center gap-2">
                <UIcon name="i-lucide-phone" class="size-4" /> 1900 1234
              </li>
              <li class="flex items-center gap-2">
                <UIcon name="i-lucide-mail" class="size-4" /> hotro@fiship.vn
              </li>
              <li class="flex items-center gap-2">
                <UIcon name="i-lucide-map-pin" class="size-4" /> TP. Hồ Chí Minh, Việt Nam
              </li>
            </ul>
          </div>
        </div>
      </UContainer>
    </template>

    <template #left>
      <p class="text-sm text-muted">
        © {{ year }} Cá nhà biển. All rights reserved.
      </p>
    </template>
  </UFooter>
</template>
