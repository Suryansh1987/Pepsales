import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

export const authService = {
  async register(userData) {
    try {
      const existingUser = await db.select()
        .from(users)
        .where(eq(users.email, userData.email))
        .limit(1);
      
      if (existingUser.length > 0) {
        throw new Error('User already exists');
      }
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      const newUser = await db.insert(users)
        .values({
          username: userData.username,
          email: userData.email,
          password: hashedPassword,
          phone: userData.phone
        })
        .returning();
      
      return {
        id: newUser[0].id,
        username: newUser[0].username,
        email: newUser[0].email,
        phone:newUser[0].phone
      };
    } catch (error) {
      console.error('Register error:', error.message);
      throw error;
    }
  },
  
  async login(email, password) {
    try {
      const user = await db.select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      if (user.length === 0) {
        throw new Error('Invalid credentials');
      }
      
      const isMatch = await bcrypt.compare(password, user[0].password);
      
      if (!isMatch) {
        throw new Error('Invalid credentials');
      }
      
      const payload = {
        id: user[0].id,
        username: user[0].username,
        email: user[0].email
      };
      
      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
      
      return {
        token,
        user: {
          id: user[0].id,
          username: user[0].username,
          email: user[0].email
        }
      };
    } catch (error) {
      console.error('Login error:', error.message);
      throw error;
    }
  },
  
  async getUserById(userId) {
    try {
      const user = await db.select({
        id: users.id,
        username: users.username,
        email: users.email
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
      
      if (user.length === 0) {
        throw new Error('User not found');
      }
      
      return user[0];
    } catch (error) {
      console.error('Get user error:', error.message);
      throw error;
    }
  }
};