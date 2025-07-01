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
        
        // Crystal game variables - 5 steps only
        this.crystalSteps = [
            { name: "Pressure-Sensitive Tapping", instruction: "Tap the crystal exactly 3 times with varying pressure levels", requiredTaps: 3, type: "tap" },
            { name: "Multi-Touch Scaling", instruction: "Use two fingers to resize the crystal 3 times", requiredGestures: 3, type: "pinch" },
            { name: "Swipe Patterns", instruction: "Swipe across the crystal in different directions 4 times", requiredSwipes: 4, type: "swipe" },
            { name: "Hold and Release", instruction: "Press and hold the crystal for 2 seconds, then release (3 times)", requiredHolds: 3, type: "hold" },
            { name: "Rapid Tapping", instruction: "Tap the crystal as quickly as possible 10 times", requiredTaps: 10, type: "rapid" }
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
            initialAngle: null,
            totalRotation: 0
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
        this.setupStrictCopyPasteProhibition(); // ENHANCED: Comprehensive copy/paste blocking
    }
    
    // ENHANCED: Complete copy/paste prohibition system
    setupStrictCopyPasteProhibition() {
        // Block copy/paste on crystal forge instructions
        const instructionEl = document.getElementById('step-instruction');
        if (instructionEl) {
            // Multiple browser compatibility for selection blocking
            instructionEl.style.userSelect = 'none';
            instructionEl.style.webkitUserSelect = 'none';
            instructionEl.style.mozUserSelect = 'none';
            instructionEl.style.msUserSelect = 'none';
            instructionEl.style.webkitTouchCallout = 'none';
            instructionEl.style.khtmlUserSelect = 'none';
            
            // Block all copy-related events
            ['copy', 'cut', 'paste', 'contextmenu', 'selectstart', 'dragstart', 'drag', 'dragover'].forEach(event => {
                instructionEl.addEventListener(event, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                });
            });
        }

        // Block copy/paste on crystal step title
        const stepTitle = document.getElementById('step-title');
        if (stepTitle) {
            stepTitle.style.userSelect = 'none';
            stepTitle.style.webkitUserSelect = 'none';
            stepTitle.style.mozUserSelect = 'none';
            stepTitle.style.msUserSelect = 'none';
            
            ['copy', 'cut', 'contextmenu', 'selectstart', 'dragstart'].forEach(event => {
                stepTitle.addEventListener(event, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                });
            });
        }

        // Block copy/paste on crystal status and progress
        ['step-status', 'step-progress', 'current-step'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.userSelect = 'none';
                ['copy', 'cut', 'contextmenu', 'selectstart'].forEach(event => {
                    el.addEventListener(event, (e) => e.preventDefault());
                });
            }
        });

        // Global copy prevention for crystal screen
        document.addEventListener('copy', (e) => {
            if (e.target.closest('.crystal-screen') || e.target.closest('#crystal-screen')) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        });

        // Global cut prevention for crystal screen
        document.addEventListener('cut', (e) => {
            if (e.target.closest('.crystal-screen') || e.target.closest('#crystal-screen')) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        });

        // Enhanced typing input restrictions
        const typingInput = document.getElementById('typing-input');
        if (typingInput) {
            // Block copy, cut, paste completely
            ['copy', 'cut', 'paste'].forEach(event => {
                typingInput.addEventListener(event, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                });
            });

            // Block context menu
            typingInput.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                return false;
            });

            // Block drag operations
            typingInput.addEventListener('dragstart', (e) => {
                e.preventDefault();
                return false;
            });
        }

        // Prevent text selection in crystal area
        const crystalArea = document.getElementById('crystal-area');
        if (crystalArea) {
            crystalArea.style.userSelect = 'none';
            crystalArea.style.webkitUserSelect = 'none';
            crystalArea.style.mozUserSelect = 'none';
        }

        // Block keyboard shortcuts globally
        document.addEventListener('keydown', (e) => {
            // Block Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X in crystal screen
            if (document.querySelector('#crystal-screen.active')) {
                if (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
            }
        });
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
        
        // Enhanced typing input restrictions
        const typingInput = document.getElementById('typing-input');
        
        // Composition events for mobile IME handling
        typingInput.addEventListener('compositionstart', (e) => {
            this.compositionActive = true;
            console.log('Composition started');
        });
        
        typingInput.addEventListener('compositionupdate', (e) => {
            console.log('Composition update:', e.data);
        });
        
        typingInput.addEventListener('compositionend', (e) => {
            this.compositionActive = false;
            if (e.data) {
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
        
        typingInput.addEventListener('input', (e) => {
            this.handleTypingInput(e);
        });
        
        typingInput.addEventListener('keydown', (e) => {
            if (this.compositionActive || e.keyCode === 229) {
                return;
            }
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
        
        // Cursor restrictions - force cursor to end
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
    
    handleTypingInput(e) {
        const { inputType, data } = e;
        const inputEl = e.target;
        const value = inputEl.value;
        const pos = inputEl.selectionStart || value.length;
        const timestamp = performance.now();

        if (inputType && inputType.startsWith('delete')) {
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
        else if (inputType === 'insertText' && data) {
            for (let i = 0; i < data.length; i++) {
                this.recordKeystroke({
                    timestamp: timestamp + i,
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

        this.lastInputLength = value.length;
        this.calculateAccuracy();
        this.checkSentenceCompletion();
    }
    
    getActualTypedCharacter(e, inputValue = '') {
        if (e.keyCode === 229 || e.key === 'Unidentified' || e.key === 'Process') {
            if (inputValue.length > this.lastInputLength) {
                return inputValue.slice(-1);
            }
            return null;
        }

        const specialKeys = {
            'Backspace': 'backspace',
            'Enter': 'enter',
            'Tab': 'tab',
            ' ': 'space',
            'Escape': 'escape',
            'ArrowLeft': 'arrowleft',
            'ArrowRight': 'arrowright',
            'ArrowUp': 'arrowup',
            'ArrowDown': 'arrowdown',
            'Delete': 'delete',
            'Home': 'home',
            'End': 'end'
        };
        
        if (e.key && specialKeys.hasOwnProperty(e.key)) {
            return specialKeys[e.key];
        }
        
        if (e.key && e.key.length === 1) {
            return e.key;
        }

        if (e.keyCode && !isNaN(e.keyCode)) {
            const char = String.fromCharCode(e.keyCode);
            if (char && /\S/.test(char)) {
                return char;
            }
        }

        return null;
    }
    
    handleKeydown(e) {
        const timestamp = performance.now();
        
        const restrictedKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
        if (restrictedKeys.includes(e.key)) {
            e.preventDefault();
            return;
        }
        
        if (e.ctrlKey && ['v', 'x', 'c'].includes(e.key.toLowerCase())) {
            e.preventDefault();
            return;
        }
        
        const actualCharacter = this.getActualTypedCharacter(e, e.target.value);
        
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
        this.currentSentence = 0;
        this.lastInputLength = 0;
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
                    
                    this.updateStepProgress(`${this.crystalState.tapCount}/${step.requiredTaps}`);
                    
                    if (this.crystalState.tapCount >= step.requiredTaps) {
                        this.completeStep();
                    }
                }
                break;
                
            case 'pinch':
                if (touches.length === 2) {
                    if (phase === 'start') {
                        this.crystalState.isPinching = true;
                        this.crystalState.initialDistance = this.getDistance(touches[0], touches[1]);
                        crystal.classList.add('active');
                    } else if (phase === 'move' && this.crystalState.isPinching) {
                        const currentDistance = this.getDistance(touches[0], touches[1]);
                        const scale = currentDistance / this.crystalState.initialDistance;
                        const newSize = Math.max(0.3, Math.min(2.0, scale));
                        
                        this.updateCrystalSize(newSize);
                        this.updateStepProgress(`Gesture ${this.crystalState.tapCount + 1}/${step.requiredGestures}`);
                    }
                } else if (phase === 'end' && this.crystalState.isPinching) {
                    this.crystalState.isPinching = false;
                    this.crystalState.tapCount++;
                    crystal.classList.remove('active');
                    
                    if (this.crystalState.tapCount >= step.requiredGestures) {
                        this.completeStep();
                    }
                }
                break;
                
            case 'swipe':
                if (phase === 'end') {
                    this.crystalState.tapCount++;
                    this.updateStepProgress(`${this.crystalState.tapCount}/${step.requiredSwipes}`);
                    
                    if (this.crystalState.tapCount >= step.requiredSwipes) {
                        this.completeStep();
                    }
                }
                break;
                
            case 'hold':
                if (phase === 'start') {
                    this.crystalState.pressureStart = performance.now();
                    crystal.classList.add('active');
                }
                if (phase === 'end' && this.crystalState.pressureStart) {
                    const holdDuration = performance.now() - this.crystalState.pressureStart;
                    if (holdDuration >= 2000) {
                        this.crystalState.tapCount++;
                        this.updateStepProgress(`${this.crystalState.tapCount}/${step.requiredHolds}`);
                        
                        if (this.crystalState.tapCount >= step.requiredHolds) {
                            this.completeStep();
                        }
                    }
                    this.crystalState.pressureStart = null;
                    crystal.classList.remove('active');
                }
                break;
                
            case 'rapid':
                if (phase === 'end') {
                    this.crystalState.tapCount++;
                    this.updateStepProgress(`${this.crystalState.tapCount}/${step.requiredTaps}`);
                    
                    if (this.crystalState.tapCount >= step.requiredTaps) {
                        this.completeStep();
                    }
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
        if (sizeIndicator) {
            sizeIndicator.textContent = `${percentage}%`;
        }
        
        if (size <= 0.6) {
            crystal.classList.add('shrinking');
            if (sizeIndicator) sizeIndicator.classList.add('shrink-highlight');
            setTimeout(() => {
                crystal.classList.remove('shrinking');
                if (sizeIndicator) sizeIndicator.classList.remove('shrink-highlight');
            }, 500);
        } else if (size >= 1.4) {
            crystal.classList.add('enlarging');
            if (sizeIndicator) sizeIndicator.classList.add('enlarge-highlight');
            setTimeout(() => {
                crystal.classList.remove('enlarging');
                if (sizeIndicator) sizeIndicator.classList.remove('enlarge-highlight');
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
    
    completeStep() {
        const crystal = document.getElementById('crystal');
        crystal.classList.add('success');
        
        setTimeout(() => {
            crystal.classList.remove('success');
        }, 600);
        
        document.getElementById('step-status').textContent = 'Completed';
        document.getElementById('next-crystal-btn').disabled = false;
        
        const sizeIndicator = document.getElementById('size-indicator');
        if (sizeIndicator) {
            sizeIndicator.classList.add('completion-highlight');
            setTimeout(() => sizeIndicator.classList.remove('completion-highlight'), 1000);
        }
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
        
        const sizeIndicator = document.getElementById('size-indicator');
        if (sizeIndicator) {
            sizeIndicator.textContent = '100%';
            sizeIndicator.classList.remove('shrink-highlight', 'enlarge-highlight', 'completion-highlight');
        }
    }
    
    updateCrystalDisplay() {
        const step = this.crystalSteps[this.currentCrystalStep - 1];
        
        document.getElementById('step-title').textContent = `Step ${this.currentCrystalStep}: ${step.name}`;
        document.getElementById('step-instruction').textContent = step.instruction;
        document.getElementById('current-step').textContent = `${this.currentCrystalStep}/5`;
        document.getElementById('step-status').textContent = 'Ready';
        document.getElementById('step-progress').textContent = this.getInitialProgress(step.type);
        document.getElementById('next-crystal-btn').disabled = true;
    }
    
    getInitialProgress(type) {
        const step = this.crystalSteps[this.currentCrystalStep - 1];
        const progress = {
            'tap': `0/${step.requiredTaps}`,
            'pinch': `0/${step.requiredGestures}`,
            'swipe': `0/${step.requiredSwipes}`,
            'hold': `0/${step.requiredHolds}`,
            'rapid': `0/${step.requiredTaps}`
        };
        return progress[type] || '0/0';
    }
    
    updateStepProgress(progress) {
        document.getElementById('step-progress').textContent = progress;
    }
    
    recordTouchEvent(data) {
        this.touchData.push(data);
    }
    
    // FIXED: Enhanced Gallery Methods with proper popup navigation
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
        
        this.resetZoom();
        this.updatePopupImage();
        document.querySelector('.image-popup').classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    // FIXED: Complete gallery popup creation with proper boundary navigation
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
        
        // FIXED: Close button - always closes popup and returns to gallery
        popup.querySelector('.close-popup').addEventListener('click', () => {
            this.closeImagePopup();
        });
        
        popup.querySelector('.popup-overlay').addEventListener('click', () => {
            this.closeImagePopup();
        });
        
        // FIXED: Prev button with boundary handling
        popup.querySelector('.popup-prev').addEventListener('click', () => {
            if (this.currentGalleryImage > 0) {
                this.prevGalleryImage();
            } else {
                // FIXED: Close popup when at first image
                this.closeImagePopup();
            }
        });
        
        // FIXED: Next button with boundary handling  
        popup.querySelector('.popup-next').addEventListener('click', () => {
            if (this.currentGalleryImage < this.galleryImages.length - 1) {
                this.nextGalleryImage();
            } else {
                // FIXED: Close popup when at last image
                this.closeImagePopup();
            }
        });
        
        // Zoom controls
        popup.querySelector('.zoom-in').addEventListener('click', () => this.zoomIn());
        popup.querySelector('.zoom-out').addEventListener('click', () => this.zoomOut());
        popup.querySelector('.zoom-reset').addEventListener('click', () => this.resetZoom());
        
        // Mouse wheel zoom
        const imageContainer = popup.querySelector('.popup-image-container');
        imageContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY < 0) {
                this.zoomIn();
            } else {
                this.zoomOut();
            }
        });
        
        // Mouse panning
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
        
        // FIXED: Keyboard navigation with boundary handling
        document.addEventListener('keydown', (e) => {
            if (popup.classList.contains('active')) {
                if (e.key === 'Escape') {
                    this.closeImagePopup();
                }
                if (e.key === 'ArrowLeft') {
                    if (this.currentGalleryImage > 0) {
                        this.prevGalleryImage();
                    } else {
                        this.closeImagePopup(); // FIXED: Close when at first image
                    }
                }
                if (e.key === 'ArrowRight') {
                    if (this.currentGalleryImage < this.galleryImages.length - 1) {
                        this.nextGalleryImage();
                    } else {
                        this.closeImagePopup(); // FIXED: Close when at last image
                    }
                }
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
    
    // FIXED: Properly close popup and return to gallery
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
    
        this.uploadCSVToGoogleDrive(csv, filename);
    
        document.getElementById('keystroke-count').textContent = this.keystrokeData.length;
        document.getElementById('keystroke-features').textContent = '9';
    }
    
    exportTouchData() {
        const features = this.extractTouchFeatures();
        const csv = this.convertToCSV(features);
        const filename = `touch_data_${this.participantId}.csv`;
    
        this.uploadCSVToGoogleDrive(csv, filename);
    
        document.getElementById('touch-count').textContent = this.touchData.length;
        document.getElementById('touch-features').textContent = '12';
    }
    
    extractKeystrokeFeatures() {
        const features = [];
        
        this.keystrokeData.forEach((keystroke, index) => {
            if (keystroke.type === 'keydown' || keystroke.type === 'insertText' || keystroke.type === 'compositionend' || keystroke.type.startsWith('delete')) {
                const flightTime = index > 0 ? 
                    Math.round(keystroke.timestamp - this.keystrokeData[index - 1].timestamp) : 
                    0;
                
                const wasDeleted = (keystroke.actualChar === 'backspace' || 
                                  keystroke.type.startsWith('delete')) ? 1 : 0;
                
                features.push({
                    participant_id: this.participantId,
                    task_id: 1,
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
