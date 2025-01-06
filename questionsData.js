import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const questionsMap = new Map();

export async function loadQuestionsData() {
    const filePath = path.join(__dirname, 'dpdpa.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(1);
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
            const questionNo = row.getCell(2).value;
            const criteria = row.getCell(3).value;
            // console.log(criteria)
            const question = row.getCell(4).value;
            const tag = row.getCell(5).value || ''
            const keywordsString = row.getCell(6).value || ''; // Handle undefined or empty cells gracefully
            const otrs = row.getCell(7).value || '';
            // New columns for compliance, practices, certifications, documents
            const compliance = row.getCell(8).value || '';
            const penaltyKeywords = row.getCell(9).value || '';
            const stepByStepGuide = row.getCell(10).value || '';
            const faq = row.getCell(11).value || '';
            const doDont = row.getCell(12).value || '';
            const certifications = row.getCell(13).value || '';
            const legalDocuments = row.getCell(14).value || '';

            questionsMap.set(questionNo, {
                question,
                criteria: parseCriteria(criteria),
                criteriaOr: parseCriteriaOr(criteria),
                keywords: parseKeywords(keywordsString),
                otrs,
                tag,
                compliance,
                penaltyKeywords,
                stepByStepGuide,
                faq,
                doDont,
                certifications,
                legalDocuments
            });
        }
    });
}

function parseCriteriaOr(criteria) {
    // Ensure criteria is treated as a string if it's undefined or not a string
    const criteriaStr = String(criteria || '').trim();
    if (!criteriaStr) return []; // Return an empty array if criteria is empty after trimming
    if (criteriaStr[0] !== '(') {
        return [];
    }
    return criteriaStr.slice(1, -1).split(',').map(crit => {
        const [qNo, kNo] = crit.split('.').map(Number);
        return { qNo, kNo };
    });
}

function parseCriteria(criteria) {
    // Ensure criteria is treated as a string if it's undefined or not a string
    const criteriaStr = String(criteria || '').trim();
    if (!criteriaStr) return []; // Return an empty array if criteria is empty after trimming
    if (criteriaStr[0] === '(') {
        return [];
    }
    return criteriaStr.split(',').map(crit => {
        const [qNo, kNo] = crit.split('.').map(Number);
        return { qNo, kNo };
    });
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

function processToken(token) {
    // Explicitly remove any numerical prefix and the following comma from each token
    const matched = token.match(/(?:\d+\,\s*)(.*)/);  // Match the pattern "number,"
    if (matched && matched[1]) {
        // Remove trailing parentheses and return only the part after the number and comma
        return matched[1].replace(/\)$/, '').trim();  // Also remove any closing parenthesis at the end
    }
    // Return the token without the last closing parenthesis if no numerical prefix is found
    return token.replace(/\)$/, '').trim();
}



export function getQuestionData(questionNo) {
    // Parse the questionNo as an integer
    const parsedQuestionNo = parseInt(questionNo);

    // Check if the parsed value is a valid number (not NaN) and greater than 0
    if (isNaN(parsedQuestionNo) || parsedQuestionNo <= 0) {
        // If invalid (NaN or non-positive), return 0 or a default value
        return 0;
    }

    // Fetch the data from questionsMap using the parsed question number
    return questionsMap.get(parsedQuestionNo) || 0; // Return 0 if not found in the map
}

// Add this function to your questionsData.js file

export function getQuestionIndex(questionNo) {
    let index = 0; // Start from the beginning of the bit string

    // Iterate over each question up to the question number (exclusive) to calculate the index
    for (let i = 1; i < questionNo; i++) {
        if (questionsMap.has(i)) {
            const questionData = questionsMap.get(i);
            // Add 1 for the question itself and add the count of keywords for that question
            index += 1 + questionData.keywords.length;
        }
    }
    // console.log(index)
    return index;
}


export function updateBitString(bit_string, questionNo, keywords) {
    const index = getQuestionIndex(questionNo);
    //console.log( keywords );
    let startIndex = bit_string.length;
    let newBitString = bit_string.split("");
    //let newBitString = bit_string.slice(0, index) + '1'; // Show the question
    let keywordsFull = getQuestionData(questionNo).keywords;
    let endIndex = startIndex + keywordsFull.length;
    for (let i = startIndex; i < endIndex; i++) {
        newBitString.push('0');
    }
    //console.log(keywordsFull);
    for (let i = 0; i < keywords.length; i++) {
        let index = keywordsFull.indexOf(keywords[i]);
        //console.log(index)
        if (index !== -1) {
            newBitString[startIndex + index] = '1';
        }
    }
    let editableString = newBitString.join("");
    // Append keyword responses
    return editableString;
}

export function checkCriteria(bit_string, criteria, criteriaOr) {
    // Ensure every criterion is met by checking the corresponding bit in the bit_string
    //console.log(criteriaOr);
    if (criteria.length) {
        if (criteria[0].qNo === 0) {
            return true;
        }
        return criteria.every(({ qNo, kNo }) => {
            const baseIndex = getQuestionIndex(qNo);  // Get the base index for the question
            const keywordIndex = baseIndex + kNo;  // Calculate the index for the keyword, adjusting for the offset
            return bit_string[keywordIndex] === '1';  // Check if the keyword bit is '1'
        });
    }
    if (criteriaOr.length) {
        if (criteriaOr[0] === 0) {
            return true;
        }
        return criteriaOr.some(({ qNo, kNo }) => {
            const baseIndex = getQuestionIndex(qNo);  // Get the base index for the question
            const keywordIndex = baseIndex + kNo;  // Calculate the index for the keyword, adjusting for the offset
            return bit_string[keywordIndex] === '1';  // Check if the keyword bit is '1'
        });
    }
    return true;

}


export function skipQuestion(bit_string, questionNo) {
    const questionData = getQuestionData(questionNo);
    const index = getQuestionIndex(questionNo);
    const numberOfKeywords = questionData.keywords.length;
    let newBitString = bit_string.slice(0, index) + '0' + '0'.repeat(numberOfKeywords); // Skip the question and keywords
    return newBitString + bit_string.slice(index + 1 + numberOfKeywords);
}
