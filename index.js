import { readFile, utils } from 'xlsx';

const workbook = readFile('./file_updated.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = utils.sheet_to_json(sheet);

const bitString = "1010110101010110101011010101";
const guidelines = [];

function getKeywordsAndGuidelines(questionNo) {
  const row = data[questionNo - 1];
  if (!row) return null;

  const keywordsColumn = row['Keywords'];
  const penaltyKeywordsColumn = row['penalty Keywords'];
  const compulsoryKeywordsColumn = row['Compulsory Keywords'];
  const guidelineColumn = row['How To avoid Penalty'];

  const keywords = keywordsColumn.split(',').map(k => k.trim().split(' ')[0]);
  const penaltyKeywords = penaltyKeywordsColumn.split(',').map(k => parseInt(k.trim(), 10)); // Convert to numbers
  const compulsoryKeywords = compulsoryKeywordsColumn.split(',').map(k => parseInt(k.trim(), 10));

  return {
    keywords,
    penaltyKeywords,
    compulsoryKeywords,
    guideline: guidelineColumn
  };
}

function getGuidelineForQuestion(questionNo, keywordsBitString) {
  const { penaltyKeywords, compulsoryKeywords, guideline } = getKeywordsAndGuidelines(questionNo) || {};
  let shouldGuidelineBeDisplayed = false;

  for (const index of penaltyKeywords) {
    if (keywordsBitString[index - 1] === '1') {
      shouldGuidelineBeDisplayed = true;
      break;
    }
  }

  if (!shouldGuidelineBeDisplayed) {
    for (const index of compulsoryKeywords) {
      if (keywordsBitString[index - 1] === '0') {
        shouldGuidelineBeDisplayed = true;
        break;
      }
    }
  }

  return shouldGuidelineBeDisplayed ? guideline : "";
}

function getNumKeywords(presentQuestionNum) {
  const row = data[presentQuestionNum - 1];
  const keywordsColumn = row['Keywords'];
  return keywordsColumn.split('),').length;
}

const questionsStartIndex = new Array(65).fill(0);

function initializeQuestionsStartIndex() {
  for (let i = 1; i < 65; i++) {
    questionsStartIndex[i] = questionsStartIndex[i - 1] + getNumKeywords(i) + 1;
  }
}

function getPresentQuestionNum(index) {
  for (let questionNum = 1; questionNum < questionsStartIndex.length; questionNum++) {
    if (index >= questionsStartIndex[questionNum - 1] && index < questionsStartIndex[questionNum]) {
      return questionNum;
    }
  }
  return -1;
}

initializeQuestionsStartIndex(); // Call the initialization function to set up the start indices

let i = 0;
while (i < bitString.length) {
  const presentQuestionNum = getPresentQuestionNum(i);
  const keywordsForPresentQuestionNo = getNumKeywords(presentQuestionNum);
  const keywordsBitString = bitString.slice(i + 1, i + 1 + keywordsForPresentQuestionNo);

  const guideline = getGuidelineForQuestion(presentQuestionNum, keywordsBitString);
  if (guideline !== "") {
    guidelines.push(guideline);
  }

  i += 1 + keywordsForPresentQuestionNo;
}

function getcategoryQuestion(questionNo) {
  const row = data[questionNo - 1];
  return row['Category'];
}

function getmaxPenalty(questionNo) {
  const row = data[questionNo - 1];
  return parseInt(row['Max Penalty (in lakhs INR)'], 10);
}

let max_penalty = {};

function calculateMaxPenalty(questionNo, guideline) {
  const category = getcategoryQuestion(questionNo);
  const maxPenaltyQuestion = getmaxPenalty(questionNo);

  if (guideline !== "") {
    if (max_penalty.hasOwnProperty(category)) {
      max_penalty[category] = Math.max(max_penalty[category], maxPenaltyQuestion);
    } else {
      max_penalty[category] = maxPenaltyQuestion;
    }
  }
}