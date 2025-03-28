export const SubscriptionStatus = {
  Pending: 0, // chờ xử lý
  Active: 1, // thành công
  Fail: 2, // thất bại,
  Cancel: 3 // user hủy
} as const

export const SubscriptionOrderType = {
  Member: 0,
  Course: 1,
  Software: 2
} as const
