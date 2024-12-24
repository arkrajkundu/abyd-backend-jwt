// routes/userDataRoutes.js
import express from 'express';
import { getUserData, createUserData } from '../controllers/userDataController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';

const router = express.Router();

router.get('/', authenticateToken, getUserData);
router.post('/', authenticateToken, createUserData);

export default router;
