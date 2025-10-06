import UserModel, { CreateUserData } from '../models/User';
import { hashPassword, comparePassword, validatePassword } from '../utils/password';
import { generateToken, generateRandomToken } from '../utils/jwt';
import { sendVerificationEmail, sendPasswordResetEmail } from './emailService';

interface RegisterResult {
  success: boolean;
  message: string;
  userId?: number;
}

interface LoginResult {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: number;
    email: string;
    username: string;
    full_name: string;
    email_verified: boolean;
  };
}

class AuthService {
  // Register new user
  async register(
    email: string,
    username: string,
    password: string,
    fullName: string
  ): Promise<RegisterResult> {
    try {
      // Check if email already exists
      if (await UserModel.emailExists(email)) {
        return { success: false, message: 'Email already registered' };
      }

      // Check if username already exists
      if (await UserModel.usernameExists(username)) {
        return { success: false, message: 'Username already taken' };
      }

      // Validate password strength
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return { success: false, message: passwordValidation.message || 'Invalid password' };
      }

      // Hash password
      const password_hash = await hashPassword(password);

      // Generate verification token
      const verification_token = generateRandomToken();

      // Create user
      const userData: CreateUserData = {
        email,
        username,
        password_hash,
        full_name: fullName,
        verification_token,
      };

      const userId = await UserModel.create(userData);

      // Send verification email
      await sendVerificationEmail(email, verification_token, username);

      return {
        success: true,
        message: 'Registration successful! Please check your email to verify your account.',
        userId,
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Registration failed. Please try again.' };
    }
  }

  // Login user
  async login(emailOrUsername: string, password: string): Promise<LoginResult> {
    try {
      // Find user by email or username
      let user = await UserModel.findByEmail(emailOrUsername);
      if (!user) {
        user = await UserModel.findByUsername(emailOrUsername);
      }

      if (!user) {
        return { success: false, message: 'Invalid credentials' };
      }

      // Check if user registered with Google OAuth (no password)
      if (!user.password_hash) {
        return {
          success: false,
          message: 'This account was created with Google. Please sign in with Google.',
        };
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.password_hash);
      if (!isPasswordValid) {
        return { success: false, message: 'Invalid credentials' };
      }

      // Check if email is verified
      if (!user.email_verified) {
        return {
          success: false,
          message: 'Please verify your email before logging in. Check your inbox.',
        };
      }

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        username: user.username,
      });

      return {
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          full_name: user.full_name,
          email_verified: user.email_verified,
        },
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  }

  // Verify email
  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await UserModel.findByVerificationToken(token);

      if (!user) {
        return { success: false, message: 'Invalid or expired verification token' };
      }

      // Update user to mark email as verified
      await UserModel.update(user.id, {
        email_verified: true,
        verification_token: null,
      });

      return { success: true, message: 'Email verified successfully! You can now log in.' };
    } catch (error) {
      console.error('Email verification error:', error);
      return { success: false, message: 'Email verification failed. Please try again.' };
    }
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await UserModel.findByEmail(email);

      if (!user) {
        // Don't reveal if email exists for security
        return {
          success: true,
          message: 'If that email exists, a password reset link has been sent.',
        };
      }

      // Check if user registered with Google OAuth
      if (user.google_id && !user.password_hash) {
        return {
          success: false,
          message: 'This account uses Google sign-in and does not have a password.',
        };
      }

      // Generate reset token
      const reset_token = generateRandomToken();
      const expires = new Date();
      expires.setHours(expires.getHours() + 1); // Token expires in 1 hour

      // Save reset token
      await UserModel.update(user.id, {
        reset_password_token: reset_token,
        reset_password_expires: expires,
      });

      // Send reset email
      await sendPasswordResetEmail(email, reset_token, user.username);

      return {
        success: true,
        message: 'If that email exists, a password reset link has been sent.',
      };
    } catch (error) {
      console.error('Password reset request error:', error);
      return { success: false, message: 'Failed to process password reset request.' };
    }
  }

  // Reset password
  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Find user by reset token
      const user = await UserModel.findByResetToken(token);

      if (!user) {
        return { success: false, message: 'Invalid or expired reset token' };
      }

      // Validate new password
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return { success: false, message: passwordValidation.message || 'Invalid password' };
      }

      // Hash new password
      const password_hash = await hashPassword(newPassword);

      // Update password and clear reset token
      await UserModel.update(user.id, {
        password_hash,
        reset_password_token: null,
        reset_password_expires: null,
      });

      return { success: true, message: 'Password reset successful! You can now log in.' };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, message: 'Password reset failed. Please try again.' };
    }
  }

  // Google OAuth login/register
  async googleAuth(
    googleId: string,
    email: string,
    fullName: string
  ): Promise<LoginResult> {
    try {
      // Check if user exists with this Google ID
      let user = await UserModel.findByGoogleId(googleId);

      if (!user) {
        // Check if email already exists (user might have registered with email/password)
        user = await UserModel.findByEmail(email);

        if (user) {
          // Link Google account to existing user
          await UserModel.update(user.id, {
            google_id: googleId,
            email_verified: true, // Google emails are verified
          });
        } else {
          // Create new user with Google
          const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
          const userData: CreateUserData = {
            email,
            username,
            full_name: fullName,
            google_id: googleId,
          };

          const userId = await UserModel.create(userData);
          // Mark email as verified for Google users
          await UserModel.update(userId, { email_verified: true });

          user = await UserModel.findById(userId);
          if (!user) {
            return { success: false, message: 'Failed to create user' };
          }
        }
      }

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        username: user.username,
      });

      return {
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          full_name: user.full_name,
          email_verified: user.email_verified,
        },
      };
    } catch (error) {
      console.error('Google auth error:', error);
      return { success: false, message: 'Google authentication failed. Please try again.' };
    }
  }
}

export default new AuthService();
