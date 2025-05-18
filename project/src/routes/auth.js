import express from 'express';
import { authService } from '../services/auth.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();


router.post('/register', async (req, res) => {
  try {
    const { username, email, password,phone } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Missing fields!' });
    }
    
    const newUser = await authService.register({ username, email, password,phone });
    
    res.status(201).json({
      success: true,
      message: 'User created!',
      data: newUser
    });
  } catch (error) {
    console.error('Register route error:', error);
    
    if (error.message === 'User already exists') {
      return res.status(400).json({
        success: false,
        message: 'User exists already!'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Register failed!'
    });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Need email and password!' });
    }
    
    const authData = await authService.login(email, password);
    
    res.status(200).json({
      success: true,
      message: 'Login ok!',
      token: authData.token,
      user: authData.user
    });
  } catch (error) {
    console.error('Login route error:', error);
    
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({
        success: false,
        message: 'Wrong credentials!'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Login failed!'
    });
  }
});


router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get user!'
    });
  }
});

export default router;