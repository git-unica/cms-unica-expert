export const ECommunityPackageCode = {
  All: 'all',
  START: 'START',
  VIP: 'VIP',
  PRO: 'PRO'
} as const

export const LabelCommunityPackageCode = {
  [ECommunityPackageCode.All]: 'Tất cả',
  [ECommunityPackageCode.START]: 'START',
  [ECommunityPackageCode.VIP]: 'VIP',
  [ECommunityPackageCode.PRO]: 'PRO'
}
