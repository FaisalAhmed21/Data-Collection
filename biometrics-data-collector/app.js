class BiometricDataCollector {
    constructor() {
        this.participantId = '';
        this.currentScreen = 'welcome';
        this.currentSentence = 0;
        this.currentCrystalStep = 1;
        this.currentGalleryImage = 0;
        
        // Data collection
        this.keystrokeData = [];
        this.touchData = [];
        
        // Enhanced pointer tracking
        this.currentPointerX = window.innerWidth / 2;
        this.currentPointerY = window.innerHeight / 2;
        this.pointerTracking = {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        };
        
        // Composition state for mobile IME handling
        this.compositionActive = false;
        this.lastInputLength = 0;
        
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
            touches: []
        };
        
        // Typing task data
        this.sentences = [
            "The quick brown fox jumps over the lazy dog with 123 numbers!",
            "Artificial Intelligence transforms healthcare through machine learning algorithms.",
            "Behavioral biometrics analyze typing patterns for secure authentication systems.",
            "Human-computer interaction studies optimize user experience and interface design."
        ];
        
        // Crystal game state
        this.crystalSteps = [
            { id: 1, instruction: "Tap the crystal exactly 3 times with your index finger", target: 3, type: 'tap' },
            { id: 2, instruction: "Rotate the crystal clockwise using two fingers for 5 seconds", target: 5000, type: 'rotate' },
            { id: 3, instruction: "Pinch to shrink the crystal to 50% size", target: 0.5, type: 'pinch' },
            { id: 4, instruction: "Spread fingers to grow crystal to 150% size", target: 1.5, type: 'spread' },
            { id: 5, instruction: "Apply pressure with 3 fingers simultaneously for 3 seconds", target: 3000, type: 'pressure' }
        ];
        
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
            // Rotation tracking
            initialAngle: null,
            totalRotation: 0  // in radians
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
        requestAnimationFrame(() => {
        this.generateParticipantId();
    });;
        this.initializeGallery();
        this.setupPointerTracking();
    }
    
    setupPointerTracking() {
        // Track mouse movement
        document.addEventListener('mousemove', (e) => {
            this.currentPointerX = e.clientX;
            this.currentPointerY = e.clientY;
            this.pointerTracking = {
                x: e.clientX,
                y: e.clientY
            };
        });
        
        // Track touch movement
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                this.currentPointerX = touch.clientX;
                this.currentPointerY = touch.clientY;
                this.pointerTracking = {
                    x: touch.clientX,
                    y: touch.clientY
                };
            }
        });
        
        // Track touch start
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                this.currentPointerX = touch.clientX;
                this.currentPointerY = touch.clientY;
                this.pointerTracking = {
                    x: touch.clientX,
                    y: touch.clientY
                };
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
    
        const idElement = document.getElementById('participant-id');
        if (idElement) {
            idElement.textContent = this.participantId;
        } else {
            console.warn('⚠️ participant-id element not found when setting ID.');
        }
    }



    
    bindEvents() {
        // Welcome screen
        document.getElementById('start-btn').addEventListener('click', () => {
            this.switchScreen('typing');
            this.startTypingTask();
        });
        
        // Typing task - FIXED: Proper mobile-friendly event handling
        const typingInput = document.getElementById('typing-input');
        
        // Composition events for mobile IME handling
        typingInput.addEventListener('compositionstart', (e) => {
            this.compositionActive = true;
            console.log('Composition started');
        });
        
        typingInput.addEventListener('compositionupdate', (e) => {
            // Track composition updates but don't record as final keystrokes
            console.log('Composition update:', e.data);
        });
        
        typingInput.addEventListener('compositionend', (e) => {
            this.compositionActive = false;
            if (e.data) {
                // Record final composition result
                this.recordKeystroke({
                    timestamp: performance.now(),
                    actualChar: e.data,
                    keyCode: e.data.charCodeAt(0),
                    type: 'compositionend',
                    sentence: this.currentSentence,
                    position: e.target.selectionStart || 0,
                    clientX: this.pointerTracking.x,
                    clientY: this.pointerTracking.y
                });
            }
            console.log('Composition ended:', e.data);
        });
        
        // FIXED: Use input event with inputType for reliable character detection
        typingInput.addEventListener('input', (e) => {
            this.handleTypingInput(e);
        });
        
        // Keydown for additional handling (non-composition events)
        typingInput.addEventListener('keydown', (e) => {
            if (this.compositionActive || e.keyCode === 229) {
                // Skip processing during composition
                return;
            }
            this.handleKeydown(e);
        });
        
        // Update pointer coordinates when typing
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

        // Inside bindEvents(), after `typingInput.addEventListener('paste', …)`
        typingInput.addEventListener('copy',   e => e.preventDefault());   // Disable Copy[6]
        typingInput.addEventListener('cut',    e => e.preventDefault());   // Disable Cut[6]
        typingInput.addEventListener('drop',   e => e.preventDefault());   // Disable Drag-and-Drop paste
        typingInput.addEventListener('contextmenu', e => e.preventDefault()); // Disable Right-Click menu[4]

        
        // Cursor restrictions
        typingInput.addEventListener('mousedown', (e) => {
            setTimeout(() => {
                const length = typingInput.value.length;
                typingInput.setSelectionRange(length, length);
            }, 0);
        });
        
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
    
    // FIXED: Enhanced mobile-friendly keystroke detection using inputType
    handleTypingInput(e) {
        const { inputType, data } = e;
        const inputEl = e.target;
        const value = inputEl.value;
        const pos = inputEl.selectionStart || value.length;
        const timestamp = performance.now();

        // Handle deletion events (backspace, delete)
        if (inputType && inputType.startsWith('delete')) {
            // Only record if there's actually content to delete
            if (pos > 0 || value.length < this.lastInputLength) {
                this.recordKeystroke({
                    timestamp,
                    actualChar: 'backspace',
                    keyCode: 8,
                    type: inputType,
                    sentence: this.currentSentence,
                    position: pos,
                    clientX: this.pointerTracking.x,
                    clientY: this.pointerTracking.y
                });
            }
        }
        // Handle text insertion
        else if (inputType === 'insertText' && data) {
            // Handle each character in the inserted text
            for (let i = 0; i < data.length; i++) {
                this.recordKeystroke({
                    timestamp: timestamp + i, // Slight offset for multiple chars
                    actualChar: data[i],
                    keyCode: data.charCodeAt(i),
                    type: inputType,
                    sentence: this.currentSentence,
                    position: pos - data.length + i,
                    clientX: this.pointerTracking.x,
                    clientY: this.pointerTracking.y
                });
            }
        }
        // Handle other input types like paste, cut, etc.
        else if (inputType && data) {
            this.recordKeystroke({
                timestamp,
                actualChar: data,
                keyCode: data.charCodeAt(0),
                type: inputType,
                sentence: this.currentSentence,
                position: pos - 1,
                clientX: this.pointerTracking.x,
                clientY: this.pointerTracking.y
            });
        }

        // Update last input length for next comparison
        this.lastInputLength = value.length;
        
        this.calculateAccuracy();
        this.checkSentenceCompletion();
    }
    
    // FIXED: Enhanced character detection with better mobile support
    getActualTypedCharacter(e, inputValue = '') {
        // 1. Handle mobile IME / virtual keyboard composition events
        if (e.keyCode === 229 || e.key === 'Unidentified' || e.key === 'Process') {
            // For mobile IME, try to get character from input value change
            if (inputValue.length > this.lastInputLength) {
                return inputValue.slice(-1);
            }
            return null; // Don't record unidentified characters
        }

        // 2. Handle well-known special keys
        const specialKeys = {
            'Backspace':    'backspace',
            'Enter':        'enter',
            'Tab':          'tab',
            ' ':            'space',
            'Escape':       'escape',
            'ArrowLeft':    'arrowleft',
            'ArrowRight':   'arrowright',
            'ArrowUp':      'arrowup',
            'ArrowDown':    'arrowdown',
            'Delete':       'delete',
            'Home':         'home',
            'End':          'end'
        };
        
        if (e.key && specialKeys.hasOwnProperty(e.key)) {
            return specialKeys[e.key];
        }
        
        // 3. Handle printable characters
        if (e.key && e.key.length === 1) {
            // Regular printable character (e.g., 'a', '1', ',', etc.)
            return e.key;
        }

        // 4. Fallback for older browsers or rare keys
        if (e.keyCode && !isNaN(e.keyCode)) {
            // Convert keyCode to a character if possible
            const char = String.fromCharCode(e.keyCode);
            if (char && /\S/.test(char)) {
                return char;
            }
        }

        // 5. Return null for unidentifiable keys (don't record them)
        return null;
    }
    
    
    
    startTypingTask() {
        this.currentSentence = 0;
        this.lastInputLength = 0; // FIXED: Reset at task start
        eys (don't record them)
        return null;
    }
    
    handleKeydown(e) {
        const timestamp = performance.now();
        
        // Block navigation keys
        const restrictedKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
        if (restrictedKeys.includes(e.key)) {
            e.preventDefault();
            return;
        }
        
        // Block copy-paste
        if (e.ctrlKey && ['v', 'x', 'c'].includes(e.key.toLowerCase())) {
            e.preventDefault();
            return;
        }
        
        // Get the actual typed character
        const actualCharacter = this.getActualTypedCharacter(e, e.target.value);
        
        // Only record if we have a valid character
        if (actualCharacter) {
            console.log('Key pressed:', e.key, 'KeyCode:', e.keyCode, 'Detected:', actualCharacter);
            
            this.recordKeystroke({
                timestamp,
                actualChar: actualCharacter,
                keyCode: e.keyCode,
                type: 'keydown',
                shiftKey: e.shiftKey,
                ctrlKey: e.ctrlKey,
                altKey: e.altKey,
                sentence: this.currentSentence,
                position: e.target.selectionStart || 0,
                clientX: this.pointerTracking.x,
                clientY: this.pointerTracking.y
            });
        }
    }
    
    startTypingTask() {
        this.currentSentence =      document.getElementById('target-sentence').textContent = this.sentences[this.currentSentence];
        const input = document.getElementById('typing-input');
        input.value = '';
        input.focus();
        document.getElementById('sentence-progress').textContent = `${this.currentSentence + 1}/4`;
        this.calculateAccuracy();
        document.getElementById('next-sentence-btn').disabled = true;
        
        // FIXED: Reset lastInputLength when starting new sentence
        this.lastInputLength = 0;
    }
    
    calculateAccuracy() {
        const typed = document.getElementById('typing-input').value;
        const target = this.sentences[this.currentSentence];
        
        if (typed.length === 0) {
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
        
        this.recordTouchEvent({
            timestamp,
            type: 'touchstart',
            touches: touches.map(t => ({
                identifier: t.identifier,
                clientX: t.clientX,
                clientY: t.clientY,
                force: t.force || 0.5
            })),
            step: this.currentCrystalStep,
            taskId: 2
        });
        
        this.processCrystalInteraction('start', touches);
    }
    
    handleCrystalTouchMove(e) {
        e.preventDefault();
        const timestamp = performance.now();
        const touches = Array.from(e.touches);
        
        this.recordTouchEvent({
            timestamp,
            type: 'touchmove',
            touches: touches.map(t => ({
                identifier: t.identifier,
                clientX: t.clientX,
                clientY: t.clientY,
                force: t.force || 0.5
            })),
            step: this.currentCrystalStep,
            taskId: 2
        });
        
        this.processCrystalInteraction('move', touches);
    }
    
    handleCrystalTouchEnd(e) {
        e.preventDefault();
        const timestamp = performance.now();
        const touches = Array.from(e.changedTouches);
        
        this.recordTouchEvent({
            timestamp,
            type: 'touchend',
            touches: touches.map(t => ({
                identifier: t.identifier,
                clientX: t.clientX,
                clientY: t.clientY,
                force: t.force || 0.5
            })),
            step: this.currentCrystalStep,
            taskId: 2
        });
        
        this.processCrystalInteraction('end', touches);
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
                force: 0.5
            }],
            step: this.currentCrystalStep,
            taskId: 2
        });
        
        this.processCrystalInteraction('start', [{ clientX: e.clientX, clientY: e.clientY }]);
    }
    
    handleCrystalMouseMove(e) {
        if (e.buttons === 1) {
            const timestamp = performance.now();
            
            this.recordTouchEvent({
                timestamp,
                type: 'mousemove',
                touches: [{
                    identifier: 0,
                    clientX: e.clientX,
                    clientY: e.clientY,
                    force: 0.5
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
                force: 0.5
            }],
            step: this.currentCrystalStep,
            taskId: 2
        });
        
        this.processCrystalInteraction('end', [{ clientX: e.clientX, clientY: e.clientY }]);
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
                
            case 'rotate':
                if (phase === 'start' && touches.length === 2) {
                    const dx = touches[1].clientX - touches[0].clientX;
                    const dy = touches[1].clientY - touches[0].clientY;
                    this.crystalState.initialAngle = Math.atan2(dy, dx);
                    this.crystalState.totalRotation = 0;
                    this.crystalState.isRotating = true;
                    this.crystalState.rotationStart = performance.now();
                    crystal.classList.add('rotation-feedback', 'active');
                } 
                else if (phase === 'move' && this.crystalState.isRotating && touches.length === 2) {
                    const dx = touches[1].clientX - touches[0].clientX;
                    const dy = touches[1].clientY - touches[0].clientY;
                    const currentAngle = Math.atan2(dy, dx);
                    
                    let angleDiff = currentAngle - this.crystalState.initialAngle;
                    if (angleDiff > Math.PI) {
                        angleDiff -= 2 * Math.PI;
                    } else if (angleDiff < -Math.PI) {
                        angleDiff += 2 * Math.PI;
                    }
                    
                    if (angleDiff > 0) {
                        this.crystalState.totalRotation += angleDiff;
                    }
                    
                    this.crystalState.initialAngle = currentAngle;
                    const elapsed = performance.now() - this.crystalState.rotationStart;
                    const rotationDeg = Math.round(this.crystalState.totalRotation * 180 / Math.PI);
                    
                    this.updateStepProgress(`${rotationDeg}° | ${Math.floor(elapsed/1000)}s / ${step.target/1000}s`);
                    
                    const requiredRadians = 10 * Math.PI / 180;
                    if (elapsed >= step.target && this.crystalState.totalRotation >= requiredRadians) {
                        this.completeStep();
                    }
                } 
                else if (phase === 'end' && touches.length < 2) {
                    this.crystalState.isRotating = false;
                    crystal.classList.remove('rotation-feedback', 'active');
                }
                break;
                
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
    
    getDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
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
            totalRotation: 0
        };
        
        const crystal = document.getElementById('crystal');
        crystal.style.transform = 'scale(1)';
        crystal.style.setProperty('--current-scale', 1);
        crystal.style.filter = 'none';
        crystal.classList.remove('active', 'shrinking', 'enlarging', 'success', 'tap-feedback', 'rotation-feedback');
        
        document.getElementById('size-indicator').textContent = '100%';
        document.getElementById('size-indicator').classList.remove('shrink-highlight', 'enlarge-highlight', 'completion-highlight');
        this.hidePressureIndicator();
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
            'rotate': 'Two-Finger Rotation',
            'pinch': 'Pinch to Shrink',
            'spread': 'Spread to Enlarge',
            'pressure': 'Three-Finger Pressure'
        };
        return titles[type] || 'Unknown';
    }
    
    getInitialProgress(type) {
        const progress = {
            'tap': '0/3',
            'rotate': '0° | 0s / 5s',
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
    
    // Enhanced Gallery Methods
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
    
    bindGalleryEvents() {
        document.addEventListener('touchstart', (e) => {
            if (document.querySelector('.image-popup.active')) {
                this.handleGalleryTouchStart(e);
            }
        });
        
        document.addEventListener('touchmove', (e) => {
            if (document.querySelector('.image-popup.active')) {
                this.handleGalleryTouchMove(e);
            }
        });
        
        document.addEventListener('touchend', (e) => {
            if (document.querySelector('.image-popup.active')) {
                this.handleGalleryTouchEnd(e);
            }
        });
        
        this.galleryTouchStart = { x: 0, y: 0 };
    }
    
    handleGalleryTouchStart(e) {
        const timestamp = performance.now();
        
        if (e.touches.length === 1) {
            this.galleryTouchStart.x = e.touches[0].clientX;
            this.galleryTouchStart.y = e.touches[0].clientY;
            this.galleryZoom.touches = [e.touches[0]];
        } else if (e.touches.length === 2) {
            this.galleryZoom.isPinching = true;
            this.galleryZoom.initialDistance = this.getDistance(e.touches[0], e.touches[1]);
            this.galleryZoom.touches = [e.touches[0], e.touches[1]];
            e.preventDefault();
        }
        
        this.recordTouchEvent({
            timestamp,
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
    
    handleGalleryTouchMove(e) {
        e.preventDefault();
        const timestamp = performance.now();
        
        if (e.touches.length === 2 && this.galleryZoom.isPinching) {
            const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
            const scaleChange = currentDistance / this.galleryZoom.initialDistance;
            const newScale = Math.max(0.5, Math.min(3.0, this.galleryZoom.scale * scaleChange));
            
            this.galleryZoom.scale = newScale;
            this.galleryZoom.initialDistance = currentDistance;
            
            this.updateImageTransform();
            this.updateZoomLevel();
        }
        
        this.recordTouchEvent({
            timestamp,
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
    
    handleGalleryTouchEnd(e) {
        const timestamp = performance.now();
        
        if (!this.galleryZoom.isPinching && e.changedTouches.length === 1) {
            const endX = e.changedTouches[0].clientX;
            const diffX = this.galleryTouchStart.x - endX;
            
            if (Math.abs(diffX) > 50 && this.galleryZoom.scale <= 1.1) {
                if (diffX > 0) {
                    this.nextGalleryImage();
                } else {
                    this.prevGalleryImage();
                }
            }
        }
        
        if (e.touches.length < 2) {
            this.galleryZoom.isPinching = false;
        }
        
        this.recordTouchEvent({
            timestamp,
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
    
    openImagePopup(index) {
        this.currentGalleryImage = index;
    
        if (!document.querySelector('.image-popup')) {
            this.createImagePopup();
        }
    
        const imageContainer = document.querySelector('.popup-image-container'); // ✅ Fix
        let lastTapTime = 0;
    
        imageContainer.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTapTime;
    
            if (tapLength < 300 && tapLength > 0) { // double-tap detected
                if (this.galleryZoom.scale > 1.1) {
                    this.resetZoom(); // Zoom out
                } else {
                    this.galleryZoom.scale = 2.0; // Zoom in to 200%
                    this.galleryZoom.translateX = 0;
                    this.galleryZoom.translateY = 0;
                    this.updateImageTransform();
                    this.updateZoomLevel();
                }
            }
    
            lastTapTime = currentTime;
        });
    
        this.resetZoom();
        this.updatePopupImage();
        document.querySelector('.image-popup').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    
    createImagePopup() {
        const popup = document.createElement('div');
        popup.className = 'image-popup';
        popup.innerHTML = `
            <div class="popup-overlay"></div>
            <div class="popup-content">
                <button class="close-popup">&times;</button>
                <div class="popup-image-container">
                    <img class="popup-image" src="" alt="">
                </div>
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
            </div>
        `;
        
        document.body.appendChild(popup);
        
        popup.querySelector('.close-popup').addEventListener('click', () => this.closeImagePopup());
        popup.querySelector('.popup-overlay').addEventListener('click', () => this.closeImagePopup());
        popup.querySelector('.popup-prev').addEventListener('click', () => this.prevGalleryImage());
        popup.querySelector('.popup-next').addEventListener('click', () => this.nextGalleryImage());
        
        popup.querySelector('.zoom-in').addEventListener('click', () => this.zoomIn());
        popup.querySelector('.zoom-out').addEventListener('click', () => this.zoomOut());
        popup.querySelector('.zoom-reset').addEventListener('click', () => this.resetZoom());
        
        const imageContainer = popup.querySelector('.popup-image-container');
        imageContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY < 0) {
                this.zoomIn();
            } else {
                this.zoomOut();
            }
        });
        
        let isPanning = false;
        imageContainer.addEventListener('mousedown', (e) => {
            if (this.galleryZoom.scale > 1) {
                isPanning = true;
                this.galleryZoom.startX = e.clientX - this.galleryZoom.translateX;
                this.galleryZoom.startY = e.clientY - this.galleryZoom.translateY;
                imageContainer.style.cursor = 'grabbing';
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isPanning && this.galleryZoom.scale > 1) {
                this.galleryZoom.translateX = e.clientX - this.galleryZoom.startX;
                this.galleryZoom.translateY = e.clientY - this.galleryZoom.startY;
                this.updateImageTransform();
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isPanning) {
                isPanning = false;
                imageContainer.style.cursor = this.galleryZoom.scale > 1 ? 'grab' : 'default';
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (popup.classList.contains('active')) {
                if (e.key === 'Escape') this.closeImagePopup();
                if (e.key === 'ArrowLeft') this.prevGalleryImage();
                if (e.key === 'ArrowRight') this.nextGalleryImage();
                if (e.key === '+' || e.key === '=') this.zoomIn();
                if (e.key === '-') this.zoomOut();
                if (e.key === '0') this.resetZoom();
            }
        });
    }
    
    zoomIn() {
        this.galleryZoom.scale = Math.min(this.galleryZoom.scale * 1.2, 3.0);
        this.updateImageTransform();
        this.updateZoomLevel();
    }
    
    zoomOut() {
        this.galleryZoom.scale = Math.max(this.galleryZoom.scale / 1.2, 0.5);
        this.updateImageTransform();
        this.updateZoomLevel();
        
        if (this.galleryZoom.scale <= 1) {
            this.galleryZoom.translateX = 0;
            this.galleryZoom.translateY = 0;
        }
    }
    
    resetZoom() {
        this.galleryZoom.scale = 1;
        this.galleryZoom.translateX = 0;
        this.galleryZoom.translateY = 0;
        this.galleryZoom.isPinching = false;
        this.updateImageTransform();
        this.updateZoomLevel();
    }
    
    updateImageTransform() {
        const img = document.querySelector('.popup-image');
        const container = document.querySelector('.popup-image-container');
        
        if (img) {
            img.style.transform = `scale(${this.galleryZoom.scale}) translate(${this.galleryZoom.translateX}px, ${this.galleryZoom.translateY}px)`;
            container.style.cursor = this.galleryZoom.scale > 1 ? 'grab' : 'default';
        }
    }
    
    updateZoomLevel() {
        const zoomLevelSpan = document.querySelector('.zoom-level');
        if (zoomLevelSpan) {
            zoomLevelSpan.textContent = `${Math.round(this.galleryZoom.scale * 100)}%`;
        }
    }
    
    updatePopupImage() {
        const popup = document.querySelector('.image-popup');
        if (popup) {
            popup.querySelector('.popup-image').src = this.galleryImages[this.currentGalleryImage];
            popup.querySelector('.popup-counter').textContent = `${this.currentGalleryImage + 1} of 20`;
            this.updateZoomLevel();
        }
    }
    
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
    
    closeImagePopup() {
        const popup = document.querySelector('.image-popup');
        if (popup) {
            popup.classList.remove('active');
            document.body.style.overflow = '';
            this.resetZoom();
        }
    }
    
    // Export Methods
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

    // https://script.google.com/macros/s/AKfycbzWMLzj7CBpeRDI9eLbndoYv72iEhZR1ZRccBs6LVHoskYaT3Udltcy9wDL1DjaHJfX/exec

    uploadCSVToGoogleDrive(content, filename) {
        const scriptURL = 'https://script.google.com/macros/s/AKfycbzWMLzj7CBpeRDI9eLbndoYv72iEhZR1ZRccBs6LVHoskYaT3Udltcy9wDL1DjaHJfX/exec'; // 🔁 Replace with your actual Apps Script Web App URL
    
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

// Initialize the application (safely delayed to ensure DOM is fully ready)
document.addEventListener('DOMContentLoaded', () => {
    requestAnimationFrame(() => {
        new BiometricDataCollector();
    });
});
