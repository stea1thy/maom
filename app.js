// Enhanced Meditation Website JavaScript

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
        
        // Enhanced audio system
        this.audioContext = null;
        this.masterGainNode = null;
        this.currentBackgroundAudio = null;
        this.backgroundSoundInterval = null;
        this.masterVolume = 0.3;
        this.soundVolumes = {
            bell: 0.3,
            bowl: 0.3,
            ocean: 0.3,
            rain: 0.3,
            stream: 0.3
        };
        
        // Initialize app
        this.init();
    }
    
    init() {
        this.setupAudioContext();
        this.setupNavigation();
        this.setupTimerControls();
        this.setupQuickTimer();
        this.setupSoundControls();
        this.setupVolumeControls();
        this.setupModal();
        this.updateProgressDisplay();
        this.initializeCircularProgress();
    }
    
    setupAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.connect(this.audioContext.destination);
            this.masterGainNode.gain.value = this.masterVolume;
        } catch (error) {
            console.log('Web Audio API not supported');
        }
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
    
    setupVolumeControls() {
        // Main volume controls
        const volumeSlider = document.querySelector('.volume-slider');
        const mainVolumeSlider = document.querySelector('.main-volume-slider');
        
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                this.masterVolume = parseFloat(e.target.value);
                if (this.masterGainNode) {
                    this.masterGainNode.gain.value = this.masterVolume;
                }
            });
        }
        
        if (mainVolumeSlider) {
            mainVolumeSlider.addEventListener('input', (e) => {
                this.masterVolume = parseFloat(e.target.value);
                if (this.masterGainNode) {
                    this.masterGainNode.gain.value = this.masterVolume;
                }
            });
        }
        
        // Individual sound volume controls
        const soundVolumeSliders = document.querySelectorAll('.sound-volume-slider');
        soundVolumeSliders.forEach(slider => {
            slider.addEventListener('input', (e) => {
                const soundType = e.target.dataset.sound;
                this.soundVolumes[soundType] = parseFloat(e.target.value);
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
                this.toggleSoundPreview(soundType, button);
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
    
    // Enhanced audio generation methods
    createBellSound(duration = 2000, frequency = 800) {
        if (!this.audioContext) return;
        
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        // Create harmonic bell sound
        oscillator1.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator2.frequency.setValueAtTime(frequency * 2.1, this.audioContext.currentTime);
        
        oscillator1.type = 'sine';
        oscillator2.type = 'sine';
        
        // Apply resonant filter for metallic quality
        filter.type = 'bandpass';
        filter.frequency.value = frequency;
        filter.Q.value = 10;
        
        oscillator1.connect(filter);
        oscillator2.connect(gainNode);
        filter.connect(gainNode);
        gainNode.connect(this.masterGainNode);
        
        // Envelope with longer decay for bell-like resonance
        const volume = this.soundVolumes.bell || 0.3;
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume * 0.8, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(volume * 0.3, this.audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration / 1000);
        
        // Frequency modulation for realistic bell resonance
        oscillator1.frequency.exponentialRampToValueAtTime(frequency * 0.98, this.audioContext.currentTime + duration / 1000);
        oscillator2.frequency.exponentialRampToValueAtTime(frequency * 2.05, this.audioContext.currentTime + duration / 1000);
        
        oscillator1.start();
        oscillator2.start();
        oscillator1.stop(this.audioContext.currentTime + duration / 1000);
        oscillator2.stop(this.audioContext.currentTime + duration / 1000);
        
        return { oscillator1, oscillator2, gainNode };
    }
    
    createBowlSound(duration = 3000, frequency = 200) {
        if (!this.audioContext) return;
        
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const oscillator3 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        // Deep resonant harmonics for singing bowl
        oscillator1.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator2.frequency.setValueAtTime(frequency * 1.618, this.audioContext.currentTime);
        oscillator3.frequency.setValueAtTime(frequency * 2.5, this.audioContext.currentTime);
        
        oscillator1.type = 'sine';
        oscillator2.type = 'sine';
        oscillator3.type = 'triangle';
        
        // Low-pass filter for warmth
        filter.type = 'lowpass';
        filter.frequency.value = frequency * 3;
        filter.Q.value = 2;
        
        oscillator1.connect(filter);
        oscillator2.connect(filter);
        oscillator3.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGainNode);
        
        // Slow attack and long sustain for bowl
        const volume = this.soundVolumes.bowl || 0.3;
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.5);
        gainNode.gain.linearRampToValueAtTime(volume * 0.8, this.audioContext.currentTime + duration / 2000);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration / 1000);
        
        oscillator1.start();
        oscillator2.start();
        oscillator3.start();
        oscillator1.stop(this.audioContext.currentTime + duration / 1000);
        oscillator2.stop(this.audioContext.currentTime + duration / 1000);
        oscillator3.stop(this.audioContext.currentTime + duration / 1000);
        
        return { oscillator1, oscillator2, oscillator3, gainNode };
    }
    
    createOceanSound(duration = 5000) {
        if (!this.audioContext) return;
        
        const bufferSize = this.audioContext.sampleRate * (duration / 1000);
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate pink noise with wave-like modulation
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            b6 = white * 0.115926;
            
            // Add wave motion
            const wave = Math.sin(2 * Math.PI * i * 0.1 / this.audioContext.sampleRate) * 0.3;
            data[i] = (pink * 0.1 + wave) * (this.soundVolumes.ocean || 0.3);
        }
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        filter.type = 'lowpass';
        filter.frequency.value = 1000;
        
        source.buffer = buffer;
        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGainNode);
        
        gainNode.gain.value = this.soundVolumes.ocean || 0.3;
        source.loop = true;
        source.start();
        
        return { source, gainNode };
    }
    
    createRainSound(duration = 5000) {
        if (!this.audioContext) return;
        
        const bufferSize = this.audioContext.sampleRate * (duration / 1000);
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate filtered white noise for rain
        for (let i = 0; i < bufferSize; i++) {
            // Create irregular droplets
            let sample = 0;
            if (Math.random() < 0.02) {
                sample = (Math.random() * 2 - 1) * 0.5;
            }
            sample += (Math.random() * 2 - 1) * 0.05; // Base rain hiss
            data[i] = sample * (this.soundVolumes.rain || 0.3);
        }
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        filter.type = 'highpass';
        filter.frequency.value = 200;
        
        source.buffer = buffer;
        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGainNode);
        
        gainNode.gain.value = this.soundVolumes.rain || 0.3;
        source.loop = true;
        source.start();
        
        return { source, gainNode };
    }
    
    createStreamSound(duration = 5000) {
        if (!this.audioContext) return;
        
        const bufferSize = this.audioContext.sampleRate * (duration / 1000);
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate flowing water sound
        for (let i = 0; i < bufferSize; i++) {
            let sample = 0;
            // Multiple frequency bands for water flow
            sample += Math.sin(2 * Math.PI * i * 220 / this.audioContext.sampleRate) * 0.1;
            sample += Math.sin(2 * Math.PI * i * 440 / this.audioContext.sampleRate) * 0.05;
            sample += (Math.random() * 2 - 1) * 0.2; // Turbulence
            
            // Add bubbling effect
            if (Math.random() < 0.005) {
                sample += Math.sin(2 * Math.PI * i * 800 / this.audioContext.sampleRate) * 0.3;
            }
            
            data[i] = sample * (this.soundVolumes.stream || 0.3);
        }
        
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        filter.type = 'bandpass';
        filter.frequency.value = 400;
        filter.Q.value = 0.5;
        
        source.buffer = buffer;
        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGainNode);
        
        gainNode.gain.value = this.soundVolumes.stream || 0.3;
        source.loop = true;
        source.start();
        
        return { source, gainNode };
    }
    
    toggleSoundPreview(soundType, button) {
        // Stop any currently playing preview
        this.stopAllPreviews();
        
        if (button.classList.contains('playing')) {
            button.classList.remove('playing');
            button.textContent = '▶ Play Sample';
            return;
        }
        
        // Reset all buttons
        document.querySelectorAll('.play-sound').forEach(btn => {
            btn.classList.remove('playing');
            btn.textContent = btn.textContent.replace('⏸ Stop', '▶ Play Sample');
        });
        
        if (soundType && soundType !== 'silent') {
            this.playMeditationSound(soundType, 3000);
            button.classList.add('playing');
            button.textContent = button.textContent.replace('▶ Play Sample', '⏸ Stop');
            
            // Auto-stop after 3 seconds
            setTimeout(() => {
                button.classList.remove('playing');
                button.textContent = button.textContent.replace('⏸ Stop', '▶ Play Sample');
            }, 3000);
        }
    }
    
    stopAllPreviews() {
        if (this.currentBackgroundAudio) {
            if (this.currentBackgroundAudio.source) {
                this.currentBackgroundAudio.source.stop();
            }
            if (this.currentBackgroundAudio.gainNode) {
                this.currentBackgroundAudio.gainNode.disconnect();
            }
            this.currentBackgroundAudio = null;
        }
    }
    
    playMeditationSound(type, duration = 1000) {
        if (!this.audioContext) return;
        
        // Resume audio context if suspended (required by some browsers)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        switch (type) {
            case 'bell':
                return this.createBellSound(duration);
            case 'bowl':
                return this.createBowlSound(duration);
            case 'ocean':
                this.currentBackgroundAudio = this.createOceanSound(duration);
                return this.currentBackgroundAudio;
            case 'rain':
                this.currentBackgroundAudio = this.createRainSound(duration);
                return this.currentBackgroundAudio;
            case 'stream':
                this.currentBackgroundAudio = this.createStreamSound(duration);
                return this.currentBackgroundAudio;
            default:
                return null;
        }
    }
    
    // Timer functionality
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
        // Clear any running timer
        if (this.currentTimer) {
            clearInterval(this.currentTimer);
            this.currentTimer = null;
        }
        
        // Reset all states
        this.isTimerRunning = false;
        this.isPaused = false;
        this.remainingTime = this.totalDuration;
        
        // Update UI immediately
        this.updateTimerButtons(false);
        this.updateTimerStatus('Ready');
        this.updateTimerDisplay();
        this.updateCircularProgress(0);
        this.stopBackgroundSound();
        
        // Reset modal pause button text if needed
        const modalPauseBtn = document.querySelector('.pause-modal-timer');
        if (modalPauseBtn) {
            modalPauseBtn.textContent = 'Pause';
        }
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
    
    playBell() {
        this.playMeditationSound('bell', 2000);
    }
    
    playBackgroundSound() {
        if (this.backgroundSound && this.backgroundSound !== 'silent') {
            // Stop any existing background sound
            this.stopBackgroundSound();
            
            // Start continuous background sound
            this.currentBackgroundAudio = this.playMeditationSound(this.backgroundSound, 60000);
            
            // For looping sounds, restart periodically
            if (['ocean', 'rain', 'stream'].includes(this.backgroundSound)) {
                this.backgroundSoundInterval = setInterval(() => {
                    if (this.isTimerRunning) {
                        this.stopBackgroundSound();
                        this.currentBackgroundAudio = this.playMeditationSound(this.backgroundSound, 60000);
                    }
                }, 55000); // Restart before it ends
            }
        }
    }
    
    stopBackgroundSound() {
        if (this.currentBackgroundAudio) {
            if (this.currentBackgroundAudio.source) {
                try {
                    this.currentBackgroundAudio.source.stop();
                } catch (e) {
                    // Sound may have already stopped
                }
            }
            this.currentBackgroundAudio = null;
        }
        
        if (this.backgroundSoundInterval) {
            clearInterval(this.backgroundSoundInterval);
            this.backgroundSoundInterval = null;
        }
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
    
    // Display update methods
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
            
            // Simple streak calculation
            this.sessionData.currentStreak = this.sessionData.totalSessions;
        }
    }
    
    updateProgressDisplay() {
        document.getElementById('totalSessions').textContent = this.sessionData.totalSessions;
        document.getElementById('totalMinutes').textContent = this.sessionData.totalMinutes;
        document.getElementById('currentStreak').textContent = this.sessionData.currentStreak;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new MeditationApp();
    
    // Add keyboard shortcuts
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