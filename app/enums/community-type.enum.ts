export const ECommunityType = {
  Hidden: 0,
  Active: 1,
  Accepted: 2
} as const

export const LabelCommunityType = {
  [ECommunityType.Hidden]: 'Ẩn',
  [ECommunityType.Active]: 'Hoạt động',
  [ECommunityType.Accepted]: 'Đã duyệt'
}
