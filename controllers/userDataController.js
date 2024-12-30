import User from '../models/User.js';
import { getQuestionData, updateBitString, checkCriteria, getQuestionIndex, skipQuestion } from '../questionsData.js';
import { generateReport } from '../generateReport.js';
import { generateRandomStrings } from '../utils.js';

// Create User API
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

// Get User Data API
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

// Delete User API
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

// Get Questions API
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
          output: getQuestionResponse(1, firstQuestionData, '1', userData)
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
        existingKeywords.keywords = keywords;
      } else {
        userData.questionKeywords.push({ questionNo: question_no, keywords });
      }
    }

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
          output: getQuestionResponse(nextQuestionNo, nextQuestionData, updatedBitString, userData)
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
        guidelines: "",
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

// Get User Stats API (GET /:email/userStats)
export const getUserStats = async (req, res) => {
  const { email } = req.params;

  try {
    const userData = await User.findOne({ email });
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return the user's stats from userStats
    const { userStats } = userData;
    res.status(200).json({ userStats });
  } catch (error) {
    console.error("Error in getUserStats:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const setUserStats = async (req, res) => {
  const { email } = req.params;
  const { complianceChecklist, penaltyKeywords, stepByStepGuide, faqs, onTheRightSide, doDont, certifications, legalDocuments } = req.body;

  try {
    const userData = await User.findOne({ email });
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the user's stats in userStats
    userData.userStats.complianceChecklist = complianceChecklist || userData.userStats.complianceChecklist;
    userData.userStats.penaltyKeywords = penaltyKeywords || userData.userStats.penaltyKeywords;
    userData.userStats.stepByStepGuide = stepByStepGuide || userData.userStats.stepByStepGuide;
    userData.userStats.faqs = faqs || userData.userStats.faqs;
    userData.userStats.onTheRightSide = onTheRightSide || userData.userStats.onTheRightSide;
    userData.userStats.doDont = doDont || userData.userStats.doDont;
    userData.userStats.certifications = certifications || userData.userStats.certifications;
    userData.userStats.legalDocuments = legalDocuments || userData.userStats.legalDocuments;

    await userData.save();
    res.status(200).json({ message: "User stats updated successfully", userStats: userData.userStats });
  } catch (error) {
    console.error("Error in setUserStats:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete User Stats API (DELETE /:email/userStats)
export const deleteUserStats = async (req, res) => {
  const { email } = req.params;

  try {
    const userData = await User.findOne({ email });
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    // Reset all user stats fields to their default values
    userData.userStats = {
      complianceChecklist: [],
      penaltyKeywords: [],
      stepByStepGuide: [],
      faqs: [],
      onTheRightSide: [],
      doDont: [],
      certifications: [],
      legalDocuments: []
    };

    await userData.save();
    res.status(200).json({ message: "User stats deleted successfully" });
  } catch (error) {
    console.error("Error in deleteUserStats:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const setQuestions = async (req, res) => {
  const { email, question_no, keywords, bit_string, guidelines, practices, certifications, documents } = req.body;

  try {
    // Fetch the user data from the database using the provided email
    let userData = await User.findOne({ email });
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update questionKeywords with the selected keywords for the current question
    const currentQuestionData = getQuestionData(question_no);
    if (currentQuestionData) {
      const existingKeywords = userData.questionKeywords.find(q => q.questionNo === question_no);
      if (existingKeywords) {
        existingKeywords.keywords = keywords; // Update existing keywords for this question
      } else {
        userData.questionKeywords.push({ questionNo: question_no, keywords }); // Add new entry if not found
      }
    }

    // Update the fields in the userStats object
    userData.userStats.complianceChecklist = userData.userStats.complianceChecklist || []; // Ensure complianceChecklist exists
    userData.userStats.guidelines = guidelines || userData.userStats.guidelines; // Update guidelines
    userData.userStats.practices = practices || userData.userStats.practices; // Update practices
    userData.userStats.certifications = certifications || userData.userStats.certifications; // Update certifications
    userData.userStats.legalDocuments = documents || userData.userStats.legalDocuments; // Update legalDocuments

    // Update the main fields such as question_no and bit_string
    userData.question_no = question_no;
    userData.bit_string = bit_string;

    // Save the updated user data to the database
    await userData.save();

    // Respond with the updated data
    res.status(200).json({
      message: "Question data set successfully",
      output: {
        question_no: question_no,
        guidelines: userData.userStats.guidelines,
        practices: userData.userStats.practices,
        certifications: userData.userStats.certifications,
        documents: userData.userStats.legalDocuments,
        bit_string: userData.bit_string,
        keywords: userData.questionKeywords.find(q => q.questionNo === question_no)?.keywords || [],
      }
    });
  } catch (error) {
    console.error("Error in setQuestions:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Next Question API (POST /nextQuestion)
export const nextQuestion = async (req, res) => {
  const { email, question_no, keywords, bit_string } = req.body;

  try {
    let userData = await User.findOne({ email });
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
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
        userData.questionKeywords.push({ questionNo: question_no, keywords }); // Add new entry if not found
      }
    }

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
          output: getQuestionResponse(nextQuestionNo, nextQuestionData, updatedBitString, userData)
        });
      }
    }

    // const [percentage, report] = await generateReport(req);
    userData.bit_string = updatedBitString;
    await userData.save();

    return res.json({
      message: "No further questions to show",
      output: {
        question_no: -1,
        bit_string: updatedBitString,
        guidelines: "",
        practices: "",
        certifications: "",
        documents: "",
        penalty_percentage: 0,
        report_url: ""
      }
    });
  } catch (error) {
    console.error("Error in nextQuestion:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Previous Question API (POST /prevQuestion)
export const prevQuestion = async (req, res) => {
  const { email, question_no, bit_string } = req.body;

  try {
    let userData = await User.findOne({ email });
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    // Retrieve the previous question data
    let prevQuestionNo = question_no - 1;
    let prevQuestionData = getQuestionData(prevQuestionNo);

    if (!prevQuestionData) {
      return res.status(404).json({ message: "Previous question not found" });
    }

    // Fetch the previous question details
    res.json({
      message: "Previous question fetched successfully",
      output: {
        question_no: prevQuestionNo,
        question_desc: prevQuestionData.question,
        keywords: prevQuestionData.keywords,
        tip: prevQuestionData.tip,
        bit_string,
        guidelines: "",
        practices: "",
        certifications: "",
        documents: "",
        penalty_percentage: 0,
        report_url: ""
      }
    });
  } catch (error) {
    console.error("Error in prevQuestion:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Resume User Question API (GET /:email/resumeQuestions)
export const resumeQuestions = async (req, res) => {
  const { email } = req.params;

  try {
    const userData = await User.findOne({ email });

    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentQuestionNo = userData.question_no;

    res.status(200).json({
      message: "Current question number fetched successfully",
      currentQuestionNo: currentQuestionNo
    });
  } catch (error) {
    console.error("Error in resumeQuestions:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Helper function to get a structured response for the question data
function getQuestionResponse(questionNo, questionData, bitString, userData) {
  return {
    question_no: questionNo,
    question_desc: questionData.question,
    keywords: questionData.keywords,
    tip: questionData.tip,
    bit_string: bitString,
    userStats: {
      complianceChecklist: userData.userStats.complianceChecklist || [],
      penaltyKeywords: userData.userStats.penaltyKeywords || [],
      stepByStepGuide: userData.userStats.stepByStepGuide || [],
      faqs: userData.userStats.faqs || [],
      onTheRightSide: userData.userStats.onTheRightSide || [],
      doDont: userData.userStats.doDont || [],
      certifications: userData.userStats.certifications || [],
      legalDocuments: userData.userStats.legalDocuments || [],
      guidelines: userData.userStats.guidelines || [],
      practices: userData.userStats.practices || [],
    },
    penalty_percentage: 0,
    report_url: ""
  };
}

// Helper function to set the bit for displaying a question
function setBitToShowQuestion(bit_string, questionNo, isShown) {
  const index = getQuestionIndex(questionNo);
  if (index >= bit_string.length) {
    bit_string += '0'.repeat(index - bit_string.length);
  }
  bit_string = bit_string.substring(0, index) + (isShown ? '1' : '0') + bit_string.substring(index + 1);
  return bit_string;
}

// export const getQuestions = async (req, res) => {
//   const { email, question_no, keywords, bit_string } = req.body;

//   try {
//     let userData = await User.findOne({ email });
//     if (!userData) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Handle the first question scenario
//     if (question_no === 0 && bit_string === "0") {
//       const firstQuestionData = getQuestionData(1);
//       if (firstQuestionData) {
//         userData.question_no = 1;
//         userData.bit_string = '1';
//         await userData.save();

//         return res.json({
//           message: "Question generated successfully",
//           output: {
//             question_no: 1,
//             question_desc: firstQuestionData.question,
//             keywords: firstQuestionData.keywords,
//             tip: firstQuestionData.tip,
//             bit_string: '1',
//             guidelines: "",
//             practices: "",
//             certifications: "",
//             documents: "",
//             penalty_percentage: 0,
//             report_url: ""
//           }
//         });
//       } else {
//         return res.status(404).json({ message: "First question data not found" });
//       }
//     }

//     // Update bit string based on responses to the current question
//     let updatedBitString = updateBitString(bit_string, question_no, keywords);

//     // Update questionKeywords with the selected keywords for the current question
//     const currentQuestionData = getQuestionData(question_no);
//     if (currentQuestionData) {
//       const existingKeywords = userData.questionKeywords.find(q => q.questionNo === question_no);
//       if (existingKeywords) {
//         existingKeywords.keywords = keywords; // Update existing keywords for this question
//       } else {
//         userData.questionKeywords.push({ questionNo: question_no, keywords: keywords }); // Add new entry if not found
//       }
//     }

//     // Save the updated questionKeywords to the user
//     await userData.save();

//     // Determine the next question based on criteria
//     let currentQuestionNo = question_no;
//     let nextQuestionNo = currentQuestionNo + 1;
//     let nextQuestionData = getQuestionData(nextQuestionNo);

//     while (nextQuestionData) {
//       if (!checkCriteria(updatedBitString, nextQuestionData.criteria, nextQuestionData.criteriaOr)) {
//         updatedBitString = skipQuestion(updatedBitString, nextQuestionNo);
//         nextQuestionNo++;
//         nextQuestionData = getQuestionData(nextQuestionNo);
//       } else {
//         updatedBitString = setBitToShowQuestion(updatedBitString, nextQuestionNo, true);
//         userData.question_no = nextQuestionNo;
//         userData.bit_string = updatedBitString;
//         await userData.save();

//         return res.json({
//           message: "Next question is available based on your responses.",
//           output: {
//             question_no: nextQuestionNo,
//             question_desc: nextQuestionData.question,
//             keywords: nextQuestionData.keywords,
//             tip: nextQuestionData.tip,
//             bit_string: updatedBitString,
//             guidelines: generateRandomStrings(2),
//             practices: generateRandomStrings(3),
//             certifications: generateRandomStrings(1),
//             documents: generateRandomStrings(1),
//             penalty_percentage: 0,
//             report_url: ""
//           }
//         });
//       }
//     }

//     // If no further questions, generate a report
//     const [percentage, report] = await generateReport(req);
//     userData.bit_string = updatedBitString;
//     await userData.save();

//     return res.json({
//       message: "No further questions to show",
//       output: {
//         question_no: -1,
//         bit_string: updatedBitString,
//         guidelines: generateRandomStrings(1),
//         practices: generateRandomStrings(1),
//         certifications: generateRandomStrings(1),
//         documents: generateRandomStrings(1),
//         penalty_percentage: percentage,
//         report_url: report
//       }
//     });
//   } catch (error) {
//     console.error("Error in getQuestions:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // Helper function to set the bit for displaying a question
// function setBitToShowQuestion(bit_string, questionNo, isShown) {
//   const index = getQuestionIndex(questionNo);
//   if (index >= bit_string.length) {
//     bit_string += '0'.repeat(index - bit_string.length);
//   }
//   bit_string = bit_string.substring(0, index) + (isShown ? '1' : '0') + bit_string.substring(index + 1);
//   return bit_string;
// }