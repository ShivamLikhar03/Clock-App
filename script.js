document.addEventListener('DOMContentLoaded', function() {
    // Tab navigation
    const navItems = document.querySelectorAll('.nav-menu li');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all tabs
            navItems.forEach(nav => nav.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Clock functionality
    initClock();
    
    // Alarm functionality
    initAlarm();
    
    // World Clock functionality
    initWorldClock();
    
    // Stopwatch functionality
    initStopwatch();
    
    // Timer functionality
    initTimer();
});

// Clock functionality
function initClock() {
    updateClock();
    // Update the clock more frequently for smoother animation
    setInterval(updateClock, 50);
}

function updateClock() {
    const now = new Date();
    
    // Update digital clock
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const milliseconds = now.getMilliseconds();
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    
    // Only update text display once per second to avoid flicker
    if (milliseconds < 50) {
        document.querySelector('.digital-clock .time').textContent = 
            `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`;
        
        document.querySelector('.digital-clock .date').textContent = 
            now.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        
        // Update analog clock values
        document.querySelector('.hour-value').textContent = formatTime(hours12);
        document.querySelector('.minute-value').textContent = formatTime(minutes);
        document.querySelector('.second-value').textContent = formatTime(seconds);
        document.querySelector('.period').textContent = period;
    }
    
    // Calculate progress percentages for smooth animation
    const hourProgress = (hours % 12) / 12 + (minutes / 60) / 12;
    const minuteProgress = minutes / 60 + (seconds / 60) / 60;
    const secondProgress = seconds / 60 + (milliseconds / 1000) / 60;
    
    // Update the ring animations
    updateClockRing('.hour-circle::before', hourProgress);
    updateClockRing('.minute-circle::before', minuteProgress);
    updateClockRing('.second-circle::before', secondProgress);
    
    // Update the marker positions
    updateMarkerPosition('.hour-marker', hourProgress);
    updateMarkerPosition('.minute-marker', minuteProgress);
    updateMarkerPosition('.second-marker', secondProgress);
}

function updateClockRing(selector, progress) {
    const element = document.querySelector(selector);
    if (element) {
        const degrees = progress * 360;
        element.style.transform = `rotate(${degrees - 90}deg)`;
    }
}

function updateMarkerPosition(selector, progress) {
    const element = document.querySelector(selector);
    if (element) {
        const degrees = progress * 360;
        // Calculate marker position to move around the circle
        const radius = 80; // Half of the circle width
        element.style.transform = `
            rotate(${degrees}deg) 
            translateY(-${radius}px)
        `;
    }
}

function formatTime(time) {
    return time.toString().padStart(2, '0');
}

// Alarm functionality
function initAlarm() {
    const alarmForm = document.querySelector('.alarm-form');
    const alarmsList = document.getElementById('alarms');
    const alarmAudio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
    
    let alarms = JSON.parse(localStorage.getItem('alarms')) || [];
    
    // Render existing alarms
    renderAlarms();
    
    // Check alarms every second
    setInterval(checkAlarms, 1000);
    
    // Add alarm event
    if (alarmForm) {
        alarmForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const alarmTimeInput = document.getElementById('alarm-time');
            if (alarmTimeInput && alarmTimeInput.value) {
                addAlarm(alarmTimeInput.value);
                alarmTimeInput.value = '';
            }
        });
        
        // Alternative for when submit event doesn't work
        document.getElementById('set-alarm').addEventListener('click', function() {
            const alarmTimeInput = document.getElementById('alarm-time');
            if (alarmTimeInput && alarmTimeInput.value) {
                addAlarm(alarmTimeInput.value);
                alarmTimeInput.value = '';
            }
        });
    }
    
    function addAlarm(timeString) {
        const [hours, minutes] = timeString.split(':');
        const now = new Date();
        const alarmTime = new Date();
        alarmTime.setHours(parseInt(hours));
        alarmTime.setMinutes(parseInt(minutes));
        alarmTime.setSeconds(0);
        
        // If the alarm time is earlier today, set it for tomorrow
        if (alarmTime < now) {
            alarmTime.setDate(alarmTime.getDate() + 1);
        }
        
        const newAlarm = {
            id: Date.now(),
            time: alarmTime.toISOString(),
            enabled: true
        };
        
        alarms.push(newAlarm);
        saveAlarms();
        renderAlarms();
    }
    
    function checkAlarms() {
        const now = new Date();
        
        alarms.forEach(alarm => {
            if (!alarm.enabled) return;
            
            const alarmTime = new Date(alarm.time);
            
            // Check if alarm should trigger (within 1 second precision)
            if (Math.abs(now - alarmTime) < 1000) {
                triggerAlarm(alarm);
            }
        });
    }
    
    function triggerAlarm(alarm) {
        alarmAudio.loop = true;
        alarmAudio.play();
        
        // Show notification
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification('Alarm', {
                body: `It's ${formatAlarmTime(alarm.time)}`,
                icon: '/static/images/alarm-icon.png'
            });
            
            notification.onclick = function() {
                window.focus();
                stopAlarm();
            };
        }
        
        // Display alert
        const shouldStop = confirm(`Alarm: ${formatAlarmTime(alarm.time)}\nClick OK to stop the alarm.`);
        if (shouldStop) {
            stopAlarm();
            
            // If it's a one-time alarm, disable it
            const alarmIndex = alarms.findIndex(a => a.id === alarm.id);
            if (alarmIndex !== -1) {
                alarms[alarmIndex].enabled = false;
                saveAlarms();
                renderAlarms();
            }
        }
    }
    
    function stopAlarm() {
        alarmAudio.pause();
        alarmAudio.currentTime = 0;
    }
    
    function formatAlarmTime(isoString) {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    function renderAlarms() {
        if (!alarmsList) return;
        
        alarmsList.innerHTML = '';
        
        if (alarms.length === 0) {
            alarmsList.innerHTML = '<li class="no-alarms">No alarms set</li>';
            return;
        }
        
        alarms.forEach(alarm => {
            const li = document.createElement('li');
            
            const timeSpan = document.createElement('span');
            timeSpan.textContent = formatAlarmTime(alarm.time);
            
            const toggleBtn = document.createElement('button');
            toggleBtn.textContent = alarm.enabled ? 'Disable' : 'Enable';
            toggleBtn.classList.add(alarm.enabled ? 'disable-btn' : 'enable-btn');
            toggleBtn.addEventListener('click', () => toggleAlarm(alarm.id));
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.classList.add('delete-btn');
            deleteBtn.addEventListener('click', () => deleteAlarm(alarm.id));
            
            const controls = document.createElement('div');
            controls.classList.add('alarm-controls');
            controls.appendChild(toggleBtn);
            controls.appendChild(deleteBtn);
            
            li.appendChild(timeSpan);
            li.appendChild(controls);
            alarmsList.appendChild(li);
        });
    }
    
    function toggleAlarm(id) {
        const alarmIndex = alarms.findIndex(alarm => alarm.id === id);
        if (alarmIndex !== -1) {
            alarms[alarmIndex].enabled = !alarms[alarmIndex].enabled;
            saveAlarms();
            renderAlarms();
        }
    }
    
    function deleteAlarm(id) {
        alarms = alarms.filter(alarm => alarm.id !== id);
        saveAlarms();
        renderAlarms();
    }
    
    function saveAlarms() {
        localStorage.setItem('alarms', JSON.stringify(alarms));
    }
    
    // Request notification permission
    if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
    }
}

// World Clock functionality
function initWorldClock() {
    const addTimezoneBtn = document.getElementById('add-timezone');
    const timezoneSelect = document.getElementById('timezone-select');
    const timezoneList = document.getElementById('timezone-list');
    
    let timezones = JSON.parse(localStorage.getItem('timezones')) || [];
    
    // Set default timezones if none exist
    if (timezones.length === 0) {
        timezones = [
            { id: 1, timezone: 'America/New_York', label: 'New York' },
            { id: 2, timezone: 'Europe/London', label: 'London' }
        ];
        saveTimezones();
    }
    
    // Render timezones
    renderTimezones();
    
    // Update every second
    setInterval(renderTimezones, 1000);
    
    // Add timezone event
    if (addTimezoneBtn && timezoneSelect) {
        addTimezoneBtn.addEventListener('click', function() {
            const selectedOption = timezoneSelect.options[timezoneSelect.selectedIndex];
            const timezone = selectedOption.value;
            const label = selectedOption.text;
            
            if (!timezones.some(tz => tz.timezone === timezone)) {
                timezones.push({
                    id: Date.now(),
                    timezone,
                    label
                });
                
                saveTimezones();
                renderTimezones();
            }
        });
    }
    
    function renderTimezones() {
        if (!timezoneList) return;
        
        timezoneList.innerHTML = '';
        
        timezones.forEach(tz => {
            const now = new Date();
            const options = {
                timeZone: tz.timezone,
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric',
                hour12: true
            };
            
            const dateOptions = {
                timeZone: tz.timezone,
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            };
            
            const timeString = now.toLocaleTimeString('en-US', options);
            const dateString = now.toLocaleDateString('en-US', dateOptions);
            
            const timezoneItem = document.createElement('div');
            timezoneItem.className = 'timezone-item';
            timezoneItem.innerHTML = `
                <div class="location">${tz.label}</div>
                <div class="time">${timeString}</div>
                <div class="date">${dateString}</div>
                <div class="remove"><i class="fas fa-times"></i></div>
            `;
            
            const removeBtn = timezoneItem.querySelector('.remove');
            removeBtn.addEventListener('click', () => removeTimezone(tz.id));
            
            timezoneList.appendChild(timezoneItem);
        });
    }
    
    function removeTimezone(id) {
        timezones = timezones.filter(tz => tz.id !== id);
        saveTimezones();
        renderTimezones();
    }
    
    function saveTimezones() {
        localStorage.setItem('timezones', JSON.stringify(timezones));
    }
}

// Stopwatch functionality
function initStopwatch() {
    const display = document.querySelector('.stopwatch-display');
    const startBtn = document.getElementById('stopwatch-start');
    const stopBtn = document.getElementById('stopwatch-stop');
    const resetBtn = document.getElementById('stopwatch-reset');
    const lapBtn = document.getElementById('stopwatch-lap');
    const lapsList = document.getElementById('laps');
    
    let startTime;
    let elapsedTime = 0;
    let stopwatchInterval;
    let isRunning = false;
    let lapCount = 0;
    
    if (startBtn) {
        startBtn.addEventListener('click', startStopwatch);
    }
    
    if (stopBtn) {
        stopBtn.addEventListener('click', stopStopwatch);
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', resetStopwatch);
    }
    
    if (lapBtn) {
        lapBtn.addEventListener('click', recordLap);
    }
    
    function startStopwatch() {
        if (isRunning) return;
        
        isRunning = true;
        startTime = Date.now() - elapsedTime;
        stopwatchInterval = setInterval(updateStopwatch, 10);
        
        if (startBtn) startBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = false;
        if (lapBtn) lapBtn.disabled = false;
    }
    
    function stopStopwatch() {
        if (!isRunning) return;
        
        isRunning = false;
        clearInterval(stopwatchInterval);
        elapsedTime = Date.now() - startTime;
        
        if (startBtn) startBtn.disabled = false;
        if (stopBtn) stopBtn.disabled = true;
    }
    
    function resetStopwatch() {
        clearInterval(stopwatchInterval);
        isRunning = false;
        elapsedTime = 0;
        
        if (display) display.textContent = '00:00:00.000';
        if (lapsList) lapsList.innerHTML = '';
        lapCount = 0;
        
        if (startBtn) startBtn.disabled = false;
        if (stopBtn) stopBtn.disabled = true;
        if (lapBtn) lapBtn.disabled = true;
    }
    
    function updateStopwatch() {
        const currentTime = Date.now();
        elapsedTime = currentTime - startTime;
        
        if (display) {
            display.textContent = formatStopwatchTime(elapsedTime);
        }
    }
    
    function recordLap() {
        if (!isRunning) return;
        
        lapCount++;
        const lapTime = elapsedTime;
        
        if (lapsList) {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>Lap ${lapCount}</span>
                <span>${formatStopwatchTime(lapTime)}</span>
            `;
            lapsList.prepend(li);
        }
    }
    
    function formatStopwatchTime(ms) {
        const date = new Date(ms);
        
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        const seconds = date.getUTCSeconds().toString().padStart(2, '0');
        const milliseconds = Math.floor(date.getUTCMilliseconds() / 10).toString().padStart(2, '0');
        
        return `${hours}:${minutes}:${seconds}.${milliseconds}`;
    }
    
    // Initialize with default state
    resetStopwatch();
}

// Timer functionality
function initTimer() {
    const hoursInput = document.getElementById('hours');
    const minutesInput = document.getElementById('minutes');
    const secondsInput = document.getElementById('seconds');
    const timerDisplay = document.querySelector('.timer-display');
    const startBtn = document.getElementById('timer-start');
    const pauseBtn = document.getElementById('timer-pause');
    const resetBtn = document.getElementById('timer-reset');
    
    let countdown;
    let endTime;
    let remainingTime;
    let isPaused = true;
    let timerAudio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
    
    if (startBtn) {
        startBtn.addEventListener('click', startTimer);
    }
    
    if (pauseBtn) {
        pauseBtn.addEventListener('click', pauseTimer);
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', resetTimer);
    }
    
    function startTimer() {
        if (!isPaused && countdown) return;
        
        // Get input values
        const hours = parseInt(hoursInput?.value || 0);
        const minutes = parseInt(minutesInput?.value || 0);
        const seconds = parseInt(secondsInput?.value || 0);
        
        // Calculate total seconds
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        
        if (totalSeconds <= 0) return;
        
        // If timer was paused, use remaining time
        const secondsRemaining = isPaused ? (remainingTime ? Math.floor(remainingTime / 1000) : totalSeconds) : totalSeconds;
        
        endTime = Date.now() + secondsRemaining * 1000;
        
        // Start countdown
        updateTimerDisplay(secondsRemaining);
        countdown = setInterval(updateTimer, 1000);
        isPaused = false;
        
        if (startBtn) startBtn.disabled = true;
        if (pauseBtn) pauseBtn.disabled = false;
        
        // Disable inputs while timer is running
        if (hoursInput) hoursInput.disabled = true;
        if (minutesInput) minutesInput.disabled = true;
        if (secondsInput) secondsInput.disabled = true;
    }
    
    function updateTimer() {
        remainingTime = endTime - Date.now();
        
        if (remainingTime <= 0) {
            clearInterval(countdown);
            updateTimerDisplay(0);
            timerComplete();
            return;
        }
        
        const secondsRemaining = Math.floor(remainingTime / 1000);
        updateTimerDisplay(secondsRemaining);
    }
    
    function pauseTimer() {
        if (isPaused) return;
        
        clearInterval(countdown);
        isPaused = true;
        
        if (startBtn) startBtn.disabled = false;
        if (pauseBtn) pauseBtn.disabled = true;
    }
    
    function resetTimer() {
        clearInterval(countdown);
        isPaused = true;
        
        if (hoursInput) hoursInput.value = '0';
        if (minutesInput) minutesInput.value = '0';
        if (secondsInput) secondsInput.value = '0';
        
        if (timerDisplay) timerDisplay.textContent = '00:00:00';
        
        if (startBtn) startBtn.disabled = false;
        if (pauseBtn) pauseBtn.disabled = true;
        
        // Enable inputs
        if (hoursInput) hoursInput.disabled = false;
        if (minutesInput) minutesInput.disabled = false;
        if (secondsInput) secondsInput.disabled = false;
        
        // Stop alarm if it's playing
        timerAudio.pause();
        timerAudio.currentTime = 0;
    }
    
    function updateTimerDisplay(secondsRemaining) {
        if (!timerDisplay) return;
        
        const hours = Math.floor(secondsRemaining / 3600);
        const minutes = Math.floor((secondsRemaining % 3600) / 60);
        const seconds = secondsRemaining % 60;
        
        timerDisplay.textContent = `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`;
    }
    
    function timerComplete() {
        isPaused = true;
        
        if (startBtn) startBtn.disabled = false;
        if (pauseBtn) pauseBtn.disabled = true;
        
        // Enable inputs
        if (hoursInput) hoursInput.disabled = false;
        if (minutesInput) minutesInput.disabled = false;
        if (secondsInput) secondsInput.disabled = false;
        
        // Play alarm sound
        timerAudio.loop = true;
        timerAudio.play();
        
        // Show notification
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification('Timer Complete', {
                body: 'Your timer has ended!',
                icon: '/static/images/timer-icon.png'
            });
            
            notification.onclick = function() {
                window.focus();
                timerAudio.pause();
                timerAudio.currentTime = 0;
            };
        }
        
        // Display alert
        const shouldStop = confirm('Timer Complete!\nClick OK to stop the alarm.');
        if (shouldStop) {
            timerAudio.pause();
            timerAudio.currentTime = 0;
        }
    }
} 