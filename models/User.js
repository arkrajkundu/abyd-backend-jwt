import mongoose from 'mongoose';

// const User = new mongoose.Schema({
//   username: { type: String, required: true, unique: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   company: { type: String },
//   industry: { type: String },
//   subIndustry: { type: String },
//   guidelines: { type: [String], default: [] },
//   practices: { type: [String], default: [] },
//   question_no: { type: Number, default: 1 },
//   bit_string: { type: String, default: '0' },

//   questionKeywords: [{
//     questionNo: { type: Number, default: 0 },
//     keywords: { type: [String], default: [] }
//   }],

//   userStats: {
//     type: Map,
//     of: mongoose.Schema.Types.Mixed,
//     default: {
//       "complianceChecklist": [{ name: String, checked: Boolean }],
//       "penaltyKeywords": [],
//       "stepByStepGuide": [],
//       "faqs": [],
//       "onTheRightSide": [],
//       "doDont": [],
//       "certifications": [],
//       "legalDocuments": []
//     }
//   }

// }, { timestamps: true });

const User = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  company: { type: String },
  industry: { type: String },
  subIndustry: { type: String },
  guidelines: { type: [String], default: [] },
  practices: { type: [String], default: [] },
  question_no: { type: Number, default: 1 },
  bit_string: { type: String, default: '0' },

  questionKeywords: [{
    questionNo: { type: Number, default: 0 },
    keywords: { type: [String], default: [] }
  }],
  state: { type: mongoose.Schema.Types.ObjectId, ref: 'State' }, // Added ai_doc_state
  userStats: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {
      "complianceChecklist": [{ name: String, checked: Boolean }],
      "penaltyKeywords": [],
      "stepByStepGuide": [],
      "faqs": [],
      "onTheRightSide": [],
      "doDont": [],
      "certifications": [],
      "legalDocuments": []
    }
  }

}, { timestamps: true });

export default mongoose.model('User', User);