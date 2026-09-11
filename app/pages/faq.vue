<script setup lang="ts">
const items = [
  {
    label: 'Cá và hải sản có thực sự tươi trong ngày không?',
    content: 'Có. Cá nhà biển làm việc trực tiếp với ngư dân và đầu mối hải sản, cá được đánh bắt và giao tới khách hàng trong cùng ngày, bảo quản lạnh đạt chuẩn xuyên suốt.',
  },
  {
    label: 'Tôi có thể đặt hàng mà không cần đăng ký tài khoản không?',
    content: 'Có. Bạn có thể đặt hàng với tư cách khách vãng lai và tra cứu đơn hàng qua đường dẫn được gửi sau khi đặt. Đăng ký tài khoản giúp bạn lưu địa chỉ, theo dõi lịch sử đơn hàng và đánh giá sản phẩm dễ dàng hơn.',
  },
  {
    label: 'Phí giao hàng được tính như thế nào?',
    content: 'Đơn hàng từ 500.000đ được miễn phí giao hàng, dưới mức này áp dụng phí theo khu vực. Thời gian giao hàng cụ thể sẽ được xác nhận khi đặt hàng.',
  },
  {
    label: 'Tôi có thể thanh toán bằng hình thức nào?',
    content: 'Hiện tại Cá nhà biển hỗ trợ thanh toán khi nhận hàng (COD). Các hình thức thanh toán trực tuyến VNPay, MoMo, ZaloPay sẽ sớm được ra mắt.',
  },
  {
    label: 'Nếu sản phẩm không tươi hoặc giao sai thì sao?',
    content: 'Vui lòng phản ánh trong vòng 2 giờ kể từ lúc nhận hàng qua hotline hoặc email hỗ trợ, Cá nhà biển sẽ đổi sản phẩm mới hoặc hoàn tiền tương ứng. Xem chi tiết tại trang Chính sách đổi trả.',
  },
  {
    label: 'Làm sao để áp dụng mã giảm giá?',
    content: 'Tại trang thanh toán, nhập mã giảm giá vào ô "Mã giảm giá" và nhấn Áp dụng trước khi đặt hàng.',
  },
]

useSeoMeta({
  title: 'Câu hỏi thường gặp - Cá nhà biển',
  description: 'Giải đáp các câu hỏi thường gặp khi mua sắm tại Cá nhà biển.',
})
useCanonical('/faq')
</script>

<template>
  <UContainer class="py-12">
    <div class="mx-auto max-w-2xl">
      <h1 class="mb-6 text-2xl font-bold text-highlighted">
        Câu hỏi thường gặp
      </h1>
      <UAccordion :items="items" />
    </div>
  </UContainer>
</template>
