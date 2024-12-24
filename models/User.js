// models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  company: { type: String },
  industry: { type: String },
  subIndustry: { type: String },
  guidelines: { type: [String], default: [] },
  practices: { type: [String], default: [] },
  certifications: { type: [String], default: [] },
  documents: { type: [String], default: [] },
  question_no: { type: Number, default: 1 },
  bit_string: { type: String, default: '0' },
}, { timestamps: true });

export default mongoose.model('User', UserSchema);
