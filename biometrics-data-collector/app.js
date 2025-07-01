class EnhancedBehavioralBiometricsCollector {
    constructor() {
        this.participantId = this.generateParticipantId();
        this.sessionStartTime = performance.now();
        
        // Data storage arrays
        this.keystrokeData = [];
        this.touchData = [];
        this.scrollData = [];
        this.motionData = [];
        this.orientationData = [];
        this.galleryData = [];
        this.crystalData = [];
        
        // Enhanced tracking variables
        this.lastScrollTime = 0;
        this.lastScrollY = 0;
        this.scrollVelocity = 0;
        this.lastScrollVelocity = 0;
        this.typingStartTime = null;
        this.lastKeystroke = null;
        this.errorCount = 0;
        this.totalKeystrokes = 0;
        
        // Touch tracking
        this.activeTouches = new Map();
        this.touchSequence = [];
        
        // Motion sensor support
        this.motionSupported = false;
        this.orientationSupported = false;
        
        // Typing task variables
        this.sentences = [
            "The quick brown fox jumps over the lazy dog with remarkable agility and grace.",
            "Technology advances rapidly in our modern world, changing how we communicate and work.",
            "Artificial intelligence and machine learning are transforming various industries today.",
            "Behavioral biometrics provide unique insights into human interaction patterns and security."
        ];
        this.currentSentenceIndex = 0;
        this.typingComplete = false;
        
        // Crystal game variables - UPDATED: Removed step 6 (Gentle Touch) - now only 5 steps
        this.crystalSteps = [
            { name: "Pressure-Sensitive Tapping", instruction: "Tap the crystal exactly 3 times with varying pressure levels", requiredTaps: 3, type: "tap" },
            { name: "Multi-Touch Scaling", instruction: "Use two fingers to resize the crystal 3 times", requiredGestures: 3, type: "pinch" },
            { name: "Swipe Patterns", instruction: "Swipe across the crystal in different directions 4 times", requiredSwipes: 4, type: "swipe" },
            { name: "Hold and Release", instruction: "Press and hold the crystal for 2 seconds, then release (3 times)", requiredHolds: 3, type: "hold" },
            { name: "Rapid Tapping", instruction: "Tap the crystal as quickly as possible 10 times", requiredTaps: 10, type: "rapid" }
        ];
        this.currentStepIndex = 0;
        this.stepProgress = 0;
        this.crystalScale = 1;
        
        // Gallery variables
        this.galleryImages = [];
        this.currentImageIndex = 0;
        this.zoomLevel = 1;
        this.panX = 0;
        this.panY = 0;
        
        this.init();
    }

    generateParticipantId() {
        return 'P' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    init() {
        this.setupEventListeners();
        this.setupMotionSensors();
        this.setupScrollTracking();
        this.initializeGallery();
        this.showScreen('welcome-screen');
        document.getElementById('participant-id').textContent = this.participantId;
    }

    setupEventListeners() {
        // Welcome screen
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startStudy();
        });

        // Typing screen with enhanced restrictions
        const typingInput = document.getElementById('typing-input');
        
        typingInput.addEventListener('keydown', (e) => {
            // ENHANCED: Block navigation keys
            const restrictedKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'];
            if (restrictedKeys.includes(e.key)) {
                e.preventDefault();
                return;
            }
            
            // ENHANCED: Block copy-paste operations
            if (e.ctrlKey && ['v', 'x', 'c', 'a'].includes(e.key.toLowerCase())) {
                e.preventDefault();
                return;
            }
            
            // Block other selection shortcuts
            if (e.shiftKey && restrictedKeys.includes(e.key)) {
                e.preventDefault();
                return;
            }
            
            // Block F-keys that might interfere
            if (e.key.startsWith('F') && e.key.length > 1) {
                e.preventDefault();
                return;
            }
            
            this.handleKeyDown(e);
        });
        
        typingInput.addEventListener('keyup', (e) => {
            this.handleKeyUp(e);
        });
        
        typingInput.addEventListener('input', (e) => {
            this.handleInput(e);
        });

        // NEW: Cursor movement restriction
        typingInput.addEventListener('mousedown', (e) => {
            setTimeout(() => {
                const length = typingInput.value.length;
                typingInput.setSelectionRange(length, length);
            }, 0);
        });

        // Enhanced paste prevention
        typingInput.addEventListener('paste', (e) => e.preventDefault());
        
        typingInput.addEventListener('copy', (e) => {
            e.preventDefault();
        });
        
        typingInput.addEventListener('cut', (e) => {
            e.preventDefault();
        });
        
        typingInput.addEventListener('selectstart', (e) => {
            e.preventDefault();
        });
        
        typingInput.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        document.getElementById('next-sentence-btn').addEventListener('click', () => {
            this.nextSentence();
        });

        // Scroll screen
        document.getElementById('finish-scroll-btn').addEventListener('click', () => {
            this.finishScrollTask();
        });

        // Crystal screen
        document.getElementById('crystal-area').addEventListener('touchstart', (e) => {
            this.handleCrystalTouch(e);
        });
        
        document.getElementById('crystal-area').addEventListener('touchmove', (e) => {
            this.handleCrystalTouch(e);
        });
        
        document.getElementById('crystal-area').addEventListener('touchend', (e) => {
            this.handleCrystalTouch(e);
        });

        document.getElementById('reset-step-btn').addEventListener('click', () => {
            this.resetCrystalStep();
        });
        
        document.getElementById('next-crystal-btn').addEventListener('click', () => {
            this.nextCrystalStep();
        });

        // Gallery screen
        document.getElementById('finish-gallery-btn').addEventListener('click', () => {
            this.finishGalleryTask();
        });

        // Export screen
        document.getElementById('export-keystroke-btn').addEventListener('click', () => {
            this.exportKeystrokeData();
        });
        
        document.getElementById('export-touch-btn').addEventListener('click', () => {
            this.exportTouchData();
        });
        
        document.getElementById('export-scroll-btn').addEventListener('click', () => {
            this.exportScrollData();
        });
        
        document.getElementById('export-motion-btn').addEventListener('click', () => {
            this.exportMotionData();
        });
        
        document.getElementById('export-all-btn').addEventListener('click', () => {
            this.exportAllData();
        });
    }

    setupMotionSensors() {
        // Request motion sensor permissions
        if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
            DeviceMotionEvent.requestPermission()
                .then(permissionState => {
                    if (permissionState === 'granted') {
                        this.initMotionSensors();
                    }
                })
                .catch(console.error);
        } else {
            this.initMotionSensors();
        }
    }

    initMotionSensors() {
        // Device motion (accelerometer + gyroscope)
        window.addEventListener('devicemotion', (e) => {
            this.recordMotionEvent({
                timestamp: performance.now(),
                acceleration: {
                    x: e.acceleration?.x || 0,
                    y: e.acceleration?.y || 0,
                    z: e.acceleration?.z || 0
                },
                accelerationIncludingGravity: {
                    x: e.accelerationIncludingGravity?.x || 0,
                    y: e.accelerationIncludingGravity?.y || 0,
                    z: e.accelerationIncludingGravity?.z || 0
                },
                rotationRate: {
                    alpha: e.rotationRate?.alpha || 0,
                    beta: e.rotationRate?.beta || 0,
                    gamma: e.rotationRate?.gamma || 0
                },
                interval: e.interval || 16
            });
            this.motionSupported = true;
        });

        // Device orientation
        window.addEventListener('deviceorientation', (e) => {
            this.recordOrientationEvent({
                timestamp: performance.now(),
                alpha: e.alpha || 0,
                beta: e.beta || 0,
                gamma: e.gamma || 0,
                absolute: e.absolute || false
            });
            this.orientationSupported = true;
        });
    }

    setupScrollTracking() {
        const scrollableContent = document.getElementById('scrollable-content');
        
        scrollableContent.addEventListener('scroll', (e) => {
            this.handleScroll(e);
        });
        
        // Track scroll wheel events
        scrollableContent.addEventListener('wheel', (e) => {
            this.handleWheelScroll(e);
        });
    }

    handleScroll(e) {
        const currentTime = performance.now();
        const scrollY = e.target.scrollTop;
        const maxScroll = e.target.scrollHeight - e.target.clientHeight;
        const scrollDepth = (scrollY / maxScroll) * 100;
        
        const timeDelta = currentTime - this.lastScrollTime;
        
        if (timeDelta > 0 && this.lastScrollTime > 0) {
            const newVelocity = (scrollY - this.lastScrollY) / timeDelta;
            const acceleration = (newVelocity - this.scrollVelocity) / timeDelta;
            
            this.recordScrollEvent({
                timestamp: currentTime,
                scrollY: scrollY,
                scrollDepth: scrollDepth,
                velocity: newVelocity,
                acceleration: acceleration,
                direction: Math.sign(newVelocity),
                timeBetweenScrolls: timeDelta,
                rhythmScore: this.calculateScrollRhythm()
            });
            
            // Update UI
            document.getElementById('scroll-velocity').textContent = Math.abs(newVelocity).toFixed(1) + ' px/s';
            document.getElementById('scroll-depth').textContent = scrollDepth.toFixed(1) + '%';
            
            this.scrollVelocity = newVelocity;
        }
        
        this.lastScrollTime = currentTime;
        this.lastScrollY = scrollY;
    }

    handleWheelScroll(e) {
        this.recordScrollEvent({
            timestamp: performance.now(),
            type: 'wheel',
            deltaX: e.deltaX,
            deltaY: e.deltaY,
            deltaZ: e.deltaZ,
            deltaMode: e.deltaMode
        });
    }

    calculateScrollRhythm() {
        if (this.scrollData.length < 5) return 1.0;
        
        const recentScrolls = this.scrollData.slice(-5);
        const intervals = [];
        
        for (let i = 1; i < recentScrolls.length; i++) {
            intervals.push(recentScrolls[i].timeBetweenScrolls);
        }
        
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
        const standardDeviation = Math.sqrt(variance);
        
        return Math.max(0, 1 - (standardDeviation / avgInterval));
    }

    handleKeyDown(e) {
        const timestamp = performance.now();
        
        if (!this.typingStartTime) {
            this.typingStartTime = timestamp;
        }
        
        const keystrokeEvent = {
            timestamp: timestamp,
            keyDownTime: timestamp,
            keyCode: e.keyCode,
            key: e.key,
            actualChar: e.key,
            pressure: e.pressure || 0.5,
            location: e.location,
            repeat: e.repeat,
            shiftKey: e.shiftKey,
            ctrlKey: e.ctrlKey,
            altKey: e.altKey,
            metaKey: e.metaKey
        };
        
        this.lastKeystroke = keystrokeEvent;
        this.totalKeystrokes++;
    }

    handleKeyUp(e) {
        if (!this.lastKeystroke || this.lastKeystroke.keyCode !== e.keyCode) return;
        
        const timestamp = performance.now();
        const keyUpTime = timestamp;
        const dwellTime = keyUpTime - this.lastKeystroke.keyDownTime;
        
        // Calculate flight time if there's a previous keystroke
        let flightTime = 0;
        if (this.keystrokeData.length > 0) {
            const previousKeystroke = this.keystrokeData[this.keystrokeData.length - 1];
            flightTime = this.lastKeystroke.keyDownTime - previousKeystroke.keyUpTime;
        }
        
        // Enhanced keystroke data
        const enhancedKeystroke = {
            ...this.lastKeystroke,
            keyUpTime: keyUpTime,
            dwellTime: dwellTime,
            flightTime: flightTime,
            typingVelocity: this.calculateTypingVelocity(),
            digraph: this.getDigraph(),
            errorType: this.detectErrorType(e.key),
            correctionLatency: this.calculateCorrectionLatency(),
            typingCadence: this.calculateTypingCadence(),
            participantId: this.participantId
        };
        
        this.keystrokeData.push(enhancedKeystroke);
        this.updateTypingStats();
        
        this.lastKeystroke = null;
    }

    calculateTypingVelocity() {
        if (this.keystrokeData.length < 2) return 0;
        
        const recentKeystrokes = this.keystrokeData.slice(-5);
        const timeSpan = recentKeystrokes[recentKeystrokes.length - 1].timestamp - recentKeystrokes[0].timestamp;
        
        return timeSpan > 0 ? (recentKeystrokes.length / timeSpan) * 1000 : 0;
    }

    getDigraph() {
        if (this.keystrokeData.length === 0) return '';
        
        const previousKey = this.keystrokeData[this.keystrokeData.length - 1].actualChar;
        const currentKey = this.lastKeystroke ? this.lastKeystroke.actualChar : '';
        
        return previousKey + currentKey;
    }

    detectErrorType(key) {
        if (key === 'Backspace') {
            this.errorCount++;
            return 'correction';
        }
        
        const targetSentence = this.sentences[this.currentSentenceIndex];
        const currentInput = document.getElementById('typing-input').value;
        
        if (currentInput.length <= targetSentence.length) {
            const expectedChar = targetSentence[currentInput.length - 1];
            if (key !== expectedChar) {
                return 'substitution';
            }
        }
        
        return 'none';
    }

    calculateCorrectionLatency() {
        if (this.keystrokeData.length < 2) return 0;
        
        for (let i = this.keystrokeData.length - 1; i >= 0; i--) {
            if (this.keystrokeData[i].errorType === 'substitution') {
                return this.lastKeystroke.timestamp - this.keystrokeData[i].timestamp;
            }
        }
        
        return 0;
    }

    calculateTypingCadence() {
        if (this.keystrokeData.length < 3) return 0;
        
        const recentKeystrokes = this.keystrokeData.slice(-3);
        const intervals = [];
        
        for (let i = 1; i < recentKeystrokes.length; i++) {
            intervals.push(recentKeystrokes[i].timestamp - recentKeystrokes[i - 1].timestamp);
        }
        
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        return 60000 / avgInterval; // Convert to beats per minute
    }

    handleInput(e) {
        this.updateTypingProgress();
    }

    updateTypingStats() {
        const currentInput = document.getElementById('typing-input').value;
        const targetSentence = this.sentences[this.currentSentenceIndex];
        
        // Calculate accuracy
        let correctChars = 0;
        for (let i = 0; i < Math.min(currentInput.length, targetSentence.length); i++) {
            if (currentInput[i] === targetSentence[i]) {
                correctChars++;
            }
        }
        
        const accuracy = currentInput.length > 0 ? (correctChars / currentInput.length) * 100 : 100;
        document.getElementById('accuracy').textContent = accuracy.toFixed(1) + '%';
        
        // Calculate WPM
        const timeElapsed = (performance.now() - this.typingStartTime) / 1000 / 60; // minutes
        const wordsTyped = currentInput.split(' ').length;
        const wpm = timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0;
        document.getElementById('wpm').textContent = wpm;
        
        // Update error count
        document.getElementById('error-count').textContent = this.errorCount;
        
        // Update advanced metrics
        this.updateAdvancedMetrics();
    }

    updateAdvancedMetrics() {
        if (this.keystrokeData.length > 0) {
            const avgDwell = this.keystrokeData.reduce((sum, k) => sum + k.dwellTime, 0) / this.keystrokeData.length;
            const avgFlight = this.keystrokeData.filter(k => k.flightTime > 0).reduce((sum, k) => sum + k.flightTime, 0) / Math.max(1, this.keystrokeData.filter(k => k.flightTime > 0).length);
            
            document.getElementById('avg-dwell').textContent = avgDwell.toFixed(0) + 'ms';
            document.getElementById('avg-flight').textContent = avgFlight.toFixed(0) + 'ms';
            
            const rhythmScore = this.calculateTypingRhythm();
            document.getElementById('rhythm-score').textContent = rhythmScore > 0.8 ? 'Stable' : rhythmScore > 0.6 ? 'Moderate' : 'Variable';
        }
    }

    calculateTypingRhythm() {
        if (this.keystrokeData.length < 5) return 1.0;
        
        const recentKeystrokes = this.keystrokeData.slice(-10);
        const intervals = [];
        
        for (let i = 1; i < recentKeystrokes.length; i++) {
            intervals.push(recentKeystrokes[i].timestamp - recentKeystrokes[i - 1].timestamp);
        }
        
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
        const standardDeviation = Math.sqrt(variance);
        
        return Math.max(0, 1 - (standardDeviation / avgInterval));
    }

    updateTypingProgress() {
        const currentInput = document.getElementById('typing-input').value;
        const targetSentence = this.sentences[this.currentSentenceIndex];
        const progress = (currentInput.length / targetSentence.length) * 100;
        
        document.getElementById('typing-progress').style.width = Math.min(progress, 100) + '%';
        
        if (currentInput.trim() === targetSentence.trim()) {
            document.getElementById('next-sentence-btn').disabled = false;
        }
    }

    nextSentence() {
        this.currentSentenceIndex++;
        
        if (this.currentSentenceIndex >= this.sentences.length) {
            this.finishTypingTask();
            return;
        }
        
        document.getElementById('typing-input').value = '';
        document.getElementById('target-sentence').textContent = this.sentences[this.currentSentenceIndex];
        document.getElementById('sentence-progress').textContent = `${this.currentSentenceIndex + 1}/${this.sentences.length}`;
        document.getElementById('next-sentence-btn').disabled = true;
        document.getElementById('typing-progress').style.width = '0%';
        
        // Reset typing stats for new sentence
        this.typingStartTime = null;
        this.errorCount = 0;
    }

    finishTypingTask() {
        this.showScreen('scroll-screen');
    }

    finishScrollTask() {
        this.showScreen('crystal-screen');
        this.initializeCrystalGame();
    }

    initializeCrystalGame() {
        this.updateCrystalStep();
    }

    updateCrystalStep() {
        const step = this.crystalSteps[this.currentStepIndex];
        document.getElementById('step-title').textContent = `Step ${this.currentStepIndex + 1}: ${step.name}`;
        document.getElementById('step-instruction').textContent = step.instruction;
        document.getElementById('current-step').textContent = `${this.currentStepIndex + 1}/5`; // UPDATED: Changed from /6 to /5
        document.getElementById('step-status').textContent = 'Ready';
        document.getElementById('step-progress').textContent = `0/${step.requiredTaps || step.requiredGestures || step.requiredSwipes || step.requiredHolds}`;
        
        this.stepProgress = 0;
        document.getElementById('next-crystal-btn').disabled = true;
    }

    handleCrystalTouch(e) {
        e.preventDefault();
        
        const timestamp = performance.now();
        const step = this.crystalSteps[this.currentStepIndex];
        
        // Enhanced touch data collection
        const touches = Array.from(e.touches || []);
        const changedTouches = Array.from(e.changedTouches || []);
        
        const enhancedTouchData = touches.map(touch => ({
            identifier: touch.identifier,
            clientX: touch.clientX,
            clientY: touch.clientY,
            pageX: touch.pageX,
            pageY: touch.pageY,
            screenX: touch.screenX,
            screenY: touch.screenY,
            radiusX: touch.radiusX || 1,
            radiusY: touch.radiusY || 1,
            rotationAngle: touch.rotationAngle || 0,
            force: touch.force || 0.5,
            touchArea: Math.PI * (touch.radiusX || 1) * (touch.radiusY || 1),
            eccentricity: this.calculateTouchEccentricity(touch)
        }));
        
        const touchEvent = {
            timestamp: timestamp,
            type: e.type,
            touches: enhancedTouchData,
            changedTouches: changedTouches.map(touch => ({
                identifier: touch.identifier,
                clientX: touch.clientX,
                clientY: touch.clientY,
                force: touch.force || 0.5,
                radiusX: touch.radiusX || 1,
                radiusY: touch.radiusY || 1
            })),
            touchCount: touches.length,
            centroid: this.calculateCentroid(touches),
            spread: this.calculateTouchSpread(touches),
            stepType: step.type,
            stepIndex: this.currentStepIndex,
            participantId: this.participantId
        };
        
        this.touchData.push(touchEvent);
        this.crystalData.push(touchEvent);
        
        // Update pressure indicator
        if (touches.length > 0) {
            const avgPressure = touches.reduce((sum, touch) => sum + (touch.force || 0.5), 0) / touches.length;
            const pressurePercent = avgPressure * 100;
            document.getElementById('pressure-fill').style.width = pressurePercent + '%';
            document.getElementById('pressure-reading').textContent = pressurePercent.toFixed(1) + '%';
            
            // Update touch area display
            const avgArea = enhancedTouchData.reduce((sum, touch) => sum + touch.touchArea, 0) / enhancedTouchData.length;
            document.getElementById('touch-area').textContent = avgArea.toFixed(0) + ' px²';
        }
        
        // Handle step-specific logic
        this.processCrystalStep(e, step);
    }

    calculateTouchEccentricity(touch) {
        if (!touch.radiusX || !touch.radiusY) return 0;
        
        const a = Math.max(touch.radiusX, touch.radiusY);
        const b = Math.min(touch.radiusX, touch.radiusY);
        
        return Math.sqrt(1 - Math.pow(b / a, 2));
    }

    calculateCentroid(touches) {
        if (touches.length === 0) return { x: 0, y: 0 };
        
        const sumX = touches.reduce((sum, touch) => sum + touch.clientX, 0);
        const sumY = touches.reduce((sum, touch) => sum + touch.clientY, 0);
        
        return {
            x: sumX / touches.length,
            y: sumY / touches.length
        };
    }

    calculateTouchSpread(touches) {
        if (touches.length < 2) return 0;
        
        const centroid = this.calculateCentroid(touches);
        const distances = touches.map(touch => 
            Math.sqrt(Math.pow(touch.clientX - centroid.x, 2) + Math.pow(touch.clientY - centroid.y, 2))
        );
        
        return Math.max(...distances);
    }

    processCrystalStep(e, step) {
        switch (step.type) {
            case 'tap':
                if (e.type === 'touchend') {
                    this.stepProgress++;
                    this.updateStepProgress(step);
                }
                break;
                
            case 'pinch':
                if (e.touches && e.touches.length === 2) {
                    const distance = this.calculateTouchDistance(e.touches[0], e.touches[1]);
                    this.updateCrystalScale(distance);
                }
                if (e.type === 'touchend' && this.stepProgress < step.requiredGestures) {
                    this.stepProgress++;
                    this.updateStepProgress(step);
                }
                break;
                
            case 'swipe':
                if (e.type === 'touchend') {
                    this.stepProgress++;
                    this.updateStepProgress(step);
                }
                break;
                
            case 'hold':
                if (e.type === 'touchstart') {
                    this.holdStartTime = performance.now();
                }
                if (e.type === 'touchend' && this.holdStartTime) {
                    const holdDuration = performance.now() - this.holdStartTime;
                    if (holdDuration >= 2000) {
                        this.stepProgress++;
                        this.updateStepProgress(step);
                    }
                }
                break;
                
            case 'rapid':
                if (e.type === 'touchend') {
                    this.stepProgress++;
                    this.updateStepProgress(step);
                }
                break;
                
            // REMOVED: 'gentle' case - Step 6 has been removed
        }
    }

    calculateTouchDistance(touch1, touch2) {
        return Math.sqrt(
            Math.pow(touch1.clientX - touch2.clientX, 2) +
            Math.pow(touch1.clientY - touch2.clientY, 2)
        );
    }

    updateCrystalScale(distance) {
        this.crystalScale = Math.max(0.5, Math.min(2.0, distance / 100));
        document.getElementById('crystal').style.transform = `scale(${this.crystalScale})`;
        document.getElementById('size-indicator').textContent = Math.round(this.crystalScale * 100) + '%';
    }

    updateStepProgress(step) {
        const required = step.requiredTaps || step.requiredGestures || step.requiredSwipes || step.requiredHolds;
        document.getElementById('step-progress').textContent = `${this.stepProgress}/${required}`;
        
        if (this.stepProgress >= required) {
            document.getElementById('step-status').textContent = 'Complete';
            document.getElementById('next-crystal-btn').disabled = false;
        }
    }

    resetCrystalStep() {
        this.stepProgress = 0;
        this.updateCrystalStep();
    }

    nextCrystalStep() {
        this.currentStepIndex++;
        
        if (this.currentStepIndex >= this.crystalSteps.length) {
            this.finishCrystalTask();
            return;
        }
        
        this.updateCrystalStep();
    }

    finishCrystalTask() {
        this.showScreen('gallery-screen');
        this.initializeGallery();
    }

    initializeGallery() {
        const galleryGrid = document.getElementById('gallery-grid');
        galleryGrid.innerHTML = '';
        
        // Generate placeholder images
        this.galleryImages = [];
        for (let i = 1; i <= 12; i++) {
            const imageData = {
                id: i,
                src: `https://picsum.photos/400/300?random=${i}`,
                alt: `Gallery Image ${i}`
            };
            this.galleryImages.push(imageData);
            
            const imageElement = document.createElement('div');
            imageElement.className = 'gallery-item';
            imageElement.innerHTML = `
                <img src="${imageData.src}" alt="${imageData.alt}" loading="lazy">
                <div class="image-overlay">
                    <span class="image-number">${i}</span>
                </div>
            `;
            
            imageElement.addEventListener('click', () => {
                this.openImagePopup(i - 1);
            });
            
            // Add touch tracking to gallery items
            imageElement.addEventListener('touchstart', (e) => this.handleGalleryTouch(e, i));
            imageElement.addEventListener('touchmove', (e) => this.handleGalleryTouch(e, i));
            imageElement.addEventListener('touchend', (e) => this.handleGalleryTouch(e, i));
            
            galleryGrid.appendChild(imageElement);
        }
        
        this.setupImagePopup();
    }

    handleGalleryTouch(e, imageId) {
        const timestamp = performance.now();
        const touches = Array.from(e.touches || []);
        
        const galleryTouchEvent = {
            timestamp: timestamp,
            type: e.type,
            imageId: imageId,
            touches: touches.map(touch => ({
                identifier: touch.identifier,
                clientX: touch.clientX,
                clientY: touch.clientY,
                force: touch.force || 0.5,
                radiusX: touch.radiusX || 1,
                radiusY: touch.radiusY || 1
            })),
            touchCount: touches.length,
            participantId: this.participantId
        };
        
        this.galleryData.push(galleryTouchEvent);
        
        // Calculate and display swipe velocity
        if (e.type === 'touchmove' && this.lastGalleryTouch) {
            const timeDelta = timestamp - this.lastGalleryTouch.timestamp;
            const touch = touches[0];
            const lastTouch = this.lastGalleryTouch.touches[0];
            
            if (touch && lastTouch && timeDelta > 0) {
                const distance = Math.sqrt(
                    Math.pow(touch.clientX - lastTouch.clientX, 2) +
                    Math.pow(touch.clientY - lastTouch.clientY, 2)
                );
                const velocity = distance / timeDelta;
                
                document.getElementById('swipe-velocity').textContent = velocity.toFixed(1) + ' px/ms';
            }
        }
        
        this.lastGalleryTouch = galleryTouchEvent;
    }

    setupImagePopup() {
        const popup = document.getElementById('image-popup');
        const popupImage = document.getElementById('popup-image');
        const closeBtn = document.getElementById('close-popup');
        const prevBtn = document.getElementById('popup-prev');
        const nextBtn = document.getElementById('popup-next');
        const zoomInBtn = document.getElementById('zoom-in');
        const zoomOutBtn = document.getElementById('zoom-out');
        const zoomResetBtn = document.getElementById('zoom-reset');
        
        closeBtn.addEventListener('click', () => this.closeImagePopup());
        prevBtn.addEventListener('click', () => this.previousImage());
        nextBtn.addEventListener('click', () => this.nextImage());
        zoomInBtn.addEventListener('click', () => this.zoomImage(1.2));
        zoomOutBtn.addEventListener('click', () => this.zoomImage(0.8));
        zoomResetBtn.addEventListener('click', () => this.resetZoom());
        
        // Touch events for popup
        popupImage.addEventListener('touchstart', (e) => this.handlePopupTouch(e));
        popupImage.addEventListener('touchmove', (e) => this.handlePopupTouch(e));
        popupImage.addEventListener('touchend', (e) => this.handlePopupTouch(e));
    }

    openImagePopup(index) {
        this.currentImageIndex = index;
        const popup = document.getElementById('image-popup');
        const popupImage = document.getElementById('popup-image');
        const counter = document.getElementById('popup-counter');
        
        popupImage.src = this.galleryImages[index].src;
        counter.textContent = `${index + 1} / ${this.galleryImages.length}`;
        popup.classList.add('active');
        
        this.resetZoom();
    }

    closeImagePopup() {
        document.getElementById('image-popup').classList.remove('active');
    }

    previousImage() {
        this.currentImageIndex = (this.currentImageIndex - 1 + this.galleryImages.length) % this.galleryImages.length;
        this.updatePopupImage();
    }

    nextImage() {
        this.currentImageIndex = (this.currentImageIndex + 1) % this.galleryImages.length;
        this.updatePopupImage();
    }

    updatePopupImage() {
        const popupImage = document.getElementById('popup-image');
        const counter = document.getElementById('popup-counter');
        
        popupImage.src = this.galleryImages[this.currentImageIndex].src;
        counter.textContent = `${this.currentImageIndex + 1} / ${this.galleryImages.length}`;
        
        this.resetZoom();
    }

    zoomImage(factor) {
        this.zoomLevel *= factor;
        this.zoomLevel = Math.max(0.5, Math.min(3, this.zoomLevel));
        this.updateImageTransform();
        
        document.getElementById('popup-zoom-level').textContent = Math.round(this.zoomLevel * 100) + '%';
        document.getElementById('zoom-level').textContent = Math.round(this.zoomLevel * 100) + '%';
    }

    resetZoom() {
        this.zoomLevel = 1;
        this.panX = 0;
        this.panY = 0;
        this.updateImageTransform();
        
        document.getElementById('popup-zoom-level').textContent = '100%';
        document.getElementById('zoom-level').textContent = '100%';
    }

    updateImageTransform() {
        const popupImage = document.getElementById('popup-image');
        popupImage.style.transform = `scale(${this.zoomLevel}) translate(${this.panX}px, ${this.panY}px)`;
    }

    handlePopupTouch(e) {
        e.preventDefault();
        
        const timestamp = performance.now();
        const touches = Array.from(e.touches || []);
        
        const popupTouchEvent = {
            timestamp: timestamp,
            type: e.type,
            imageIndex: this.currentImageIndex,
            zoomLevel: this.zoomLevel,
            panX: this.panX,
            panY: this.panY,
            touches: touches.map(touch => ({
                identifier: touch.identifier,
                clientX: touch.clientX,
                clientY: touch.clientY,
                force: touch.force || 0.5
            })),
            participantId: this.participantId
        };
        
        this.galleryData.push(popupTouchEvent);
        
        // Handle pinch-to-zoom
        if (touches.length === 2) {
            const distance = this.calculateTouchDistance(touches[0], touches[1]);
            
            if (e.type === 'touchstart') {
                this.initialPinchDistance = distance;
                this.initialZoomLevel = this.zoomLevel;
            } else if (e.type === 'touchmove' && this.initialPinchDistance) {
                const scale = distance / this.initialPinchDistance;
                this.zoomLevel = this.initialZoomLevel * scale;
                this.zoomLevel = Math.max(0.5, Math.min(3, this.zoomLevel));
                this.updateImageTransform();
                
                document.getElementById('popup-zoom-level').textContent = Math.round(this.zoomLevel * 100) + '%';
                document.getElementById('zoom-level').textContent = Math.round(this.zoomLevel * 100) + '%';
            }
        }
    }

    finishGalleryTask() {
        this.showScreen('export-screen');
        this.updateExportStats();
    }

    updateExportStats() {
        document.getElementById('keystroke-count').textContent = this.keystrokeData.length;
        document.getElementById('touch-count').textContent = this.touchData.length;
        document.getElementById('scroll-count').textContent = this.scrollData.length;
        document.getElementById('motion-count').textContent = this.motionData.length;
        
        const totalFeatures = 23 + 18 + 12 + 15; // Keystroke + Touch + Scroll + Motion features
        document.getElementById('total-features').textContent = totalFeatures;
    }

    // Data recording methods
    recordMotionEvent(data) {
        this.motionData.push({
            ...data,
            participantId: this.participantId
        });
    }

    recordOrientationEvent(data) {
        this.orientationData.push({
            ...data,
            participantId: this.participantId
        });
    }

    recordScrollEvent(data) {
        this.scrollData.push({
            ...data,
            participantId: this.participantId
        });
    }

    // Export methods
    exportKeystrokeData() {
        const csvData = this.convertToCSV(this.keystrokeData, 'keystroke');
        this.downloadCSV(csvData, `keystroke_data_${this.participantId}.csv`);
    }

    exportTouchData() {
        const csvData = this.convertToCSV(this.touchData, 'touch');
        this.downloadCSV(csvData, `touch_data_${this.participantId}.csv`);
    }

    exportScrollData() {
        const csvData = this.convertToCSV(this.scrollData, 'scroll');
        this.downloadCSV(csvData, `scroll_data_${this.participantId}.csv`);
    }

    exportMotionData() {
        const combinedMotionData = [
            ...this.motionData.map(d => ({ ...d, type: 'motion' })),
            ...this.orientationData.map(d => ({ ...d, type: 'orientation' }))
        ];
        const csvData = this.convertToCSV(combinedMotionData, 'motion');
        this.downloadCSV(csvData, `motion_data_${this.participantId}.csv`);
    }

    exportAllData() {
        const allData = {
            keystroke: this.keystrokeData,
            touch: this.touchData,
            scroll: this.scrollData,
            motion: this.motionData,
            orientation: this.orientationData,
            gallery: this.galleryData,
            crystal: this.crystalData
        };
        
        const jsonData = JSON.stringify(allData, null, 2);
        this.downloadJSON(jsonData, `complete_biometric_data_${this.participantId}.json`);
        
        // Also export individual CSV files
        this.exportKeystrokeData();
        this.exportTouchData();
        this.exportScrollData();
        this.exportMotionData();
    }

    convertToCSV(data, type) {
        if (data.length === 0) return '';
        
        let headers = [];
        let rows = [];
        
        switch (type) {
            case 'keystroke':
                headers = [
                    'participant_id', 'timestamp', 'key_code', 'key', 'actual_char',
                    'dwell_time', 'flight_time', 'pressure', 'typing_velocity',
                    'digraph', 'error_type', 'correction_latency', 'typing_cadence',
                    'shift_key', 'ctrl_key', 'alt_key', 'meta_key', 'repeat',
                    'location', 'key_down_time', 'key_up_time'
                ];
                
                rows = data.map(item => [
                    item.participantId, item.timestamp, item.keyCode, item.key,
                    item.actualChar, item.dwellTime, item.flightTime, item.pressure,
                    item.typingVelocity, item.digraph, item.errorType,
                    item.correctionLatency, item.typingCadence, item.shiftKey,
                    item.ctrlKey, item.altKey, item.metaKey, item.repeat,
                    item.location, item.keyDownTime, item.keyUpTime
                ]);
                break;
                
            case 'touch':
                headers = [
                    'participant_id', 'timestamp', 'type', 'touch_count',
                    'centroid_x', 'centroid_y', 'spread', 'step_type', 'step_index',
                    'touch_id', 'client_x', 'client_y', 'page_x', 'page_y',
                    'screen_x', 'screen_y', 'radius_x', 'radius_y',
                    'rotation_angle', 'force', 'touch_area', 'eccentricity'
                ];
                
                rows = [];
                data.forEach(event => {
                    if (event.touches && event.touches.length > 0) {
                        event.touches.forEach(touch => {
                            rows.push([
                                event.participantId, event.timestamp, event.type,
                                event.touchCount, event.centroid?.x || 0, event.centroid?.y || 0,
                                event.spread || 0, event.stepType || '', event.stepIndex || 0,
                                touch.identifier, touch.clientX, touch.clientY,
                                touch.pageX || touch.clientX, touch.pageY || touch.clientY,
                                touch.screenX || touch.clientX, touch.screenY || touch.clientY,
                                touch.radiusX, touch.radiusY, touch.rotationAngle,
                                touch.force, touch.touchArea, touch.eccentricity
                            ]);
                        });
                    }
                });
                break;
                
            case 'scroll':
                headers = [
                    'participant_id', 'timestamp', 'scroll_y', 'scroll_depth',
                    'velocity', 'acceleration', 'direction', 'time_between_scrolls',
                    'rhythm_score', 'type', 'delta_x', 'delta_y', 'delta_z', 'delta_mode'
                ];
                
                rows = data.map(item => [
                    item.participantId, item.timestamp, item.scrollY || 0,
                    item.scrollDepth || 0, item.velocity || 0, item.acceleration || 0,
                    item.direction || 0, item.timeBetweenScrolls || 0,
                    item.rhythmScore || 0, item.type || 'scroll',
                    item.deltaX || 0, item.deltaY || 0, item.deltaZ || 0, item.deltaMode || 0
                ]);
                break;
                
            case 'motion':
                headers = [
                    'participant_id', 'timestamp', 'type', 'accel_x', 'accel_y', 'accel_z',
                    'accel_gravity_x', 'accel_gravity_y', 'accel_gravity_z',
                    'rotation_alpha', 'rotation_beta', 'rotation_gamma',
                    'interval', 'orientation_alpha', 'orientation_beta',
                    'orientation_gamma', 'absolute'
                ];
                
                rows = data.map(item => [
                    item.participantId, item.timestamp, item.type || 'motion',
                    item.acceleration?.x || 0, item.acceleration?.y || 0, item.acceleration?.z || 0,
                    item.accelerationIncludingGravity?.x || 0, item.accelerationIncludingGravity?.y || 0,
                    item.accelerationIncludingGravity?.z || 0, item.rotationRate?.alpha || item.alpha || 0,
                    item.rotationRate?.beta || item.beta || 0, item.rotationRate?.gamma || item.gamma || 0,
                    item.interval || 0, item.alpha || 0, item.beta || 0, item.gamma || 0, item.absolute || false
                ]);
                break;
        }
        
        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        return csvContent;
    }

    downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    downloadJSON(jsonContent, filename) {
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    startStudy() {
        this.showScreen('typing-screen');
        document.getElementById('target-sentence').textContent = this.sentences[0];
        document.getElementById('typing-input').focus();
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new EnhancedBehavioralBiometricsCollector();
});
