// userDataController.js
import User from '../models/User.js';
import { getQuestionData, updateBitString, checkCriteria, getQuestionIndex, skipQuestion } from '../questionsData.js';
import { generateReport } from '../generateReport.js';
import { generateRandomStrings } from '../utils.js';

export const createUser = async (req, res) => {
  const { email, company, industry, subIndustry } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = new User({
      email,
      company,
      industry,
      subIndustry,
      question_no: 1,
      bit_string: '0',
      guidelines: [],
      practices: [],
      // certifications: [],
      // documents: [],
      questionKeywords: [],
      userStats: {
        complianceChecklist: [],
        penaltyKeywords: [],
        stepByStepGuide: [],
        faqs: [],
        onTheRightSide: [],
        doDont: [],
        certifications: [],
        legalDocuments: []
      }
    });

    await newUser.save();
    res.status(201).json({ message: "User created successfully", user: newUser });
  } catch (error) {
    console.error("Error in createUser:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUserData = async (req, res) => {
  const { email } = req.params;

  try {
    const userData = await User.findOne({ email });
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user: userData });
  } catch (error) {
    console.error("Error in getUserData:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete User API (DELETE /:email)
export const deleteUser = async (req, res) => {
  const { email } = req.params;

  try {
    const deletedUser = await User.findOneAndDelete({ email });

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error in deleteUser:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getQuestions = async (req, res) => {
  const { email, question_no, keywords, bit_string } = req.body;

  try {
    let userData = await User.findOne({ email });
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    // Handle the first question scenario
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

    // Update questionKeywords with the selected keywords for the current question
    const currentQuestionData = getQuestionData(question_no);
    if (currentQuestionData) {
      const existingKeywords = userData.questionKeywords.find(q => q.questionNo === question_no);
      if (existingKeywords) {
        existingKeywords.keywords = keywords; // Update existing keywords for this question
      } else {
        userData.questionKeywords.push({ questionNo: question_no, keywords: keywords }); // Add new entry if not found
      }
    }

    // Save the updated questionKeywords to the user
    await userData.save();

    // Determine the next question based on criteria
    let currentQuestionNo = question_no;
    let nextQuestionNo = currentQuestionNo + 1;
    let nextQuestionData = getQuestionData(nextQuestionNo);

    while (nextQuestionData) {
      if (!checkCriteria(updatedBitString, nextQuestionData.criteria, nextQuestionData.criteriaOr)) {
        updatedBitString = skipQuestion(updatedBitString, nextQuestionNo);
        nextQuestionNo++;
        nextQuestionData = getQuestionData(nextQuestionNo);
      } else {
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

// Get User Checklist API (GET /:email/checklist)
export const getUserChecklist = async (req, res) => {
  const { email } = req.params;

  try {
    const userData = await User.findOne({ email });
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return the user's checklist from userStats
    const { complianceChecklist } = userData.userStats;
    res.status(200).json({ checklist: complianceChecklist });
  } catch (error) {
    console.error("Error in getUserChecklist:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Set User Checklist API (PUT /:email/checklist)
export const setChecklist = async (req, res) => {
  const { email } = req.params;
  const { checklist } = req.body; // Expecting an array of objects: [{name, checked}, ...]

  try {
    const userData = await User.findOne({ email });
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate checklist structure
    if (!Array.isArray(checklist)) {
      return res.status(400).json({ message: "Checklist must be an array of objects" });
    }

    // Update the user's checklist in userStats
    userData.userStats.complianceChecklist = checklist;

    await userData.save();
    res.status(200).json({ message: "Checklist updated successfully", checklist: userData.userStats.complianceChecklist });
  } catch (error) {
    console.error("Error in setChecklist:", error);
    res.status(500).json({ message: "Server error" });
  }
};