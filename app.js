// Meditation Website JavaScript

class MeditationApp {
    constructor() {
        // Timer state
        this.currentTimer = null;
        this.isTimerRunning = false;
        this.isPaused = false;
        this.totalDuration = 5 * 60; // 5 minutes in seconds
        this.remainingTime = this.totalDuration;
        this.preparationTime = 0;
        this.intervalBells = 0;
        this.backgroundSound = 'silent';
        
        // Progress tracking (session-based)
        this.sessionData = {
            totalSessions: 0,
            totalMinutes: 0,
            currentStreak: 0,
            sessions: []
        };
        
        // Audio context for sound generation
        this.audioContext = null;
        this.currentAudio = null;
        
        // Initialize app
        this.init();
    }
    
    init() {
        this.setupNavigation();
        this.setupTimerControls();
        this.setupQuickTimer();
        this.setupSoundControls();
        this.setupModal();
        this.updateProgressDisplay();
        this.initializeCircularProgress();
    }
    
    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        const sections = document.querySelectorAll('.section');
        
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetSection = button.dataset.section;
                
                // Update active nav button
                navButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Update active section
                sections.forEach(section => section.classList.remove('active'));
                document.getElementById(targetSection).classList.add('active');
            });
        });
    }
    
    setupTimerControls() {
        // Duration slider
        const durationSlider = document.querySelector('.duration-slider');
        const sliderValue = document.querySelector('.slider-value');
        
        durationSlider.addEventListener('input', (e) => {
            const minutes = parseInt(e.target.value);
            sliderValue.textContent = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
            this.totalDuration = minutes * 60;
            this.remainingTime = this.totalDuration;
            this.updateTimerDisplay();
        });
        
        // Timer buttons
        document.querySelector('.start-timer').addEventListener('click', () => this.startTimer());
        document.querySelector('.pause-timer').addEventListener('click', () => this.pauseTimer());
        document.querySelector('.stop-timer').addEventListener('click', () => this.stopTimer());
        
        // Settings
        document.querySelector('.prep-time').addEventListener('change', (e) => {
            this.preparationTime = parseInt(e.target.value) * 60;
        });
        
        document.querySelector('.interval-bells').addEventListener('change', (e) => {
            this.intervalBells = parseInt(e.target.value) * 60;
        });
        
        document.querySelector('.background-sound').addEventListener('change', (e) => {
            this.backgroundSound = e.target.value;
        });
    }
    
    setupQuickTimer() {
        const presetButtons = document.querySelectorAll('.timer-preset');
        const quickSoundSelect = document.getElementById('quickSoundSelect');
        const startButton = document.querySelector('.start-quick-timer');
        
        let selectedDuration = 5;
        
        presetButtons.forEach(button => {
            button.addEventListener('click', () => {
                presetButtons.forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
                selectedDuration = parseInt(button.dataset.minutes);
            });
        });
        
        // Select first button by default
        presetButtons[0].classList.add('selected');
        
        startButton.addEventListener('click', () => {
            this.totalDuration = selectedDuration * 60;
            this.remainingTime = this.totalDuration;
            this.backgroundSound = quickSoundSelect.value;
            this.showTimerModal();
            this.startModalTimer();
        });
    }
    
    setupSoundControls() {
        const playButtons = document.querySelectorAll('.play-sound');
        
        playButtons.forEach(button => {
            button.addEventListener('click', () => {
                const soundType = button.dataset.sound;
                this.playSound(soundType, button);
            });
        });
    }
    
    setupModal() {
        const modal = document.getElementById('timerModal');
        const closeButton = document.querySelector('.close-modal');
        const pauseButton = document.querySelector('.pause-modal-timer');
        const stopButton = document.querySelector('.stop-modal-timer');
        
        closeButton.addEventListener('click', () => this.hideTimerModal());
        pauseButton.addEventListener('click', () => this.pauseModalTimer());
        stopButton.addEventListener('click', () => this.stopModalTimer());
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideTimerModal();
            }
        });
    }
    
    initializeCircularProgress() {
        const circles = document.querySelectorAll('.progress-ring-progress');
        circles.forEach(circle => {
            const radius = circle.r.baseVal.value;
            const circumference = radius * 2 * Math.PI;
            circle.style.strokeDasharray = `${circumference} ${circumference}`;
            circle.style.strokeDashoffset = circumference;
        });
    }
    
    updateCircularProgress(percentage) {
        const circles = document.querySelectorAll('.progress-ring-progress');
        circles.forEach(circle => {
            const radius = circle.r.baseVal.value;
            const circumference = radius * 2 * Math.PI;
            const offset = circumference - (percentage / 100) * circumference;
            circle.style.strokeDashoffset = offset;
        });
    }
    
    startTimer() {
        if (this.preparationTime > 0 && !this.isPaused) {
            this.startPreparation();
        } else {
            this.startMeditation();
        }
    }
    
    startPreparation() {
        this.updateTimerStatus('Preparing...');
        let prepTime = this.preparationTime;
        
        const prepTimer = setInterval(() => {
            prepTime--;
            this.updateTimerDisplay(prepTime);
            
            if (prepTime <= 0) {
                clearInterval(prepTimer);
                this.playBell();
                this.startMeditation();
            }
        }, 1000);
    }
    
    startMeditation() {
        this.isTimerRunning = true;
        this.isPaused = false;
        this.updateTimerButtons(true);
        this.updateTimerStatus('Meditating');
        this.playBackgroundSound();
        
        this.currentTimer = setInterval(() => {
            this.remainingTime--;
            this.updateTimerDisplay();
            this.updateCircularProgress(((this.totalDuration - this.remainingTime) / this.totalDuration) * 100);
            
            // Interval bells
            if (this.intervalBells > 0 && this.remainingTime % this.intervalBells === 0 && this.remainingTime > 0) {
                this.playBell();
            }
            
            if (this.remainingTime <= 0) {
                this.completeSession();
            }
        }, 1000);
    }
    
    pauseTimer() {
        if (this.currentTimer) {
            clearInterval(this.currentTimer);
            this.currentTimer = null;
        }
        this.isPaused = true;
        this.isTimerRunning = false;
        this.updateTimerButtons(false);
        this.updateTimerStatus('Paused');
        this.stopBackgroundSound();
    }
    
    stopTimer() {
        if (this.currentTimer) {
            clearInterval(this.currentTimer);
            this.currentTimer = null;
        }
        this.isTimerRunning = false;
        this.isPaused = false;
        this.remainingTime = this.totalDuration;
        this.updateTimerButtons(false);
        this.updateTimerStatus('Ready');
        this.updateTimerDisplay();
        this.updateCircularProgress(0);
        this.stopBackgroundSound();
    }
    
    completeSession() {
        if (this.currentTimer) {
            clearInterval(this.currentTimer);
            this.currentTimer = null;
        }
        this.isTimerRunning = false;
        this.isPaused = false;
        this.updateTimerButtons(false);
        this.updateTimerStatus('Complete! 🎉');
        this.playBell();
        this.stopBackgroundSound();
        this.recordSession();
        this.updateProgressDisplay();
        
        // Reset timer
        setTimeout(() => {
            this.remainingTime = this.totalDuration;
            this.updateTimerDisplay();
            this.updateTimerStatus('Ready');
            this.updateCircularProgress(0);
        }, 3000);
    }
    
    // Modal timer methods
    showTimerModal() {
        document.getElementById('timerModal').classList.remove('hidden');
        this.updateModalTimerDisplay();
    }
    
    hideTimerModal() {
        document.getElementById('timerModal').classList.add('hidden');
        if (this.isTimerRunning) {
            this.stopTimer();
        }
    }
    
    startModalTimer() {
        this.isTimerRunning = true;
        this.updateModalTimerStatus('Meditating');
        this.playBackgroundSound();
        
        this.currentTimer = setInterval(() => {
            this.remainingTime--;
            this.updateModalTimerDisplay();
            this.updateModalCircularProgress(((this.totalDuration - this.remainingTime) / this.totalDuration) * 100);
            
            if (this.remainingTime <= 0) {
                this.completeModalSession();
            }
        }, 1000);
    }
    
    pauseModalTimer() {
        const button = document.querySelector('.pause-modal-timer');
        
        if (this.isTimerRunning) {
            this.pauseTimer();
            button.textContent = 'Resume';
        } else if (this.isPaused) {
            this.startMeditation();
            button.textContent = 'Pause';
        }
    }
    
    stopModalTimer() {
        this.stopTimer();
        this.hideTimerModal();
    }
    
    completeModalSession() {
        this.completeSession();
        setTimeout(() => {
            this.hideTimerModal();
        }, 3000);
    }
    
    updateTimerDisplay(customTime = null) {
        const time = customTime !== null ? customTime : this.remainingTime;
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const displays = document.querySelectorAll('.time-display');
        displays.forEach(display => {
            display.textContent = timeString;
        });
    }
    
    updateModalTimerDisplay() {
        const minutes = Math.floor(this.remainingTime / 60);
        const seconds = this.remainingTime % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const modalDisplay = document.querySelector('#timerModal .time-display');
        if (modalDisplay) {
            modalDisplay.textContent = timeString;
        }
    }
    
    updateTimerStatus(status) {
        const statusElements = document.querySelectorAll('.timer-status');
        statusElements.forEach(element => {
            element.textContent = status;
        });
    }
    
    updateModalTimerStatus(status) {
        const modalStatus = document.querySelector('#timerModal .timer-status');
        if (modalStatus) {
            modalStatus.textContent = status;
        }
    }
    
    updateModalCircularProgress(percentage) {
        const circle = document.querySelector('#timerModal .progress-ring-progress');
        if (circle) {
            const radius = circle.r.baseVal.value;
            const circumference = radius * 2 * Math.PI;
            const offset = circumference - (percentage / 100) * circumference;
            circle.style.strokeDashoffset = offset;
        }
    }
    
    updateTimerButtons(isRunning) {
        const startBtn = document.querySelector('.start-timer');
        const pauseBtn = document.querySelector('.pause-timer');
        const stopBtn = document.querySelector('.stop-timer');
        
        if (isRunning) {
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            stopBtn.disabled = false;
        } else {
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            stopBtn.disabled = true;
        }
    }
    
    recordSession() {
        const completedMinutes = Math.ceil((this.totalDuration - this.remainingTime) / 60);
        if (completedMinutes > 0) {
            this.sessionData.totalSessions++;
            this.sessionData.totalMinutes += completedMinutes;
            this.sessionData.sessions.push({
                date: new Date().toISOString(),
                duration: completedMinutes,
                completed: this.remainingTime <= 0
            });
            
            // Simple streak calculation (would be more sophisticated with persistent storage)
            this.sessionData.currentStreak = this.sessionData.totalSessions;
        }
    }
    
    updateProgressDisplay() {
        document.getElementById('totalSessions').textContent = this.sessionData.totalSessions;
        document.getElementById('totalMinutes').textContent = this.sessionData.totalMinutes;
        document.getElementById('currentStreak').textContent = this.sessionData.currentStreak;
    }
    
    // Sound methods
    playSound(soundType, button) {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
            
            // Reset all buttons
            document.querySelectorAll('.play-sound').forEach(btn => {
                btn.classList.remove('playing');
                btn.textContent = btn.textContent.replace('⏸ Stop', '▶ Play Sample');
            });
        }
        
        if (soundType && soundType !== 'silent') {
            // Simulate different meditation sounds with Web Audio API
            this.generateMeditationSound(soundType, 3000); // 3 second sample
            button.classList.add('playing');
            button.textContent = button.textContent.replace('▶ Play Sample', '⏸ Stop');
            
            // Auto-stop after 3 seconds
            setTimeout(() => {
                button.classList.remove('playing');
                button.textContent = button.textContent.replace('⏸ Stop', '▶ Play Sample');
            }, 3000);
        }
    }
    
    playBell() {
        this.generateMeditationSound('bell', 1000);
    }
    
    playBackgroundSound() {
        if (this.backgroundSound && this.backgroundSound !== 'silent') {
            // In a real app, this would play actual audio files
            // For demo purposes, we'll simulate with periodic gentle sounds
            this.backgroundSoundInterval = setInterval(() => {
                if (this.isTimerRunning) {
                    this.generateMeditationSound(this.backgroundSound, 500, 0.1);
                }
            }, 10000); // Every 10 seconds
        }
    }
    
    stopBackgroundSound() {
        if (this.backgroundSoundInterval) {
            clearInterval(this.backgroundSoundInterval);
            this.backgroundSoundInterval = null;
        }
    }
    
    generateMeditationSound(type, duration, volume = 0.3) {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Configure sound based on type
            switch (type) {
                case 'bell':
                    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + duration / 1000);
                    break;
                case 'bowl':
                    oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + duration / 1000);
                    break;
                case 'ocean':
                    oscillator.type = 'sawtooth';
                    oscillator.frequency.setValueAtTime(60, this.audioContext.currentTime);
                    break;
                case 'rain':
                    oscillator.type = 'sawtooth';
                    oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime);
                    break;
                case 'stream':
                    oscillator.type = 'sawtooth';
                    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
                    break;
                default:
                    oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
            }
            
            // Set volume envelope
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + duration / 1000);
            
        } catch (error) {
            console.log('Audio not supported in this browser');
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new MeditationApp();
    
    // Add some helpful keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    if (app.isTimerRunning) {
                        app.pauseTimer();
                    } else if (app.isPaused) {
                        app.startTimer();
                    }
                    break;
                case 'Escape':
                    if (!document.getElementById('timerModal').classList.contains('hidden')) {
                        app.hideTimerModal();
                    }
                    break;
            }
        }
    });
    
    // Add smooth scrolling for better UX
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Export for potential future use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MeditationApp;
}