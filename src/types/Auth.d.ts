export interface User {
  id: string;
  email: string;
  name: string;
  role: 'agency' | 'user';
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
}

export interface SignUpData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  role: 'agency' | 'user';
}

export interface SignInData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}