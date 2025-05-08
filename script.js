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
        
        this.initializeElements();
        this.attachEventListeners();
        this.populateUserInfo();
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
        this.chatToggle = document.getElementById('chatToggle');
        this.chatSection = document.querySelector('.chat-section');
        this.closeChat = document.querySelector('.close-chat');

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
            eventElement.style.backgroundColor = event.color;
            
            if (this.currentView === 'week' || this.currentView === 'day') {
                if (!event.allDay) {
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
                    ${!event.allDay ? `<div class="event-time">${event.startTime} - ${event.endTime}</div>` : ''}
                    <div class="event-title">${event.title}</div>
                `;
                eventElement.appendChild(eventContent);
            } else {
                // For month view, show a more compact event display
                eventElement.innerHTML = `
                    <span class="event-title">${event.title}</span>
                    ${!event.allDay ? `<span class="event-time">${event.startTime}</span>` : ''}
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
     * Load events for the current user
     */
    loadUserEvents() {
        if (!this.userEmail) return [];
        return JSON.parse(localStorage.getItem(`events_${this.userEmail}`)) || [];
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
}

// Initialize the calendar when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Calendar();
});

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
        // Optionally: Add event listeners to checkboxes to toggle calendar visibility
    } catch (err) {
        console.error('Failed to fetch Google calendars:', err);
    }
}

// Example: Call this after Google Calendar is connected
// fetchAndDisplayGoogleCalendars();

// If you have a Google Connect button, call fetchAndDisplayGoogleCalendars() after successful connection
// For example, after fetching Google events, also call fetchAndDisplayGoogleCalendars() 