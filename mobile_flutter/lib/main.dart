import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'core/config.dart';
import 'core/theme.dart';
import 'services/api_service.dart';
import 'blocs/auth/auth_bloc.dart';
import 'screens/login/login_screen.dart';
import 'screens/register/register_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/pets/pets_screen.dart';
import 'screens/appointments/appointments_screen.dart';
import 'screens/records/records_screen.dart';
import 'screens/live/live_screen.dart';
import 'screens/notifications/notifications_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: '.env');
  runApp(const HelpingPawsApp());
}

class HelpingPawsApp extends StatelessWidget {
  const HelpingPawsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) =>
          AuthBloc(apiService: ApiService())..add(AuthCheckRequested()),
      child: MaterialApp(
        title: 'HelpingPaws',
        theme: AppTheme.lightTheme,
        debugShowCheckedModeBanner: false,
        home: BlocBuilder<AuthBloc, AuthState>(
          builder: (context, state) {
            if (state is AuthLoading || state is AuthInitial) {
              return const Scaffold(
                body: Center(child: CircularProgressIndicator()),
              );
            }
            if (state is AuthAuthenticated) {
              return const HomeScreen();
            }
            return const LoginScreen();
          },
        ),
        onGenerateRoute: (settings) {
          switch (settings.name) {
            case '/login':
              return MaterialPageRoute(builder: (_) => const LoginScreen());
            case '/register':
              return MaterialPageRoute(builder: (_) => const RegisterScreen());
            case '/home':
              return MaterialPageRoute(builder: (_) => const HomeScreen());
            case '/pets':
              return MaterialPageRoute(builder: (_) => const PetsScreen());
            case '/appointments':
              return MaterialPageRoute(
                builder: (_) => const AppointmentsScreen(),
              );
            case '/records':
              return MaterialPageRoute(builder: (_) => const RecordsScreen());
            case '/live':
              return MaterialPageRoute(builder: (_) => const LiveScreen());
            case '/notifications':
              return MaterialPageRoute(
                builder: (_) => const NotificationsScreen(),
              );
            default:
              return MaterialPageRoute(builder: (_) => const LoginScreen());
          }
        },
      ),
    );
  }
}
