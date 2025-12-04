# LabChain ML Server

FastAPI server providing ML services for protocol standardization, autocomplete, and missing parameter detection.

## Setup

1. **Create virtual environment** (if not already created):
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**:
   Create a `.env` file in the `ml-server` directory:
   ```env
   OPENAI_API_KEY=your-openai-api-key-here
   PORT=8000
   ```

4. **Run the server**:
   ```bash
   python app.py
   ```
   
   Or using uvicorn directly:
   ```bash
   uvicorn app:app --reload --port 8000
   ```

The server will be available at `http://localhost:8000`

## API Endpoints

- `GET /` - API information
- `GET /health` - Health check
- `POST /standardize` - Convert free text to structured protocol
- `POST /autocomplete` - Get next step suggestions
- `POST /detect-missing` - Detect missing parameters

## Environment Variables

- `OPENAI_API_KEY` - OpenAI API key for text processing (optional, has fallback)
- `PORT` - Server port (default: 8000)

## Notes

- The server works without OpenAI API key using fallback methods
- OpenAI integration provides better accuracy but requires API key
- CORS is configured for `localhost:3000` (Next.js dev server)

