import User from '../models/User.js';
import { getQuestionData, updateBitString, checkCriteria, getQuestionIndex, skipQuestion } from '../questionsData.js';
import { generateReport } from '../generateReport.js';
import { generateRandomStrings } from '../utils.js';

// Create a new user
export const createUser = async (req, res) => {
  const { email_id, company, industry, sub_industry } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email_id });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user with initial data
    const newUser = new User({
      email_id,
      company,
      industry,
      sub_industry,
      question_no: 1,
      bit_string: '0',  // Initialize bit_string
      guidelines: [],
      practices: [],
      certifications: [],
      documents: []
    });

    await newUser.save();
    res.status(201).json({ message: "User created successfully", user: newUser });
  } catch (error) {
    console.error("Error in createUser:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a user
export const deleteUser = async (req, res) => {
  const { email } = req.params;

  try {
    const result = await User.deleteOne({ email_id: email });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error in deleteUser:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user data
export const getUserData = async (req, res) => {
  const { email } = req.params;

  try {
    const userData = await User.findOne({ email_id: email });
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user: userData });
  } catch (error) {
    console.error("Error in getUserData:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get questions for a user
export const getQuestions = async (req, res) => {
  const { email_id, question_no, keywords, bit_string } = req.body;

  try {
    let userData = await User.findOne({ email: email_id });
    console.log(userData)
    console.log("Email ID:", email_id);

    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initial question case
    if (question_no === 0 && bit_string === "0") {
      const firstQuestionData = getQuestionData(1);
      if (firstQuestionData) {
        userData.question_no = 1;
        userData.bit_string = '1';
        await userData.save();

        return res.json({
          message: "Question generated successfully",
          output: {
            question_no: 1,
            question_desc: firstQuestionData.question,
            keywords: firstQuestionData.keywords,
            tip: firstQuestionData.tip,
            bit_string: '1',
            guidelines: "",
            practices: "",
            certifications: "",
            documents: "",
            penalty_percentage: 0,
            report_url: ""
          }
        });
      } else {
        return res.status(404).json({ message: "First question data not found" });
      }
    }

    // Update bit string based on responses to the current question
    let updatedBitString = updateBitString(bit_string, question_no, keywords);

    // Determine the next question based on criteria
    let currentQuestionNo = question_no;
    let nextQuestionNo = currentQuestionNo + 1;
    let nextQuestionData = getQuestionData(nextQuestionNo);

    // Loop through subsequent questions to find the next displayable one
    while (nextQuestionData) {
      if (!checkCriteria(updatedBitString, nextQuestionData.criteria, nextQuestionData.criteriaOr)) {
        updatedBitString = skipQuestion(updatedBitString, nextQuestionNo); // Skip this question
        nextQuestionNo++;
        nextQuestionData = getQuestionData(nextQuestionNo);
      } else {
        // Set the bit for showing the question
        updatedBitString = setBitToShowQuestion(updatedBitString, nextQuestionNo, true);
        userData.question_no = nextQuestionNo;
        userData.bit_string = updatedBitString;
        await userData.save();

        return res.json({
          message: "Next question is available based on your responses.",
          output: {
            question_no: nextQuestionNo,
            question_desc: nextQuestionData.question,
            keywords: nextQuestionData.keywords,
            tip: nextQuestionData.tip,
            bit_string: updatedBitString,
            guidelines: generateRandomStrings(2),
            practices: generateRandomStrings(3),
            certifications: generateRandomStrings(1),
            documents: generateRandomStrings(1),
            penalty_percentage: 0,
            report_url: ""
          }
        });
      }
    }

    // If no further questions, generate a report
    const [percentage, report] = await generateReport(req);
    userData.bit_string = updatedBitString;
    await userData.save();

    return res.json({
      message: "No further questions to show",
      output: {
        question_no: -1,
        bit_string: updatedBitString,
        guidelines: generateRandomStrings(1),
        practices: generateRandomStrings(1),
        certifications: generateRandomStrings(1),
        documents: generateRandomStrings(1),
        penalty_percentage: percentage,
        report_url: report
      }
    });
  } catch (error) {
    console.error("Error in getQuestions:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Helper function to set the bit for displaying a question
function setBitToShowQuestion(bit_string, questionNo, isShown) {
  const index = getQuestionIndex(questionNo);
  if (index >= bit_string.length) {
    bit_string += '0'.repeat(index - bit_string.length);
  }
  bit_string = bit_string.substring(0, index) + (isShown ? '1' : '0') + bit_string.substring(index + 1);
  return bit_string;
}
