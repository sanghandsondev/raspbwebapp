// UI elements
const button = document.querySelector('.button-js');
const statusElement = document.querySelector('.status');

const recordButton = document.querySelector('.record-button');
const recordStatus = document.querySelector('.record-status');
const recordTimer = document.querySelector('.record-timer');

// State variables
let ws;
let isConnected = false;
let isRecording = false;
let timerInterval = null;
let recordingStartTime = 0;
const MAX_RECORD_TIME_S = 240; // 4 minutes

function formatTime(seconds) {
    const min = Math.floor(seconds / 60).toString().padStart(2, '0');
    const sec = (seconds % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
}

function startTimer() {
    recordingStartTime = Date.now();
    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        const elapsedTime = Math.floor((Date.now() - recordingStartTime) / 1000);
        
        if (elapsedTime >= MAX_RECORD_TIME_S) {
            recordTimer.textContent = `${formatTime(MAX_RECORD_TIME_S)} / 04:00`;
            ws.send(JSON.stringify({ command: 'stop_record' }));
            // The server response will trigger stopTimer() and UI updates
        } else {
            recordTimer.textContent = `${formatTime(elapsedTime)} / 04:00`;
        }
    }, 1000);
    recordTimer.textContent = '00:00 / 04:00';
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    recordTimer.textContent = '00:00 / 04:00';
}

async function initializeWebSocket() {
    try {
        const response = await fetch('/config');
        const config = await response.json();
        const wsUrl = config.wsUrl;
        console.log('Using WebSocket URL:', wsUrl);
        setupWebSocket(wsUrl);
    } catch (error) {
        console.error('Failed to fetch config:', error);
        statusElement.innerHTML = 'Connection Status: Error fetching config<br>LED Status: UNKNOWN';
    }
}

function setupWebSocket(wsUrl) {
    ws = new WebSocket(wsUrl);

    // Connection opened
    ws.addEventListener('open', (event) => {
        console.log('Connected to WebSocket server');
        isConnected = true;
        statusElement.innerHTML = 'Connection Status: Connected<br>LED Status: UNKNOWN';
    });

    // Connection closed
    ws.addEventListener('close', (event) => {
        console.log('Disconnected from WebSocket server');
        isConnected = false;
        statusElement.innerHTML = 'Connection Status: Disconnected<br>LED Status: UNKNOWN';
        // Try to reconnect after 5 seconds
        // setTimeout(() => {
        //     location.reload();
        // }, 5000);
    });

    // Listen for messages from the server
    ws.addEventListener('message', (event) => {
        console.log('Message from server:', event.data);
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'initial_status') {
                statusElement.innerHTML = `Connection Status: Connected<br>LED Status: ${data.state.led === 'on' ? 'ON' : 'OFF'}`;
                recordStatus.textContent = `Status: ${data.state.record === 'recording' ? 'Recording...' : 'Not Recording'}`;
                if (data.state.record === 'recording') {
                    recordButton.textContent = 'Stop Recording';
                    recordButton.classList.add('recording');
                    isRecording = true;
                } else {
                    recordButton.textContent = 'Start Recording';
                    recordButton.classList.remove('recording');
                    isRecording = false;
                    stopTimer();
                }
            } else if (data.type === 'update_status') {
                switch(data.component) {
                    case 'led':
                        statusElement.innerHTML = `Connection Status: Connected<br>LED Status: ${data.value === 'on' ? 'ON' : 'OFF'}`;
                        if (data.msg) {
                            alert(data.msg);
                        }
                        break;
                    case 'record':
                        recordStatus.textContent = `Status: ${data.value === 'recording' ? 'Recording...' : 'Not Recording'}`;
                        if (data.value === 'recording') {
                            recordButton.textContent = 'Stop Recording';
                            recordButton.classList.add('recording');
                            isRecording = true;
                            startTimer();
                        } else {
                            recordButton.textContent = 'Start Recording';
                            recordButton.classList.remove('recording');
                            isRecording = false;
                            stopTimer();
                        }
                        if (data.msg) {
                            alert(data.msg);
                        }
                        break;
                    default:
                        console.warn('Unknown component in update_status:', data.component);
                }
            }
        } catch (e) {
            console.error('Error parsing message:', e);
        }
    });

    // Handle errors
    ws.addEventListener('error', (event) => {
        console.error('WebSocket error:', event);
        statusElement.innerHTML = 'Connection Status: Error<br>LED Status: UNKNOWN';
    });
}

async function UIHandler() {
    // LED Button click handler
    button.addEventListener('click', () => {
        if (!isConnected) {
            alert('Not connected to the server');
            return;
        }
        // Send toggle LED command
        const message = JSON.stringify({ command: 'toggle_led' });
        ws.send(message);
    });

    // Record button click handler
    recordButton.addEventListener('click', () => {
        if (!isConnected) {
            alert('Not connected to the server');
            return;
        }
        // No recording -> start recording
        if (!isRecording) {
            ws.send(JSON.stringify({ command: 'start_record' }));
        } 
        // Recording -> stop recording
        else {
            ws.send(JSON.stringify({ command: 'stop_record' }));
        }
    });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', initializeWebSocket);
document.addEventListener('DOMContentLoaded', UIHandler);

