const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Summarizes text using Groq's Completion API
 * @param {string} text - The meeting transcript to summarize
 * @returns {Promise<string>} A 3-line summary of the meeting transcript
 */
async function summarizeText(text) {
  try {
    // Try to get API key from environment variables first
    let apiKey = process.env.GROQ_API_KEY;
    
    // If not found in env variables, try to load from env folder
    if (!apiKey) {
      try {
        const envFilePath = path.join(__dirname, '..', 'env', 'groq_api_key.txt');
        apiKey = fs.readFileSync(envFilePath, 'utf8').trim();
      } catch (fileError) {
        console.error('Failed to read API key from env folder:', fileError.message);
      }
    }
    
    if (!apiKey) {
      throw new Error('Groq API key is missing. Please set the GROQ_API_KEY environment variable or add it to the env folder.');
    }

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama3-70b-8192',
        messages: [
          {
            role: 'system',
            content: 'You are a professional summarizer. Your task is to distill meeting transcripts into exactly 3 lines that capture the essence of the meeting. Do not include any introductory phrases or explanations - respond with ONLY the 3 lines.'
          },
          {
            role: 'user',
            content: `Summarize this meeting transcript in exactly 3 lines. Provide ONLY the 3 lines with no additional text:\n\n${text}`
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent, focused output
        max_tokens: 200   // Increased to accommodate 3 lines
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Extract the summary from the API response and ensure it's exactly 3 lines
    let summary = response.data.choices[0].message.content.trim();
    
    // Remove any introductory phrases or punctuation at the beginning
    summary = summary.replace(/^[^a-zA-Z0-9]+/, ''); 
    
    // Split by newlines and ensure we take only 3 lines
    const lines = summary.split(/\n+/).filter(line => line.trim().length > 0);
    if (lines.length >= 3) {
      summary = lines.slice(0, 3).join('\n');
    }
    
    return summary;
  } catch (error) {
    console.error('Error calling Groq API:', error.message);
    
    // Check for specific error types and provide more helpful messages
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Response Error:', {
        status: error.response.status,
        data: error.response.data
      });
      throw new Error(`Groq API error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response received from Groq API. Please check your internet connection.');
    }
    
    // Re-throw the original error if it wasn't handled above
    throw error;
  }
}

module.exports = {
  summarizeText
};