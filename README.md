# Meeting Transcript Summarizer

A Node.js service that generates 3-sentence summaries of meeting transcripts using Groq's Completion API.

## Features

- Web form for submitting meeting transcripts
- RESTful API endpoint for programmatic access
- 3-sentence summaries of meeting transcripts
- Uses Groq's advanced LLama3-70B model for high-quality summaries

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   PORT=3000
   ```
4. Run the server:
   ```
   npm start
   ```

## API Usage

### Endpoint

`POST /api/summarize`

### Request Body

```json
{
  "transcript": "Your meeting transcript text here..."
}
```

### Response

```json
{
  "summary": "Three-sentence summary of the meeting transcript."
}
```

## Web Interface

The service provides a simple web interface at the root URL (`/`) where users can paste meeting transcripts and get summaries.

## Error Handling

The service includes comprehensive error handling for:
- Missing API keys
- Invalid input
- API rate limits and errors
- Network issues

## Technology Stack

- Node.js
- Express.js
- Groq Completion API (LLama3-70B model)
- Axios for HTTP requests