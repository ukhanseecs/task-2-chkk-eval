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

// Serve a simple HTML form for testing
app.get('/', (req, res) => {
  const supportedTypes = getSupportedFileTypes();
  const acceptedFileTypes = supportedTypes.map(type => `.${type}`).join(',');
  
  res.send(`
    <html>
      <head>
        <title>Meeting Transcript Summarizer</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          textarea { width: 100%; height: 200px; margin-bottom: 10px; padding: 10px; }
          button { padding: 10px 20px; background-color: #4CAF50; color: white; border: none; cursor: pointer; margin-right: 10px; }
          #result { margin-top: 20px; padding: 10px; border: 1px solid #ddd; }
          .tab { cursor: pointer; padding: 10px 20px; display: inline-block; border: 1px solid #ccc; background-color: #f1f1f1; }
          .tab.active { background-color: #ccc; }
          .tab-content { display: none; padding: 20px; border: 1px solid #ccc; border-top: none; }
          .tab-content.active { display: block; }
          .file-upload { margin: 20px 0; }
          .loading { display: none; margin-top: 10px; }
          .error { color: red; }
          .supported-types { color: #666; font-size: 14px; margin-top: 5px; }
          .action-buttons { margin-top: 15px; display: none; }
          .action-buttons button { margin-right: 10px; }
          .copy-btn { background-color: #2196F3; }
          .download-btn { background-color: #ff9800; }
          .tooltip { position: relative; display: inline-block; }
          .tooltip .tooltiptext { visibility: hidden; width: 140px; background-color: #555; color: #fff; text-align: center; border-radius: 6px; padding: 5px; position: absolute; z-index: 1; bottom: 150%; left: 50%; margin-left: -75px; opacity: 0; transition: opacity 0.3s; }
          .tooltip .tooltiptext::after { content: ""; position: absolute; top: 100%; left: 50%; margin-left: -5px; border-width: 5px; border-style: solid; border-color: #555 transparent transparent transparent; }
          .tooltip.show .tooltiptext { visibility: visible; opacity: 1; }
        </style>
      </head>
      <body>
        <h1>Meeting Transcript Summarizer</h1>
        
        <div class="tabs">
          <div class="tab active" onclick="openTab(event, 'textTab')">Text Input</div>
          <div class="tab" onclick="openTab(event, 'fileTab')">File Upload</div>
        </div>

        <div id="textTab" class="tab-content active">
          <h3>Enter Meeting Transcript</h3>
          <form id="summaryForm">
            <textarea id="transcript" placeholder="Paste your meeting transcript here..."></textarea>
            <button type="submit">Generate Summary</button>
          </form>
        </div>

        <div id="fileTab" class="tab-content">
          <h3>Upload Meeting Transcript File</h3>
          <form id="fileUploadForm" enctype="multipart/form-data">
            <div class="file-upload">
              <input type="file" id="file" name="file" accept="${acceptedFileTypes}">
              <div class="supported-types">Supported file types: ${supportedTypes.join(', ')}</div>
            </div>
            <button type="submit">Upload and Summarize</button>
          </form>
          <div id="fileProcessing" class="loading">Processing file...</div>
        </div>

        <div id="result"></div>
        
        <div id="actionButtons" class="action-buttons">
          <div class="tooltip">
            <button id="copyBtn" class="copy-btn">Copy Summary</button>
            <span class="tooltiptext" id="copyTooltip">Copy to clipboard</span>
          </div>
          <button id="downloadBtn" class="download-btn">Download Summary</button>
        </div>

        <script>
          let currentSummary = "";
          
          function openTab(evt, tabName) {
            const tabContents = document.getElementsByClassName("tab-content");
            for (let i = 0; i < tabContents.length; i++) {
              tabContents[i].classList.remove("active");
            }
            
            const tabs = document.getElementsByClassName("tab");
            for (let i = 0; i < tabs.length; i++) {
              tabs[i].classList.remove("active");
            }
            
            document.getElementById(tabName).classList.add("active");
            evt.currentTarget.classList.add("active");
          }
          
          // Copy summary to clipboard
          document.getElementById('copyBtn').addEventListener('click', () => {
            if (!currentSummary) return;
            
            navigator.clipboard.writeText(currentSummary).then(() => {
              const tooltip = document.getElementById("copyTooltip");
              tooltip.textContent = "Copied!";
              const tooltipContainer = document.querySelector(".tooltip");
              tooltipContainer.classList.add("show");
              
              setTimeout(() => {
                tooltipContainer.classList.remove("show");
                setTimeout(() => {
                  tooltip.textContent = "Copy to clipboard";
                }, 300);
              }, 2000);
            });
          });
          
          // Download summary as text file
          document.getElementById('downloadBtn').addEventListener('click', () => {
            if (!currentSummary) return;
            
            const blob = new Blob([currentSummary], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'meeting-summary.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          });
          
          // Text input form submission
          document.getElementById('summaryForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const transcript = document.getElementById('transcript').value;
            const resultDiv = document.getElementById('result');
            const actionButtons = document.getElementById('actionButtons');
            
            if (!transcript.trim()) {
              resultDiv.innerHTML = '<p class="error">Please enter a transcript.</p>';
              actionButtons.style.display = 'none';
              return;
            }
            
            resultDiv.innerHTML = '<p>Generating summary...</p>';
            actionButtons.style.display = 'none';
            
            try {
              const response = await fetch('/api/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript })
              });
              
              const data = await response.json();
              
              if (response.ok) {
                currentSummary = data.summary;
                resultDiv.innerHTML = '<h3>Summary:</h3><p>' + data.summary.replace(/\\n/g, '<br>') + '</p>';
                actionButtons.style.display = 'block';
              } else {
                resultDiv.innerHTML = '<p class="error">Error: ' + (data.error || 'Unknown error') + '</p>';
                actionButtons.style.display = 'none';
              }
            } catch (error) {
              resultDiv.innerHTML = '<p class="error">Error: ' + error.message + '</p>';
              actionButtons.style.display = 'none';
            }
          });
          
          // File upload form submission
          document.getElementById('fileUploadForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('file');
            const resultDiv = document.getElementById('result');
            const processingDiv = document.getElementById('fileProcessing');
            const actionButtons = document.getElementById('actionButtons');
            
            if (!fileInput.files || fileInput.files.length === 0) {
              resultDiv.innerHTML = '<p class="error">Please select a file.</p>';
              actionButtons.style.display = 'none';
              return;
            }
            
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);
            
            resultDiv.innerHTML = '';
            processingDiv.style.display = 'block';
            actionButtons.style.display = 'none';
            
            try {
              const response = await fetch('/api/summarize/file', {
                method: 'POST',
                body: formData
              });
              
              const data = await response.json();
              
              if (response.ok) {
                currentSummary = data.summary;
                resultDiv.innerHTML = '<h3>Summary:</h3><p>' + data.summary.replace(/\\n/g, '<br>') + '</p>';
                actionButtons.style.display = 'block';
              } else {
                resultDiv.innerHTML = '<p class="error">Error: ' + (data.error || 'Unknown error') + '</p>';
                actionButtons.style.display = 'none';
              }
            } catch (error) {
              resultDiv.innerHTML = '<p class="error">Error: ' + error.message + '</p>';
              actionButtons.style.display = 'none';
            } finally {
              processingDiv.style.display = 'none';
              fileInput.value = ''; // Reset the file input
            }
          });
        </script>
      </body>
    </html>
  `);
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});