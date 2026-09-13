<script setup lang="ts">
useSeoMeta({
  title: 'Chính sách - Cá Nhà Biển',
  description: 'Chính sách giao hàng của Cá Nhà Biển.',
})
useCanonical('/policy')
</script>

<template>
  <UContainer class="py-12">
    <div class="mx-auto max-w-2xl space-y-10">
      <h1 class="text-2xl font-bold text-highlighted">
        Chính sách
      </h1>

      <section id="giao-hang" class="scroll-mt-20 space-y-3">
        <h2 class="text-lg font-semibold text-highlighted">
          Chính sách giao hàng
        </h2>
        <div class="space-y-2 text-sm text-muted">
          <p>Giao hàng tận nơi tại TP.HCM và các tỉnh thành lân cận qua đối tác vận chuyển; thời gian giao hàng cụ thể sẽ được xác nhận khi đặt hàng.</p>
          <p>
            Đơn hàng dưới 500.000đ chịu phí giao hàng theo khu vực; đơn hàng từ 500.000đ trở lên được
            miễn phí giao hàng.
          </p>
          <p>Hải sản được đóng gói cách nhiệt, giữ lạnh trong suốt quá trình vận chuyển.</p>
        </div>
      </section>
    </div>
  </UContainer>
</template>
