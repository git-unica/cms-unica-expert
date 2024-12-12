export const NotificationTypeEnum = {

  CommunityCreateSuccess: 'community_create_success', // Gửi cho user tạo cộng đồng  // Tạo cộng đồng thành công
  CommunityUserJoinSuccess: 'community_user_join_success', // Gửi cho user đòi cộng đồng  // Tham gia cộng đồng thành công
  CommunityUserJoinWaiting: 'community_user_join_waiting', // Gửi quản trị viên  cộng đồng   // Chờ duyệt tham gia cộng đồng
  CommunityUserJoinReject: 'community_user_join_reject', // Gửi cho user bị từ chối   // Bị từ chối vào cộng đồng
  // Thành viên
  CommunityMemberPayment: 'community_member_payment', // Gửi quản trị viên  cộng đồng  // Có thành viên mới thanh toán cộng đồng (cộng đồng có phí)
  CommunityMemberRemoved: 'community_member_removed', // Gửi thành viên bị xóa // Thành viên bị xóa khỏi cộng đồng
  CommunityMemberSuspended: 'community_member_suspended', // Gửi thành viên bị đình chỉ // Thành viên bị đình chỉ trong cộng đồng
  // Cộng đồng
  CommunityAdminPostNew: 'community_admin_post_new', // Gửi all thành viên cộng đồng  // Có thảo luận mới trong cộng đồng từ admin
  CommunityCommentNew: 'community_comment_new', // Gửi chủ bài viết   // Bình luận mới trên bài viết của người dùng
  CommunityMention: 'community_mention', // Gửi cho người được nhắc tới // Người dùng được nhắc đến (mention)
  CommunityPostLike: 'community_post_like', // Gửi chủ bài viết // Bài viết được thích (like)
  CommunityCommentLike: 'community_comment_like', // Gửi chủ bình luận // Bình luận được thích (like)
  CommunityPostPinned: 'community_post_pinned', // Gửi all thành viên // Bài viết được ghim
  CommunityTopicAdd: 'community_topic_add', // Gửi all thành viên cộng đồng // tạo chủ đề trong cộng đồng
  // CommunityTopicUpdate: 'community_topic_update',      //Gửi all thành viên cộng đồng // Cập nhật chủ đề trong cộng đồng
  // CommunityTopicDelete: 'community_topic_delete',      //Gửi all thành viên cộng đồng // Xóa chủ đề trong cộng đồng

  // Khóa học
  CommunityCourseStudentAccess: 'community_course_student_access', // Gửi quản trị viên  cộng đồng  // Học viên mới truy cập khóa học
  CommunityCourseNewPublic: 'community_course_new_public', // Gửi all thành viên cộng đồng  // Khóa học mới được công khai

  // Bảng xếp hạng, level
  LevelUp: 'level_up', // Gửi người dùng đc lên level mới  // Người dùng lên level mới
  LeaderboardTop10: 'leaderboard_top_10', // Gửi người dùng dc vào top 10 của bảng xếp hạng // Người dùng vào top 10 của bảng xếp hạng

  // Thông báo cho admins của cộng đồng sau khi hệ thống duyệt đơn
  CommunityOwnerApprovedOrder: 'community_owner_approved_order',

  // thông báo sự kiện sắp diễn ra
  UpcomingEvent: 'upcoming_event',

  // Thông báo cho chủ cộng đồng (đang sử dụng gói PRO/VIP) gói phần mềm cộng đồng đang dùng sắp hết hạn (rule: 7,3,1 ngày trước ngày hết hạn)
  CommunityOwnerCommunityPackageAboutExpire: 'community_owner_community_package_about_expire',

  NewOrderForAdmin: 'new_order_for_admin',
  SalesApprovesOrders: 'sales_approves_orders'
} as const
