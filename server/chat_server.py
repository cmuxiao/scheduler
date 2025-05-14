from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import datetime
from datetime import timedelta
from langchain_ollama import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.memory import ConversationBufferMemory

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Calendar data store
CALENDAR_FILE = "calendar_events.json"

# Define the system prompt template
system_template = """
You are a helpful and intelligent assistant for a smart calendar app. Your job is to help users plan their time efficiently. Focus only on calendar-related tasks.

Event & Task Entry
- When the user asks to add an event or task directly, respond immediately with a [SUGGEST_EVENT] command:
  Format: [SUGGEST_EVENT]title|date|start_time|end_time|notes[/SUGGEST_EVENT]
  Example: [SUGGEST_EVENT]Dentist|2025-05-20|14:00|15:00|Routine checkup[/SUGGEST_EVENT]
- For all-day events, omit the times:
  [SUGGEST_EVENT]Mom's Birthday|2025-05-15||[/SUGGEST_EVENT]
- Only ask for essential missing information (title, date, or time). Be extremely brief.
- When the user confirms with "yes", "sure", or "confirm", respond with [ADD_EVENT] using the same format.
- Do not include explanations, greetings, or extra conversation. Focus strictly on the calendar task.

Date Handling - IMPORTANT
- Always use current or future dates, never past dates.
- When users mention weekdays like "Monday" or "Friday", assume they mean the next upcoming one.
  Example: If today is Tuesday and user says "Friday", use this Friday's date.
- For terms like "today", "tomorrow", "next week", "this weekend", calculate from the current date.
- For phrases like "first Monday of the month", use the next valid occurrence.
- Never use dates from past years (e.g., 2023) unless the user explicitly states them.

When Suggesting a Time
- If the user asks when they should do something (instead of telling you directly), gather details:
  - What's the deadline?
  - How long will it take?
  - Preferred time of day (morning, afternoon, evening)?
  - Any known schedule conflicts?
- Based on availability and urgency, suggest the most appropriate time.
- Format the suggestion using [SUGGEST_EVENT].
- Ask only if truly necessary. Be concise.

Context Awareness
- Use earlier messages to fill in missing details. For example:
  User: Add meeting with Sarah  
  User: at 3pm tomorrow  
  You: [SUGGEST_EVENT]Meeting with Sarah|2025-05-15|15:00|16:00|[/SUGGEST_EVENT]
- If user says "reschedule" or "move it," treat it as an update. Ask for the new time/date and suggest again.

Recurring Events
- For things like "every Monday", "weekly", or "daily", treat the task as recurring.
- Add recurrence details to the notes field.
  Example:
  [SUGGEST_EVENT]Workout|2025-05-19|07:00|08:00|Repeat every Monday[/SUGGEST_EVENT]

Priority Handling
- For events marked "urgent", "ASAP", or "important", suggest the earliest possible time.
- Note urgency in the notes field.
  Example:
  [SUGGEST_EVENT]Call client|2025-05-14|09:00|09:30|Urgent follow-up call[/SUGGEST_EVENT]

Formatting Rules
- Keep all [SUGGEST_EVENT] and [ADD_EVENT] commands on one line with no extra line breaks or characters.
- Use only brackets and vertical bars (|) to separate fields.
- Do not use emojis, small talk, or filler text unless included in the event title or notes.
"""

# Create a global dictionary to store conversation memories for each user
conversation_memories = {}

def load_calendar_events(user_id="default"):
    """Load calendar events for a specific user"""
    filename = f"{user_id}_{CALENDAR_FILE}"
    if os.path.exists(filename):
        try:
            with open(filename, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            print(f"Error reading calendar file for user {user_id}. Creating new calendar.")
            return []
    return []

def save_calendar_events(events, user_id="default"):
    """Save calendar events for a specific user"""
    filename = f"{user_id}_{CALENDAR_FILE}"
    with open(filename, 'w') as f:
        json.dump(events, f, indent=2)

def add_event(title, date, start_time, end_time=None, notes=None, is_all_day=False, user_id="default"):
    """Add a new event to the calendar"""
    events = load_calendar_events(user_id)
    
    new_event = {
        "id": len(events) + 1,
        "title": title,
        "date": date,
        "is_all_day": is_all_day,
        "allDay": is_all_day,  # Add both property names for compatibility
        "notes": notes or ""
    }
    
    if not is_all_day:
        new_event["startTime"] = start_time
        new_event["endTime"] = end_time or start_time
    
    # Add default color
    new_event["color"] = "#4285f4"
    
    events.append(new_event)
    save_calendar_events(events, user_id)
    return new_event

def update_event(event_id, updates, user_id="default"):
    """Update an existing event"""
    events = load_calendar_events(user_id)
    for event in events:
        if event["id"] == event_id:
            event.update(updates)
            save_calendar_events(events, user_id)
            return event
    return None

def delete_event(event_id, user_id="default"):
    """Delete an event"""
    events = load_calendar_events(user_id)
    events = [e for e in events if e["id"] != event_id]
    save_calendar_events(events, user_id)
    return True

def add_recurring_events(base_event, recurrence_pattern, user_id="default"):
    """Add recurring events based on pattern"""
    events = []
    base_date = datetime.datetime.strptime(base_event["date"], "%Y-%m-%d")
    
    if "weekly" in recurrence_pattern.lower():
        # Add events for each week
        weeks = 1
        if "for" in recurrence_pattern.lower():
            try:
                weeks = int(recurrence_pattern.lower().split("for")[1].split("week")[0].strip())
            except:
                weeks = 1
        
        for week in range(weeks):
            new_date = base_date + timedelta(weeks=week)
            new_event = base_event.copy()
            new_event["date"] = new_date.strftime("%Y-%m-%d")
            new_event["id"] = len(load_calendar_events(user_id)) + len(events) + 1
            events.append(new_event)
    
    return events

def add_date_range_events(title, start_date, end_date, start_time=None, end_time=None, notes=None, user_id="default"):
    """Add events for a date range"""
    events = []
    current_date = datetime.datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.datetime.strptime(end_date, "%Y-%m-%d")
    
    # Set default work hours if not specified
    if "work" in title.lower():
        start_time = start_time or "09:00"
        end_time = end_time or "17:00"
    
    while current_date <= end:
        # Skip weekends if this is a work schedule
        if "work" in title.lower() and current_date.weekday() >= 5:
            current_date += timedelta(days=1)
            continue
        
        # Get existing events for this user
        events_list = load_calendar_events(user_id)
        
        new_event = {
            "id": len(events_list) + len(events) + 1,
            "title": title,
            "date": current_date.strftime("%Y-%m-%d"),
            "is_all_day": not (start_time and end_time),
            "allDay": not (start_time and end_time),
            "color": "#4285f4",
            "notes": notes or ""
        }
        
        if start_time:
            new_event["startTime"] = start_time
        if end_time:
            new_event["endTime"] = end_time
        
        events.append(new_event)
        current_date += timedelta(days=1)
    
    # Save all events
    current_events = load_calendar_events(user_id)
    current_events.extend(events)
    save_calendar_events(current_events, user_id)
    
    return events

def parse_event_command(response_text):
    """Parse event commands from the LLM response"""
    event_data = None
    clean_response = response_text
    event_command = None
    
    # Check for SUGGEST_EVENT command
    if "[SUGGEST_EVENT]" in response_text:
        try:
            # Extract the event data between the command markers
            event_data = response_text.split("[SUGGEST_EVENT]")[1].split("[/SUGGEST_EVENT]")[0].strip()
            # Remove the command markers from the response
            clean_response = response_text.replace(f"[SUGGEST_EVENT]{event_data}[/SUGGEST_EVENT]", "").strip()
            event_command = "suggest"
            
            # Parse the event data
            parts = event_data.split("|")
            
            # Handle date ranges and recurring patterns
            date_str = parts[1].strip()
            start_date = None
            end_date = None
            recurrence = None
            
            # Check for date range (e.g., "2024-03-18 to 2024-03-22")
            if " to " in date_str:
                start_date_str, end_date_str = date_str.split(" to ")
                start_date = normalize_date(start_date_str)
                end_date = normalize_date(end_date_str)
            else:
                start_date = normalize_date(date_str)
                # For work schedules that mention "next week", automatically set end date to Friday
                if "next week" in date_str.lower() and "work" in parts[0].lower():
                    start_date_obj = datetime.datetime.strptime(start_date, "%Y-%m-%d")
                    # Calculate the following Friday
                    days_to_friday = 4 - start_date_obj.weekday()  # Friday is 4
                    if days_to_friday < 0:
                        days_to_friday += 7
                    end_date = (start_date_obj + timedelta(days=days_to_friday)).strftime("%Y-%m-%d")
            
            # Check for recurring pattern in notes
            if len(parts) > 4 and parts[4]:
                notes = parts[4].strip()
                if "repeat" in notes.lower() or "every" in notes.lower() or "weekly" in notes.lower():
                    recurrence = notes
            
            is_all_day = len(parts) <= 3 or not parts[2].strip()
            
            # For work schedules, set default times if not specified
            if "work" in parts[0].lower() and is_all_day:
                is_all_day = False
                parts.extend(["09:00", "17:00"] if len(parts) <= 3 else [])
            
            event = {
                "title": parts[0].strip(),
                "date": start_date,
                "is_all_day": is_all_day,
                "allDay": is_all_day,
                "color": "#4285f4"
            }
            
            if len(parts) > 2 and parts[2].strip():
                event["startTime"] = parts[2].strip()
            if len(parts) > 3 and parts[3].strip():
                event["endTime"] = parts[3].strip()
            if len(parts) > 4:
                event["notes"] = parts[4].strip()
            
            # Add additional metadata for date ranges and recurrence
            if end_date:
                event["end_date"] = end_date
            if recurrence:
                event["recurrence"] = recurrence
            
            return event, clean_response, event_command
        except Exception as e:
            print(f"Error parsing suggest event command: {e}")
            return None, response_text, None
    
    # Check for ADD_EVENT command (similar logic as SUGGEST_EVENT)
    if "[ADD_EVENT]" in response_text:
        # ... (same logic as SUGGEST_EVENT, just change the command name)
        return None, response_text, None
    
    return None, clean_response, None

def normalize_date(date_str):
    """Ensure date is current or future, not in the past"""
    try:
        # Handle "next week" references
        if "next week" in date_str.lower():
            current_date = datetime.datetime.now()
            # Calculate days until next Monday
            days_until_monday = (7 - current_date.weekday()) % 7
            if days_until_monday == 0:  # If today is Monday
                days_until_monday = 7   # Go to next Monday
            next_monday = current_date + timedelta(days=days_until_monday)
            return next_monday.strftime("%Y-%m-%d")
        
        # Parse the date string
        date_parts = date_str.split('-')
        
        # Handle YYYY-MM-DD format
        if len(date_parts) == 3 and len(date_parts[0]) == 4:
            year, month, day = map(int, date_parts)
            input_date = datetime.date(year, month, day)
            
            # If date is in the past, adjust to current year or next occurrence
            current_date = datetime.datetime.now().date()
            
            if input_date < current_date:
                # Try with current year first
                current_year = current_date.year
                try:
                    adjusted_date = datetime.date(current_year, month, day)
                    # If still in the past, use next year
                    if adjusted_date < current_date:
                        adjusted_date = datetime.date(current_year + 1, month, day)
                    return adjusted_date.isoformat()
                except ValueError:
                    # Handle Feb 29 and similar edge cases
                    return current_date.isoformat()
            
            return date_str
        else:
            # For non-standard formats, return as is but log warning
            print(f"Warning: Non-standard date format: {date_str}")
            return date_str
            
    except Exception as e:
        print(f"Error normalizing date {date_str}: {e}")
        # If parsing fails, return current date as fallback
        return datetime.datetime.now().date().isoformat()

def get_or_create_memory(user_id):
    """Get or create a conversation memory for a user"""
    if user_id not in conversation_memories:
        conversation_memories[user_id] = ConversationBufferMemory(return_messages=True)
    return conversation_memories[user_id]

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    
    user_id = data.get('user_id', 'default')
    message = data.get('message', '')
    pending_event = data.get('pending_event', None)
    
    if not message:
        return jsonify({"error": "No message provided"}), 400
    
    try:
        # Initialize Ollama model
        model = OllamaLLM(model="llama3")
        
        # Get or create user memory
        memory = get_or_create_memory(user_id)
        
        # Create prompt template with memory
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_template),
            MessagesPlaceholder(variable_name="history"),
            ("human", "{input}")
        ])
        
        # Create conversation chain
        chain = prompt | model
        
        # Get current calendar events to provide context
        events = load_calendar_events(user_id)
        events_context = f"Current calendar events: {json.dumps(events)}\n" if events else "No events in calendar.\n"
        
        # Add current date context to help with relative date references
        today = datetime.datetime.now()
        current_date_context = f"Current date: {today.strftime('%Y-%m-%d')} ({today.strftime('%A')})\n"
        
        # Check if the user is confirming a pending event
        confirmation_input = ""
        event_added = False
        add_result = None
        
        # Directly handle confirmations for better user experience
        if pending_event and message.lower() in ["yes", "y", "sure", "confirm", "ok", "okay", "yeah", "yep", "please do", "go ahead"]:
            # Directly add the event instead of asking the AI to do it
            add_result = add_event(
                title=pending_event["title"],
                date=pending_event["date"],
                start_time=pending_event.get("startTime"),
                end_time=pending_event.get("endTime"),
                notes=pending_event.get("notes", ""),
                is_all_day=pending_event.get("is_all_day", pending_event.get("allDay", False)),
                user_id=user_id
            )
            event_added = True
            confirmation_input = "\nEvent added to calendar."
            
            # Store the message in the AI's context too
            memory.chat_memory.add_user_message(message)
            memory.chat_memory.add_ai_message(f"I've added the event to your calendar: {pending_event['title']} on {pending_event['date']}.")
            
            return jsonify({
                "response": "Event added to calendar.",
                "event_added": True,
                "event_suggested": False,
                "event_data": None,
                "add_result": add_result
            })
        elif pending_event and message.lower() in ["no", "n", "nope", "cancel", "don't", "do not"]:
            # User declined
            confirmation_input = f"\nUser declined to add the event: {json.dumps(pending_event)}."
            # Store the message in the AI's context
            memory.chat_memory.add_user_message(message)
            memory.chat_memory.add_ai_message("I've cancelled the event creation.")
            
            return jsonify({
                "response": "Event cancelled.",
                "event_added": False,
                "event_suggested": False,
                "event_data": None,
                "add_result": None
            })
        
        # Combine user input with calendar context and any confirmation context
        augmented_input = f"{current_date_context}{events_context}\n{message}{confirmation_input}"
        
        # Get conversation history
        history = memory.chat_memory.messages
        
        # Run the chain with user input and history
        response = chain.invoke({
            "history": history,
            "input": augmented_input
        })
        
        # Parse any event commands in the response
        event_data, clean_response, event_command = parse_event_command(response)
        
        # Process based on command type
        if event_command == "add" and event_data:
            # Handle date ranges and recurring events
            if "end_date" in event_data:
                # Add events for date range
                events = add_date_range_events(
                    title=event_data["title"],
                    start_date=event_data["date"],
                    end_date=event_data["end_date"],
                    start_time=event_data.get("startTime", "09:00"),  # Default to 9 AM for work events
                    end_time=event_data.get("endTime", "17:00"),     # Default to 5 PM for work events
                    notes=event_data.get("notes", ""),
                    user_id=user_id
                )
                add_result = events
                event_added = True
            elif "recurrence" in event_data:
                # Add recurring events
                events = add_recurring_events(event_data, event_data["recurrence"], user_id)
                add_result = events
                event_added = True
            else:
                # Add single event
                add_result = add_event(
                    title=event_data["title"],
                    date=event_data["date"],
                    start_time=event_data.get("startTime"),
                    end_time=event_data.get("endTime"),
                    notes=event_data.get("notes", ""),
                    is_all_day=event_data["is_all_day"],
                    user_id=user_id
                )
                event_added = True
        
        # Store conversation
        memory.chat_memory.add_user_message(message)
        memory.chat_memory.add_ai_message(clean_response)
        
        return jsonify({
            "response": clean_response,
            "event_added": event_command == "add" and event_data is not None,
            "event_suggested": event_command == "suggest" and event_data is not None,
            "event_data": event_data,
            "add_result": add_result
        })
    
    except Exception as e:
        return jsonify({
            "error": str(e),
            "response": "Error processing request. Try again."
        }), 500

@app.route('/api/events', methods=['GET'])
def get_events():
    user_id = request.args.get('user_id', 'default')
    events = load_calendar_events(user_id)
    return jsonify(events)

@app.route('/api/events/<int:event_id>', methods=['PUT'])
def update_event_endpoint(event_id):
    user_id = request.args.get('user_id', 'default')
    updates = request.json
    result = update_event(event_id, updates, user_id)
    if result:
        return jsonify(result)
    return jsonify({"error": "Event not found"}), 404

@app.route('/api/events/<int:event_id>', methods=['DELETE'])
def delete_event_endpoint(event_id):
    user_id = request.args.get('user_id', 'default')
    if delete_event(event_id, user_id):
        return jsonify({"success": True})
    return jsonify({"error": "Event not found"}), 404

if __name__ == '__main__':
    app.run(debug=True, port=5000) 