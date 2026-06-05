import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../blocs/auth/auth_bloc.dart';
import '../../core/config.dart';
import '../../models/notification.dart';
import '../../services/api_service.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final ApiService _apiService = ApiService();
  List<AppNotification> _notifications = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    try {
      final data = await _apiService.getNotifications();
      setState(() {
        _notifications = data.map((e) => AppNotification.fromJson(e)).toList();
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  Future<void> _markAsRead(int id) async {
    try {
      await _apiService.markNotificationRead(id);
      setState(() {
        _notifications = _notifications.map((n) {
          if (n.id == id)
            return AppNotification(
              id: n.id,
              userId: n.userId,
              message: n.message,
              type: n.type,
              isRead: true,
              createdAt: n.createdAt,
            );
          return n;
        }).toList();
      });
    } catch (e) {
      // Silently fail
    }
  }

  Future<void> _markAllAsRead() async {
    try {
      await _apiService.markAllNotificationsRead();
      setState(() {
        _notifications = _notifications
            .map(
              (n) => AppNotification(
                id: n.id,
                userId: n.userId,
                message: n.message,
                type: n.type,
                isRead: true,
                createdAt: n.createdAt,
              ),
            )
            .toList();
      });
    } catch (e) {
      // Silently fail
    }
  }

  Color _getTypeColor(String type) {
    switch (type) {
      case 'SUCCESS':
        return AppConfig.successColor;
      case 'WARNING':
        return AppConfig.warningColor;
      case 'ERROR':
        return AppConfig.errorColor;
      default:
        return AppConfig.primaryColor;
    }
  }

  IconData _getTypeIcon(String type) {
    switch (type) {
      case 'SUCCESS':
        return Icons.check_circle;
      case 'WARNING':
        return Icons.warning;
      case 'ERROR':
        return Icons.error;
      default:
        return Icons.info;
    }
  }

  @override
  Widget build(BuildContext context) {
    final unreadCount = _notifications.where((n) => !n.isRead).length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (unreadCount > 0)
            TextButton(
              onPressed: _markAllAsRead,
              child: const Text('Mark all read'),
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _notifications.isEmpty
          ? _buildEmptyState()
          : RefreshIndicator(
              onRefresh: _loadNotifications,
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _notifications.length,
                itemBuilder: (context, index) {
                  final notification = _notifications[index];
                  return _NotificationCard(
                    notification: notification,
                    onTap: () {
                      if (!notification.isRead) {
                        _markAsRead(notification.id);
                      }
                    },
                    typeColor: _getTypeColor(notification.type),
                    typeIcon: _getTypeIcon(notification.type),
                  );
                },
              ),
            ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.notifications_none,
            size: 64,
            color: AppConfig.textSecondary.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            'No notifications yet',
            style: TextStyle(fontSize: 18, color: AppConfig.textSecondary),
          ),
        ],
      ),
    );
  }
}

class _NotificationCard extends StatelessWidget {
  final AppNotification notification;
  final VoidCallback onTap;
  final Color typeColor;
  final IconData typeIcon;

  const _NotificationCard({
    required this.notification,
    required this.onTap,
    required this.typeColor,
    required this.typeIcon,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: notification.isRead
              ? Colors.transparent
              : typeColor.withOpacity(0.5),
          width: notification.isRead ? 0 : 2,
        ),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: typeColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(typeIcon, color: typeColor, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          notification.type,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: typeColor,
                          ),
                        ),
                        if (!notification.isRead) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: typeColor,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Text(
                              'New',
                              style: TextStyle(
                                fontSize: 10,
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      notification.message,
                      style: TextStyle(
                        fontSize: 14,
                        color: AppConfig.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      DateFormat(
                        'MMM d, y h:mm a',
                      ).format(DateTime.parse(notification.createdAt)),
                      style: TextStyle(
                        fontSize: 12,
                        color: AppConfig.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
