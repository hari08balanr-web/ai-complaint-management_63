import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { memoryStore } from '../db';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'resolvedesk_default_jwt_secret_2026';

// POST /api/auth/signup
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();

    // Check if user already exists
    if (mongoose.connection.readyState === 1) {
      const existing = await User.findOne({ email: cleanEmail });
      if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = new User({
        name: cleanName,
        email: cleanEmail,
        passwordHash
      });
      await user.save();

      const token = jwt.sign(
        { userId: user._id.toString(), email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email
        }
      });
    } else {
      // Memory store fallback
      if (memoryStore.users.has(cleanEmail)) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const userObj = {
        id: userId,
        _id: userId,
        name: cleanName,
        email: cleanEmail,
        passwordHash,
        createdAt: new Date()
      };
      memoryStore.users.set(cleanEmail, userObj);
      memoryStore.persist();

      const token = jwt.sign(
        { userId, email: cleanEmail, name: cleanName },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        token,
        user: {
          id: userId,
          name: cleanName,
          email: cleanEmail
        }
      });
    }
  } catch (err: any) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    let foundUser: any = null;
    let userId = '';
    let userName = '';

    if (mongoose.connection.readyState === 1) {
      foundUser = await User.findOne({ email: cleanEmail });
      if (!foundUser) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
      userId = foundUser._id.toString();
      userName = foundUser.name;
    } else {
      foundUser = memoryStore.users.get(cleanEmail);
      if (!foundUser) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
      userId = foundUser.id;
      userName = foundUser.name;
    }

    const isMatch = await bcrypt.compare(password, foundUser.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId, email: cleanEmail, name: userName },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: userId,
        name: userName,
        email: cleanEmail
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during authentication.' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  return res.json({ user: req.user });
});

export default router;
