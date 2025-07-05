class BiometricDataCollector {
    constructor() {
        this.participantId = '';
        this.currentScreen = 'welcome';
        this.currentSentence = 0;
        this.currentCrystalStep = 1;
        this.currentGalleryImage = 0;
        this.lastRecordedCharTime = 0;
        this.skipNextKeydown = false;
        this.backspaceProcessed = false;
        // Data collection
        this.keystrokeData = [];
        this.touchData = [];

        // Enhanced pointer tracking
        this.currentPointerX = window.innerWidth / 2;
        this.currentPointerY = window.innerHeight / 2;
        this.pointerTracking = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

        // Composition state for mobile IME handling
        this.compositionActive = false;
        this.lastInputLength = 0;
        this.lastCharWasUppercase = false;
        this.lastInputValue = '';

        // Touch analytics tracking
        this.touchHistory = [];
        this.velocityHistory = [];

        // Enhanced gallery zoom state with pinch support
        this.galleryZoom = {
            scale: 1,
            isPanning: false,
            isPinching: false,
            startX: 0,
            startY: 0,
            translateX: 0,
            translateY: 0,
            initialDistance: 0,
            touches: [],
            lastTapTime: 0
        };

        // Typing task data
        this.sentences = [
            "Dr. Smith's Lab-42 discovered H2O molecules can freeze at -5 degree Celsius under pressure.",
            "The CEO's Q3 report showed $2.8M profit and 15% growth across all divisions.",
            "Agent X-007 decoded the message: 'Meet @ Pier 9 on July 4th at 3:30 PM.'",
            "Tesla's Model S hit 0-60 mph in 2.1 seconds - breaking the previous record!"
        ];

        // Crystal game definition
        this.crystalSteps = [
            { id: 1, instruction: "Tap the crystal exactly 3 times with your index finger", target: 3, type: 'tap' },
            { id: 2, instruction: "Rotate your finger on the crystal surface three full 360° turns, alternating direction each time (e.g., clockwise → counter-clockwise → clockwise)", target: 3, type: 'altRotate' },
            { id: 3, instruction: "Pinch to shrink the crystal to 50% size", target: 0.5, type: 'pinch' },
            { id: 4, instruction: "Spread fingers to grow crystal to 150% size", target: 1.5, type: 'spread' },
            { id: 5, instruction: "Apply pressure with 3 fingers simultaneously for 3 seconds", target: 3000, type: 'pressure' }
        ];

        // Crystal runtime state
        this.crystalState = {
            tapCount: 0,
            rotationTime: 0,
            rotationStart: null,
            currentSize: 1.0,
            isRotating: false,
            isPinching: false,
            isSpreading: false,
            pressureStart: null,
            pressureFingers: 0,
            initialDistance: 0,
            initialAngle: null,
            totalRotation: 0,
            rotationsCompleted: 0,
            expectedDirection: null,
            currentRotation: 0
        };

        // Gallery images
        this.galleryImages = [
            'https://picsum.photos/800/600?random=1',
            'https://picsum.photos/800/600?random=2',
            'https://picsum.photos/800/600?random=3',
            'https://picsum.photos/800/600?random=4',
            'https://picsum.photos/800/600?random=5',
            'https://picsum.photos/800/600?random=6',
            'https://picsum.photos/800/600?random=7',
            'https://picsum.photos/800/600?random=8',
            'https://picsum.photos/800/600?random=9',
            'https://picsum.photos/800/600?random=10',
            'https://picsum.photos/800/600?random=11',
            'https://picsum.photos/800/600?random=12',
            'https://picsum.photos/800/600?random=13',
            'https://picsum.photos/800/600?random=14',
            'https://picsum.photos/800/600?random=15',
            'https://picsum.photos/800/600?random=16',
            'https://picsum.photos/800/600?random=17',
            'https://picsum.photos/800/600?random=18',
            'https://picsum.photos/800/600?random=19',
            'https://picsum.photos/800/600?random=20'
        ];

        this.init();
    }

    init() {
        this.bindEvents();
        this.generateParticipantId();
        this.initializeGallery();
        this.setupPointerTracking();
    }

    setupPointerTracking() {
        document.addEventListener('mousemove', (e) => {
            this.currentPointerX = e.clientX;
            this.currentPointerY = e.clientY;
            this.pointerTracking = { x: e.clientX, y: e.clientY };
        });

        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                this.currentPointerX = touch.clientX;
                this.currentPointerY = touch.clientY;
                this.pointerTracking = { x: touch.clientX, y: touch.clientY };
            }
        });

        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                this.currentPointerX = touch.clientX;
                this.currentPointerY = touch.clientY;
                this.pointerTracking = { x: touch.clientX, y: touch.clientY };
            }
        });
    }

    generateParticipantId() {
        const now = new Date();
        const pad = n => n.toString().padStart(2, '0');
        const year = now.getFullYear();
        const month = pad(now.getMonth() + 1);
        const day = pad(now.getDate());
        const hour = pad(now.getHours());
        const minute = pad(now.getMinutes());
        const second = pad(now.getSeconds());
        const timePart = `${year}${month}${day}-${hour}${minute}${second}`;
        const randomPart = Math.random().toString(36).substring(2, 5);
        this.participantId = `P${timePart}-${randomPart}`;
        document.getElementById('participant-id').textContent = this.participantId;
    }

    bindEvents() {
        // Welcome screen
        document.getElementById('start-btn').addEventListener('click', () => {
            this.switchScreen('typing');
            this.startTypingTask();
        });

        // Enhanced typing task event handling
        const typingInput = document.getElementById('typing-input');

        typingInput.addEventListener('compositionstart', () => {
            this.compositionActive = true;
        });

        typingInput.addEventListener('compositionupdate', () => {
            // Track composition updates
        });

        typingInput.addEventListener('compositionend', e => {
            this.compositionActive = false;
            if (e.data) {
                for (let i = 0; i < e.data.length; i++) {
                    const char = e.data[i];
                    this.handleCharacterInput(char, 'compositionend', performance.now() + i);
                }
            }
        });

        // FIXED: Enhanced input event handling with backspace deduplication
        typingInput.addEventListener('input', e => this.handleTypingInput(e));

        // FIXED: Enhanced keydown handling for proper iOS support
        typingInput.addEventListener('keydown', e => {
            if (this.compositionActive) return;
            this.handleKeydown(e);
        });

        typingInput.addEventListener('focus', (e) => {
            const rect = e.target.getBoundingClientRect();
            this.currentPointerX = rect.left + rect.width / 2;
            this.currentPointerY = rect.top + rect.height / 2;
            this.pointerTracking.x = this.currentPointerX;
            this.pointerTracking.y = this.currentPointerY;
        });

        typingInput.addEventListener('click', (e) => {
            this.currentPointerX = e.clientX;
            this.currentPointerY = e.clientY;
            this.pointerTracking.x = e.clientX;
            this.pointerTracking.y = e.clientY;
        });

        // Prevent paste operations
        typingInput.addEventListener('paste', (e) => e.preventDefault());
        typingInput.addEventListener('copy', e => e.preventDefault());
        typingInput.addEventListener('cut', e => e.preventDefault());
        typingInput.addEventListener('drop', e => e.preventDefault());
        typingInput.addEventListener('contextmenu', e => e.preventDefault());

        document.getElementById('next-sentence-btn').addEventListener('click', () => this.nextSentence());

        // Crystal game
        this.bindCrystalEvents();
        document.getElementById('reset-step-btn').addEventListener('click', () => this.resetCrystalStep());
        document.getElementById('next-crystal-btn').addEventListener('click', () => this.nextCrystalStep());

        // Gallery
        this.bindGalleryEvents();
        document.getElementById('finish-gallery-btn').addEventListener('click', () => this.switchScreen('export'));

        // Export
        document.getElementById('export-keystroke-btn').addEventListener('click', () => this.exportKeystrokeData());
        document.getElementById('export-touch-btn').addEventListener('click', () => this.exportTouchData());
    }

    switchScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenName;
        }
    }

    // FIXED: Enhanced input handling with backspace deduplication
    handleTypingInput(e) {
        const { inputType, data } = e;
        const inputEl = e.target;
        const currentValue = inputEl.value;
        const ts = performance.now();

        // FIXED: Handle deletions with deduplication
        if (inputType && inputType.includes('delete')) {
            if (!this.backspaceProcessed) {
                this.recordKeystroke({
                    timestamp: ts,
                    actualChar: 'BACKSPACE',
                    keyCode: 8,
                    type: inputType,
                    sentence: this.currentSentence,
                    position: inputEl.selectionStart || 0,
                    clientX: this.pointerTracking.x,
                    clientY: this.pointerTracking.y
                });
                this.backspaceProcessed = true;
                setTimeout(() => { this.backspaceProcessed = false; }, 50);
            }
            this.lastInputValue = currentValue;
            this.calculateAccuracy();
            this.checkSentenceCompletion();
            return;
        }

        // Handle character inputs
        if (inputType === 'insertText' && data) {
            for (let i = 0; i < data.length; i++) {
                const char = data[i];
                this.handleCharacterInput(char, inputType, ts + i);
            }
        } else if (inputType === 'insertCompositionText' && data) {
            for (let i = 0; i < data.length; i++) {
                const char = data[i];
                this.handleCharacterInput(char, inputType, ts + i);
            }
        } else if (currentValue.length > this.lastInputValue.length) {
            const newChars = currentValue.slice(this.lastInputValue.length);
            for (let i = 0; i < newChars.length; i++) {
                const char = newChars[i];
                this.handleCharacterInput(char, 'input', ts + i);
            }
        }

        this.lastInputValue = currentValue;
        this.calculateAccuracy();
        this.checkSentenceCompletion();
    }

    // ENHANCED: Character input handler with proper SHIFT insertion
    handleCharacterInput(char, inputType, timestamp) {
        const isUpper = char.match(/[A-Z]/);
        const isLower = char.match(/[a-z]/);
        const isLetter = isUpper || isLower;

        // Insert SHIFT when case changes
        if (isLetter) {
            const currentIsUpper = isUpper;
            if (currentIsUpper !== this.lastCharWasUppercase) {
                this.recordKeystroke({
                    timestamp: timestamp - 0.5,
                    actualChar: 'SHIFT',
                    keyCode: 16,
                    type: inputType,
                    sentence: this.currentSentence,
                    position: document.getElementById('typing-input').selectionStart || 0,
                    clientX: this.pointerTracking.x,
                    clientY: this.pointerTracking.y
                });
            }
            this.lastCharWasUppercase = currentIsUpper;
        }

        // Record the actual character
        let actualChar = char;
        let keyCode = char.charCodeAt(0);

        if (char === ' ') {
            actualChar = 'SPACE';
            keyCode = 32;
        }

        this.recordKeystroke({
            timestamp: timestamp,
            actualChar: actualChar,
            keyCode: keyCode,
            type: inputType,
            sentence: this.currentSentence,
            position: document.getElementById('typing-input').selectionStart || 0,
            clientX: this.pointerTracking.x,
            clientY: this.pointerTracking.y
        });

        this.skipNextKeydown = true;
        this.lastRecordedCharTime = timestamp;
    }

    // FIXED: Enhanced keydown handling
    handleKeydown(e) {
        const now = performance.now();

        if (this.skipNextKeydown && now - this.lastRecordedCharTime < 50) {
            this.skipNextKeydown = false;
            return;
        }

        const restricted = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'];
        if (restricted.includes(e.key)) { 
            e.preventDefault(); 
            return; 
        }
        if (e.ctrlKey && ['v','x','c'].includes(e.key.toLowerCase())) { 
            e.preventDefault(); 
            return; 
        }

        // FIXED: Handle backspace with deduplication
        if (e.key === 'Backspace' || e.keyCode === 8) {
            if (!this.backspaceProcessed) {
                this.recordKeystroke({
                    timestamp: now,
                    actualChar: 'BACKSPACE',
                    keyCode: 8,
                    type: 'keydown',
                    sentence: this.currentSentence,
                    position: e.target.selectionStart || 0,
                    clientX: this.pointerTracking.x,
                    clientY: this.pointerTracking.y
                });
                this.backspaceProcessed = true;
                setTimeout(() => { this.backspaceProcessed = false; }, 50);
            }
            return;
        }

        // Handle other special keys
        const specialKeys = {
            'Enter': 'ENTER',
            'Tab': 'TAB',
            'Escape': 'ESCAPE',
            'Shift': 'SHIFT',
            'Control': 'CTRL',
            'Alt': 'ALT',
            'Meta': 'META'
        };

        if (specialKeys[e.key]) {
            this.recordKeystroke({
                timestamp: now,
                actualChar: specialKeys[e.key],
                keyCode: e.keyCode,
                type: 'keydown',
                sentence: this.currentSentence,
                position: e.target.selectionStart || 0,
                clientX: this.pointerTracking.x,
                clientY: this.pointerTracking.y
            });
            return;
        }

        // Skip printable characters as they're handled by input event
        if (e.key && e.key.length === 1) {
            return;
        }
    }

    startTypingTask() {
        this.currentSentence = 0;
        this.lastInputValue = '';
        this.lastCharWasUppercase = false;
        this.backspaceProcessed = false;
        this.displayCurrentSentence();
        this.updateTypingProgress();
    }

    displayCurrentSentence() {
        document.getElementById('target-sentence').textContent = this.sentences[this.currentSentence];
        const input = document.getElementById('typing-input');
        input.value = '';
        input.focus();
        document.getElementById('sentence-progress').textContent = `${this.currentSentence + 1}/4`;
        this.calculateAccuracy();
        document.getElementById('next-sentence-btn').disabled = true;
        this.lastInputValue = '';
        this.lastCharWasUppercase = false;
        this.backspaceProcessed = false;
    }

    calculateAccuracy() {
        const typed = document.getElementById('typing-input').value;
        const target = this.sentences[this.currentSentence];
        if (typed === target) {
            document.getElementById('accuracy').textContent = '100%';
            return;
        }
        let correct = 0;
        const minLength = Math.min(typed.length, target.length);
        for (let i = 0; i < minLength; i++) {
            if (typed[i] === target[i]) {
                correct++;
            }
        }
        const accuracy = Math.round((correct / target.length) * 100);
        document.getElementById('accuracy').textContent = `${accuracy}%`;
    }

    checkSentenceCompletion() {
        const typed = document.getElementById('typing-input').value.trim();
        const target = this.sentences[this.currentSentence].trim();
        const nextBtn = document.getElementById('next-sentence-btn');
        if (typed === target) {
            nextBtn.disabled = false;
            nextBtn.style.backgroundColor = 'var(--color-primary)';
            nextBtn.style.opacity = '1';
        } else {
            nextBtn.disabled = true;
            nextBtn.style.backgroundColor = 'var(--color-secondary)';
            nextBtn.style.opacity = '0.5';
        }
    }

    nextSentence() {
        this.currentSentence++;
        if (this.currentSentence >= this.sentences.length) {
            this.switchScreen('crystal');
            this.startCrystalGame();
        } else {
            this.displayCurrentSentence();
            this.updateTypingProgress();
        }
    }

    updateTypingProgress() {
        const progress = ((this.currentSentence) / this.sentences.length) * 100;
        document.getElementById('typing-progress').style.width = `${progress}%`;
    }

    recordKeystroke(data) {
        this.keystrokeData.push(data);
    }

    // Crystal Game Methods
    startCrystalGame() {
        this.currentCrystalStep = 1;
        this.resetCrystalState();
        this.updateCrystalDisplay();
    }

    bindCrystalEvents() {
        const crystalArea = document.getElementById('crystal-area');
        crystalArea.addEventListener('touchstart', (e) => this.handleCrystalTouchStart(e));
        crystalArea.addEventListener('touchmove', (e) => this.handleCrystalTouchMove(e));
        crystalArea.addEventListener('touchend', (e) => this.handleCrystalTouchEnd(e));
        crystalArea.addEventListener('mousedown', (e) => this.handleCrystalMouseDown(e));
        crystalArea.addEventListener('mousemove', (e) => this.handleCrystalMouseMove(e));
        crystalArea.addEventListener('mouseup', (e) => this.handleCrystalMouseUp(e));
        crystalArea.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    handleCrystalTouchStart(e) {
        e.preventDefault();
        const timestamp = performance.now();
        const touches = Array.from(e.touches);

        // Record enhanced touch data with analytics
        const touchData = {
            timestamp,
            type: 'touchstart',
            touches: touches.map(t => ({
                identifier: t.identifier,
                clientX: t.clientX,
                clientY: t.clientY,
                force: t.force || 0.5,
                radiusX: t.radiusX || 1,
                radiusY: t.radiusY || 1,
                rotationAngle: t.rotationAngle || 0,
                touchArea: this.calculateTouchArea(t),
                velocity: { x: 0, y: 0, magnitude: 0 },
                acceleration: { x: 0, y: 0, magnitude: 0 }
            })),
            step: this.currentCrystalStep,
            taskId: 2
        };

        this.recordTouchEvent(touchData);
        this.updateTouchHistory(touches[0], timestamp);
        this.processCrystalInteraction('start', touches);
    }

    handleCrystalTouchMove(e) {
        e.preventDefault();
        const timestamp = performance.now();
        const touches = Array.from(e.touches);

        // Calculate velocity and acceleration
        const velocity = this.calculateTouchVelocity(touches[0], timestamp);
        const acceleration = this.calculateTouchAcceleration(velocity, timestamp);

        const touchData = {
            timestamp,
            type: 'touchmove',
            touches: touches.map(t => ({
                identifier: t.identifier,
                clientX: t.clientX,
                clientY: t.clientY,
                force: t.force || 0.5,
                radiusX: t.radiusX || 1,
                radiusY: t.radiusY || 1,
                rotationAngle: t.rotationAngle || 0,
                touchArea: this.calculateTouchArea(t),
                velocity: velocity,
                acceleration: acceleration
            })),
            step: this.currentCrystalStep,
            taskId: 2
        };

        this.recordTouchEvent(touchData);
        this.updateTouchHistory(touches[0], timestamp);
        this.processCrystalInteraction('move', touches);
    }

    handleCrystalTouchEnd(e) {
        e.preventDefault();
        const timestamp = performance.now();
        const touches = Array.from(e.changedTouches).map(t => ({
            clientX: t.clientX,
            clientY: t.clientY
        }));
        this.processCrystalInteraction('end', touches);
        
        const touchData = {
            timestamp,
            type: 'touchend',
            touches: touches.map(t => ({
                identifier: t.identifier,
                clientX: t.clientX,
                clientY: t.clientY,
                force: t.force || 0.5,
                radiusX: t.radiusX || 1,
                radiusY: t.radiusY || 1,
                rotationAngle: t.rotationAngle || 0,
                touchArea: this.calculateTouchArea(t),
                velocity: { x: 0, y: 0, magnitude: 0 },
                acceleration: { x: 0, y: 0, magnitude: 0 }
            })),
            step: this.currentCrystalStep,
            taskId: 2
        };

        this.recordTouchEvent(touchData);
    }

    // Show direction indicator
    updateDirectionIndicator() {
        const crystalArea = document.getElementById('crystal-area');
        let indicator = crystalArea.querySelector('.direction-indicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'direction-indicator';
            crystalArea.appendChild(indicator);
        }
        
        if (this.crystalState.expectedDirection === null) {
            indicator.textContent = 'Start rotating in any direction';
            indicator.className = 'direction-indicator neutral';
        } else {
            const currentRotation = this.crystalState.rotationsCompleted;
            const isClockwise = (currentRotation % 2 === 0) 
                ? this.crystalState.expectedDirection > 0 
                : this.crystalState.expectedDirection < 0;
            
            indicator.textContent = isClockwise ? '↻ Rotate Clockwise' : '↺ Rotate Counter-Clockwise';
            indicator.className = `direction-indicator ${isClockwise ? 'clockwise' : 'counter-clockwise'}`;
        }
    }
    
    // Hide direction indicator
    hideDirectionIndicator() {
        const indicator = document.querySelector('.direction-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    // Show wrong direction feedback
    showWrongDirectionFeedback() {
        const crystal = document.getElementById('crystal');
        crystal.classList.add('wrong-direction');
        
        setTimeout(() => {
            crystal.classList.remove('wrong-direction');
        }, 300);
    }


    handleCrystalMouseDown(e) {
        const timestamp = performance.now();
        this.recordTouchEvent({
            timestamp,
            type: 'mousedown',
            touches: [{ 
                identifier: 0, 
                clientX: e.clientX, 
                clientY: e.clientY, 
                force: 0.5,
                radiusX: 1,
                radiusY: 1,
                rotationAngle: 0,
                touchArea: Math.PI,
                velocity: { x: 0, y: 0, magnitude: 0 },
                acceleration: { x: 0, y: 0, magnitude: 0 }
            }],
            step: this.currentCrystalStep,
            taskId: 2
        });
        this.processCrystalInteraction('start', [{ clientX: e.clientX, clientY: e.clientY }]);
    }

    handleCrystalMouseMove(e) {
        if (e.buttons === 1) {

            const timestamp = performance.now();
            const velocity = this.calculateTouchVelocity({ clientX: e.clientX, clientY: e.clientY }, timestamp);
            const acceleration = this.calculateTouchAcceleration(velocity, timestamp);

            this.recordTouchEvent({
                timestamp,
                type: 'mousemove',
                touches: [{ 
                    identifier: 0, 
                    clientX: e.clientX, 
                    clientY: e.clientY, 
                    force: 0.5,
                    radiusX: 1,
                    radiusY: 1,
                    rotationAngle: 0,
                    touchArea: Math.PI,
                    velocity: velocity,
                    acceleration: acceleration
                }],
                step: this.currentCrystalStep,
                taskId: 2
            });
            this.processCrystalInteraction('move', [{ clientX: e.clientX, clientY: e.clientY }]);
        }
    }

    handleCrystalMouseUp(e) {
        const timestamp = performance.now();
        this.recordTouchEvent({
            timestamp,
            type: 'mouseup',
            touches: [{ 
                identifier: 0, 
                clientX: e.clientX, 
                clientY: e.clientY, 
                force: 0.5,
                radiusX: 1,
                radiusY: 1,
                rotationAngle: 0,
                touchArea: Math.PI,
                velocity: { x: 0, y: 0, magnitude: 0 },
                acceleration: { x: 0, y: 0, magnitude: 0 }
            }],
            step: this.currentCrystalStep,
            taskId: 2
        });
        this.processCrystalInteraction('end', [{ clientX: e.clientX, clientY: e.clientY }]);
    }

    // Calculate touch area using radiusX and radiusY
    calculateTouchArea(touch) {
        const radiusX = touch.radiusX || 1;
        const radiusY = touch.radiusY || 1;
        // Elliptical area formula: π × radiusX × radiusY
        return Math.PI * radiusX * radiusY;
    }

    // Calculate touch velocity
    calculateTouchVelocity(touch, timestamp) {
        const history = this.touchHistory;
        if (history.length === 0) {
            this.updateTouchHistory(touch, timestamp);
            return { x: 0, y: 0, magnitude: 0 };
        }

        const lastTouch = history[history.length - 1];
        const deltaX = touch.clientX - lastTouch.x;
        const deltaY = touch.clientY - lastTouch.y;
        const deltaTime = timestamp - lastTouch.timestamp;

        if (deltaTime === 0) {
            return { x: 0, y: 0, magnitude: 0 };
        }

        const velocityX = deltaX / deltaTime;
        const velocityY = deltaY / deltaTime;
        const magnitude = Math.sqrt(velocityX * velocityX + velocityY * velocityY);

        return { x: velocityX, y: velocityY, magnitude: magnitude };
    }

    // Calculate touch acceleration
    calculateTouchAcceleration(velocity, timestamp) {
        const history = this.velocityHistory;
        if (history.length === 0) {
            this.velocityHistory.push({ velocity, timestamp });
            return { x: 0, y: 0, magnitude: 0 };
        }

        const lastVelocity = history[history.length - 1];
        const deltaVX = velocity.x - lastVelocity.velocity.x;
        const deltaVY = velocity.y - lastVelocity.velocity.y;
        const deltaTime = timestamp - lastVelocity.timestamp;

        if (deltaTime === 0) {
            return { x: 0, y: 0, magnitude: 0 };
        }

        const accelerationX = deltaVX / deltaTime;
        const accelerationY = deltaVY / deltaTime;
        const magnitude = Math.sqrt(accelerationX * accelerationX + accelerationY * accelerationY);

        // Keep velocity history manageable
        this.velocityHistory.push({ velocity, timestamp });
        if (this.velocityHistory.length > 10) {
            this.velocityHistory.shift();
        }

        return { x: accelerationX, y: accelerationY, magnitude: magnitude };
    }

    // Update touch history for analytics
    updateTouchHistory(touch, timestamp) {
        this.touchHistory.push({
            x: touch.clientX,
            y: touch.clientY,
            timestamp: timestamp
        });

        // Keep history manageable
        if (this.touchHistory.length > 10) {
            this.touchHistory.shift();
        }
    }

    processCrystalInteraction(phase, touches) {
        const step = this.crystalSteps[this.currentCrystalStep - 1];
        const crystal = document.getElementById('crystal');

        switch (step.type) {
            case 'tap':
                if (phase === 'end' && touches.length === 1) {
                    this.crystalState.tapCount++;
                    crystal.classList.add('tap-feedback');
                    crystal.classList.add('active');
                    setTimeout(() => {
                        crystal.classList.remove('tap-feedback');
                        crystal.classList.remove('active');
                    }, 200);
                    this.updateStepProgress(`${this.crystalState.tapCount}/${step.target}`);
                    if (this.crystalState.tapCount >= step.target) {
                        this.completeStep();
                    }
                }
                break;

            case 'altRotate': {
                const mobileRotationThreshold = 0.005;
                 

                if (touches.length !== 1) return;
            
                const rect = crystal.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const touch = touches[0];
                const angle = Math.atan2(touch.clientY - centerY, touch.clientX - centerX);
            
                if (phase === 'start') {
                    this.crystalState.initialAngle = angle;
                    this.crystalState.lastAngle = angle;
                    this.crystalState.currentRotation = 0;
                    
                    // Only reset rotations if completely starting over
                    if (this.crystalState.rotationsCompleted === 0) {
                        this.crystalState.expectedDirection = null;
                    }
                    
                    crystal.classList.add('active');
                    this.updateStepProgress(`${this.crystalState.rotationsCompleted}/3`);
                    this.updateDirectionIndicator();
                    
                } else if (phase === 'move') {
                    const last = this.crystalState.lastAngle;
                    let delta = angle - last;
                    
                    // Improved angle wrapping with validation
                    if (delta > Math.PI) delta -= 2 * Math.PI;
                    if (delta < -Math.PI) delta += 2 * Math.PI;
                    
                    // Skip if delta is invalid or too large (likely a calculation error)
                    if (!isFinite(delta) || Math.abs(delta) > Math.PI/2) return;
                    
                    // Set expected direction on first significant move
                    if (this.crystalState.expectedDirection === null && Math.abs(delta) > 0.02) {
                        this.crystalState.expectedDirection = Math.sign(delta);
                        this.updateDirectionIndicator();
                    }
                    
                    // Only process moves above threshold to reduce jitter
                    if (Math.abs(delta) < mobileRotationThreshold){
                        return;
                    }
                    
                    // Determine required direction for current rotation
                    const requiredDirection = (this.crystalState.rotationsCompleted % 2 === 0) 
                        ? this.crystalState.expectedDirection 
                        : -this.crystalState.expectedDirection;
                    
                    // ✅ FIXED: Gentle feedback instead of harsh reset
                    if (Math.sign(delta) !== requiredDirection) {
                        this.showWrongDirectionFeedback();
                        this.crystalState.lastAngle = angle; // Update angle reference but keep progress
                        return;
                    }
                    
                    // ✅ Valid rotation - update progress
                    this.crystalState.currentRotation += delta;
                    this.crystalState.lastAngle = angle;
                    
                    const rotationAmount = Math.abs(this.crystalState.currentRotation);
                    const partialRotation = Math.min(rotationAmount / (2 * Math.PI), 1);
                    
                    this.updateStepProgress(`${(this.crystalState.rotationsCompleted + partialRotation).toFixed(1)}/3`);
                    
                    // Complete a full rotation
                    if (rotationAmount >= 2 * Math.PI) {
                        this.crystalState.rotationsCompleted += 1;
                        this.crystalState.currentRotation = 0;
                        
                        crystal.classList.add('rotation-feedback');
                        setTimeout(() => crystal.classList.remove('rotation-feedback'), 300);
                        
                        this.updateDirectionIndicator();
                        
                        // Check if all rotations completed
                        if (this.crystalState.rotationsCompleted >= step.target) {
                            this.completeStep();
                        }
                    }
                    
                } else if (phase === 'end') {
                    crystal.classList.remove('active');
                    this.hideDirectionIndicator();
                }
                break;
            }


            case 'pinch':
            case 'spread':
                if (touches.length === 2) {
                    if (phase === 'start') {
                        this.crystalState.isPinching = step.type === 'pinch';
                        this.crystalState.isSpreading = step.type === 'spread';
                        this.crystalState.initialDistance = this.getDistance(touches[0], touches[1]);
                        crystal.classList.add('active');
                    } else if (phase === 'move' && (this.crystalState.isPinching || this.crystalState.isSpreading)) {
                        const currentDistance = this.getDistance(touches[0], touches[1]);
                        const scale = currentDistance / this.crystalState.initialDistance;
                        const newSize = Math.max(0.3, Math.min(2.0, scale));
                        this.updateCrystalSize(newSize);
                        this.updateStepProgress(`${Math.round(newSize * 100)}%`);
                        if (Math.abs(newSize - step.target) < 0.1) {
                            this.completeStep();
                        }
                    }
                } else if (phase === 'end') {
                    this.crystalState.isPinching = false;
                    this.crystalState.isSpreading = false;
                    crystal.classList.remove('active');
                }
                break;

            case 'pressure':
                if (touches.length === 3) {
                    if (phase === 'start') {
                        this.crystalState.pressureStart = performance.now();
                        this.crystalState.pressureFingers = touches.length;
                        crystal.classList.add('active');
                        this.showPressureIndicator();
                    } else if (phase === 'move' && this.crystalState.pressureStart) {
                        const elapsed = performance.now() - this.crystalState.pressureStart;
                        this.updatePressureIndicator(elapsed / step.target);
                        this.updateStepProgress(`${Math.floor(elapsed / 1000)}s / ${step.target / 1000}s`);
                        if (elapsed >= step.target) {
                            this.completeStep();
                        }
                    }
                } else if (phase === 'end') {
                    this.crystalState.pressureStart = null;
                    this.crystalState.pressureFingers = 0;
                    crystal.classList.remove('active');
                    this.hidePressureIndicator();
                }
                break;
        }
    }

    updateCrystalSize(size) {
        const crystal = document.getElementById('crystal');
        const sizeIndicator = document.getElementById('size-indicator');
        this.crystalState.currentSize = size;
        crystal.style.transform = `scale(${size})`;
        crystal.style.setProperty('--current-scale', size);
        const percentage = Math.round(size * 100);
        sizeIndicator.textContent = `${percentage}%`;

        if (size <= 0.6) {
            crystal.classList.add('shrinking');
            sizeIndicator.classList.add('shrink-highlight');
            setTimeout(() => {
                crystal.classList.remove('shrinking');
                sizeIndicator.classList.remove('shrink-highlight');
            }, 500);
        } else if (size >= 1.4) {
            crystal.classList.add('enlarging');
            sizeIndicator.classList.add('enlarge-highlight');
            setTimeout(() => {
                crystal.classList.remove('enlarging');
                sizeIndicator.classList.remove('enlarge-highlight');
            }, 500);
        }

        if (size < 0.7) {
            crystal.style.filter = 'hue-rotate(180deg) brightness(0.8)';
        } else if (size > 1.3) {
            crystal.style.filter = 'hue-rotate(60deg) brightness(1.3)';
        } else {
            crystal.style.filter = 'none';
        }
    }

    showPressureIndicator() {
        const crystalArea = document.getElementById('crystal-area');
        if (!crystalArea.querySelector('.pressure-indicator')) {
            const indicator = document.createElement('div');
            indicator.className = 'pressure-indicator';
            indicator.innerHTML = '<div class="pressure-fill"></div>';
            crystalArea.appendChild(indicator);
        }
    }

    updatePressureIndicator(progress) {
        const fill = document.querySelector('.pressure-fill');
        if (fill) {
            fill.style.width = `${Math.min(progress * 100, 100)}%`;
        }
    }

    hidePressureIndicator() {
        const indicator = document.querySelector('.pressure-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    completeStep() {
        const crystal = document.getElementById('crystal');
        crystal.classList.add('success');
        setTimeout(() => {
            crystal.classList.remove('success');
        }, 600);
        document.getElementById('step-status').textContent = 'Completed';
        document.getElementById('next-crystal-btn').disabled = false;
        const sizeIndicator = document.getElementById('size-indicator');
        sizeIndicator.classList.add('completion-highlight');
        setTimeout(() => sizeIndicator.classList.remove('completion-highlight'), 1000);
    }

    nextCrystalStep() {
        if (this.currentCrystalStep >= this.crystalSteps.length) {
            this.switchScreen('gallery');
            return;
        }
        this.currentCrystalStep++;
        if (this.currentCrystalStep > this.crystalSteps.length) {
            this.switchScreen('gallery');
            return;
        }
        this.resetCrystalState();
        this.updateCrystalDisplay();
    }

    resetCrystalStep() {
        this.resetCrystalState();
        this.updateCrystalDisplay();
    }

    resetCrystalState() {
        this.crystalState = {
            tapCount: 0,
            rotationTime: 0,
            rotationStart: null,
            currentSize: 1.0,
            isRotating: false,
            isPinching: false,
            isSpreading: false,
            pressureStart: null,
            pressureFingers: 0,
            initialDistance: 0,
            initialAngle: null,
            totalRotation: 0,
            rotationsCompleted: 0,
            expectedDirection: null,
            currentRotation: 0
        };

        const crystal = document.getElementById('crystal');
        crystal.style.transform = 'scale(1)';
        crystal.style.setProperty('--current-scale', 1);
        crystal.style.filter = 'none';
        crystal.classList.remove('active', 'shrinking', 'enlarging', 'success', 'tap-feedback', 'rotation-feedback');
        document.getElementById('size-indicator').textContent = '100%';
        document.getElementById('size-indicator').classList.remove('shrink-highlight', 'enlarge-highlight', 'completion-highlight');
        this.hidePressureIndicator();
        this.hideDirectionIndicator();
    }

    updateCrystalDisplay() {
        const step = this.crystalSteps[this.currentCrystalStep - 1];
        document.getElementById('step-title').textContent = `Step ${this.currentCrystalStep}: ${this.getStepTitle(step.type)}`;
        document.getElementById('step-instruction').textContent = step.instruction;
        document.getElementById('current-step').textContent = `${this.currentCrystalStep}/5`;
        document.getElementById('step-status').textContent = 'Ready';
        document.getElementById('step-progress').textContent = this.getInitialProgress(step.type);
        document.getElementById('next-crystal-btn').disabled = true;
    }

    getStepTitle(type) {
        const titles = {
            'tap': 'Index Finger Tapping',
            'altRotate': 'Alternating Finger Rotation',
            'pinch': 'Pinch to Shrink',
            'spread': 'Spread to Enlarge',
            'pressure': 'Three-Finger Pressure'
        };
        return titles[type] || 'Unknown';
    }

    getInitialProgress(type) {
        const progress = {
            'tap': '0/3',
            'altRotate': '0/3',
            'pinch': '100% → 50%',
            'spread': '100% → 150%',
            'pressure': '0s / 3s'
        };
        return progress[type] || '0/0';
    }

    updateStepProgress(progress) {
        document.getElementById('step-progress').textContent = progress;
    }

    recordTouchEvent(data) {
        this.touchData.push(data);
    }

    // Gallery Methods - YOUR PROVIDED FUNCTIONS (kept exactly as-is)
    // 1. Initialize thumbnail grid
    initializeGallery() {
        const grid = document.getElementById('gallery-grid');
        grid.innerHTML = '';
    
        this.galleryImages.forEach((url, index) => {
            const imageContainer = document.createElement('div');
            imageContainer.className = 'gallery-item';
    
            const img = document.createElement('img');
            img.src = url;
            img.alt = `Gallery image ${index + 1}`;
            img.loading = 'lazy';
    
            imageContainer.appendChild(img);
            imageContainer.addEventListener('click', () => this.openImagePopup(index));
    
            grid.appendChild(imageContainer);
        });
    }
    
    // 2. Bind touch events when popup is active
    bindGalleryEvents() {
        this.galleryTouchStart = { x: 0, y: 0 };
    
        document.addEventListener('touchstart', e => {
            if (document.querySelector('.image-popup.active')) {
                this.handleGalleryTouchStart(e);
            }
        }, { passive: false });
    
        document.addEventListener('touchmove', e => {
            if (document.querySelector('.image-popup.active')) {
                this.handleGalleryTouchMove(e);
            }
        }, { passive: false });
    
        document.addEventListener('touchend', e => {
            if (document.querySelector('.image-popup.active')) {
                this.handleGalleryTouchEnd(e);
            }
        });
    }
    
    // 3. On touch start: detect pan vs pinch vs swipe start
    handleGalleryTouchStart(e) {
        const ts = performance.now();
    
        if (e.touches.length === 1) {
            // record swipe start
            this.galleryTouchStart.x = e.touches[0].clientX;
            this.galleryTouchStart.y = e.touches[0].clientY;
    
            // if already zoomed, begin panning
            if (this.galleryZoom.scale > 1) {
                this.galleryZoom.isPanning = true;
                this.galleryZoom.startX = e.touches[0].clientX - this.galleryZoom.translateX;
                this.galleryZoom.startY = e.touches[0].clientY - this.galleryZoom.translateY;
            }
        } else if (e.touches.length === 2) {
            // begin pinch zoom
            this.galleryZoom.isPinching = true;
            this.galleryZoom.initialDistance = this.getDistance(e.touches[0], e.touches[1]);
            e.preventDefault();
        }
    
        this.recordTouchEvent({
            timestamp: ts,
            type: 'touchstart',
            touches: Array.from(e.touches).map(t => ({
                identifier: t.identifier,
                clientX: t.clientX,
                clientY: t.clientY,
                force: t.force || 0.5
            })),
            step: this.currentGalleryImage + 1,
            taskId: 3
        });
    }
    
    // 4. On touch move: perform pinch or pan
    handleGalleryTouchMove(e) {
        e.preventDefault();
        const ts = performance.now();
    
        if (e.touches.length === 2 && this.galleryZoom.isPinching) {
            // pinch-to-zoom
            const dist = this.getDistance(e.touches[0], e.touches[1]);
            const change = dist / this.galleryZoom.initialDistance;
            this.galleryZoom.scale = Math.max(0.5, Math.min(3.0, this.galleryZoom.scale * change));
            this.galleryZoom.initialDistance = dist;
            this.updateImageTransform();
            this.updateZoomLevel();
        }
        else if (e.touches.length === 1 && this.galleryZoom.isPanning) {
            // single-finger pan
            const t = e.touches[0];
            this.galleryZoom.translateX = t.clientX - this.galleryZoom.startX;
            this.galleryZoom.translateY = t.clientY - this.galleryZoom.startY;
            this.updateImageTransform();
        }
    
        this.recordTouchEvent({
            timestamp: ts,
            type: 'touchmove',
            touches: Array.from(e.touches).map(t => ({
                identifier: t.identifier,
                clientX: t.clientX,
                clientY: t.clientY,
                force: t.force || 0.5
            })),
            step: this.currentGalleryImage + 1,
            taskId: 3
        });
    }
    
    // 5. On touch end: finish pinch/pan and handle swipe if not zoomed
    handleGalleryTouchEnd(e) {
        const ts = performance.now();
    
        // swipe to change image only when scale ≈ 1
        if (!this.galleryZoom.isPinching && !this.galleryZoom.isPanning
            && e.changedTouches.length === 1 && this.galleryZoom.scale <= 1.1) {
            const endX = e.changedTouches[0].clientX;
            const dx = this.galleryTouchStart.x - endX;
            if (Math.abs(dx) > 50) {
                dx > 0 ? this.nextGalleryImage() : this.prevGalleryImage();
            }
        }
    
        // end pinch
        if (e.touches.length < 2) {
            this.galleryZoom.isPinching = false;
        }
        // end pan
        if (e.touches.length === 0) {
            this.galleryZoom.isPanning = false;
        }
    
        this.recordTouchEvent({
            timestamp: ts,
            type: 'touchend',
            touches: Array.from(e.changedTouches).map(t => ({
                identifier: t.identifier,
                clientX: t.clientX,
                clientY: t.clientY,
                force: t.force || 0.5
            })),
            step: this.currentGalleryImage + 1,
            taskId: 3
        });
    }
    
    // 6. Open popup and attach double-tap listener once
    openImagePopup(index) {
        this.currentGalleryImage = index;
        this.resetZoom();
    
        if (!document.querySelector('.image-popup')) {
            this.createImagePopup();
        }
    
        this.updatePopupImage();
        const popup = document.querySelector('.image-popup');
        popup.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    // 7. Build popup DOM and set up controls
    createImagePopup() {
        const popup = document.createElement('div');
        popup.className = 'image-popup';
        popup.innerHTML = `
            <div class="popup-overlay"></div>
            <div class="popup-content">
              <button class="close-popup">&times;</button>
              <div class="popup-image-container"><img class="popup-image" src="" alt=""></div>
              <div class="popup-counter"></div>
              <div class="popup-nav">
                <button class="popup-prev">❮</button>
                <button class="popup-next">❯</button>
              </div>
              <div class="zoom-controls">
                <button class="zoom-out">−</button>
                <span class="zoom-level">100%</span>
                <button class="zoom-in">+</button>
                <button class="zoom-reset">Reset</button>
              </div>
            </div>`;
        document.body.appendChild(popup);
    
        // close & nav
        popup.querySelector('.close-popup').onclick = () => this.closeImagePopup();
        popup.querySelector('.popup-overlay').onclick = () => this.closeImagePopup();
        popup.querySelector('.popup-prev').onclick = () => this.prevGalleryImage();
        popup.querySelector('.popup-next').onclick = () => this.nextGalleryImage();
    
        // zoom controls
        popup.querySelector('.zoom-in').onclick = () => this.zoomIn();
        popup.querySelector('.zoom-out').onclick = () => this.zoomOut();
        popup.querySelector('.zoom-reset').onclick = () => this.resetZoom();
    
        // container events
        const ctr = popup.querySelector('.popup-image-container');
    
        ctr.addEventListener('wheel', e => {
            e.preventDefault();
            e.deltaY < 0 ? this.zoomIn() : this.zoomOut();
        });
    
        // mouse pan
        let mousePanning = false;
        ctr.onmousedown = e => {
            if (this.galleryZoom.scale > 1) {
                mousePanning = true;
                this.galleryZoom.startX = e.clientX - this.galleryZoom.translateX;
                this.galleryZoom.startY = e.clientY - this.galleryZoom.translateY;
                ctr.style.cursor = 'grabbing';
            }
        };
        document.onmousemove = e => {
            if (mousePanning) {
                this.galleryZoom.translateX = e.clientX - this.galleryZoom.startX;
                this.galleryZoom.translateY = e.clientY - this.galleryZoom.startY;
                this.updateImageTransform();
            }
        };
        document.onmouseup = () => {
            if (mousePanning) {
                mousePanning = false;
                ctr.style.cursor = this.galleryZoom.scale > 1 ? 'grab' : 'default';
            }
        };
    
        // touch pan & double-tap
        let touchPanning = false;
        ctr.addEventListener('touchstart', e => {
            if (e.touches.length === 1 && this.galleryZoom.scale > 1) {
                touchPanning = true;
                this.galleryZoom.startX = e.touches[0].clientX - this.galleryZoom.translateX;
                this.galleryZoom.startY = e.touches[0].clientY - this.galleryZoom.translateY;
                ctr.style.cursor = 'grabbing';
                e.preventDefault();
            }
        }, { passive: false });
    
        ctr.addEventListener('touchmove', e => {
            if (touchPanning) {
                this.galleryZoom.translateX = e.touches[0].clientX - this.galleryZoom.startX;
                this.galleryZoom.translateY = e.touches[0].clientY - this.galleryZoom.startY;
                this.updateImageTransform();
                e.preventDefault();
            }
        }, { passive: false });
    
        ctr.addEventListener('touchend', e => {
            if (touchPanning) {
                touchPanning = false;
                ctr.style.cursor = this.galleryZoom.scale > 1 ? 'grab' : 'default';
            }
            // double-tap
            const now = Date.now();
            const dt = now - this.galleryZoom.lastTapTime;
            if (dt > 0 && dt < 300) {
                if (this.galleryZoom.scale > 1.1) {
                    this.resetZoom();
                } else {
                    this.galleryZoom.scale = 2.0;
                    this.galleryZoom.translateX = 0;
                    this.galleryZoom.translateY = 0;
                    this.updateImageTransform();
                    this.updateZoomLevel();
                }
            }
            this.galleryZoom.lastTapTime = now;
        });
    
        // keyboard
        document.onkeydown = e => {
            if (!popup.classList.contains('active')) return;
            switch (e.key) {
                case 'Escape': this.closeImagePopup(); break;
                case 'ArrowLeft': this.prevGalleryImage(); break;
                case 'ArrowRight': this.nextGalleryImage(); break;
                case '+': case '=': this.zoomIn(); break;
                case '-': this.zoomOut(); break;
                case '0': this.resetZoom(); break;
            }
        };
    }
    
    // 8. Zoom methods
    zoomIn() {
        this.galleryZoom.scale = Math.min(this.galleryZoom.scale * 1.2, 3.0);
        this.updateImageTransform();
        this.updateZoomLevel();
    }
    
    zoomOut() {
        this.galleryZoom.scale = Math.max(this.galleryZoom.scale / 1.2, 0.5);
        if (this.galleryZoom.scale <= 1) {
            this.galleryZoom.translateX = 0;
            this.galleryZoom.translateY = 0;
        }
        this.updateImageTransform();
        this.updateZoomLevel();
    }
    
    resetZoom() {
        this.galleryZoom.scale = 1;
        this.galleryZoom.translateX = 0;
        this.galleryZoom.translateY = 0;
        this.galleryZoom.isPinching = false;
        this.galleryZoom.isPanning = false;
        this.updateImageTransform();
        this.updateZoomLevel();
    }
    
    // 9. Apply translate then scale
    updateImageTransform() {
        const img = document.querySelector('.popup-image');
        const ctr = document.querySelector('.popup-image-container');
        if (!img) return;
        img.style.transform = 
            `translate(${this.galleryZoom.translateX}px, ${this.galleryZoom.translateY}px) ` +
            `scale(${this.galleryZoom.scale})`;
        ctr.style.cursor = this.galleryZoom.scale > 1 ? 'grab' : 'default';
    }
    
    // 10. Update zoom percentage display
    updateZoomLevel() {
        const span = document.querySelector('.zoom-level');
        if (span) span.textContent = `${Math.round(this.galleryZoom.scale * 100)}%`;
    }
    
    // 11. Refresh popup image & counter
    updatePopupImage() {
        const pop = document.querySelector('.image-popup');
        if (!pop) return;
        pop.querySelector('.popup-image').src = this.galleryImages[this.currentGalleryImage];
        pop.querySelector('.popup-counter').textContent =
            `${this.currentGalleryImage + 1} of ${this.galleryImages.length}`;
        this.updateZoomLevel();
    }
    
    // 12. Navigate images
    nextGalleryImage() {
        if (this.currentGalleryImage < this.galleryImages.length - 1) {
            this.currentGalleryImage++;
            this.resetZoom();
            this.updatePopupImage();
        }
    }
    
    prevGalleryImage() {
        if (this.currentGalleryImage > 0) {
            this.currentGalleryImage--;
            this.resetZoom();
            this.updatePopupImage();
        }
    }
    
    // 13. Close popup
    closeImagePopup() {
        const pop = document.querySelector('.image-popup');
        if (pop) {
            pop.classList.remove('active');
            document.body.style.overflow = '';
            this.resetZoom();
        }
    }
    
    // 14. Utility: distance between two touches
    getDistance(t1, t2) {
        const dx = t2.clientX - t1.clientX;
        const dy = t2.clientY - t1.clientY;
        return Math.hypot(dx, dy);
    }

    // Export Methods - YOUR PROVIDED FUNCTIONS (kept exactly as-is)
    exportKeystrokeData() {
        const features = this.extractKeystrokeFeatures();
        const csv = this.convertToCSV(features);
        const filename = `${this.participantId}_keystroke.csv`;
    
        this.uploadCSVToGoogleDrive(csv, filename);
    
        document.getElementById('keystroke-count').textContent = this.keystrokeData.length;
        document.getElementById('keystroke-features').textContent = '9';
    }

    exportTouchData() {
        const features = this.extractTouchFeatures();
        const csv = this.convertToCSV(features);
        const filename = `${this.participantId}_touch.csv`;

        this.uploadCSVToGoogleDrive(csv, filename);
    
        document.getElementById('touch-count').textContent = this.touchData.length;
        document.getElementById('touch-features').textContent = '12';
    }

    // FIXED: Enhanced keystroke feature extraction with proper character handling
    extractKeystrokeFeatures() {
        const features = [];
        
        this.keystrokeData.forEach((keystroke, index) => {
            // Process all recorded keystrokes (input events, keydown, composition)
            if (keystroke.type === 'keydown' || keystroke.type === 'insertText' || keystroke.type === 'compositionend' || keystroke.type.startsWith('delete')) {
                // Calculate flight time (time between keystrokes)
                const flightTime = index > 0 ? 
                    Math.round(keystroke.timestamp - this.keystrokeData[index - 1].timestamp) : 
                    0;
                
                // Determine if this was a deletion
                const wasDeleted = (keystroke.actualChar === 'backspace' || 
                                  keystroke.type.startsWith('delete')) ? 1 : 0;
                
                features.push({
                    participant_id: this.participantId,
                    task_id: 1, // Typing task
                    trial_id: keystroke.sentence + 1,
                    timestamp_ms: Math.round(keystroke.timestamp),
                    ref_char: keystroke.actualChar || 'unknown',
                    touch_x: Math.round(keystroke.clientX || this.currentPointerX),
                    touch_y: Math.round(keystroke.clientY || this.currentPointerY),
                    was_deleted: wasDeleted,
                    flight_time_ms: flightTime
                });
            }
        });
        
        return features;
    }

    // FIXED: Enhanced touch feature extraction
    extractTouchFeatures() {
        const features = [];
        
        this.touchData.forEach((touch, index) => {
            const pressure = touch.touches.reduce((sum, t) => sum + (t.force || 0.5), 0) / touch.touches.length;
            const velocity = this.calculateVelocity(touch, index);
            const acceleration = this.calculateAcceleration(touch, index);
            
            features.push({
                participant_id: this.participantId,
                task_id: touch.taskId,
                trial_id: touch.step,
                timestamp_ms: Math.round(touch.timestamp),
                touch_x: Math.round(touch.touches[0]?.clientX || 0),
                touch_y: Math.round(touch.touches[0]?.clientY || 0),
                btn_touch_state: touch.type,
                tracking_id: touch.touches[0]?.identifier || 0,
                pressure: Math.round(pressure * 100) / 100,
                velocity: Math.round(velocity * 100) / 100,
                acceleration: Math.round(acceleration * 100) / 100,
                touch_area: Math.round(this.calculateTouchArea(touch.touches)),
                inter_touch_timing: index > 0 ? Math.round(touch.timestamp - this.touchData[index - 1].timestamp) : 0
            });
        });
        
        return features;
    }
    
    calculateVelocity(touch, index) {
        if (index === 0 || !this.touchData[index - 1]) return 0;
        
        const prev = this.touchData[index - 1];
        const dt = touch.timestamp - prev.timestamp;
        
        if (dt === 0 || !touch.touches[0] || !prev.touches[0]) return 0;
        
        const dx = touch.touches[0].clientX - prev.touches[0].clientX;
        const dy = touch.touches[0].clientY - prev.touches[0].clientY;
        
        return Math.sqrt(dx * dx + dy * dy) / dt;
    }
    
    calculateAcceleration(touch, index) {
        if (index < 2) return 0;
        
        const curr = this.calculateVelocity(touch, index);
        const prev = this.calculateVelocity(this.touchData[index - 1], index - 1);
        const dt = touch.timestamp - this.touchData[index - 1].timestamp;
        
        return dt > 0 ? (curr - prev) / dt : 0;
    }
    
    calculateTouchArea(touches) {
        if (touches.length === 1) return 1;
        
        let minX = touches[0].clientX, maxX = touches[0].clientX;
        let minY = touches[0].clientY, maxY = touches[0].clientY;
        
        touches.forEach(touch => {
            minX = Math.min(minX, touch.clientX);
            maxX = Math.max(maxX, touch.clientX);
            minY = Math.min(minY, touch.clientY);
            maxY = Math.max(maxY, touch.clientY);
        });
        
        return (maxX - minX) * (maxY - minY);
    }
    
    convertToCSV(data) {
        if (data.length === 0) return 'No data available';
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header];
                return typeof value === 'string' ? `"${value}"` : value;
            }).join(','))
        ].join('\n');
        
        return csvContent;
    }

    uploadCSVToGoogleDrive(content, filename) {
        const scriptURL = 'https://script.google.com/macros/s/AKfycbzWMLzj7CBpeRDI9eLbndoYv72iEhZR1ZRccBs6LVHoskYaT3Udltcy9wDL1DjaHJfX/exec';
    
        fetch(`${scriptURL}?filename=${encodeURIComponent(filename)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: content
        })
        .then(res => res.text())
        .then(response => {
            console.log(`✅ ${filename} uploaded:`, response);
            alert(`✅ ${filename} uploaded to your Google Drive.`);
        })
        .catch(error => {
            console.error(`❌ Upload failed:`, error);
            alert(`❌ Upload failed for ${filename}: ` + error.message);
        });
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new BiometricDataCollector();
});
