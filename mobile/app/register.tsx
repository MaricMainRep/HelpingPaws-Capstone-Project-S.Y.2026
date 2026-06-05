import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { Button } from '../src/components/ui/Button';
import { Input } from '../src/components/ui/Input';
import { config } from '../src/lib/config';
import { PawPrint, User, Stethoscope } from 'lucide-react-native';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, loading, error } = useAuth();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'PET_OWNER' | 'STAFF' | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setLocalError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }
    if (!role) {
      setLocalError('Please select a role');
      return;
    }
    setLocalError('');
    try {
      await register(email.trim(), password, name.trim(), role);
      router.replace('/(tabs)');
    } catch (err: any) {
      setLocalError(err.response?.data?.error || 'Registration failed');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <PawPrint size={48} color={config.colors.primary} />
            </View>
            <Text style={styles.title}>HelpingPaws</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.formTitle}>Create Account</Text>

            {step === 1 ? (
              <>
                <Text style={styles.sectionTitle}>I am a...</Text>
                <View style={styles.roleContainer}>
                  <TouchableOpacity
                    style={[styles.roleCard, role === 'PET_OWNER' && styles.roleCardSelected]}
                    onPress={() => setRole('PET_OWNER')}
                  >
                    <User size={32} color={role === 'PET_OWNER' ? '#fff' : config.colors.primary} />
                    <Text style={[styles.roleText, role === 'PET_OWNER' && styles.roleTextSelected]}>
                      Pet Owner
                    </Text>
                    <Text style={styles.roleDesc}>Book appointments for my pets</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.roleCard, role === 'STAFF' && styles.roleCardSelected]}
                    onPress={() => setRole('STAFF')}
                  >
                    <Stethoscope size={32} color={role === 'STAFF' ? '#fff' : config.colors.primary} />
                    <Text style={[styles.roleText, role === 'STAFF' && styles.roleTextSelected]}>
                      Staff
                    </Text>
                    <Text style={styles.roleDesc}>Work at the clinic</Text>
                  </TouchableOpacity>
                </View>

                <Button
                  title="Continue"
                  onPress={() => setStep(2)}
                  disabled={!role}
                />
              </>
            ) : (
              <>
                {(localError || error) && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{localError || error}</Text>
                  </View>
                )}

                <Input
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />

                <Input
                  label="Email"
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Input
                  label="Password"
                  placeholder="Create a password (min 8 characters)"
                  value={password}
                  onChangeText={setPassword}
                  isPassword
                />

                <Input
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  isPassword
                />

                <View style={styles.buttonRow}>
                  <Button
                    title="Back"
                    onPress={() => setStep(1)}
                    variant="outline"
                    style={styles.backButton}
                  />
                  <Button
                    title={loading ? '' : 'Sign Up'}
                    onPress={handleRegister}
                    loading={loading}
                    style={styles.signupButton}
                  />
                </View>
              </>
            )}

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f5f3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: config.colors.primary,
  },
  form: {
    backgroundColor: '#fff',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 16,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  roleCard: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  roleCardSelected: {
    borderColor: config.colors.primary,
    backgroundColor: config.colors.primary,
  },
  roleText: {
    fontSize: 16,
    fontWeight: '600',
    color: config.colors.primary,
    marginTop: 8,
  },
  roleTextSelected: {
    color: '#fff',
  },
  roleDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: config.colors.error,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: config.colors.error,
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
  },
  signupButton: {
    flex: 1,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
    color: config.colors.primary,
  },
});