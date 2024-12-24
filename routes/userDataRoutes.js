import express from 'express';
import { getUserData, createUser, getQuestions, deleteUser, getUserChecklist, setChecklist } from '../controllers/userDataController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';

const router = express.Router();

router.get('/:email', authenticateToken, getUserData);
router.post('/', authenticateToken, createUser);
router.get('/:email/checklist', authenticateToken, getUserChecklist); // getChecklist
router.put('/:email/checklist', authenticateToken, setChecklist); // setChecklist
router.delete('/:email', authenticateToken, deleteUser);

export default router;