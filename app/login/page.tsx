'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AuthForm } from '@/components/auth/AuthForm';
import { toast } from '@/lib/toast';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Shield, Calendar, Heart } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const features = [
  { icon: Calendar, label: 'Easy Scheduling', description: 'Book appointments with just a few clicks' },
  { icon: Heart, label: 'Pet Health', description: 'Keep track of vaccinations and medical records' },
  { icon: Shield, label: 'Secure Access', description: 'Your data is protected and private' },
];

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const router = useRouter();

  async function handleLogin(data: any) {
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error('Login failed', { description: result.error || 'Invalid credentials' });
        setLoading(false);
        return;
      }

      toast.success('Login successful', { description: 'Redirecting to dashboard...' });
      
      // Store auth info in localStorage as fallback
      if (result.auth_token) {
        localStorage.setItem('auth_token', result.auth_token);
        localStorage.setItem('user_id', result.user_id);
        localStorage.setItem('user_role', result.user_role);
      }
      
      setShowLoadingScreen(true);
      
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } catch (err) {
      toast.error('Login failed', { 
        description: err instanceof Error ? err.message : 'An unexpected error occurred' 
      });
      setLoading(false);
    }
  }

  return (
    <>
      <LoadingScreen show={showLoadingScreen} message="Redirecting to dashboard..." />
      <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#3a7d6c] to-[#57aa95] p-8 lg:p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white" />
          <div className="absolute bottom-40 right-20 w-96 h-96 rounded-full bg-white" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-white" />
        </div>

        {/* Logo & Tagline */}
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

        {/* Hero Content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
              Care for your pets,<br />
              <span className="text-white/90">simplified.</span>
            </h2>
            <p className="mt-4 text-white/80 text-lg max-w-md">
              The all-in-one platform for veterinary clinics and pet owners. 
              Manage appointments, health records, and more.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 gap-4">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4"
              >
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{feature.label}</h3>
                  <p className="text-white/70 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-white/60 text-sm">
          Trusted by veterinary clinics worldwide
        </div>
      </div>

      {/* Right Panel - Login Form */}
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

          {/* Form Header */}
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">Sign in to access your account</p>
          </div>

          {/* Auth Form */}
          <div className="bg-card border border-border rounded-xl sm:rounded-2xl shadow-sm p-5 sm:p-6 lg:p-8">
            <AuthForm
              mode="login"
              onSubmit={handleLogin}
              loading={loading}
            />
          </div>

          {/* Register Link */}
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="font-semibold text-[#3a7d6c] hover:text-[#57aa95] transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
      </div>
    </>
  );
}
