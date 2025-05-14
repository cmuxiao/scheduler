# Smart Calendar App

A modern, responsive calendar application with AI-powered scheduling assistance.

## Features

- **Interactive Calendar**: Monthly, weekly, and daily views
- **Event Management**: Create, edit, and delete events
- **AI Assistant**: Natural language interface for scheduling and event management
- **User Authentication**: Secure account creation and login
- **Responsive Design**: Works on desktop and mobile devices (soon)

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Python with Flask
- **AI**: Langchain with Ollama LLM integration
- **Authentication**: Client-side authentication (for demo purposes)

## Getting Started

### Prerequisites

- Python 3.8+
- [Ollama](https://ollama.ai/) installed locally with llama3 model

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/cmuxiao/sheduler.git
   cd sheduler
   ```

2. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Make sure Ollama is running with the llama3 model:
   ```
   ollama run llama3
   ```

4. Start the AI chatbot server:
   ```
   python server/chat_server.py
   ```

5. Open `index.html` in your browser or serve the files with a static file server.

## Usage

1. Create an account or log in
2. Navigate through the calendar using the month, week, and day views
3. Create events by clicking on the "+" button or a time slot
4. Chat with the AI assistant to help manage your schedule
5. Use natural language to ask about your availability or create events

## AI Assistant Commands

The AI assistant understands natural language requests like:
- "What's my schedule for next week?"
- "Add a dentist appointment on Friday at 2 PM"
- "When's a good time to schedule a meeting tomorrow?"
- "Do I have time for a 1-hour workout today?"

## Offline Mode

If the AI server is not available, the chat assistant will switch to a simplified mode that can handle basic commands and questions.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Icons from [Font Awesome](https://fontawesome.com/)
- Color scheme inspired by Google Calendar 
