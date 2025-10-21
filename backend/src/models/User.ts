import { promisePool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface User {
  id: number;
  email: string;
  username: string;
  password_hash: string | null;
  full_name: string;
  is_verified: boolean;
  verification_token: string | null;
  reset_password_token: string | null;
  reset_password_expires: Date | null;
  google_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  email: string;
  username: string;
  password_hash?: string;
  full_name: string;
  verification_token?: string;
  google_id?: string;
}

export interface UpdateUserData {
  email?: string;
  password_hash?: string;
  full_name?: string;
  is_verified?: boolean;
  verification_token?: string | null;
  reset_password_token?: string | null;
  reset_password_expires?: Date | null;
  google_id?: string;
}

class UserModel {
  // Create new user
  async create(userData: CreateUserData): Promise<number> {
    const [result] = await promisePool.query<ResultSetHeader>(
      `INSERT INTO users (email, username, password_hash, full_name, verification_token, google_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userData.email,
        userData.username,
        userData.password_hash || null,
        userData.full_name,
        userData.verification_token || null,
        userData.google_id || null,
      ]
    );
    return result.insertId;
  }

  // Find user by ID
  async findById(id: number): Promise<User | null> {
    const [rows] = await promisePool.query<User[] & RowDataPacket[]>(
      'SELECT *, email_verified as is_verified FROM users WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  // Find user by email
  async findByEmail(email: string): Promise<User | null> {
    const [rows] = await promisePool.query<User[] & RowDataPacket[]>(
      'SELECT *, email_verified as is_verified FROM users WHERE email = ?',
      [email]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  // Find user by username
  async findByUsername(username: string): Promise<User | null> {
    const [rows] = await promisePool.query<User[] & RowDataPacket[]>(
      'SELECT *, email_verified as is_verified FROM users WHERE username = ?',
      [username]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  // Find user by Google ID
  async findByGoogleId(googleId: string): Promise<User | null> {
    const [rows] = await promisePool.query<User[] & RowDataPacket[]>(
      'SELECT *, email_verified as is_verified FROM users WHERE google_id = ?',
      [googleId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  // Find user by verification token
  async findByVerificationToken(token: string): Promise<User | null> {
    const [rows] = await promisePool.query<User[] & RowDataPacket[]>(
      'SELECT *, email_verified as is_verified FROM users WHERE verification_token = ?',
      [token]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  // Find user by reset password token
  async findByResetToken(token: string): Promise<User | null> {
    const [rows] = await promisePool.query<User[] & RowDataPacket[]>(
      'SELECT *, email_verified as is_verified FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW()',
      [token]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  // Update user
  async update(id: number, userData: UpdateUserData): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(userData).forEach(([key, value]) => {
      // Map is_verified to email_verified for database column name
      const dbKey = key === 'is_verified' ? 'email_verified' : key;
      fields.push(`${dbKey} = ?`);
      values.push(value);
    });

    if (fields.length === 0) return false;

    values.push(id);

    const [result] = await promisePool.query<ResultSetHeader>(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  }

  // Delete user
  async delete(id: number): Promise<boolean> {
    const [result] = await promisePool.query<ResultSetHeader>('DELETE FROM users WHERE id = ?', [
      id,
    ]);
    return result.affectedRows > 0;
  }

  // Check if email exists
  async emailExists(email: string): Promise<boolean> {
    const [rows] = await promisePool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    return rows.length > 0;
  }

  // Check if username exists
  async usernameExists(username: string): Promise<boolean> {
    const [rows] = await promisePool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    return rows.length > 0;
  }
}

export default new UserModel();
