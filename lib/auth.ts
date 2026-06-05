import bcrypt from 'bcryptjs';
import { supabase } from './supabase';
import type { User } from './supabase';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function registerUser(
  email: string,
  password: string,
  name: string,
  role: 'ADMIN' | 'STAFF' | 'PET_OWNER'
): Promise<{ user: User; error: null } | { user: null; error: string }> {
  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return { user: null, error: 'Email already in use' };
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          password_hash: passwordHash,
          name,
          role,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      return { user: null, error: error.message };
    }

    // Create role-specific profile
    if (role === 'STAFF') {
      await supabase.from('staff').insert([
        {
          user_id: newUser.id,
          is_available: true,
        },
      ]);
    } else if (role === 'PET_OWNER') {
      await supabase.from('pet_owners').insert([
        {
          user_id: newUser.id,
        },
      ]);
    }

    return { user: newUser, error: null };
  } catch (err) {
    return {
      user: null,
      error: err instanceof Error ? err.message : 'Registration failed',
    };
  }
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ user: User; error: null } | { user: null; error: string }> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return { user: null, error: 'Invalid email or password' };
    }

    if (!user.is_active) {
      return { user: null, error: 'Account is disabled' };
    }

    const isPasswordValid = await verifyPassword(password, user.password_hash);

    if (!isPasswordValid) {
      return { user: null, error: 'Invalid email or password' };
    }

    return { user, error: null };
  } catch (err) {
    return {
      user: null,
      error: err instanceof Error ? err.message : 'Login failed',
    };
  }
}

export async function getUserById(id: number): Promise<User | null> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !user) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export async function updateUserProfile(
  userId: number,
  updates: Partial<User>
): Promise<{ user: User | null; error: string | null }> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return { user: null, error: error.message };
    }

    return { user, error: null };
  } catch (err) {
    return {
      user: null,
      error: err instanceof Error ? err.message : 'Update failed',
    };
  }
}
