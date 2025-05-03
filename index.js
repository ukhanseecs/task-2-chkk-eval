require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { summarizeText } = require('./services/groqService');
const { extractTextFromFile, getSupportedFileTypes } = require('./services/fileParserService');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Define file filter for uploads
const fileFilter = (req, file, cb) => {
  const allowedExtensions = getSupportedFileTypes();
  const ext = path.extname(file.originalname).toLowerCase().substring(1);
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type. Supported types: ${allowedExtensions.join(', ')}`), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB file size limit
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Clean up uploaded files after processing
const cleanupUploadedFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(`Error cleaning up file ${filePath}:`, error);
  }
};

// Serve the HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint for getting supported file types
app.get('/api/filetypes', (req, res) => {
  try {
    const types = getSupportedFileTypes();
    res.json({ types });
  } catch (error) {
    console.error('Error getting supported file types:', error);
    res.status(500).json({ 
      error: 'Failed to get supported file types',
      details: error.message
    });
  }
});

// API endpoint for generating summaries from text
app.post('/api/summarize', async (req, res) => {
  try {
    const { transcript } = req.body;
    
    if (!transcript || transcript.trim() === '') {
      return res.status(400).json({ error: 'Transcript is required' });
    }
    
    const summary = await summarizeText(transcript);
    res.json({ summary });
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ 
      error: 'Failed to generate summary',
      details: error.message
    });
  }
});

// API endpoint for generating summaries from uploaded files
app.post('/api/summarize/file', upload.single('file'), async (req, res) => {
  let filePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded or unsupported file type' });
    }
    
    filePath = req.file.path;
    
    // Extract text from the uploaded file
    const transcript = await extractTextFromFile(req.file);
    
    if (!transcript || transcript.trim() === '') {
      return res.status(400).json({ error: 'No text content found in the file' });
    }
    
    // Generate summary using the extracted text
    const summary = await summarizeText(transcript);
    res.json({ summary });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ 
      error: 'Failed to process file',
      details: error.message
    });
  } finally {
    // Clean up the uploaded file
    if (filePath) {
      cleanupUploadedFile(filePath);
    }
  }
});

// Error handling for multer errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ 
      error: 'File upload error', 
      details: err.message 
    });
  } else if (err) {
    return res.status(500).json({ 
      error: 'Server error', 
      details: err.message 
    });
  }
  next();
});

// Ensure uploads directory exists
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'));
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});