import pkg from 'xlsx';
import { getQuestionData } from './questionsData.js'
import { generatePDF } from './genPDF.js';

const { readFile, utils } = pkg;

const workbook = readFile('./dataset.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = utils.sheet_to_json(sheet);

const bitString = "1010110101010110101011010101";

function getKeywordsAndGuidelines(questionNo) {
  const row = data[questionNo - 1];
  if (!row) return null;

  const keywordsColumn = row['Keywords'] || ''; // Ensure it's a valid string
  const penaltyKeywordsColumn = row['penalty Keywords'] || ''; // Fallback to empty string if undefined
  const compulsoryKeywordsColumn = row['Compulsory Keywords'] || ''; // Fallback to empty string if undefined
  const guidelineColumn = row['How To avoid Penalty'] || ''; // Fallback to empty string if undefined

  // Use parseKeywords for the regular keywords
  const keywords = parseKeywords(keywordsColumn).map(k => k.trim().split(' ')[0]);

  // Use a different function to handle penaltyKeywords and compulsoryKeywords parsing
  const penaltyKeywords = parsePenaltyOrCompulsoryKeywords(penaltyKeywordsColumn);
  const compulsoryKeywords = parsePenaltyOrCompulsoryKeywords(compulsoryKeywordsColumn);

  return {
    keywords,
    penaltyKeywords,
    compulsoryKeywords,
    guideline: guidelineColumn
  };
}

// New function to parse penaltyKeywords and compulsoryKeywords
function parsePenaltyOrCompulsoryKeywords(input) {
  // Ensure input is always treated as a string
  const inputStr = (input || '').toString();

  return inputStr
    .split(',') // Split by commas
    .map(item => item.trim()) // Trim each item to remove extra spaces
    .filter(item => item.length > 0) // Remove any empty strings resulting from extra commas
    .map(item => parseInt(item, 10)) // Convert to integer
    .filter(item => !isNaN(item)); // Filter out invalid numbers
}


// Helper function to process individual tokens
function processToken(token) {
  return token.trim(); // Adjust this function to handle any other secific processing
}


function getGuidelineForQuestion(questionNo, keywordsBitString) {
  const { penaltyKeywords, compulsoryKeywords, guideline } = getKeywordsAndGuidelines(questionNo) || {};
  //console.log(penaltyKeywords+" C: "+ compulsoryKeywords + " G: " + guideline);
  // Ensure keywordsBitString is a string and has sufficient length
  if (!keywordsBitString || typeof keywordsBitString !== 'string') {
    return "";  // Return an empty string if keywordsBitString is undefined or invalid
  }

  let shouldGuidelineBeDisplayed = false;

  // Check penalty keywords
  if ( keywordsBitString[ Number(penaltyKeywords) - 1] === '1') {
      shouldGuidelineBeDisplayed = true;
      //console.log("Here 1");
    }

  // If no guideline is triggered by penalty keywords, check compulsory keywords
  if (!shouldGuidelineBeDisplayed && questionNo !==2) {
    for (const index of compulsoryKeywords || []) { // Fallback to an empty array if undefined
      if (index - 1 < keywordsBitString.length && keywordsBitString[index - 1] === '0') {
        shouldGuidelineBeDisplayed = true;
        break;
      }
    }
  }
  if( !shouldGuidelineBeDisplayed && questionNo ===2 ){
    let countKeywords = 0;
    for (let i = 0; i < keywordsBitString.length-1; i++) {
      if( keywordsBitString[i] === '1' ){
        countKeywords+=1;
      }
    }
    if ( countKeywords < 2 ) {
      //console.log("here 2");
      shouldGuidelineBeDisplayed = true;
    }
  }
 // console.log("q no : " + questionNo + " displayGuideLine : " + shouldGuidelineBeDisplayed);
  return shouldGuidelineBeDisplayed ? guideline : "";
}


function getNumKeywords(presentQuestionNum) {
  const row = data[presentQuestionNum - 1];

  // Check if row exists and has a 'Keywords' column
  if (!row || !row['Keywords']) {
    console.error('Row or Keywords column is undefined');
    return 0;  // Return 0 or handle the case when there are no keywords
  }

  const keywordsColumn = row['Keywords'].trim(); // Ensure it's a trimmed string

  // Use parseKeywords function to parse the keywords correctly
  const parsedKeywords = parseKeywords(keywordsColumn);
  return parsedKeywords.length;
}

function parseKeywords(input) {
  let results = [];
  let currentToken = '';
  let inParentheses = 0;  // Track whether the parsing is inside parentheses

  for (let char of input) {
    if (char === '(') {
      inParentheses++;
    } else if (char === ')') {
      inParentheses--;
    }

    if (char === ',' && inParentheses === 0) {
      // Process the current token when a comma is encountered outside of parentheses
      if (currentToken.trim() !== '') {
        const processedToken = processToken(currentToken);
        if (processedToken !== '') {
          results.push(processedToken);
        }
        currentToken = '';
      }
    } else {
      currentToken += char;  // Accumulate characters into the current token
    }
  }

  // Process the last accumulated token if it's not empty
  if (currentToken.trim() !== '') {
    const processedToken = processToken(currentToken);
    if (processedToken !== '') {
      results.push(processedToken);
    }
  }

  return results;
}


const questionsStartIndex = new Array(42).fill(0);

function initializeQuestionsStartIndex() {
  for (let i = 1; i < 42; i++) {
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

function getcategoryQuestion(questionNo) {
  const row = data[questionNo - 1];
  //console.log(questionNo);
  return row['Category '];
}

function getmaxPenalty(questionNo) {
  const row = data[questionNo - 1];
  return parseInt(row['Max Penalty (in lakhs INR)'], 10);
}


function calculatePenaltyPercentage(questionNo, bit_string) {
  const row = data[questionNo - 1];
  //console.log(bit_string);
  let penaltyKW = row['penalty Keywords'];
  let compulsoryKeywords = row['Compulsory Keywords']
  let totalKw = 0;
  let safeKw = 0;
  //console.log("q:"+questionNo);
  //console.log(penaltyKW);
  if ( typeof penaltyKW !== 'undefined') {
    totalKw += 1;
    if ( Number.isInteger( penaltyKW ) && !Number(bit_string[penaltyKW-1]) ){
      safeKw += 1;
    }
  }
  if ( typeof compulsoryKeywords !== 'undefined') {
    if( Number.isInteger( compulsoryKeywords ) ){
      totalKw += 1;
      if ( Number(bit_string[compulsoryKeywords-1] )){
        safeKw += 1;
      }
    }
    else {
      const intArray = compulsoryKeywords.split(',').map(Number); // Converts each element to an integer
      for (let i = 0; i < intArray.length; i++) {
        totalKw += 1;
        if ( Number(bit_string[intArray[i]-1]) ){
          safeKw += 1;
        }
      }
    }
    
  }
  //console.log(row);
  return [totalKw,safeKw];
}

//calculatePenaltyPercentage(3, "1")
// function calculatePenaltyPercentage(questionNo, bit_string) {
//   const questionData = getQuestionData(questionNo);
//   if (!questionData) {
//     return 0;  // Return 0 if there's no data for the question
//   }

//   const { penaltyKeywords, compulsoryKeywords } = questionData;
//   let totalKeywords = penaltyKeywords.length + compulsoryKeywords.length;
//   let safeCount = 0;

//   // Process penalty keywords
//   penaltyKeywords.forEach(optionNumber => {
//     const keywordIndex = getKeywordIndex(questionNo, optionNumber);
//     if (keywordIndex < bit_string.length && bit_string[keywordIndex] === '0') {
//       safeCount++;  // Increment if the option was NOT selected (safe)
//     }
//   });

//   if (questionNo === 3) {
//     // Special handling for "Any two" condition in Question No 3
//     let countSelected = 0;
//     compulsoryKeywords.forEach(optionNumber => {
//       const keywordIndex = getKeywordIndex(questionNo, optionNumber);
//       if (keywordIndex < bit_string.length && bit_string[keywordIndex] === '1') {
//         countSelected++;
//       }
//     });

//     // Check if at least two compulsory keywords are selected
//     if (countSelected >= 2) {
//       safeCount += 2; // Add 2 to safe count, or use countSelected if you wish to add all selected keywords
//     }
//   } else {
//     // Normal processing for compulsory keywords
//     compulsoryKeywords.forEach(optionNumber => {
//       const keywordIndex = getKeywordIndex(questionNo, optionNumber);
//       if (keywordIndex < bit_string.length && bit_string[keywordIndex] === '1') {
//         safeCount++;  // Increment if the option was selected (safe)
//       }
//     });
//   }

//   return totalKeywords, safeCount;
// }

function getKeywordIndex(questionNo, optionNumber) {
  const baseIndex = getQuestionIndex(questionNo);
  // Assuming optionNumber is 1-based index, subtract 1 to convert it to 0-based.
  return baseIndex + optionNumber;
}

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

async function copyFolderPdf(email_id){
  return new Promise((resolve, reject) => {
  // Specify the source and destination paths (adjust these paths)
  const sourceFolderPath = "./output/"+email_id; // Adjust this to your source folder path
  const destinationFolderPath = '/var/www/html/users_pdf/users_pdf/'+email_id; // Adjust this to your destination folder path

  // Function to ensure the destination folder is copied
  async function copyFolder() {
      // Check if the destination folder already exists
      if (fs.existsSync(destinationFolderPath)) {
          console.log('Existing folder found, deleting older version:', destinationFolderPath);
          
          await new Promise((resolve, reject) => {
              // Delete the existing folder using sudo
              exec(`sudo rm -rf "${destinationFolderPath}"`, (err, stdout, stderr) => {
                  if (err) {
                      console.error(`Error deleting existing folder: ${stderr || err.message}`);
                      reject(err); // Reject the promise on error
                  } else {
                      console.log('Existing folder deleted:', destinationFolderPath);
                      resolve(); // Resolve the promise on success
                  }
              });
          });
      }

      // Perform the copy operation
      await new Promise((resolve, reject) => {
          exec(`sudo cp -r "${sourceFolderPath}" "${destinationFolderPath}"`, (err, stdout, stderr) => {
              if (err) {
                  console.error(`Error copying folder: ${stderr || err.message}`);
                  reject(err); // Reject the promise on error
              } else {
                  console.log('Folder copied successfully to:', destinationFolderPath);
                  resolve(); // Resolve the promise on success
              }
          });
      });
  }

    // Start the process by copying the folder
    copyFolder().catch(err => console.error('Error during folder copy:', err));

    setTimeout(() => {
      console.log('PDF copied');
      resolve(); // Resolve the promise when done
    }, 2000); // Simulating delay
    });

}

function copyToHTMLVAR(email_id){
  

  // Specify the source and destination paths (adjust these paths)
  const sourcePath = '/home/datence.tech/dv1/AbydWebApp/output/'+email_id+".pdf";
  const destinationFolderPath = '/var/www/html/users_pdf/users_pdf/'+email_id;
  const destinationPath = path.join(destinationFolderPath, 'output.pdf');

// Function to ensure the destination folder exists using sudo
function ensureDirectoryExists(dirPath) {
    exec(`sudo mkdir -p "${dirPath}"`, (err, stdout, stderr) => {
        if (err) {
            console.error(`Error creating folder: ${stderr || err.message}`);
            return;
        }
        //console.log(`Folder created or already exists: ${dirPath}`);
    });
}

// Ensure the destination folder exists
ensureDirectoryExists(destinationFolderPath);

// Delete the destination file if it already exists using sudo
exec(`sudo rm -f "${destinationPath}"`, (err, stdout, stderr) => {
    if (err) {
        console.error(`Error deleting existing file: ${stderr || err.message}`);
        return;
    }
    //console.log('Existing file deleted:', destinationPath);
});

// Copy the PDF file using sudo
exec(`sudo cp "${sourcePath}" "${destinationPath}"`, (err, stdout, stderr) => {
    if (err) {
        console.error(`Error copying file: ${stderr || err.message}`);
        return;
    }
    console.log('File copied successfully to:', destinationPath);
});

}

function getBestPracticesForQuestion( q , ks){
  const row = data[q - 1];
  //console.log(row);
  if (!row) return null;
  
  const practice = row['Industry best practice'] || ''; // Ensure it's a valid string
  //console.log( practice);
  if( practice[0] !== "("){
    return practice;
  }
  // console.log(practice);
  // Step 1: Split the input string into individual parts
  const parts = practice.split('), ').map(part => part.replace(/[()]/g, '').trim());

  // Step 2: Map each part to an object with key-value pairs, converting the key to an integer
  const result = parts.map(part => {
    const [key, value] = part.split(', ');
    return { [parseInt(key)]: value };  // Convert key to integer
  });

  // console.log(result);
  let returnStr = "";
  result.forEach(item => {
    const key = Object.keys(item)[0];
    const value = item[key];
    if (ks[key-1] === "1") {
      returnStr += value+"\n";
    }
    //console.log(`Key: ${key}, Value: ${value}`);
  });
  //console.log( returnStr )
  return returnStr;

}

function getCertificationsForQuestion( q , ks){
  const row = data[q - 1];
  if (!row) return null;

  const practice = row['Certification'] || ''; // Ensure it's a valid string
  if( practice[0] !== "("){
    return practice;
  }
  //console.log( practice);
    // Step 1: Split the input string into individual parts
    const parts = practice.split('), ').map(part => part.replace(/[()]/g, '').trim());

    // Step 2: Map each part to an object with key-value pairs, converting the key to an integer
    const result = parts.map(part => {
      const [key, value] = part.split(', ');
      return { [parseInt(key)]: value };  // Convert key to integer
    });
    //console.log(result);
    let returnStr = "";
    result.forEach(item => {
      const key = Object.keys(item)[0];
      const value = item[key];
      if (ks[key-1] === "1") {
        returnStr += value+"\n";
      }
      //console.log(`Key: ${key}, Value: ${value}`);
    });
    //console.log(returnStr);
    return returnStr;

}

function getLegalDocsForQuestion( q , ks){
  const row = data[q - 1];
  if (!row) return null;
  if (!ks) return null;
  const practice = row['Documents'] || ''; // Ensure it's a valid string
  if( practice[0] !== "("){
    return practice;
  }

    // Step 1: Split the input string into individual parts
    const parts = practice.split('), ').map(part => part.replace(/[()]/g, '').trim());

    // Step 2: Map each part to an object with key-value pairs, converting the key to an integer
    const result = parts.map(part => {
      const [key, value] = part.split(', ');
      return { [parseInt(key)]: value };  // Convert key to integer
    });
  
    let returnStr = "";
    result.forEach(item => {
      const key = Object.keys(item)[0];
      const value = item[key];
      if (ks[key-1] === "1") {
        returnStr += value+"\n";
      }
      //console.log(`Key: ${key}, Value: ${value}`);
    });
    

    return returnStr;

    

}

export async function generateReport(req) {
  const { bit_string } = req.body;
  let index = 0;
  const guidelinesArray = [];
  const bestPractices = [];
  const certifications = new Set();
  const legalDocs = new Set();
  let totalKW = 0;
  let safeKW = 0;
  let max_penalty = {};

  while (index < bit_string.length) {

    // Generating Guidelines
    let questionNumber = getPresentQuestionNum(index);
    let keywordsNumber = getNumKeywords(questionNumber);
    if (bit_string[index] === "0") {
      index += keywordsNumber + 1;
      continue;
    }
    if (bit_string.length < index + 1 + keywordsNumber ){
      break;
    }
    // Generating Percentage
    let [total, safe] = calculatePenaltyPercentage(questionNumber, bit_string.slice(index + 1, index + 1 + keywordsNumber));
    totalKW += total;
    safeKW += safe;

    let questionGuidelines = getGuidelineForQuestion(questionNumber, bit_string.slice(index + 1, index + 1 + keywordsNumber));
    let bestPractice = getBestPracticesForQuestion(questionNumber, bit_string.slice(index + 1, index + 1 + keywordsNumber));
    let certification = getCertificationsForQuestion(questionNumber, bit_string.slice(index + 1, index + 1 + keywordsNumber));
    let legalDoc = getLegalDocsForQuestion(questionNumber, bit_string.slice(index + 1, index + 1 + keywordsNumber));

    if (questionGuidelines !== "") {
      guidelinesArray.push(questionGuidelines);
    }

    if (bestPractice !== "") {
      bestPractices.push(bestPractice);
    }

    if (certification !== "") {
      certifications.add(certification);
    }

    if (legalDoc !== "") {
      legalDocs.add(legalDoc);
    }

    // Generating Max Penalty

    const category = getcategoryQuestion(questionNumber);
    const maxPenaltyQuestion = getmaxPenalty(questionNumber) || 0;

    if (questionGuidelines !== "") {
      if (max_penalty.hasOwnProperty(category)) {
        max_penalty[category] = Math.max(max_penalty[category], maxPenaltyQuestion);
      } else {
        max_penalty[category] = maxPenaltyQuestion;
      }
    }

    index += keywordsNumber + 1;
  }

  let maxPenaltyValue = 0;
  Object.entries(max_penalty).forEach(([str, int]) => {
    maxPenaltyValue += int;
  });

  //console.log("totalKw: " + totalKW + "safeKw : " + safeKW);
  let percentage = Math.round( (safeKW*100) / totalKW ) || 0;
  //console.log(percentage)


  // Create a new set to store the final unique strings
  const outputSet = new Set();

  // Iterate over the input set
  certifications.forEach(item => {
    // Split the item by newline character (\n) and add each part to the new set
    item.split(',').forEach(part => {
      if (part.trim() !== "") {  // Ensure empty strings aren't added
        outputSet.add(part.trim());
      }
    });
  });

  //console.log(outputSet);  // Output: Set { '1', '2', '3', '4' }


  let path = `./output/${req.body.email_id}/output.pdf`;
  const folderPath = "./output/"+req.body.email_id;

  // Check if the folder exists
  if (fs.existsSync(folderPath)) {
    // Delete the folder and its contents (recursive: true)
    fs.rmSync(folderPath, { recursive: true, force: true });
    //console.log(`Folder "${folderPath}" deleted successfully.`);
  } else {
    //console.log(`Folder "${folderPath}" does not exist.`);
  }

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
    //console.log('Folder created successfully');
  } else {
    //console.log('Folder already exists');
  }
  let path_url = "http://20.244.86.79/users_pdf/users_pdf/" + req.body.email_id + "/output.pdf"
  await generatePDF(req.body.user_id, req.body.company, req.body.industry, req.body.sub_industry, req.body.email_id, guidelinesArray, maxPenaltyValue, percentage, bestPractices, outputSet, legalDocs, path);
  //console.log( percentage, path );
  await copyFolderPdf(req.body.email_id);
  return [ percentage, path_url];
}
