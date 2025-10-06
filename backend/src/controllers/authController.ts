import { Request, Response } from 'express';
import authService from '../services/authService';
import {
  registerSchema,
  loginSchema,
  emailSchema,
  resetPasswordSchema,
} from '../utils/validation';

// Register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const { error } = registerSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const { email, username, password, full_name } = req.body;

    const result = await authService.register(email, username, password, full_name);

    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }

    res.status(201).json({
      message: result.message,
      userId: result.userId,
    });
  } catch (error) {
    console.error('Register controller error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const { error } = loginSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const { emailOrUsername, password } = req.body;

    const result = await authService.login(emailOrUsername, password);

    if (!result.success) {
      res.status(401).json({ error: result.message });
      return;
    }

    res.status(200).json({
      message: result.message,
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error('Login controller error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Verify email
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).json({ error: 'Verification token is required' });
      return;
    }

    const result = await authService.verifyEmail(token);

    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }

    res.status(200).json({ message: result.message });
  } catch (error) {
    console.error('Verify email controller error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Request password reset
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const { error } = emailSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const { email } = req.body;

    const result = await authService.requestPasswordReset(email);

    res.status(200).json({ message: result.message });
  } catch (error) {
    console.error('Forgot password controller error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Reset password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const { error } = resetPasswordSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const { token, password } = req.body;

    const result = await authService.resetPassword(token, password);

    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }

    res.status(200).json({ message: result.message });
  } catch (error) {
    console.error('Reset password controller error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Logout (client-side will remove token, but we can add blacklist logic later)
export const logout = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({ message: 'Logout successful' });
};
