import express from 'express';
import { authenticateToken } from '../middleware/authenticateToken.js';
import { getUserState, updateUserState } from '../controllers/stateController.js';

const router = express.Router();

// Get or initialize current state
router.get('/', authenticateToken, getUserState);

// Update state
router.post('/', authenticateToken, updateUserState);

export default router;
