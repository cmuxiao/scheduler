/**
 * Calendar class to handle all calendar functionality
 */
class Calendar {
    constructor() {
        this.date = new Date();
        this.events = JSON.parse(localStorage.getItem('events')) || [];
        this.currentView = 'month';
        this.messages = JSON.parse(localStorage.getItem('chatMessages')) || [];
        
        this.initializeElements();
        this.attachEventListeners();
        this.render();
        this.renderMessages();
    }

    /**
     * Initialize all DOM elements
     */
    initializeElements() {
        this.calendarElement = document.getElementById('calendar');
        this.currentDateElement = document.getElementById('currentDate');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.monthViewBtn = document.getElementById('monthView');
        this.weekViewBtn = document.getElementById('weekView');
        this.todayBtn = document.getElementById('todayBtn');
        this.todayBtn.textContent = 'Day';
        this.createEventBtn = document.getElementById('createEventBtn');
        this.modal = document.getElementById('eventModal');
        this.eventForm = document.getElementById('eventForm');
        this.closeModal = document.querySelector('.close');
        this.colorPicker = document.getElementById('eventColor');

        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendMessageBtn = document.getElementById('sendMessage');
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Navigation
        this.prevBtn.addEventListener('click', () => this.navigate(-1));
        this.nextBtn.addEventListener('click', () => this.navigate(1));
        
        // View controls
        this.monthViewBtn.addEventListener('click', () => this.changeView('month'));
        this.weekViewBtn.addEventListener('click', () => this.changeView('week'));
        this.todayBtn.addEventListener('click', () => this.goToToday());
        
        // Event modal
        this.createEventBtn.addEventListener('click', () => this.openEventModal(new Date()));
        this.closeModal.addEventListener('click', () => this.closeEventModal());
        this.eventForm.addEventListener('submit', (e) => this.handleEventSubmit(e));
        
        // Chat
        this.sendMessageBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Close modal on outside click
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.closeEventModal();
            }
        });

        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeEventModal();
            }
        });
    }

    /**
     * Navigate to previous or next period
     */
    navigate(direction) {
        if (this.currentView === 'month') {
            this.date.setMonth(this.date.getMonth() + direction);
        } else if (this.currentView === 'week') {
            this.date.setDate(this.date.getDate() + (direction * 7));
        } else if (this.currentView === 'day') {
            this.date.setDate(this.date.getDate() + direction);
        }
        this.render();
    }

    /**
     * Change the current view
     */
    changeView(view) {
        this.currentView = view;
        this.monthViewBtn.classList.toggle('active', view === 'month');
        this.weekViewBtn.classList.toggle('active', view === 'week');
        this.todayBtn.classList.toggle('active', view === 'day');
        this.calendarElement.classList.toggle('week-view', view === 'week');
        this.calendarElement.classList.toggle('day-view', view === 'day');
        this.render();
    }

    /**
     * Go to today's date
     */
    goToToday() {
        this.date = new Date();
        this.currentView = 'day';
        this.monthViewBtn.classList.remove('active');
        this.weekViewBtn.classList.remove('active');
        this.todayBtn.classList.add('active');
        this.calendarElement.classList.remove('week-view');
        this.calendarElement.classList.add('day-view');
        this.render();
    }

    /**
     * Main render method
     */
    render() {
        this.updateHeader();
        this.calendarElement.innerHTML = '';
        this.calendarElement.className = 'calendar';
        
        if (this.currentView === 'month') {
            this.renderMonth();
        } else if (this.currentView === 'week') {
            this.renderWeek();
        } else if (this.currentView === 'day') {
            this.renderDay();
        }
    }

    /**
     * Update the header with current date range
     */
    updateHeader() {
        if (this.currentView === 'week') {
            const weekStart = new Date(this.date);
            weekStart.setDate(this.date.getDate() - this.date.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);

            const startMonth = weekStart.toLocaleString('default', { month: 'short' });
            const endMonth = weekEnd.toLocaleString('default', { month: 'short' });
            const startDay = weekStart.getDate();
            const endDay = weekEnd.getDate();
            const startYear = weekStart.getFullYear();
            const endYear = weekEnd.getFullYear();

            if (startMonth === endMonth && startYear === endYear) {
                this.currentDateElement.textContent = `${startMonth} ${startDay}–${endDay}, ${startYear}`;
            } else if (startYear === endYear) {
                this.currentDateElement.textContent = `${startMonth} ${startDay}–${endMonth} ${endDay}, ${startYear}`;
            } else {
                this.currentDateElement.textContent = `${startMonth} ${startDay}, ${startYear}–${endMonth} ${endDay}, ${endYear}`;
            }
        } else if (this.currentView === 'day') {
            const options = { 
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            };
            this.currentDateElement.textContent = this.date.toLocaleDateString(undefined, options);
        } else {
            const options = { month: 'long', year: 'numeric' };
            this.currentDateElement.textContent = this.date.toLocaleDateString(undefined, options);
        }
    }

    /**
     * Render the month view
     */
    renderMonth() {
        const year = this.date.getFullYear();
        const month = this.date.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        const startingDay = firstDay.getDay();
        const totalDays = lastDay.getDate();
        
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        
        // Always render 5 weeks (35 days)
        const totalDaysToRender = 35;
        
        for (let i = 0; i < totalDaysToRender; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            let dayNumber;
            let isCurrentMonth = true;
            
            if (i < startingDay) {
                // Previous month days
                dayNumber = prevMonthLastDay - startingDay + i + 1;
                isCurrentMonth = false;
            } else if (i >= startingDay + totalDays) {
                // Next month days
                dayNumber = i - startingDay - totalDays + 1;
                isCurrentMonth = false;
            } else {
                // Current month days
                dayNumber = i - startingDay + 1;
            }
            
            if (!isCurrentMonth) {
                dayElement.classList.add('other-month');
            }
            
            const currentDate = new Date(year, month, dayNumber);
            dayElement.dataset.date = currentDate.toISOString();
            
            if (this.isToday(currentDate)) {
                dayElement.classList.add('today');
            }
            
            dayElement.innerHTML = `<div class="day-number">${dayNumber}</div>`;
            this.renderEvents(dayElement, currentDate);
            
            dayElement.addEventListener('click', () => this.openEventModal(currentDate));
            this.calendarElement.appendChild(dayElement);
        }
    }

    /**
     * Render the week view
     */
    renderWeek() {
        this.calendarElement.classList.add('week-view');
        
        // Create time slots column
        const timeSlots = document.createElement('div');
        timeSlots.className = 'time-slots';
        
        // Generate time slots for 24 hours
        for (let hour = 0; hour < 24; hour++) {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            const time = new Date();
            time.setHours(hour, 0, 0, 0);
            timeSlot.textContent = time.toLocaleTimeString(undefined, { 
                hour: 'numeric',
                minute: '2-digit',
                hour12: true 
            });
            timeSlots.appendChild(timeSlot);
        }
        
        this.calendarElement.appendChild(timeSlots);
        
        const weekStart = new Date(this.date);
        weekStart.setDate(this.date.getDate() - this.date.getDay());
        
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(weekStart);
            currentDate.setDate(weekStart.getDate() + i);
            
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.dataset.date = currentDate.toISOString();
            
            if (this.isToday(currentDate)) {
                dayElement.classList.add('today');
            }
            
            // Create time slots for each day
            for (let hour = 0; hour < 24; hour++) {
                const timeSlot = document.createElement('div');
                timeSlot.className = 'time-slot';
                timeSlot.style.height = '60px';
                timeSlot.dataset.hour = hour;
                
                // Add click handler for creating events at specific times
                timeSlot.addEventListener('click', (e) => {
                    const date = new Date(currentDate);
                    date.setHours(hour, 0, 0, 0);
                    this.openEventModal(date);
                });
                
                dayElement.appendChild(timeSlot);
            }
            
            this.renderEvents(dayElement, currentDate);
            this.calendarElement.appendChild(dayElement);
        }
    }

    /**
     * Render the day view
     */
    renderDay() {
        this.calendarElement.classList.add('day-view');
        
        // Create time slots column
        const timeSlots = document.createElement('div');
        timeSlots.className = 'time-slots';
        
        // Generate time slots for 24 hours
        for (let hour = 0; hour < 24; hour++) {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            const time = new Date();
            time.setHours(hour, 0, 0, 0);
            timeSlot.textContent = time.toLocaleTimeString(undefined, { 
                hour: 'numeric',
                minute: '2-digit',
                hour12: true 
            });
            timeSlots.appendChild(timeSlot);
        }
        
        this.calendarElement.appendChild(timeSlots);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.dataset.date = this.date.toISOString();
        
        if (this.isToday(this.date)) {
            dayElement.classList.add('today');
        }
        
        // Create time slots for the day
        for (let hour = 0; hour < 24; hour++) {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.style.height = '60px';
            timeSlot.dataset.hour = hour;
            
            // Add click handler for creating events at specific times
            timeSlot.addEventListener('click', (e) => {
                const date = new Date(this.date);
                date.setHours(hour, 0, 0, 0);
                this.openEventModal(date);
            });
            
            dayElement.appendChild(timeSlot);
        }
        
        this.renderEvents(dayElement, this.date);
        this.calendarElement.appendChild(dayElement);
    }

    /**
     * Render events for a specific day
     */
    renderEvents(dayElement, date) {
        const dayEvents = this.events.filter(event => {
            // Compare dates using the stored date string format
            const eventDate = event.date;
            const currentDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            return eventDate === currentDate;
        });
        
        // Sort events by time
        dayEvents.sort((a, b) => {
            const timeA = this.parseTimeString(a.time);
            const timeB = this.parseTimeString(b.time);
            return timeA - timeB;
        });
        
        dayEvents.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = 'event';
            eventElement.style.backgroundColor = event.color || '#4285f4';
            
            if (this.currentView === 'week' || this.currentView === 'day') {
                // Parse the time to get hours and minutes
                const [time, period] = event.time.split(' ');
                const [hours, minutes] = time.split(':').map(Number);
                const adjustedHours = period === 'PM' && hours !== 12 ? hours + 12 : 
                                    period === 'AM' && hours === 12 ? 0 : hours;
                
                // Position the event based on its time
                const top = (adjustedHours * 60 + minutes) * (60 / 60); // 60px per hour
                eventElement.style.top = `${top}px`;
                eventElement.style.height = '60px'; // Default 1-hour duration
                
                // Add event details
                const eventContent = document.createElement('div');
                eventContent.className = 'event-content';
                eventContent.innerHTML = `
                    <div class="event-time">${event.time}</div>
                    <div class="event-title">${event.title}</div>
                `;
                eventElement.appendChild(eventContent);
            } else {
                // For month view, show a more compact event display
                eventElement.textContent = `${event.time} ${event.title}`;
            }
            
            eventElement.dataset.eventId = event.id;
            
            eventElement.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Delete this event?')) {
                    this.deleteEvent(event.id);
                }
            });
            
            dayElement.appendChild(eventElement);
        });
    }

    /**
     * Check if a date is today
     */
    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    /**
     * Open the event modal
     */
    openEventModal(date) {
        this.modal.style.display = 'block';
        
        // Format the date for the input using local date string
        const dateInput = document.getElementById('eventDate');
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        dateInput.value = `${year}-${month}-${day}`;
        
        // Format the time for the input
        const timeInput = document.getElementById('eventTime');
        const periodSelect = document.getElementById('eventPeriod');
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        const formattedMinutes = minutes.toString().padStart(2, '0');
        timeInput.value = `${formattedHours}:${formattedMinutes}`;
        periodSelect.value = ampm;
        
        // Reset color to default (first option)
        document.getElementById('color1').checked = true;
        
        document.getElementById('eventTitle').focus();
    }

    /**
     * Close the event modal
     */
    closeEventModal() {
        this.modal.style.display = 'none';
        this.eventForm.reset();
    }

    /**
     * Handle event form submission
     */
    handleEventSubmit(e) {
        e.preventDefault();
        
        const title = document.getElementById('eventTitle').value.trim();
        if (!title) {
            alert('Please enter an event title');
            return;
        }
        
        // Parse the date and time
        const dateStr = document.getElementById('eventDate').value;
        const timeStr = document.getElementById('eventTime').value;
        const period = document.getElementById('eventPeriod').value;
        const color = document.querySelector('input[name="eventColor"]:checked').value;
        
        // Create a new date object from the input values
        const [year, month, day] = dateStr.split('-').map(Number);
        const [hours, minutes] = timeStr.split(':').map(Number);
        
        // Adjust hours for PM
        let adjustedHours = hours;
        if (period === 'PM' && hours !== 12) {
            adjustedHours += 12;
        } else if (period === 'AM' && hours === 12) {
            adjustedHours = 0;
        }
        
        // Create date using local values
        const eventDate = new Date(year, month - 1, day, adjustedHours, minutes);
        
        const event = {
            id: Date.now(),
            title: title,
            date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
            time: `${timeStr} ${period}`,
            color: color
        };
        
        this.events.push(event);
        localStorage.setItem('events', JSON.stringify(this.events));
        this.closeEventModal();
        this.render();
    }

    /**
     * Parse time string to minutes for sorting
     */
    parseTimeString(timeStr) {
        const [time, period] = timeStr.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        let totalMinutes = hours * 60 + minutes;
        if (period === 'PM' && hours !== 12) {
            totalMinutes += 12 * 60;
        } else if (period === 'AM' && hours === 12) {
            totalMinutes = minutes;
        }
        return totalMinutes;
    }

    /**
     * Delete an event
     */
    deleteEvent(eventId) {
        this.events = this.events.filter(e => e.id !== eventId);
        localStorage.setItem('events', JSON.stringify(this.events));
        this.render();
    }

    /**
     * Send a chat message
     */
    sendMessage() {
        const messageText = this.messageInput.value.trim();
        if (!messageText) return;

        const message = {
            id: Date.now(),
            text: messageText,
            timestamp: new Date().toISOString(),
            sent: true // true for sent messages, false for received
        };

        this.messages.push(message);
        localStorage.setItem('chatMessages', JSON.stringify(this.messages));
        
        this.messageInput.value = '';
        this.renderMessages();

        // Simulate a response after 1 second
        setTimeout(() => {
            const response = {
                id: Date.now(),
                text: "This is an automated response. I'm a demo chat!",
                timestamp: new Date().toISOString(),
                sent: false
            };
            this.messages.push(response);
            localStorage.setItem('chatMessages', JSON.stringify(this.messages));
            this.renderMessages();
        }, 1000);
    }

    /**
     * Render chat messages
     */
    renderMessages() {
        this.chatMessages.innerHTML = '';
        
        this.messages.forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.className = `message ${message.sent ? 'sent' : 'received'}`;
            messageElement.textContent = message.text;
            this.chatMessages.appendChild(messageElement);
        });

        // Scroll to bottom
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
}

// Initialize the calendar when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Calendar();
}); 