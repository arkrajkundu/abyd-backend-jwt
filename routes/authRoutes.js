import express from 'express';
import { registerUser, loginUser, getUserProfile, updateUserProfile, verifyToken } from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', registerUser);
router.post('/login', loginUser);
router.get('/profile', verifyToken, getUserProfile);
router.put('/profile', verifyToken, updateUserProfile);

export default router;
