import User from '../models/User.js';
import State from '../models/State.js';

// Fetch user state if present or else create it
export const getUserState = async (req, res) => {
    try {
      const user = await User.findById(req.userId).populate('state');
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      if (!user.state) {
        const newState = new State();
        await newState.save();
  
        user.state = newState._id;
        await user.save();
  
        console.log(`State initialized for user ${req.userId}`);
      }
      res.json(user.state);
    } catch (error) {
      console.error('Error fetching or initializing user state:', error);
      res.status(500).json({ error: 'Failed to fetch or initialize user state' });
    }
  };

// Update user state
export const updateUserState = async (req, res) => {
  const { questionNumber, displayedContent, answers } = req.body;

  try {
    const user = await User.findById(req.userId).populate('state');
    if (!user || !user.state) {
      return res.status(404).json({ error: 'User or state not found' });
    }

    if (questionNumber !== undefined) user.state.questionNumber = questionNumber;
    if (displayedContent !== undefined) user.state.displayedContent = displayedContent;
    if (answers !== undefined) {
      user.state.answers = { ...user.state.answers, ...answers };
    }

    await user.state.save();
    res.json({ message: 'User state updated successfully', state: user.state });
  } catch (error) {
    console.error('Error updating user state:', error);
    res.status(500).json({ error: 'Failed to update user state' });
  }
};
