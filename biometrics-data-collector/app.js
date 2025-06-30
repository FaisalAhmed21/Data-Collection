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
            y: window.innerHeight / 2,
            major: 10,
            minor: 10,
            orientation: 0
        };
        
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
            initialDistance: 0
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
        // Track mouse movement
        document.addEventListener('mousemove', (e) => {
            this.currentPointerX = e.clientX;
            this.currentPointerY = e.clientY;
            this.pointerTracking = {
                x: e.clientX,
                y: e.clientY,
                major: 10,
                minor: 10,
                orientation: 0
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
                    y: touch.clientY,
                    major: touch.radiusX ? touch.radiusX * 2 : 10,
                    minor: touch.radiusY ? touch.radiusY * 2 : 10,
                    orientation: touch.rotationAngle || 0
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
                    y: touch.clientY,
                    major: touch.radiusX ? touch.radiusX * 2 : 10,
                    minor: touch.radiusY ? touch.radiusY * 2 : 10,
                    orientation: touch.rotationAngle || 0
                };
            }
        });
    }
    
    generateParticipantId() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        this.participantId = `P${timestamp}${random}`;
        document.getElementById('participant-id').textContent = this.participantId;
    }
    
    bindEvents() {
        // Welcome screen
        document.getElementById('start-btn').addEventListener('click', () => {
            this.switchScreen('typing');
            this.startTypingTask();
        });
        
        // Typing task
        const typingInput = document.getElementById('typing-input');
        
        // CRITICAL FIX: Simplified and more reliable character detection
        typingInput.addEventListener('keydown', (e) => this.handleKeydown(e));
        typingInput.addEventListener('input', (e) => this.handleTypingInput(e));
        
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
    
    // FIXED: Return the actual key pressed by the user with improved character detection
    getActualTypedCharacter(e) {
        // Handle special keys by name
        const specialKeys = {
            8: 'Backspace',
            9: 'Tab',
            13: 'Enter',
            16: 'Shift',
            17: 'Control',
            18: 'Alt',
            20: 'CapsLock',
            27: 'Escape',
            32: 'Space',
            37: 'ArrowLeft',
            38: 'ArrowUp',
            39: 'ArrowRight',
            40: 'ArrowDown',
            46: 'Delete',
        };

        // Return special key name if exists
        if (specialKeys[e.keyCode]) {
            return specialKeys[e.keyCode];
        }

        // Handle space key explicitly
        if (e.key === ' ' || e.keyCode === 32) {
            return 'Space';
        }

        // Handle single character keys
        if (e.key && e.key.length === 1) {
            return e.key;
        }

        // Handle number keys with shift modifiers
        if (e.keyCode >= 48 && e.keyCode <= 57) {
            if (e.shiftKey) {
                const symbols = [')', '!', '@', '#', '$', '%', '^', '&', '*', '('];
                return symbols[e.keyCode - 48];
            }
            return String.fromCharCode(e.keyCode);
        }

        // Handle letter keys with correct case
        if (e.keyCode >= 65 && e.keyCode <= 90) {
            return e.shiftKey ? 
                String.fromCharCode(e.keyCode) : 
                String.fromCharCode(e.keyCode).toLowerCase();
        }

        // Handle punctuation keys
        const punctuation = {
            188: e.shiftKey ? '<' : ',',
            190: e.shiftKey ? '>' : '.',
            191: e.shiftKey ? '?' : '/',
            186: e.shiftKey ? ':' : ';',
            222: e.shiftKey ? '"' : "'",
            219: e.shiftKey ? '{' : '[',
            221: e.shiftKey ? '}' : ']',
            220: e.shiftKey ? '|' : '\\',
            189: e.shiftKey ? '_' : '-',
            187: e.shiftKey ? '+' : '=',
            192: e.shiftKey ? '~' : '`'
        };

        if (punctuation[e.keyCode]) {
            return punctuation[e.keyCode];
        }

        // Final fallback to key name
        return e.key || `KeyCode_${e.keyCode}`;
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
        if (e.ctrlKey && ['v', 'x'].includes(e.key.toLowerCase())) {
            e.preventDefault();
            return;
        }
        
        // Get the actual typed character with exact case
        const actualCharacter = this.getActualTypedCharacter(e);
        
        // Debug logging
        console.log('Key pressed:', e.key, 'KeyCode:', e.keyCode, 'Shift:', e.shiftKey, 'Detected:', actualCharacter);
        
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
            clientY: this.pointerTracking.y,
            touchMajor: this.pointerTracking.major,
            touchMinor: this.pointerTracking.minor,
            touchOrientation: this.pointerTracking.orientation
        });
    }
    
    handleTypingInput(e) {
        const input = e.target;
        setTimeout(() => {
            const length = input.value.length;
            input.setSelectionRange(length, length);
        }, 0);
        
        this.calculateAccuracy();
        this.checkSentenceCompletion();
    }
    
    startTypingTask() {
        this.currentSentence = 0;
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
                    this.crystalState.isRotating = true;
                    this.crystalState.rotationStart = performance.now();
                    crystal.classList.add('rotation-feedback');
                    crystal.classList.add('active');
                } else if (phase === 'move' && this.crystalState.isRotating && touches.length === 2) {
                    const elapsed = performance.now() - this.crystalState.rotationStart;
                    this.updateStepProgress(`${Math.floor(elapsed / 1000)}s / ${step.target / 1000}s`);
                    
                    if (elapsed >= step.target) {
                        this.completeStep();
                    }
                } else if (phase === 'end' && touches.length < 2) {
                    this.crystalState.isRotating = false;
                    crystal.classList.remove('rotation-feedback');
                    crystal.classList.remove('active');
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
            initialDistance: 0
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
            'rotate': '0s / 5s',
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
        
        // Store touch information for pinch detection
        if (e.touches.length === 1) {
            this.galleryTouchStart.x = e.touches[0].clientX;
            this.galleryTouchStart.y = e.touches[0].clientY;
            this.galleryZoom.touches = [e.touches[0]];
        } else if (e.touches.length === 2) {
            // Two-finger pinch start
            this.galleryZoom.isPinching = true;
            this.galleryZoom.initialDistance = this.getDistance(e.touches[0], e.touches[1]);
            this.galleryZoom.touches = [e.touches[0], e.touches[1]];
            
            // Prevent default swipe behavior during pinch
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
        
        // Handle two-finger pinch zoom
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
        
        // Handle single-finger swipe navigation (only when not pinching)
        if (!this.galleryZoom.isPinching && e.changedTouches.length === 1) {
            const endX = e.changedTouches[0].clientX;
            const diffX = this.galleryTouchStart.x - endX;
            
            // Only navigate if the swipe is significant and we're not zoomed in
            if (Math.abs(diffX) > 50 && this.galleryZoom.scale <= 1.1) {
                if (diffX > 0) {
                    this.nextGalleryImage();
                } else {
                    this.prevGalleryImage();
                }
            }
        }
        
        // Reset pinch state when fingers are lifted
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
        
        // Bind popup controls
        popup.querySelector('.close-popup').addEventListener('click', () => this.closeImagePopup());
        popup.querySelector('.popup-overlay').addEventListener('click', () => this.closeImagePopup());
        popup.querySelector('.popup-prev').addEventListener('click', () => this.prevGalleryImage());
        popup.querySelector('.popup-next').addEventListener('click', () => this.nextGalleryImage());
        
        // Zoom controls
        popup.querySelector('.zoom-in').addEventListener('click', () => this.zoomIn());
        popup.querySelector('.zoom-out').addEventListener('click', () => this.zoomOut());
        popup.querySelector('.zoom-reset').addEventListener('click', () => this.resetZoom());
        
        // Mouse wheel zoom support
        const imageContainer = popup.querySelector('.popup-image-container');
        imageContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY < 0) {
                this.zoomIn();
            } else {
                this.zoomOut();
            }
        });
        
        // Pan support when zoomed
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
        
        // Keyboard controls
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
    
    // Zoom functionality
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
        const filename = `keystroke_data_${this.participantId}.csv`;
        this.downloadCSV(csv, filename);
        
        document.getElementById('keystroke-count').textContent = this.keystrokeData.length;
        document.getElementById('keystroke-features').textContent = '12';
    }
    
    exportTouchData() {
        const features = this.extractTouchFeatures();
        const csv = this.convertToCSV(features);
        const filename = `touch_data_${this.participantId}.csv`;
        this.downloadCSV(csv, filename);
        
        document.getElementById('touch-count').textContent = this.touchData.length;
        document.getElementById('touch-features').textContent = '17';
    }
    
    // FIXED: Keystroke feature extraction
    extractKeystrokeFeatures() {
        const features = [];
        
        // Process each keystroke directly
        this.keystrokeData.forEach((keystroke, index) => {
            if (keystroke.type === 'keydown') {
                // Use the actualChar directly
                const refChar = keystroke.actualChar;
                
                // Calculate flight time
                const flightTime = index > 0 ? 
                    Math.round(keystroke.timestamp - this.keystrokeData[index - 1].timestamp) : 
                    0;
                
                features.push({
                    participant_id: this.participantId,
                    task_id: 1,
                    trial_id: keystroke.sentence + 1,
                    timestamp_ms: Math.round(keystroke.timestamp),
                    ref_char: refChar,
                    first_frame_touch_x: Math.round(keystroke.clientX || 100),
                    first_frame_touch_y: Math.round(keystroke.clientY || 100),
                    first_frame_touch_major: Math.round(keystroke.touchMajor || 10),
                    first_frame_touch_minor: Math.round(keystroke.touchMinor || 10),
                    first_frame_touch_orientation: Math.round(keystroke.touchOrientation || 0),
                    was_deleted: keystroke.actualChar === 'Backspace' ? 1 : 0,
                    flight_time_ms: flightTime
                });
            }
        });
        
        return features;
    }
    
    extractTouchFeatures() {
        const features = [];
        
        this.touchData.forEach((touch, index) => {
            const pressure = touch.touches.reduce((sum, t) => sum + t.force, 0) / touch.touches.length;
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
                touch_major: 10,
                touch_minor: 10,
                orientation: 0,
                tracking_id: touch.touches[0]?.identifier || 0,
                pressure: Math.round(pressure * 100) / 100,
                finger_id: 1,
                hand_id: 1,
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
    
    downloadCSV(content, filename) {
        try {
            const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                alert(`${filename} downloaded successfully!`);
            } else {
                alert('Download not supported in this browser');
            }
        } catch (error) {
            console.error('Download error:', error);
            alert(`Error downloading ${filename}: ${error.message}`);
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new BiometricDataCollector();
});
