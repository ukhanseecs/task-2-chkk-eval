const axios = require('axios');

/**
 * Summarizes text using Groq's Completion API
 * @param {string} text - The meeting transcript to summarize
 * @returns {Promise<string>} A 3-sentence summary of the meeting transcript
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
            content: 'You are a professional summarizer that creates concise, accurate summaries of meeting transcripts. Always provide exactly 3 sentences that capture the key points, decisions, and action items from the meeting. Be clear and straightforward, focusing only on the most important information.'
          },
          {
            role: 'user',
            content: `Please summarize the following meeting transcript in exactly 3 sentences:\n\n${text}`
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent, focused output
        max_tokens: 300   // Limit the summary length
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Extract the summary from the API response
    const summary = response.data.choices[0].message.content.trim();
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