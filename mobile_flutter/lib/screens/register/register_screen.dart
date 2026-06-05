import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../blocs/auth/auth_bloc.dart';
import '../../core/config.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_input.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  int _step = 1;
  String? _role;
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _handleRegister() {
    if (_nameController.text.isEmpty ||
        _emailController.text.isEmpty ||
        _passwordController.text.isEmpty ||
        _confirmPasswordController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill in all fields')),
      );
      return;
    }
    if (_passwordController.text != _confirmPasswordController.text) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Passwords do not match')));
      return;
    }
    if (_role == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Please select a role')));
      return;
    }

    context.read<AuthBloc>().add(
      AuthRegisterRequested(
        email: _emailController.text.trim(),
        password: _passwordController.text,
        name: _nameController.text.trim(),
        role: _role!,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create Account')),
      body: BlocListener<AuthBloc, AuthState>(
        listener: (context, state) {
          if (state is AuthError) {
            ScaffoldMessenger.of(
              context,
            ).showSnackBar(SnackBar(content: Text(state.message)));
          } else if (state is AuthAuthenticated) {
            Navigator.pushReplacementNamed(context, '/home');
          }
        },
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: _step == 1 ? _buildStep1() : _buildStep2(),
          ),
        ),
      ),
    );
  }

  Widget _buildStep1() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'I am a...',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
        ),
        const SizedBox(height: 16),
        GestureDetector(
          onTap: () => setState(() => _role = 'PET_OWNER'),
          child: Card(
            color: _role == 'PET_OWNER'
                ? AppConfig.primaryColor.withOpacity(0.1)
                : null,
            child: ListTile(
              leading: const Icon(Icons.person),
              title: const Text('Pet Owner'),
              subtitle: const Text('Book appointments for my pets'),
              trailing: _role == 'PET_OWNER'
                  ? const Icon(Icons.check_circle)
                  : null,
            ),
          ),
        ),
        const SizedBox(height: 12),
        GestureDetector(
          onTap: () => setState(() => _role = 'STAFF'),
          child: Card(
            color: _role == 'STAFF'
                ? AppConfig.primaryColor.withOpacity(0.1)
                : null,
            child: ListTile(
              leading: const Icon(Icons.medical_services),
              title: const Text('Staff'),
              subtitle: const Text('Work at the clinic'),
              trailing: _role == 'STAFF'
                  ? const Icon(Icons.check_circle)
                  : null,
            ),
          ),
        ),
        const SizedBox(height: 24),
        ElevatedButton(
          onPressed: _role != null ? () => setState(() => _step = 2) : null,
          child: const Text('Continue'),
        ),
      ],
    );
  }

  Widget _buildStep2() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        CustomInput(
          controller: _nameController,
          label: 'Full Name',
          hint: 'Enter your full name',
        ),
        const SizedBox(height: 16),
        CustomInput(
          controller: _emailController,
          label: 'Email',
          hint: 'Enter your email',
          keyboardType: TextInputType.emailAddress,
        ),
        const SizedBox(height: 16),
        CustomInput(
          controller: _passwordController,
          label: 'Password',
          hint: 'Create a password (min 8 characters)',
          obscureText: _obscurePassword,
          suffixIcon: IconButton(
            icon: Icon(
              _obscurePassword ? Icons.visibility_off : Icons.visibility,
            ),
            onPressed: () =>
                setState(() => _obscurePassword = !_obscurePassword),
          ),
        ),
        const SizedBox(height: 16),
        CustomInput(
          controller: _confirmPasswordController,
          label: 'Confirm Password',
          hint: 'Confirm your password',
          obscureText: _obscurePassword,
        ),
        const SizedBox(height: 24),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => setState(() => _step = 1),
                child: const Text('Back'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: BlocBuilder<AuthBloc, AuthState>(
                builder: (context, state) {
                  return CustomButton(
                    text: 'Sign Up',
                    onPressed: _handleRegister,
                    isLoading: state is AuthLoading,
                  );
                },
              ),
            ),
          ],
        ),
      ],
    );
  }
}
