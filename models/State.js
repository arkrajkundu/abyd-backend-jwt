import mongoose from 'mongoose';

const stateSchema = new mongoose.Schema({
  questionNumber: { type: Number, default: 0 },
  displayedContent: { type: [String], default: [] },
  answers: { type: Map, of: String, default: {} },
}, { timestamps: true });

const State = mongoose.model('State', stateSchema);
export default State;
