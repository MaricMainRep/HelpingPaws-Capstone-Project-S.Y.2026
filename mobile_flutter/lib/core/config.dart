import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConfig {
  static String supabaseUrl = dotenv.env['SUPABASE_URL'] ?? '';
  static String supabaseAnonKey = dotenv.env['SUPABASE_ANON_KEY'] ?? '';
  static String apiBaseUrl =
      dotenv.env['API_BASE_URL'] ?? 'http://localhost:8000';

  static const Color primaryColor = Color(0xFF3A7D6C);
  static const Color secondaryColor = Color(0xFF57AA95);
  static const Color backgroundColor = Color(0xFFF8FAFC);
  static const Color surfaceColor = Color(0xFFFFFFFF);
  static const Color errorColor = Color(0xFFEF4444);
  static const Color warningColor = Color(0xFFF59E0B);
  static const Color successColor = Color(0xFF22C55E);
  static const Color textPrimary = Color(0xFF1E293B);
  static const Color textSecondary = Color(0xFF64748B);
  static const Color borderColor = Color(0xFFE2E8F0);
}

class AppConstants {
  static const String appName = 'HelpingPaws';
  static const String userIdKey = 'user_id';
  static const String userRoleKey = 'user_role';
}
