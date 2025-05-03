require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { summarizeText } = require('./services/groqService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve a simple HTML form for testing
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Meeting Transcript Summarizer</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          textarea { width: 100%; height: 300px; margin-bottom: 10px; padding: 10px; }
          button { padding: 10px 20px; background-color: #4CAF50; color: white; border: none; cursor: pointer; }
          #result { margin-top: 20px; padding: 10px; border: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <h1>Meeting Transcript Summarizer</h1>
        <form id="summaryForm">
          <textarea id="transcript" placeholder="Paste your meeting transcript here..."></textarea>
          <button type="submit">Generate 3-Sentence Summary</button>
        </form>
        <div id="result"></div>

        <script>
          document.getElementById('summaryForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const transcript = document.getElementById('transcript').value;
            const resultDiv = document.getElementById('result');
            
            if (!transcript.trim()) {
              resultDiv.innerHTML = '<p>Please enter a transcript.</p>';
              return;
            }
            
            resultDiv.innerHTML = '<p>Generating summary...</p>';
            
            try {
              const response = await fetch('/api/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript })
              });
              
              const data = await response.json();
              
              if (response.ok) {
                resultDiv.innerHTML = '<h3>Summary:</h3><p>' + data.summary + '</p>';
              } else {
                resultDiv.innerHTML = '<p>Error: ' + (data.error || 'Unknown error') + '</p>';
              }
            } catch (error) {
              resultDiv.innerHTML = '<p>Error: ' + error.message + '</p>';
            }
          });
        </script>
      </body>
    </html>
  `);
});

// API endpoint for generating summaries
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});