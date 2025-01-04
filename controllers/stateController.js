import User from '../models/User.js';
import State from '../models/State.js';

const defaultState = {
    questionNumber: 0,
    displayedContent: [
      `<br><br><p align="center" style="margin-bottom: 0.14in; border: none; padding: 0in; margin-top:3cm;"><u><b>PRIVACY POLICY</b></u></p>
      <p align="center" style="margin-bottom: 0.14in; border: none; padding: 0in">
      <u><b>HEADINGS</b></u></p>
      <br><br><br>
      <ol style="line-height: 50%; margin-left:2.5cm">
        <li><p align="justify" style="margin-bottom: 0in; border: none; padding: 0in">
        General information</p></li>
        <li><p align="justify" style="margin-bottom: 0in; border: none; padding: 0in">
        What information do we collect?</p></li>
        <li><p align="justify" style="margin-bottom: 0in; border: none; padding: 0in">
        What about more sensitive data?</p></li>
        <li><p align="justify" style="margin-bottom: 0in; border: none; padding: 0in">
        How about some technical information?</p></li>
        <li><p align="justify" style="margin-bottom: 0in; border: none; padding: 0in">
        Do we carry out any profiling or automated decision making?</p></li>
        <li><p align="justify" style="margin-bottom: 0in; border: none; padding: 0in">
        How we share your personal data?</p></li>
        <li><p align="justify" style="margin-bottom: 0in; border: none; padding: 0in">
        Where we store your data?</p></li>
        <li><p align="justify" style="margin-bottom: 0in; border: none; padding: 0in">
        Security! Security! Security!</p></li>
        <li><p align="justify" style="margin-bottom: 0in; border: none; padding: 0in">
        What about third parties referred on our platforms?</p></li>
        <li><p align="justify" style="margin-bottom: 0in; border: none; padding: 0in">
        Sharing aggregate and anonymized data</p></li>
        <li><p align="justify" style="margin-bottom: 0in; border: none; padding: 0in">
        How long we keep your information</p></li>
        <li><p align="justify" style="margin-bottom: 0in; border: none; padding: 0in">
        Sale of personal data</p></li>
        <li><p align="justify" style="margin-bottom: 0in; border: none; padding: 0in">
        Children’s privacy</p></li>
        <li><p align="justify" style="margin-bottom: 0in; border: none; padding: 0in">
        Your data, Your rights</p></li>
        <li><p align="justify" style="margin-bottom: 0.14in; border: none; padding: 0in">
        What about changes to this policy?</p></li>
        <li><p align="justify" style="margin-bottom: 0.14in; border: none; padding: 0in">
        Whom to contact in case of grievance?</p></li>
      </ol>
      <div style="break-after:page"></div>
      <p align="center" style="margin-bottom: 0.14in; border: none; padding: 0in; margin-top:3cm">
      <u><b>PRIVACY POLICY</b></u></p>
      <p align="justify" style="margin-bottom: 0.14in; border: none; padding: 0in">
      <br/>
      <br/>
      
      </p>
      <p align="justify" style="margin-bottom: 0.14in; border: none; padding: 0in; margin-left:2cm">
      <u><b>General Information</b></u></p>`
    ],
    answers: {}
  };
  
  // Fetch user state if present or create a new one with defaultState
  export const getUserState = async (req, res) => {
    try {
      const user = await User.findById(req.userId).populate('state');
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      if (!user.state) {
        const newState = new State(defaultState);
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
