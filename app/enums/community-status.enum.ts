export const ECommunityStatus = {
  Private: 0,
  Public: 1,
  NotActivated: 2
} as const

export const LabelCommunityStatus = {
  [ECommunityStatus.Private]: 'Nhóm kín',
  [ECommunityStatus.Public]: 'Công khai',
  [ECommunityStatus.NotActivated]: 'Chưa kích hoạt'
}
