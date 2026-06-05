'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import {
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from '@/components/ui/field';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;
type FormData = LoginFormData | RegisterFormData;

interface AuthFormProps {
  mode: 'login' | 'register';
  onSubmit: (data: FormData) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export function AuthForm({
  mode,
  onSubmit,
  loading = false,
  error = null,
}: AuthFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const schema = mode === 'login' ? loginSchema : registerSchema;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6 w-full">
      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 sm:p-4 text-sm text-destructive border border-destructive/20 flex items-start gap-2 sm:gap-3">
          <span className="text-lg">⚠️</span>
          <div>{error}</div>
        </div>
      )}

      <FieldGroup className="gap-3 sm:gap-4">
        <FieldLabel>Email Address</FieldLabel>
        <Input
          {...register('email')}
          type="email"
          placeholder="you@example.com"
          disabled={loading}
          aria-invalid={!!errors.email}
          className={errors.email ? 'border-destructive focus-visible:ring-destructive/20 border-border' : 'border-border'}
        />
        {errors.email && (
          <FieldDescription className="text-destructive text-sm mt-1">
            {errors.email.message}
          </FieldDescription>
        )}
      </FieldGroup>

      {mode === 'register' && (
        <FieldGroup>
          <FieldLabel>Full Name</FieldLabel>
          <Input
            {...register('name')}
            type="text"
            placeholder="John Doe"
            disabled={loading}
            aria-invalid={!!(errors as any).name}
            className={(errors as any).name ? 'border-destructive focus-visible:ring-destructive/20' : 'border-border'}
          />
          {(errors as any).name && (
            <FieldDescription className="text-destructive text-sm mt-1">
              {(errors as any).name.message}
            </FieldDescription>
          )}
        </FieldGroup>
      )}

      <FieldGroup>
        <FieldLabel>Password</FieldLabel>
        <div className="relative">
          <Input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            placeholder={
              mode === 'login' ? 'Enter your password' : 'At least 8 characters'
            }
            disabled={loading}
            aria-invalid={!!errors.password}
            className={errors.password ? 'border-destructive focus-visible:ring-destructive/20 pr-10' : 'border-border pr-10'}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <FieldDescription className="text-destructive text-sm mt-1">
            {errors.password.message}
          </FieldDescription>
        )}
      </FieldGroup>

      {mode === 'register' && (
        <FieldGroup>
          <FieldLabel>Confirm Password</FieldLabel>
          <div className="relative">
            <Input
              {...register('confirmPassword')}
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              disabled={loading}
            aria-invalid={!!(errors as any).confirmPassword}
            className={(errors as any).confirmPassword ? 'border-destructive focus-visible:ring-destructive/20 pr-10' : 'border-border pr-10'}
          />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {'confirmPassword' in errors && errors.confirmPassword && (
            <FieldDescription className="text-destructive text-sm mt-1">
              {errors.confirmPassword.message}
            </FieldDescription>
          )}
        </FieldGroup>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {mode === 'login' ? 'Signing in...' : 'Creating account...'}
          </>
        ) : mode === 'login' ? (
          'Sign In'
        ) : (
          'Create Account'
        )}
      </Button>
    </form>
  );
}
