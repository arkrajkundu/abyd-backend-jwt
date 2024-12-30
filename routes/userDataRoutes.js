import express from 'express';
import {
  getUserData,
  createUser,
  getQuestions,
  deleteUser,
  getUserChecklist,
  setChecklist,
  setQuestions,
  nextQuestion,
  prevQuestion
} from '../controllers/userDataController.js';
import { getUserStats, setUserStats, deleteUserStats } from '../controllers/userDataController.js';
import { authenticateToken } from '../middleware/authenticateToken.js';

const router = express.Router();

// User creation and data fetching routes
router.get('/:email', authenticateToken, getUserData);
router.post('/', authenticateToken, createUser);
router.get('/:email/checklist', authenticateToken, getUserChecklist); // getChecklist
router.put('/:email/checklist', authenticateToken, setChecklist); // setChecklist
router.delete('/:email', authenticateToken, deleteUser);

// Get user stats
router.get('/:email/userStats', getUserStats);

// Set (update) user stats
router.put('/:email/userStats', setUserStats);

// Delete user stats
router.delete('/:email/userStats', deleteUserStats);

// Set (update) question data - new route
router.put('/:email/setQuestions', authenticateToken, setQuestions);

// Get next question - new route
router.put('/:email/nextQuestion', authenticateToken, nextQuestion);

// Get previous question - new route
router.put('/:email/prevQuestion', authenticateToken, prevQuestion);

export default router;