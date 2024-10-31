export const OrderStatus = {
  Processing: 0, // chờ xử lý
  Paid: 1, // thành công (đã thanh toán)
  Cancel: 2, // đã hủy
  Removed: 3, // đã xóa
  Refund: 4 // hoàn tiền
  //  hoàn tiền do kế toán/sale chọn khi cập nhật đơn
} as const

export const OrderPaymentStatus = {
  NotPay: 0, // chưa thanh toán
  Paid: 1, // đã thanh toán
  Cancel: 2 // đã hủy
} as const
