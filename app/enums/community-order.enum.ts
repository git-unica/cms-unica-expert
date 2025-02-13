export const ECommunityOrderStatus = {
  Processing: 0, // chờ xử lý
  Paid: 1, // thành công (đã thanh toán)
  Cancel: 2, // đã hủy
  Removed: 3, // đã xóa
  Refund: 4 // hoàn tiền
  //  hoàn tiền do kế toán/sale chọn khi cập nhật đơn
} as const

export const ECommunityOrderPaymentStatus = {
  NotPay: 0, // chưa thanh toán
  Paid: 1, // đã thanh toán
  Cancel: 2 // đã hủy
} as const

export const ECommunityOrderType = {
  MEMBERSHIP: 1,
  COURSE: 2,
  EVENT: 3,
  PRODUCT: 4
} as const

export const CommunityOrderTypeText = new Map([
  [ECommunityOrderType.MEMBERSHIP, 'membership'],
  [ECommunityOrderType.COURSE, 'course'],
  [ECommunityOrderType.EVENT, 'event'],
  [ECommunityOrderType.PRODUCT, 'product']
])
