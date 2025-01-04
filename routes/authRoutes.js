import express from 'express';
import { registerUser, loginUser, getUserData, updateUserProfile, verifyToken } from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', registerUser);
router.post('/login', loginUser);
router.get('/get-user-data', getUserData);
// router.get('/profile', verifyToken, getUserProfile);
router.put('/profile', verifyToken, updateUserProfile);

export default router;
