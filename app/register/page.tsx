'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AuthForm } from '@/components/auth/AuthForm';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { Shield, Heart, Check, ArrowLeft } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

type Role = 'STAFF' | 'PET_OWNER';

const roleOptions = [
  {
    value: 'PET_OWNER',
    label: 'Pet Owner',
    description: 'Book appointments and view your pet information',
    icon: Heart,
  },
  {
    value: 'STAFF',
    label: 'Veterinary Staff',
    description: 'Manage appointments, health records, and pet care',
    icon: Shield,
  },
];

const benefits = [
  'Easy appointment scheduling',
  'Access to pet health records',
  'Real-time notifications',
  'Live camera monitoring',
  'Medication reminders',
];

export default function RegisterPage() {
  const [step, setStep] = useState<'role' | 'form'>('role');
  const [selectedRole, setSelectedRole] = useState<Role>('PET_OWNER');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRegister(data: any) {
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          role: selectedRole,
        }),
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error('Registration failed', { description: result.error || 'Could not create account' });
        setLoading(false);
        return;
      }

      toast.success('Account created', { description: 'Redirecting to dashboard...' });
      window.location.href = '/dashboard';
    } catch (err) {
      toast.error('Registration failed', { 
        description: err instanceof Error ? err.message : 'An unexpected error occurred' 
      });
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Benefits */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#3a7d6c] to-[#57aa95] p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white" />
          <div className="absolute bottom-40 right-20 w-96 h-96 rounded-full bg-white" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-white" />
        </div>

        {/* Logo */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                <Image
                  src="/icon.png"
                  alt="HelpingPaws Logo"
                  fill
                  className="object-contain p-1"
                />
              </div>
            <div>
              <h1 className="text-3xl font-bold text-white">HelpingPaws</h1>
              <p className="text-white/80 text-sm">Veterinary Clinic Management</p>
            </div>
          </div>
        </div>

        {/* Benefits Content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight">
              Join thousands of<br />
              <span className="text-white/90">happy pet owners.</span>
            </h2>
            <p className="mt-4 text-white/80 text-lg max-w-md">
              Create your free account and experience the best way to manage your pet&apos;s healthcare.
            </p>
          </div>

          {/* Benefits List */}
          <div className="space-y-3">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-white/90">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-white/60 text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-white font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      </div>

      {/* Right Panel - Registration Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-muted">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
              <Image
                src="/icon.png"
                alt="HelpingPaws Logo"
                fill
                className="object-contain p-1"
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">HelpingPaws</h1>
            <p className="text-muted-foreground text-sm">Veterinary Clinic Management</p>
          </div>

          {step === 'role' ? (
            <>
              {/* Form Header */}
              <div className="text-center">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">Create an account</h2>
                <p className="text-muted-foreground mt-2 text-sm sm:text-base">Choose how you want to use HelpingPaws</p>
              </div>

              {/* Role Selection */}
              <div className="bg-card border border-border rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-6 lg:p-8 space-y-3 sm:space-y-4">
                {roleOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedRole(option.value as Role)}
                    className={`w-full p-3 sm:p-4 rounded-xl border-2 transition-all text-left flex items-center gap-3 sm:gap-4 ${
                      selectedRole === option.value
                        ? 'border-[#3a7d6c] bg-[#3a7d6c]/5'
                        : 'border-border hover:border-[#3a7d6c]/30'
                    }`}
                  >
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${
                      selectedRole === option.value
                        ? 'bg-[#3a7d6c]'
                        : 'bg-muted'
                    }`}>
                      <option.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${
                        selectedRole === option.value
                          ? 'text-white'
                          : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground text-sm sm:text-base">
                        {option.label}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground truncate">
                        {option.description}
                      </div>
                    </div>
                    {selectedRole === option.value && (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#3a7d6c] flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}

                <Button
                  onClick={() => setStep('form')}
                  className="w-full"
                  size="lg"
                >
                  Continue
                </Button>

                {/* Back to Login */}
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 text-center text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to login
                </Link>
              </div>

              {/* Sign In Link */}
              <p className="text-center text-sm text-muted-foreground lg:hidden">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-[#3a7d6c] hover:text-[#57aa95] transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </>
          ) : (
            <>
              {/* Form Header */}
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground">Complete registration</h2>
                <p className="text-muted-foreground mt-2">
                  Registering as{' '}
                  <span className="font-semibold text-foreground">
                    {roleOptions.find((r) => r.value === selectedRole)?.label}
                  </span>
                </p>
              </div>

              {/* Auth Form */}
              <div className="bg-card border border-border rounded-2xl shadow-sm p-6 sm:p-8">
                <AuthForm
                  mode="register"
                  onSubmit={handleRegister}
                  loading={loading}
                />

                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => setStep('role')}
                    className="w-full text-center text-primary hover:text-primary/80 text-sm font-semibold transition-colors"
                  >
                    ← Back to role selection
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
