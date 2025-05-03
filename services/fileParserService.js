const docxParser = require('docx-parser');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);

/**
 * Extract text from various file types
 * @param {Object} file - File object from multer
 * @returns {Promise<string>} Extracted text content
 */
async function extractTextFromFile(file) {
  try {
    const fileExtension = file.originalname.split('.').pop().toLowerCase();
    
    switch (fileExtension) {
      case 'docx':
        return await parseDocx(file.path);
      case 'pdf':
        return await parsePdf(file.path);
      case 'txt':
        return await parseTxt(file.path);
      default:
        throw new Error(`Unsupported file type: ${fileExtension}`);
    }
  } catch (error) {
    console.error('Error extracting text from file:', error);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
}

/**
 * Parse text from a Word document
 * @param {string} filePath - Path to the DOCX file
 * @returns {Promise<string>} Extracted text content
 */
async function parseDocx(filePath) {
  return new Promise((resolve, reject) => {
    docxParser.parseDocx(filePath, function(error, output) {
      if (error) {
        reject(error);
      } else {
        resolve(output);
      }
    });
  });
}

/**
 * Parse text from a PDF document
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<string>} Extracted text content
 */
async function parsePdf(filePath) {
  try {
    const dataBuffer = await readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    throw new Error(`PDF parsing error: ${error.message}`);
  }
}

/**
 * Parse text from a plain text file
 * @param {string} filePath - Path to the TXT file
 * @returns {Promise<string>} Extracted text content
 */
async function parseTxt(filePath) {
  try {
    const data = await readFile(filePath, 'utf8');
    return data;
  } catch (error) {
    throw new Error(`Text file parsing error: ${error.message}`);
  }
}

/**
 * Get supported file extensions
 * @returns {Array<string>} Array of supported file extensions
 */
function getSupportedFileTypes() {
  return ['txt', 'pdf', 'docx'];
}

module.exports = {
  extractTextFromFile,
  getSupportedFileTypes
};