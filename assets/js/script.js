/**
 * Calendar class to handle all calendar functionality
 */
class Calendar {
    constructor() {
        this.date = new Date();
        this.userEmail = localStorage.getItem('loggedInUser');
        this.events = this.loadUserEvents();
        this.currentView = 'month';
        this.messages = JSON.parse(localStorage.getItem('chatMessages')) || [];
        
        // Use a configurable API URL with fallback
        this.chatApiUrl = localStorage.getItem('chatApiUrl') || 'http://localhost:5000/api/chat';
        this.isChatbotReady = false;
        this.useFallbackChat = localStorage.getItem('useFallbackChat') === 'true';
        
        // Track pending event suggestions
        this.pendingEvent = null;
        
        this.initializeElements();
        this.attachEventListeners();
        this.populateUserInfo();
        this.render();
        this.renderMessages();
        
        // Welcome message while checking server
        this.addBotMessage("Welcome to your calendar assistant! I'm connecting to the AI service...");
        this.checkChatbotServer();
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
        this.chatToggle = document.getElementById('chatToggle');
        this.chatSection = document.querySelector('.chat-section');
        this.closeChat = document.querySelector('.close-chat');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.reconnectButton = document.getElementById('reconnectButton');
        this.quickActionButtons = document.getElementById('quickActionButtons') || this.createQuickActionButtons();

        // Sidebar toggle
        this.sidebar = document.querySelector('.sidebar');
        this.sidebarToggle = document.getElementById('sidebarToggle');

        // Logout button
        this.logoutBtn = document.getElementById('logoutBtn');

        // User menu
        this.userMenuContainer = document.querySelector('.user-menu-container');
        this.userAvatar = document.getElementById('userAvatar');
        this.userDropdown = document.getElementById('userDropdown');
        this.userName = document.getElementById('userName');
        this.userEmailDisplay = document.getElementById('userEmail');
    }

    /**
     * Create quick action buttons for common chat commands
     */
    createQuickActionButtons() {
        // Create container if it doesn't exist
        const container = document.createElement('div');
        container.id = 'quickActionButtons';
        container.className = 'quick-action-buttons';
        
        // Add button for creating an event today
        const createTodayButton = document.createElement('button');
        createTodayButton.className = 'quick-action-button';
        createTodayButton.innerHTML = '<i class="fas fa-plus"></i> Today';
        createTodayButton.addEventListener('click', () => {
            this.messageInput.value = 'Add event today';
            this.sendMessage();
        });
        
        // Add button for creating an event tomorrow
        const createTomorrowButton = document.createElement('button');
        createTomorrowButton.className = 'quick-action-button';
        createTomorrowButton.innerHTML = '<i class="fas fa-plus"></i> Tomorrow';
        createTomorrowButton.addEventListener('click', () => {
            this.messageInput.value = 'Add event tomorrow';
            this.sendMessage();
        });
        
        // Add button for creating a meeting
        const createMeetingButton = document.createElement('button');
        createMeetingButton.className = 'quick-action-button';
        createMeetingButton.innerHTML = '<i class="fas fa-users"></i> Meeting';
        createMeetingButton.addEventListener('click', () => {
            this.messageInput.value = 'Add a meeting';
            this.sendMessage();
        });
        
        // Add button for showing events
        const showEventsButton = document.createElement('button');
        showEventsButton.className = 'quick-action-button';
        showEventsButton.innerHTML = '<i class="fas fa-calendar"></i> Events';
        showEventsButton.addEventListener('click', () => {
            this.messageInput.value = 'Show my events';
            this.sendMessage();
        });
        
        // Add buttons to container
        container.appendChild(createTodayButton);
        container.appendChild(createTomorrowButton);
        container.appendChild(createMeetingButton);
        container.appendChild(showEventsButton);
        
        // Insert the container at the right location
        const chatInput = document.querySelector('.chat-input');
        chatInput.parentNode.insertBefore(container, chatInput);
        
        return container;
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

        // Chat toggle
        this.chatToggle.addEventListener('click', () => this.toggleChat());
        this.closeChat.addEventListener('click', () => this.toggleChat());

        // Sidebar toggle
        if (this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', () => {
                this.sidebar.classList.toggle('collapsed');
            });
        }

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

        // Logout button (in dropdown)
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Fallback: always log out and redirect
                localStorage.removeItem('loggedInUser');
                window.location.href = 'login.html';
            });
        }

        // User avatar dropdown
        if (this.userAvatar && this.userMenuContainer) {
            this.userAvatar.addEventListener('click', (e) => {
                e.stopPropagation();
                this.userMenuContainer.classList.toggle('open');
            });
            // Hide dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!this.userMenuContainer.contains(e.target)) {
                    this.userMenuContainer.classList.remove('open');
                }
            });
        }

        // Reconnect button
        if (this.reconnectButton) {
            this.reconnectButton.addEventListener('click', () => {
                this.reconnectChatbot();
            });
        }
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
        
        // Always show and render the mini calendar
        const miniCalendar = document.getElementById('miniCalendar');
        miniCalendar.style.display = 'block';
        this.renderMiniCalendar();
        
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
            
            // Create day number element
            const dayNumberElement = document.createElement('div');
            dayNumberElement.className = 'day-number';
            dayNumberElement.textContent = dayNumber;
            dayElement.appendChild(dayNumberElement);
            
            // Create events container
            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'events';
            dayElement.appendChild(eventsContainer);
            
            // Add click handler for adding events
            dayElement.addEventListener('click', () => {
                this.openEventModal(currentDate);
            });
            
            this.calendarElement.appendChild(dayElement);
            
            // Render events for this day
            this.renderEvents(dayElement, currentDate);
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
            const eventDate = new Date(event.date);
            return eventDate.getDate() === date.getDate() &&
                   eventDate.getMonth() === date.getMonth() &&
                   eventDate.getFullYear() === date.getFullYear();
        });
        
        const eventsContainer = dayElement.querySelector('.events');
        if (!eventsContainer) return;
        
        eventsContainer.innerHTML = '';
        
        dayEvents.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = 'event';
            
            // Set event color (handle events from manual creation and chatbot)
            const color = event.color || '#4285f4';
            eventElement.style.backgroundColor = color.endsWith('fe') ? color : `${color}20`; // Add transparency for non-opacity colors
            eventElement.style.borderLeftColor = color;
            eventElement.style.color = color.replace(/20$/, ''); // Remove transparency if present
            
            // Check for all-day (handle both property names)
            const isAllDay = event.allDay || event.is_all_day || false;
            
            if (this.currentView === 'week' || this.currentView === 'day') {
                if (!isAllDay) {
                    // Parse the time to get hours and minutes
                    const [startHour, startMinute] = event.startTime.split(':').map(Number);
                    const [endHour, endMinute] = event.endTime.split(':').map(Number);
                    
                    // Position the event based on its time
                    const top = (startHour * 60 + startMinute) * (60 / 60); // 60px per hour
                    const duration = ((endHour * 60 + endMinute) - (startHour * 60 + startMinute));
                    eventElement.style.top = `${top}px`;
                    eventElement.style.height = `${duration}px`;
                }
                
                // Add event details
                const eventContent = document.createElement('div');
                eventContent.className = 'event-content';
                eventContent.innerHTML = `
                    ${!isAllDay ? `<div class="event-time">${event.startTime} - ${event.endTime}</div>` : ''}
                    <div class="event-title">${event.title}</div>
                `;
                eventElement.appendChild(eventContent);
            } else {
                // For month view, show a more compact event display
                eventElement.innerHTML = `
                    <span class="event-title">${event.title}</span>
                    ${!isAllDay ? `<span class="event-time">${event.startTime}</span>` : ''}
                `;
            }
            
            // Add click event listener to show options
            eventElement.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent the day click event from firing
                this.showEventOptions(event);
            });
            
            eventsContainer.appendChild(eventElement);
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
        
        // Format the date for the input
        const dateInput = document.getElementById('eventDate');
        dateInput.value = date.toISOString().split('T')[0];
        
        // Set default times
        const startTimeInput = document.getElementById('startTime');
        const startAmPmSelect = document.getElementById('startAmPm');
        const endTimeInput = document.getElementById('endTime');
        const endAmPmSelect = document.getElementById('endAmPm');
        
        // Set default start time to current hour + 1
        const defaultStartHour = (date.getHours() + 1) % 24;
        const defaultEndHour = (defaultStartHour + 1) % 24;
        
        startTimeInput.value = `${defaultStartHour.toString().padStart(2, '0')}:00`;
        startAmPmSelect.value = defaultStartHour >= 12 ? 'PM' : 'AM';
        endTimeInput.value = `${defaultEndHour.toString().padStart(2, '0')}:00`;
        endAmPmSelect.value = defaultEndHour >= 12 ? 'PM' : 'AM';
        
        // Reset color to default (first option)
        document.getElementById('color1').checked = true;
        
        // Reset all-day checkbox
        document.getElementById('allDayEvent').checked = false;
        
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
        const allDay = document.getElementById('allDayEvent').checked;
        const startTime = document.getElementById('startTime').value;
        const startAmPm = document.getElementById('startAmPm').value;
        const endTime = document.getElementById('endTime').value;
        const endAmPm = document.getElementById('endAmPm').value;
        const color = document.querySelector('input[name="eventColor"]:checked').value;
        
        // Create a new date object from the input values
        const [year, month, day] = dateStr.split('-').map(Number);
        
        // Create the event object
        const event = {
            id: Date.now(),
            title: title,
            date: new Date(year, month - 1, day).toISOString(),
            allDay: allDay,
            color: color
        };
        
        // Add time if not all-day event
        if (!allDay) {
            if (!startTime || !endTime) {
                alert('Please enter both start and end times');
                return;
            }
            
            // Convert times to 24-hour format
            const [startHour, startMinute] = startTime.split(':').map(Number);
            const [endHour, endMinute] = endTime.split(':').map(Number);
            
            const adjustedStartHour = startAmPm === 'PM' && startHour !== 12 ? startHour + 12 : 
                                    startAmPm === 'AM' && startHour === 12 ? 0 : startHour;
            const adjustedEndHour = endAmPm === 'PM' && endHour !== 12 ? endHour + 12 : 
                                  endAmPm === 'AM' && endHour === 12 ? 0 : endHour;
            
            event.startTime = `${adjustedStartHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
            event.endTime = `${adjustedEndHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
        }
        
        // Add the event to the events array
        this.events.push(event);
        
        // Save to localStorage (user-specific)
        this.saveUserEvents();
        
        // Close modal and refresh calendar
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
        this.saveUserEvents();
        this.render();
    }

    /**
     * Update the connection status display
     */
    updateConnectionStatus(status) {
        if (!this.connectionStatus) return;
        
        // Remove all existing status classes
        this.connectionStatus.classList.remove('online', 'offline', 'connecting', 'fallback');
        
        switch (status) {
            case 'online':
                this.connectionStatus.classList.add('online');
                this.connectionStatus.textContent = 'Online';
                break;
            case 'offline':
                this.connectionStatus.classList.add('offline');
                this.connectionStatus.textContent = 'Offline';
                break;
            case 'connecting':
                this.connectionStatus.classList.add('connecting');
                this.connectionStatus.textContent = 'Connecting...';
                break;
            case 'fallback':
                this.connectionStatus.classList.add('fallback');
                this.connectionStatus.textContent = 'Local Mode';
                break;
            default:
                this.connectionStatus.classList.add('offline');
                this.connectionStatus.textContent = 'Unknown';
        }
    }

    /**
     * Check if the chatbot server is ready
     */
    checkChatbotServer() {
        // Update status to connecting
        this.updateConnectionStatus('connecting');
        
        // If fallback mode is already set, don't check the server
        if (this.useFallbackChat) {
            this.isChatbotReady = true;
            this.updateConnectionStatus('fallback');
            this.addBotMessage("I'm in local mode. Basic calendar functions only.");
            return;
        }

        fetch(this.chatApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: this.userEmail || 'default',
                message: 'ping'
            })
        })
        .then(response => {
            if (response.ok) {
                this.isChatbotReady = true;
                console.log('Chatbot server is ready');
                // Update status to online
                this.updateConnectionStatus('online');
                
                // Replace the welcome message
                const welcomeMsg = "Calendar assistant ready. How can I help?";
                // Find and replace the connecting message
                const connectingMsg = this.messages.find(m => m.text.includes("I'm connecting to the AI service"));
                if (connectingMsg) {
                    connectingMsg.text = welcomeMsg;
                    localStorage.setItem('chatMessages', JSON.stringify(this.messages));
                    this.renderMessages();
                } else {
                    this.addBotMessage(welcomeMsg);
                }
            } else {
                console.warn('Chatbot server returned an error:', response.statusText);
                this.updateConnectionStatus('offline');
                this.enableFallbackMode("Connection failed. Using simple mode.");
            }
        })
        .catch(error => {
            console.error('Error connecting to chatbot server:', error);
            this.updateConnectionStatus('offline');
            this.enableFallbackMode("Server connection failed. Using simple mode. Run 'python chat_server.py' for full features.");
        });
    }

    /**
     * Enable fallback chat mode when server is unavailable
     */
    enableFallbackMode(message) {
        this.useFallbackChat = true;
        this.isChatbotReady = true;
        localStorage.setItem('useFallbackChat', 'true');
        this.updateConnectionStatus('fallback');
        
        // Replace the connecting message with fallback notification
        const connectingMsg = this.messages.find(m => m.text.includes("I'm connecting to the AI service"));
        if (connectingMsg) {
            connectingMsg.text = message;
            localStorage.setItem('chatMessages', JSON.stringify(this.messages));
            this.renderMessages();
        } else {
            this.addBotMessage(message);
        }
    }

    /**
     * Add a bot message to the chat
     */
    addBotMessage(text, options = {}) {
        const message = {
            id: Date.now(),
            text: text,
            timestamp: new Date().toISOString(),
            sent: false, // false for received messages
            ...options
        };
        
        this.messages.push(message);
        localStorage.setItem('chatMessages', JSON.stringify(this.messages));
        this.renderMessages();
    }

    /**
     * Add a user message to the chat
     */
    addUserMessage(text) {
        const message = {
            id: Date.now(),
            text: text,
            timestamp: new Date().toISOString(),
            sent: true // true for sent messages
        };
        
        this.messages.push(message);
        localStorage.setItem('chatMessages', JSON.stringify(this.messages));
        this.renderMessages();
    }

    /**
     * Send a chat message
     */
    sendMessage() {
        const messageText = this.messageInput.value.trim();
        if (!messageText) return;

        // Add user message to chat
        this.addUserMessage(messageText);
        this.messageInput.value = '';

        // Add a "thinking" indicator
        const thinkingId = Date.now();
        const thinkingMessage = {
            id: thinkingId,
            text: "Thinking...",
            timestamp: new Date().toISOString(),
            sent: false,
            isThinking: true
        };
        this.messages.push(thinkingMessage);
        this.renderMessages();

        // Check if the chatbot server is ready
        if (!this.isChatbotReady) {
            // Remove thinking indicator after a short delay
            this.messages = this.messages.filter(m => m.id !== thinkingId);
            this.addBotMessage("I'm not connected to the AI assistant server. Please make sure it's running.");
            return;
        }

        // If using fallback chat mode
        if (this.useFallbackChat) {
            // Remove thinking indicator after a short delay
            setTimeout(() => {
                this.messages = this.messages.filter(m => m.id !== thinkingId);
                
                // Process simple commands with fallback responses
                const response = this.getFallbackResponse(messageText);
                this.addBotMessage(response);
            }, 500);
            return;
        }

        // Send message to API
        fetch(this.chatApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: this.userEmail || 'default',
                message: messageText,
                pending_event: this.pendingEvent // Include any pending event for confirmation
            })
        })
        .then(response => response.json())
        .then(data => {
            // Remove thinking indicator
            this.messages = this.messages.filter(m => m.id !== thinkingId);
            
            // Handle event suggestion
            if (data.event_suggested && data.event_data) {
                // Store the pending event
                this.pendingEvent = data.event_data;
                
                // Add the response with confirmation buttons
                this.addBotMessage(data.response, { 
                    eventSuggestion: true,
                    eventData: data.event_data 
                });
            } else {
                // Regular response
                this.addBotMessage(data.response);
                
                // If an event was added, refresh the calendar
                if (data.event_added && data.add_result) {
                    console.log('Event added by chatbot:', data.add_result);
                    // Fetch latest events instead of using the old loadUserEvents method
                    this.fetchAndUpdateEvents();
                    
                    // Clear pending event since it was added
                    this.pendingEvent = null;
                } else if (!data.event_suggested) {
                    // Clear pending event if no new event was suggested
                    this.pendingEvent = null;
                }
            }
        })
        .catch(error => {
            console.error('Error sending message to chatbot:', error);
            // Remove thinking indicator
            this.messages = this.messages.filter(m => m.id !== thinkingId);
            this.addBotMessage("I'm sorry, I encountered an error processing your request. Please try again or switch to simplified mode.");
            
            // Suggest switching to fallback mode
            if (!this.useFallbackChat) {
                setTimeout(() => {
                    this.addBotMessage("Would you like to switch to simplified assistant mode? Type 'switch to simple mode' to enable it.");
                }, 1000);
            }
        });
    }

    /**
     * Get a simple fallback response for basic calendar questions
     */
    getFallbackResponse(message) {
        message = message.toLowerCase();
        
        // Check for mode switching command
        if (message.includes('switch to online mode') || message.includes('disable fallback') || message.includes('use server')) {
            this.useFallbackChat = false;
            localStorage.setItem('useFallbackChat', 'false');
            this.isChatbotReady = false;
            this.updateConnectionStatus('connecting');
            setTimeout(() => this.checkChatbotServer(), 500);
            return "Connecting to server...";
        }
        
        // Check for API URL change
        if (message.includes('set api url') || message.includes('change api url') || message.includes('update api url')) {
            const urlMatch = message.match(/https?:\/\/[^\s]+/);
            if (urlMatch) {
                const newUrl = urlMatch[0];
                this.chatApiUrl = newUrl;
                localStorage.setItem('chatApiUrl', newUrl);
                this.useFallbackChat = false;
                this.isChatbotReady = false;
                this.updateConnectionStatus('connecting');
                setTimeout(() => this.checkChatbotServer(), 500);
                return `API URL updated to ${newUrl}. Connecting...`;
            } else {
                return "Include full URL like 'set api url to http://localhost:5000/api/chat'";
            }
        }
        
        // Show the current API URL
        if (message.includes('show api url') || message.includes('what is the api url') || message.includes('api url')) {
            return `API URL: ${this.chatApiUrl}`;
        }
        
        // Reset API URL to default
        if (message.includes('reset api url') || message.includes('default api url')) {
            const defaultUrl = 'http://localhost:5000/api/chat';
            this.chatApiUrl = defaultUrl;
            localStorage.setItem('chatApiUrl', defaultUrl);
            return `API URL reset to default: ${defaultUrl}`;
        }
        
        // Check for help request
        if (message.includes('help') || message === '?') {
            return "Commands:\n• Show events\n• Create new event\n• Show API URL\n• Set API URL\n• Switch to online mode";
        }
        
        // Handle event creation in fallback mode
        if (message.includes('create event') || message.includes('add event') || message.includes('new event') || message.includes('schedule')) {
            // Extract potential event details
            let dateMatch = message.match(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
            let dateText = dateMatch ? dateMatch[0] : "today";
            
            // Display a simple event creation form
            setTimeout(() => {
                const today = new Date();
                const eventDate = dateText.toLowerCase() === "tomorrow" ? 
                    new Date(today.setDate(today.getDate() + 1)) : today;
                
                // Create a simplified event
                const simpleEvent = {
                    title: "New Event",
                    date: eventDate.toISOString().split('T')[0],
                    is_all_day: true
                };
                
                // Suggest to use the calendar button
                this.addBotMessage("Use '+' button or connect to server for events.", {
                    eventSuggestion: true,
                    eventData: simpleEvent,
                    fallbackMode: true
                });
            }, 500);
            
            return "Creating event...";
        }
        
        if (message.includes('show events') || message.includes('my events') || message.includes('my calendar')) {
            const eventCount = this.events.length;
            if (eventCount === 0) {
                return "No events scheduled.";
            } else {
                return `${eventCount} event${eventCount === 1 ? '' : 's'} in calendar.`;
            }
        }
        
        // Default responses
        const defaultResponses = [
            "Simple mode active. Start server for full features.",
            "Limited mode. Run 'python chat_server.py' for AI assistant.",
            "Basic calendar only. Connect to server for more.",
            "Simple mode. Type 'help' for commands."
        ];
        
        return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }

    /**
     * Render chat messages
     */
    renderMessages() {
        this.chatMessages.innerHTML = '';
        
        this.messages.forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.className = `message ${message.sent ? 'sent' : 'received'}`;
            
            // Add pulsing animation for thinking messages
            if (message.isThinking) {
                messageElement.classList.add('thinking');
            }
            
            // Regular message text
            const textElement = document.createElement('div');
            textElement.className = 'message-text';
            textElement.textContent = message.text;
            messageElement.appendChild(textElement);
            
            // Add confirmation buttons for event suggestions
            if (!message.sent && message.eventSuggestion && message.eventData) {
                const eventData = message.eventData;
                
                // Create event summary
                const eventSummary = document.createElement('div');
                eventSummary.className = 'event-suggestion';
                
                // Format date
                const eventDate = new Date(eventData.date);
                const formattedDate = eventDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                });
                
                // Check for all-day event (handle both property names)
                const isAllDay = eventData.is_all_day || eventData.allDay || false;
                
                // Time information
                let timeInfo = 'All day';
                if (!isAllDay && eventData.startTime) {
                    timeInfo = eventData.startTime;
                    if (eventData.endTime) {
                        timeInfo += ` - ${eventData.endTime}`;
                    }
                }
                
                // Build summary
                eventSummary.innerHTML = `
                    <div class="event-suggestion-title">${eventData.title}</div>
                    <div class="event-suggestion-details">
                        <div class="event-date">${formattedDate}</div>
                        <div class="event-time">${timeInfo}</div>
                        ${eventData.notes ? `<div class="event-notes">${eventData.notes}</div>` : ''}
                    </div>
                `;
                messageElement.appendChild(eventSummary);
                
                // Create confirmation buttons
                const confirmationButtons = document.createElement('div');
                confirmationButtons.className = 'event-confirmation-buttons';
                
                if (message.fallbackMode) {
                    // In fallback mode, add a button to open the event modal
                    const createButton = document.createElement('button');
                    createButton.className = 'open-event-modal';
                    createButton.textContent = 'Create event manually';
                    createButton.addEventListener('click', () => {
                        this.openEventModal(new Date(eventData.date));
                    });
                    confirmationButtons.appendChild(createButton);
                } else {
                    // In online mode, add confirm/decline buttons
                    const confirmButton = document.createElement('button');
                    confirmButton.className = 'confirm-event';
                    confirmButton.textContent = 'Yes, add this event';
                    confirmButton.addEventListener('click', () => {
                        this.messageInput.value = 'Yes';
                        this.sendMessage();
                    });
                    
                    const declineButton = document.createElement('button');
                    declineButton.className = 'decline-event';
                    declineButton.textContent = 'No, cancel';
                    declineButton.addEventListener('click', () => {
                        this.messageInput.value = 'No';
                        this.sendMessage();
                    });
                    
                    confirmationButtons.appendChild(confirmButton);
                    confirmationButtons.appendChild(declineButton);
                }
                
                messageElement.appendChild(confirmationButtons);
            }
            
            this.chatMessages.appendChild(messageElement);
        });

        // Scroll to bottom
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    /**
     * Toggle chat visibility
     */
    toggleChat() {
        this.chatSection.classList.toggle('active');
        this.chatToggle.classList.toggle('active');
    }

    /**
     * Show event options popup
     */
    showEventOptions(event) {
        // Close any existing popup
        const existingPopup = document.querySelector('.event-options-popup');
        if (existingPopup) {
            document.body.removeChild(existingPopup);
        }
        
        const popup = document.createElement('div');
        popup.className = 'event-options-popup';
        
        const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
        
        popup.innerHTML = `
            <div class="event-details">
                <h3>${event.title}</h3>
                <div class="event-date">
                    <i class="fas fa-calendar"></i>
                    <span>${formattedDate}</span>
                </div>
                ${!event.allDay ? `
                    <div class="event-time">
                        <i class="fas fa-clock"></i>
                        <span>${event.startTime} - ${event.endTime}</span>
                    </div>
                ` : ''}
            </div>
            <div class="event-options-content">
                <button class="edit-event">
                    <i class="fas fa-edit"></i>
                    Edit
                </button>
                <button class="delete-event">
                    <i class="fas fa-trash"></i>
                    Delete
                </button>
            </div>
        `;
        
        // Position popup near the clicked event
        const eventElement = document.querySelector(`[data-date="${event.date}"] .event`);
        if (eventElement) {
            const rect = eventElement.getBoundingClientRect();
            popup.style.top = `${rect.bottom + window.scrollY + 5}px`;
            popup.style.left = `${rect.left + window.scrollX}px`;
        }
        
        // Add event listeners
        const editButton = popup.querySelector('.edit-event');
        const deleteButton = popup.querySelector('.delete-event');
        
        editButton.addEventListener('click', () => {
            document.body.removeChild(popup);
            this.editEvent(event);
        });
        
        deleteButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this event?')) {
                this.events = this.events.filter(e => e.id !== event.id);
                this.saveUserEvents();
                document.body.removeChild(popup);
                this.render();
            }
        });
        
        // Close popup when clicking outside
        document.addEventListener('click', function closePopup(e) {
            if (!popup.contains(e.target)) {
                document.body.removeChild(popup);
                document.removeEventListener('click', closePopup);
            }
        });
        
        document.body.appendChild(popup);
    }

    /**
     * Edit an existing event
     */
    editEvent(event) {
        const modal = document.getElementById('eventModal');
        const form = document.getElementById('eventForm');
        const allDayCheckbox = document.getElementById('allDayEvent');
        const timeGroup = document.querySelector('.time-group');
        
        // Fill form with event data
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventDate').value = new Date(event.date).toISOString().split('T')[0];
        document.getElementById('eventColor').value = event.color;
        
        // Handle all-day event
        allDayCheckbox.checked = event.allDay;
        timeGroup.style.display = event.allDay ? 'none' : 'block';
        
        // Fill time fields if not all-day event
        if (!event.allDay) {
            const [startHour, startMinute] = event.startTime.split(':');
            const [endHour, endMinute] = event.endTime.split(':');
            
            document.getElementById('startTime').value = `${parseInt(startHour) % 12 || 12}:${startMinute}`;
            document.getElementById('startAmPm').value = parseInt(startHour) >= 12 ? 'PM' : 'AM';
            document.getElementById('endTime').value = `${parseInt(endHour) % 12 || 12}:${endMinute}`;
            document.getElementById('endAmPm').value = parseInt(endHour) >= 12 ? 'PM' : 'AM';
        }
        
        // Show modal
        modal.style.display = 'block';
        
        // Update form submit handler
        form.onsubmit = (e) => {
            e.preventDefault();
            
            const title = document.getElementById('eventTitle').value;
            const date = document.getElementById('eventDate').value;
            const allDay = document.getElementById('allDayEvent').checked;
            const startTime = document.getElementById('startTime').value;
            const startAmPm = document.getElementById('startAmPm').value;
            const endTime = document.getElementById('endTime').value;
            const endAmPm = document.getElementById('endAmPm').value;
            const color = document.getElementById('eventColor').value;
            
            if (!title || !date) {
                alert('Please fill in all required fields');
                return;
            }
            
            // Create updated event object
            const updatedEvent = {
                id: event.id,
                title,
                date: new Date(date).toISOString(),
                allDay,
                color
            };
            
            // Add time if not all-day event
            if (!allDay) {
                if (!startTime || !endTime) {
                    alert('Please fill in all time fields');
                    return;
                }
                
                // Convert time to 24-hour format
                const startHour = parseInt(startTime.split(':')[0]);
                const startMinute = parseInt(startTime.split(':')[1]);
                const endHour = parseInt(endTime.split(':')[0]);
                const endMinute = parseInt(endTime.split(':')[1]);
                
                updatedEvent.startTime = `${startAmPm === 'PM' ? (startHour % 12) + 12 : startHour % 12}:${startMinute.toString().padStart(2, '0')}`;
                updatedEvent.endTime = `${endAmPm === 'PM' ? (endHour % 12) + 12 : endHour % 12}:${endMinute.toString().padStart(2, '0')}`;
            }
            
            // Update event in storage
            const index = this.events.findIndex(e => e.id === event.id);
            if (index !== -1) {
                this.events[index] = updatedEvent;
                this.saveUserEvents();
            }
            
            // Close modal and refresh calendar
            modal.style.display = 'none';
            this.render();
        };
    }

    /**
     * Render the mini calendar (for sidebar navigation)
     */
    renderMiniCalendar() {
        const miniCalendar = document.getElementById('miniCalendar');
        miniCalendar.innerHTML = '';
        const year = this.date.getFullYear();
        const month = this.date.getMonth();
        const today = new Date();

        // Header
        const header = document.createElement('div');
        header.className = 'mini-calendar-header';
        header.innerHTML = `
            <button class="mini-prev">&lt;</button>
            <span>${this.date.toLocaleString('default', { month: 'long' })} ${year}</span>
            <button class="mini-next">&gt;</button>
        `;
        miniCalendar.appendChild(header);

        // Weekdays
        const weekdays = document.createElement('div');
        weekdays.className = 'mini-calendar-weekdays';
        weekdays.innerHTML = ['S','M','T','W','T','F','S'].map(d => `<div>${d}</div>`).join('');
        miniCalendar.appendChild(weekdays);

        // Days grid
        const daysGrid = document.createElement('div');
        daysGrid.className = 'mini-calendar-days';
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startingDay = firstDay.getDay();
        const totalDays = lastDay.getDate();
        const totalCells = Math.ceil((startingDay + totalDays) / 7) * 7;

        for (let i = 0; i < totalCells; i++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'mini-calendar-day';
            let dayNum = i - startingDay + 1;
            let cellDate = new Date(year, month, dayNum);
            if (i < startingDay || dayNum > totalDays) {
                dayCell.classList.add('mini-other-month');
                dayCell.textContent = '';
            } else {
                dayCell.textContent = dayNum;
                // Highlight today
                if (cellDate.toDateString() === today.toDateString()) {
                    dayCell.classList.add('mini-today');
                }
                // Highlight selected date
                if (cellDate.toDateString() === this.date.toDateString()) {
                    dayCell.classList.add('mini-selected');
                }
                dayCell.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.date = new Date(cellDate);
                    this.render();
                });
            }
            daysGrid.appendChild(dayCell);
        }
        miniCalendar.appendChild(daysGrid);

        // Navigation
        header.querySelector('.mini-prev').addEventListener('click', (e) => {
            e.stopPropagation();
            this.date.setMonth(this.date.getMonth() - 1);
            this.render();
        });
        header.querySelector('.mini-next').addEventListener('click', (e) => {
            e.stopPropagation();
            this.date.setMonth(this.date.getMonth() + 1);
            this.render();
        });
    }

    /**
     * Fetch the latest events from the server and update the calendar
     */
    fetchAndUpdateEvents() {
        const url = new URL(this.chatApiUrl.replace('/chat', '/events'));
        const params = { user_id: this.userEmail || 'default' };
        url.search = new URLSearchParams(params).toString();
        
        fetch(url)
            .then(response => response.json())
            .then(events => {
                if (Array.isArray(events)) {
                    // Normalize event properties from server format to client format
                    this.events = events.map(event => {
                        // Create a normalized event object
                        const normalizedEvent = {
                            ...event,
                            // Handle property name discrepancies
                            allDay: event.allDay || event.is_all_day || false,
                            // Make sure id is always numeric 
                            id: typeof event.id === 'number' ? event.id : parseInt(event.id) || Date.now(),
                            // Ensure date is properly formatted
                            date: event.date
                        };
                        
                        // If no color is specified, add a default color
                        if (!normalizedEvent.color) {
                            normalizedEvent.color = '#4285f4';
                        }
                        
                        return normalizedEvent;
                    });
                    
                    // Save to localStorage
                    this.saveUserEvents();
                    
                    // Refresh calendar view
                    this.render();
                    console.log('Calendar updated with events from server:', this.events);
                }
            })
            .catch(error => {
                console.error('Error fetching events from server:', error);
            });
    }

    /**
     * Load events for the current user
     */
    loadUserEvents() {
        if (!this.userEmail) return [];
        
        const events = JSON.parse(localStorage.getItem(`events_${this.userEmail}`)) || [];
        
        // Normalize event properties to ensure consistency
        return events.map(event => {
            // Create a normalized event object
            const normalizedEvent = {
                ...event,
                // Handle property name discrepancies
                allDay: event.allDay || event.is_all_day || false
            };
            
            return normalizedEvent;
        });
    }

    /**
     * Save events for the current user
     */
    saveUserEvents() {
        if (!this.userEmail) return;
        localStorage.setItem(`events_${this.userEmail}` , JSON.stringify(this.events));
    }

    /**
     * Populate user info in the dropdown
     */
    populateUserInfo() {
        const email = localStorage.getItem('loggedInUser');
        let name = email;
        // Try to get name from users list
        try {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(u => u.email === email);
            if (user && user.name) name = user.name;
        } catch {}
        if (this.userName) this.userName.textContent = name;
        if (this.userEmailDisplay) this.userEmailDisplay.textContent = email;
    }

    /**
     * Try to reconnect to the chatbot server
     */
    reconnectChatbot() {
        // Add spinning animation
        if (this.reconnectButton) {
            this.reconnectButton.classList.add('spinning');
        }
        
        // Reset status
        this.useFallbackChat = false;
        localStorage.setItem('useFallbackChat', 'false');
        this.isChatbotReady = false;
        
        // Inform user
        this.addBotMessage("Attempting to connect to the AI assistant server...");
        
        // Try to connect
        this.updateConnectionStatus('connecting');
        setTimeout(() => {
            this.checkChatbotServer();
            
            // Remove spinning animation after 2 seconds
            setTimeout(() => {
                if (this.reconnectButton) {
                    this.reconnectButton.classList.remove('spinning');
                }
            }, 2000);
        }, 500);
    }
}

// Initialize the calendar when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.calendarApp = new Calendar();
});

// Google Calendar Integration
document.addEventListener('DOMContentLoaded', function() {
    // Toggle calendar list
    const calendarListToggle = document.getElementById('calendarListToggle');
    const calendarList = document.getElementById('calendarList');
    if (calendarListToggle && calendarList) {
        calendarListToggle.addEventListener('click', () => {
            calendarList.style.display = (calendarList.style.display === 'none') ? 'block' : 'none';
            calendarListToggle.querySelector('i').classList.toggle('fa-chevron-up');
            calendarListToggle.querySelector('i').classList.toggle('fa-chevron-down');
        });
    }

    // Other calendars dropdown
    const otherCalendarsHeader = document.getElementById('otherCalendarsHeader');
    const otherCalendarsSection = document.querySelector('.other-calendars-section');
    const moreMenu = document.getElementById('calendarListMoreMenu');
    if (otherCalendarsHeader && otherCalendarsSection && moreMenu) {
        otherCalendarsHeader.addEventListener('click', (e) => {
            e.stopPropagation();
            otherCalendarsSection.classList.toggle('open');
        });
        document.addEventListener('click', (e) => {
            if (!otherCalendarsSection.contains(e.target)) {
                otherCalendarsSection.classList.remove('open');
            }
        });
    }
});

// Google Calendar Integration: Fetch and display user's calendars dynamically
async function fetchAndDisplayGoogleCalendars() {
    if (!window.gapi || !gapi.client || !gapi.client.calendar) return;
    try {
        const response = await gapi.client.calendar.calendarList.list();
        const calendars = response.result.items;
        const calendarList = document.getElementById('calendarList');
        if (!calendarList) return;
        calendarList.innerHTML = '';
        calendars.forEach(cal => {
            const li = document.createElement('li');
            li.innerHTML = `
                <input type="checkbox" class="calendar-toggle" data-id="${cal.id}" checked>
                <span class="calendar-color" style="background:${cal.backgroundColor}"></span>
                <span>${cal.summary}</span>
            `;
            calendarList.appendChild(li);
        });
    } catch (err) {
        console.error('Failed to fetch Google calendars:', err);
    }
} 