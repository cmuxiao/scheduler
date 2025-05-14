# Server Components

This directory contains all the backend server components for the Smart Calendar application.

## Components

- `chat_server.py`: Flask server that handles the AI chat functionality
- `requirements.txt`: Python package dependencies

## Getting Started

1. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Ensure Ollama is installed and running with the llama3 model:
   ```
   ollama run llama3
   ```

3. Start the chat server:
   ```
   python chat_server.py
   ```

The server will start on port 5000 by default.

## API Endpoints

- `POST /api/chat`: Send messages to the AI assistant
   - Request: `{"user_id": "user_email", "message": "User message"}`
   - Response: `{"response": "AI response", "event_added": bool, "event_data": {...}}`

- `GET /api/events`: Get all events for a user
   - Request: Query parameter `user_id` (optional)
   - Response: Array of event objects 