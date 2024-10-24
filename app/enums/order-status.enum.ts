export const OrderStatus = {
  Processing: 0, // chờ xử lý
  Paid: 1, // kích hoạt (đã thanh toán)
  Cancel: 2, // đã hủy
  PayError: 3, // thanh toán lỗi
  Refund: 4 // hoàn tiền
  // thanh toán lỗi + hoàn tiền do kế toán/sale chọn khi cập nhật đơn
} as const

export const OrderPaymentStatus = {
  NotPay: 0, // chưa thanh toán
  Paid: 1, // đã thanh toán
  Cancel: 2 // đã hủy
} as const
