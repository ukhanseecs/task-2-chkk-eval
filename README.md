# Meeting Transcript Summarizer

A Node.js service that generates 3-sentence summaries of meeting transcripts using Groq's Completion API.

## Features

- Web form for submitting meeting transcripts (text input or file upload)
- File upload support for documents (PDF, DOCX, and TXT files)
- Copy and download functionality for generated summaries
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

### Text Summarization Endpoint

`POST /api/summarize`

#### Request Body

```json
{
  "transcript": "Your meeting transcript text here..."
}
```

#### Response

```json
{
  "summary": "Three-sentence summary of the meeting transcript."
}
```

### File Upload Summarization Endpoint

`POST /api/summarize/file`

#### Request

Send a multipart/form-data request with a `file` field containing the document to summarize.
Supported file types: PDF, DOCX, TXT

#### Response

```json
{
  "summary": "Three-sentence summary of the meeting transcript."
}
```

## Web Interface

The service provides a simple web interface at the root URL (`/`) where users can:
- Paste meeting transcripts directly
- Upload document files (PDF, DOCX, TXT)
- View generated summaries
- Copy and download generated summaries

## Error Handling

The service includes comprehensive error handling for:
- Missing API keys
- Invalid input
- Unsupported file types
- File size limitations (10MB max)
- API rate limits and errors
- Network issues

## Technology Stack

- Node.js
- Express.js
- Multer (for file uploads)
- PDF-Parse (for PDF extraction)
- DOCX-Parser (for Word document extraction)
- Groq Completion API (LLama3-70B model)
- Axios for HTTP requests