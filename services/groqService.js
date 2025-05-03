const axios = require('axios');

/**
 * Summarizes text using Groq's Completion API
 * @param {string} text - The meeting transcript to summarize
 * @returns {Promise<string>} A 3-word summary of the meeting transcript
 */
async function summarizeText(text) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      throw new Error('Groq API key is missing. Please set the GROQ_API_KEY environment variable.');
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
        max_tokens: 20    // Reduced since we only need 3 words
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Extract the summary from the API response and ensure it's exactly 3 words
    let summary = response.data.choices[0].message.content.trim();
    
    // Remove any introductory phrases or punctuation
    summary = summary.replace(/^[^a-zA-Z0-9]+/, ''); // Remove leading non-alphanumeric chars
    
    // Split by spaces and ensure we take only 3 words
    const words = summary.split(/\s+/).filter(word => word.length > 0);
    if (words.length >= 3) {
      summary = words.slice(0, 3).join(' ');
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