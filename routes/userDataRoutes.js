import express from 'express';
import { getUserData, createUser } from '../controllers/userDataController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';

const router = express.Router();

// Route to get user data, requires authentication
router.get('/:email', authenticateToken, getUserData);

// Route to create a new user, requires authentication
router.post('/', authenticateToken, createUser);

export default router;
