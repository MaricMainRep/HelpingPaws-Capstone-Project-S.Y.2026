class User {
  final int id;
  final String email;
  final String name;
  final String role;
  final bool isActive;
  final DateTime? createdAt;

  User({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    required this.isActive,
    this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: (json['id'] as num).toInt(),
      email: (json['email'] as String?) ?? '',
      name: (json['name'] as String?) ?? 'Unknown',
      role: (json['role'] as String?) ?? 'PET_OWNER',
      isActive: json['is_active'] as bool? ?? true,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'role': role,
      'is_active': isActive,
    };
  }

  bool get isPetOwner => role == 'PET_OWNER';
  bool get isStaff => role == 'STAFF';
  bool get isAdmin => role == 'ADMIN';
}
