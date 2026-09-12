<script setup lang="ts">
useSeoMeta({
  title: 'Giới thiệu - Cá Nhà Biển',
  description: 'Cá Nhà Biển - cá tươi, hải sản tươi sống đánh bắt trong ngày, giao tận nhà mỗi sáng.',
})
useCanonical('/about')
</script>

<template>
  <UContainer class="py-12">
    <div class="mx-auto max-w-2xl">
      <h1 class="mb-6 text-2xl font-bold text-highlighted">
        Giới thiệu về Cá Nhà Biển
      </h1>

      <div class="space-y-4 text-sm text-muted">
        <p>
          Cá Nhà Biển ra đời với mong muốn mang cá và hải sản tươi ngon nhất, đánh bắt trong ngày, đến thẳng bữa cơm
          của mỗi gia đình Việt — không qua trung gian, không mất đi độ tươi.
        </p>
        <p>
          Chúng tôi làm việc trực tiếp với ngư dân và các đầu mối hải sản uy tín, kiểm soát chặt chẽ quy trình
          bảo quản lạnh từ lúc đánh bắt đến khi giao hàng, để mỗi con cá đến tay khách hàng vẫn giữ được độ
          tươi và dinh dưỡng tốt nhất.
        </p>

        <h2 class="pt-4 font-semibold text-highlighted">
          Cam kết của chúng tôi
        </h2>
        <ul class="space-y-2">
          <li class="flex items-center gap-2">
            <UIcon name="i-lucide-badge-check" class="size-4 text-primary" /> Cá tươi trong ngày, không đông lạnh lâu ngày
          </li>
          <li class="flex items-center gap-2">
            <UIcon name="i-lucide-snowflake" class="size-4 text-primary" /> Bảo quản lạnh đạt chuẩn suốt quá trình vận chuyển
          </li>
        </ul>

        <h2 class="pt-4 font-semibold text-highlighted">
          Khu vực giao hàng
        </h2>
        <p>
          Giao hàng tận nơi tại TP.HCM và các tỉnh thành lân cận qua đối tác vận chuyển.
        </p>
      </div>

      <UButton to="/products" class="mt-8">
        Khám phá sản phẩm
      </UButton>
    </div>
  </UContainer>
</template>
