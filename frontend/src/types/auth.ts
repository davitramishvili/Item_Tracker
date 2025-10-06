export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  email_verified: boolean;
}

export interface AuthResponse {
  message: string;
  token?: string;
  user?: User;
  userId?: number;
}

export interface LoginCredentials {
  emailOrUsername: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  full_name: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}
