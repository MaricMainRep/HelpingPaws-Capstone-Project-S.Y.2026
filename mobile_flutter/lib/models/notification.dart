class AppNotification {
  final int id;
  final int userId;
  final String message;
  final String type;
  final bool isRead;
  final String createdAt;

  AppNotification({
    required this.id,
    required this.userId,
    required this.message,
    required this.type,
    required this.isRead,
    required this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] as int,
      userId: (json['user_id'] as num).toInt(),
      message: json['message'] as String,
      type: json['type'] as String? ?? 'INFO',
      isRead: json['is_read'] as bool? ?? false,
      createdAt: json['created_at'] as String,
    );
  }
}
