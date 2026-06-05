import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { config } from './config';
import { User } from '../types';

const AUTH_TOKEN_KEY = '@helpingpaws_auth';
const USER_ID_KEY = '@helpingpaws_user_id';
const USER_ROLE_KEY = '@helpingpaws_user_role';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.api.baseUrl,
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    });

    this.client.interceptors.request.use(async (req) => {
      const userId = await AsyncStorage.getItem(USER_ID_KEY);
      const userRole = await AsyncStorage.getItem(USER_ROLE_KEY);
      if (userId && userRole) {
        req.headers['X-User-ID'] = userId;
        req.headers['X-User-Role'] = userRole;
      }
      return req;
    });
  }

  async login(email: string, password: string): Promise<{ user: User }> {
    const res = await this.client.post('/api/auth/login/', { email, password });
    const { user } = res.data;
    await this.saveAuth(user);
    return { user };
  }

  async register(email: string, password: string, name: string, role: string): Promise<{ user: User }> {
    const res = await this.client.post('/api/auth/register/', { email, password, name, role });
    const { user } = res.data;
    await this.saveAuth(user);
    return { user };
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/api/auth/logout/');
    } finally {
      await this.clearAuth();
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const userId = await AsyncStorage.getItem(USER_ID_KEY);
    if (!userId) return null;

    try {
      const res = await this.client.get('/api/auth/me/');
      return res.data.user;
    } catch {
      await this.clearAuth();
      return null;
    }
  }

  private async saveAuth(user: User): Promise<void> {
    await AsyncStorage.setItem(USER_ID_KEY, String(user.id));
    await AsyncStorage.setItem(USER_ROLE_KEY, user.role);
  }

  private async clearAuth(): Promise<void> {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    await AsyncStorage.removeItem(USER_ID_KEY);
    await AsyncStorage.removeItem(USER_ROLE_KEY);
    await Keychain.resetGenericPassword();
  }

  async isAuthenticated(): Promise<boolean> {
    const userId = await AsyncStorage.getItem(USER_ID_KEY);
    return !!userId;
  }

  get clientInstance(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient();
export default apiClient;