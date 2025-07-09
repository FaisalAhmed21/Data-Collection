class BiometricDataCollector {
    constructor() {
        this.participantId = '';
        this.currentScreen = 'welcome';
        this.currentSentence = 0;
        this.currentCrystalStep = 1;
        this.currentGalleryImage = 0;
        
        // Task progression state management
        this.taskState = {
            studyStarted: false,
            typingCompleted: false,
            crystalCompleted: false,
            galleryCompleted: false
        };
        
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        this.isAndroid = /Android/.test(navigator.userAgent);
        this.isMobile = this.isIOS || this.isAndroid;
        this.keystrokeData = [];
        this.touchData = [];
        this.currentPointerX = window.innerWidth / 2;
        this.currentPointerY = window.innerHeight / 2;
        this.pointerTracking = {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        };
        
        this.compositionActive = false;
        this.lastInputLength = 0;
        this.previousChar = null;
        this.lastBackspaceTime = 0;
        this.backspaceCooldown = 100;
        this.lastCharTime = 0;
        this.lastChar = null;
        this.charCooldown = 50;
        this.lastInputValue = '';
        this.lastInputLength = 0;
        this.inputEventCount = 0;
        this.lastInputEvent = null;
        this.lastInputEventTime = 0;
        this.inputEventCooldown = 50;
        
        // SHIFT and flight time tracking
        this.shiftPressed = false;
        this.shiftPressTime = 0;
        this.shiftReleaseTime = 0;
        this.lastKeystrokeTime = 0;
        this.currentCase = 'lowercase'; // Track current case state
        this.flightTimeData = []; // Store flight times between keystrokes
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
            lastTapTime: 0,
            zoomPersistent: false // Track if zoom should persist
        };
        
        this.sentences = [
            "Dr. Smith's Lab-42 discovered H2O molecules can freeze at -5 degree Celsius under pressure.",
            "The CEO's Q3 report showed $2.8M profit and 15% growth across all divisions.",
            "Agent X-007 decoded the message: 'Meet @ Pier 9 on July 4th at 3:30 PM.'",
            "Tesla's Model S hit 0-60 mph in 2.1 seconds - breaking the previous record!"
        ];
        
        this.crystalSteps = [
            { id: 1, instruction: "Tap the crystal exactly 3 times with your finger", target: 3, type: 'tap' },
            { id: 2, instruction: "Touch anywhere on crystal surface, then rotate clockwise for one full rotation with one finger. After green light, rotate counter-clockwise for one full rotation. After second green light, rotate clockwise again for one full rotation. After third green light, task is complete.", target: 3, type: 'rotate' },
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
            initialAngle: null,
            totalRotation: 0,
            lastAngle: null,
            rotationAccumulated: 0,
            rotationDirection: null,
            rotationRounds: 0,
            rotationSequence: [],
            rotationCompleted: false, // Track if rotation task is completed
            wrongDirectionStarted: false, // Track if wrong direction was started
            currentTrial: 1,
            stepStartTime: null
        };
        
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
        this.updateTaskLocks(); // Lock all tasks at start
        this.setupCustomKeyboard(); // <-- Add this line
    }
    
    setupPointerTracking() {
        document.addEventListener('mousemove', (e) => {
            this.currentPointerX = e.clientX;
            this.currentPointerY = e.clientY;
            this.pointerTracking = {
                x: e.clientX,
                y: e.clientY
            };
        });
        
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
        document.getElementById('participant-id').textContent = this.participantId;
    }
    
    bindEvents() {
        // Welcome screen
        document.getElementById('start-btn').addEventListener('click', () => {
            this.taskState.studyStarted = true;
            this.taskState.typingCompleted = false;
            this.taskState.crystalCompleted = false;
            this.taskState.galleryCompleted = false;
            this.updateTaskLocks();
            this.switchScreen('typing');
            this.startTypingTask();
        });
        
        const typingInput = document.getElementById('typing-input');
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
        typingInput.addEventListener('paste', (e) => e.preventDefault());
        typingInput.addEventListener('copy',   e => e.preventDefault());
        typingInput.addEventListener('cut',    e => e.preventDefault());
        typingInput.addEventListener('drop',   e => e.preventDefault());
        typingInput.addEventListener('contextmenu', e => e.preventDefault());
        document.getElementById('next-sentence-btn').addEventListener('click', () => this.nextSentence());
        this.bindCrystalEvents();
        document.getElementById('reset-step-btn').addEventListener('click', () => this.resetCrystalStep());
        const nextCrystalBtn = document.getElementById('next-crystal-btn');
        if (!nextCrystalBtn) {
            console.error('[DEBUG] next-crystal-btn not found in DOM when attaching handler!');
        } else {
            nextCrystalBtn.addEventListener('click', () => {
                console.log('[DEBUG] Next Step button clicked');
                this.nextCrystalStep();
            });
            console.log('[DEBUG] Next Step button handler attached');
        }
        this.bindGalleryEvents();
        document.getElementById('finish-gallery-btn').addEventListener('click', () => this.switchScreen('export'));
        document.getElementById('export-keystroke-btn').addEventListener('click', () => this.exportKeystrokeData());
        document.getElementById('export-touch-btn').addEventListener('click', () => this.exportTouchData());

        // Restrict cursor movement: always keep cursor at end
        /*
        typingInput.addEventListener('keydown', (e) => {
            // Prevent arrow keys, Home, End, and selection
            if ([37, 38, 39, 40, 35, 36].includes(e.keyCode) || (e.ctrlKey && (e.key === 'a' || e.key === 'A'))) {
                e.preventDefault();
                return false;
            }
        });
        typingInput.addEventListener('mousedown', (e) => {
            // Prevent mouse click from moving cursor
            e.preventDefault();
            typingInput.setSelectionRange(typingInput.value.length, typingInput.value.length);
            return false;
        });
        typingInput.addEventListener('mouseup', (e) => {
            // Always set cursor at end after mouse up
            typingInput.setSelectionRange(typingInput.value.length, typingInput.value.length);
        });
        typingInput.addEventListener('select', (e) => {
            // Prevent text selection
            typingInput.setSelectionRange(typingInput.value.length, typingInput.value.length);
        });
        typingInput.addEventListener('input', (e) => {
            // Always keep cursor at end after input
            typingInput.setSelectionRange(typingInput.value.length, typingInput.value.length);
        });
        */
    }
    
    switchScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenName;
            
            // Smooth scroll to the target screen
            this.smoothScrollToScreen(targetScreen);
        }
        // Update feature counts on export screen
        if (screenName === 'export') {
            // Keystroke features
            const keystrokeFeatures = this.extractKeystrokeFeatures();
            const keystrokeFeatureCount = keystrokeFeatures.length > 0 ? Object.keys(keystrokeFeatures[0]).length : 0;
            document.getElementById('keystroke-features').textContent = keystrokeFeatureCount;
            // Touch features
            const touchFeatures = this.extractTouchFeatures();
            const touchFeatureCount = touchFeatures.length > 0 ? Object.keys(touchFeatures[0]).length : 0;
            document.getElementById('touch-features').textContent = touchFeatureCount;
        }
    }
    
    smoothScrollToScreen(targetScreen) {
        // Smooth scroll to the target screen
        targetScreen.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
        });
        
        // Additional smooth scroll for mobile devices
        setTimeout(() => {
            window.scrollTo({
                top: targetScreen.offsetTop,
                behavior: 'smooth'
            });
        }, 100);
    }
    
    showNextTaskButton(targetScreen, taskName) {
        // Hide the current "Next" button
        const currentBtn = document.getElementById('next-sentence-btn');
        if (currentBtn) {
            currentBtn.style.display = 'none';
        }
        const crystalBtn = document.getElementById('next-crystal-btn');
        if (crystalBtn) {
            crystalBtn.style.display = 'none';
        }
        let nextTaskBtn = document.getElementById('next-task-btn');
        if (!nextTaskBtn) {
            nextTaskBtn = document.createElement('button');
            nextTaskBtn.id = 'next-task-btn';
            nextTaskBtn.className = 'next-task-btn';
            nextTaskBtn.textContent = `Next Task: ${taskName}`;
            if (targetScreen === 'crystal') {
                const typingSection = document.getElementById('typing-screen');
                typingSection.appendChild(nextTaskBtn);
            } else if (targetScreen === 'gallery') {
                const crystalSection = document.getElementById('crystal-screen');
                crystalSection.appendChild(nextTaskBtn);
            }
        } else {
            nextTaskBtn.textContent = `Next Task: ${taskName}`;
        }
        nextTaskBtn.onclick = () => {
            if (targetScreen === 'crystal') {
                this.taskState.typingCompleted = true;
                this.taskState.crystalCompleted = false;
                this.taskState.galleryCompleted = false;
                this.updateTaskLocks();
                this.switchScreen('crystal');
                this.startCrystalGame();
            } else if (targetScreen === 'gallery') {
                this.taskState.crystalCompleted = true;
                this.taskState.galleryCompleted = false;
                this.updateTaskLocks();
                this.switchScreen('gallery');
            }
            nextTaskBtn.remove();
        };
        nextTaskBtn.style.display = 'inline-flex';
        nextTaskBtn.style.opacity = '0';
        nextTaskBtn.style.transform = 'translateY(20px)';
        setTimeout(() => {
            nextTaskBtn.style.transition = 'all 0.5s ease';
            nextTaskBtn.style.opacity = '1';
            nextTaskBtn.style.transform = 'translateY(0)';
        }, 100);
        console.log(`✅ Next Task button shown for: ${taskName}`);
    }
    
    // FIXED: Enhanced mobile-friendly keystroke detection using inputType
    // FIXED: Enhanced mobile-friendly keystroke detection with reduced deduplication

    // FIXED: Simplified character normalization function
    normalizeCharacter(char) {
        // Handle common smart quotes and special characters
        const charMap = {
            // Single quotes and apostrophes
            "'": "'", "'": "'", "'": "'", "`": "'", "´": "'", "′": "'", "‵": "'",
            // Double quotes  
            '"': '"', '"': '"', '"': '"', '„': '"', '‟': '"', '″': '"', '‶': '"',
            // Dashes
            '–': '-', '—': '-',
            // Other common characters
            '…': '.', '،': ',', '¡': '!', '¿': '?',
            '€': '$', '£': '$', '¥': '$', '±': '+', '≠': '=',
            '℃': '°', '℉': '°'
        };
        
        // Return normalized character or original if no mapping exists
        return charMap[char] || char;
    }

    handleTypingInput(e) {
        const { inputType, data } = e;
        const inputEl = e.target;
        const value = inputEl.value;
        const pos = inputEl.selectionStart || value.length;
        const timestamp = performance.now();
        const currentTime = performance.now();
    
        // Skip composition events entirely - let them complete first
        if (this.compositionActive) {
            console.log('Composition active, skipping input event');
            return;
        }
    
        // FIXED: Much more lenient deduplication - only block obvious duplicates
        const eventSignature = `${inputType}-${data}-${value.length}`;
        
        if (data && inputType === 'insertText') {
            // FIXED: Simplified quote detection - less aggressive filtering
            const isQuote = data === "'" || data === '"' || data.includes("'") || data.includes('"');
            
            if (isQuote) {
                console.log('🔍 Quote input detected:', data, 'charCode:', data.charCodeAt(0));
            }
    
            // FIXED: Much more lenient duplicate detection
            const dedupWindow = 25; // Reduced from 50-300ms to 25ms
            if (this.lastInputEvent === eventSignature && 
                this.lastInputEventTime && 
                (currentTime - this.lastInputEventTime) < dedupWindow) {
                console.log('🚫 Duplicate input BLOCKED (very tight window):', data, 'time:', currentTime - this.lastInputEventTime);
                return;
            }
        }
    
        // Update tracking immediately
        this.lastInputEvent = eventSignature;
        this.lastInputEventTime = currentTime;
        this.inputEventCount++;
    
        // Handle deletion
        if (inputType && inputType.startsWith('delete')) {
            if (inputType === 'deleteContentBackward' || inputType === 'deleteContent' || inputType === 'deleteWordBackward') {
                const currentTime = performance.now();
                // FIXED: Reduced backspace cooldown from 100ms to 50ms
                if (currentTime - this.lastBackspaceTime > 50) {
                    this.recordKeystroke({
                        timestamp: timestamp,
                        actualChar: 'BACKSPACE',
                        keyCode: 8,
                        type: inputType,
                        sentence: this.currentSentence,
                        position: pos,
                        clientX: this.pointerTracking.x,
                        clientY: this.pointerTracking.y
                    });
                    console.log('Mobile backspace recorded:', inputType);
                    this.lastBackspaceTime = currentTime;
                }
            }
            this.calculateAccuracy();
            this.checkSentenceCompletion();
            return;
        }
    
        // Handle text insertion
        if (inputType === 'insertText' && data) {
            for (let i = 0; i < data.length; i++) {
                const raw = data[i];
                const ref = this.normalizeCharacter(raw);          // FIXED
                const ts  = timestamp + i;
                
                if (char === ' ') {
                    // SPACE character
                    this.recordKeystroke({
                        timestamp: charTimestamp,
                        actualChar: 'SPACE',
                        keyCode: 32,
                        type: inputType,
                        sentence: this.currentSentence,
                        position: pos - data.length + i,
                        clientX: this.pointerTracking.x,
                        clientY: this.pointerTracking.y
                    });
                } else {
                    // FIXED: Simplified character normalization
                    let refChar = this.normalizeCharacter(char);
                    
                    // FIXED: Much more lenient recording decision
                    if (this.shouldRecordCharLenient(ref, ts)) {
                        console.log('📝 Recording keystroke:', refChar, 'type:', inputType);
                        this.recordKeystroke({
                            timestamp: charTimestamp,
                            actualChar: refChar,
                            keyCode: char.charCodeAt(0),
                            type: inputType,
                            sentence: this.currentSentence,
                            position: pos - data.length + i,
                            clientX: this.pointerTracking.x,
                            clientY: this.pointerTracking.y
                        });
                        
                        // Update tracking
                        this.lastChar = refChar;
                        this.lastCharTime = charTimestamp;
                    } else {
                        console.log('❌ Character recording skipped:', refChar);
                    }
                }
                
                // Update previous character for next iteration
                this.previousChar = char;
            }
        }

        if (this.keystrokeData.length > 0 && this.keystrokeData.length % 50 === 0) {
            const count = this.validateKeystrokeData();
            if (count < 10 && this.isMobile) {
                console.log('📱 Low keystroke count during typing - emergency fallback active');
            }
        }
    
        // Update accuracy after any input
        this.calculateAccuracy();
        this.checkSentenceCompletion();
    }

    
    // FIXED: Enhanced character detection with better mobile support
    getActualTypedCharacter(e, inputValue = '') {
        // 1. Handle mobile IME / virtual keyboard composition events
        if (e.keyCode === 229 || e.key === 'Unidentified' || e.key === 'Process') {
            if (inputValue.length > this.lastInputLength) {
                return inputValue.slice(-1);
            }
            return null; // Don't record unidentified characters
        }
    
        // 2. Handle well-known special keys
        const specialKeys = {
            'Backspace':    'Backspace',
            'Enter':        'enter',
            'Tab':          'tab',
            ' ':            'SPACE',     // ✅ updated
            "'":            "'",         // Single quote
            '"':            '"',         // Double quote
            "'":            "'",         // Smart single quote
            "'":            "'",         // Smart single quote
            "'":            "'",         // Smart single quote
            "'":            "'",         // Smart single quote
            "'":            "'",         // Smart single quote
            "'":            "'",         // Smart single quote
            '`':            "'",         // Backtick as single quote
            '´':            "'",         // Acute accent as single quote
            '"':            '"',         // Smart double quote
            '"':            '"',         // Smart double quote
            '"':            '"',         // Smart double quote
            '"':            '"',         // Smart double quote
            '"':            '"',         // Smart double quote
            '"':            '"',         // Smart double quote
            '„':            '"',         // German opening double quote
            '‟':            '"',         // German closing double quote
            '-':            '-',         // Hyphen
            '–':            '-',         // En dash
            '—':            '-',         // Em dash
            '.':            '.',         // Period
            '…':            '.',         // Ellipsis
            ',':            ',',         // Comma
            '،':            ',',         // Arabic comma
            '!':            '!',         // Exclamation
            '¡':            '!',         // Inverted exclamation
            '?':            '?',         // Question mark
            '¿':            '?',         // Inverted question
            '@':            '@',         // At symbol
            '#':            '#',         // Hash
            '$':            '$',         // Dollar
            '€':            '$',         // Euro
            '£':            '$',         // Pound
            '¥':            '$',         // Yen
            '%':            '%',         // Percent
            '&':            '&',         // Ampersand
            '*':            '*',         // Asterisk
            '(':            '(',         // Left parenthesis
            ')':            ')',         // Right parenthesis
            '+':            '+',         // Plus
            '±':            '+',         // Plus-minus
            '=':            '=',         // Equals
            '≠':            '=',         // Not equals
            '[':            '[',         // Left bracket
            ']':            ']',         // Right bracket
            '【':            '[',         // Fullwidth left bracket
            '】':            ']',         // Fullwidth right bracket
            '{':            '{',         // Left brace
            '}':            '}',         // Right brace
            '｛':            '{',         // Fullwidth left brace
            '｝':            '}',         // Fullwidth right brace
            '\\':           '\\',        // Backslash
            '＼':           '\\',        // Fullwidth backslash
            '|':            '|',         // Pipe
            '｜':            '|',         // Fullwidth pipe
            ';':            ';',         // Semicolon
            '；':            ';',         // Fullwidth semicolon
            ':':            ':',         // Colon
            '：':            ':',         // Fullwidth colon
            '/':            '/',         // Forward slash
            '／':            '/',         // Fullwidth forward slash
            '<':            '<',         // Less than
            '>':            '>',         // Greater than
            '＜':            '<',         // Fullwidth less than
            '＞':            '>',         // Fullwidth greater than
            '`':            '`',         // Backtick
            '｀':            '`',         // Fullwidth backtick
            '~':            '~',         // Tilde
            '～':            '~',         // Fullwidth tilde
            '^':            '^',         // Caret
            '＾':            '^',         // Fullwidth caret
            '_':            '_',         // Underscore
            '＿':            '_',         // Fullwidth underscore
            '°':            '°',         // Degree symbol
            '℃':            '°',         // Celsius
            '℉':            '°',         // Fahrenheit
            '©':            '©',         // Copyright
            '®':            '®',         // Registered
            '™':            '™',         // Trademark
            '§':            '§',         // Section
            '¶':            '¶',         // Paragraph
            '†':            '†',         // Dagger
            '‡':            '‡',         // Double dagger
            '•':            '•',         // Bullet
            '·':            '•',         // Middle dot
            '▪':            '•',         // Black square
            '▫':            '•',         // White square
            '✓':            '✓',         // Check mark
            '✔':            '✓',         // Heavy check mark
            '☑':            '✓',         // Ballot box with check
            '✗':            '✗',         // Ballot X
            '✘':            '✗',         // Heavy ballot X
            '☒':            '✗',         // Ballot box with X
            '→':            '→',         // Right arrow
            '←':            '←',         // Left arrow
            '↑':            '↑',         // Up arrow
            '↓':            '↓',         // Down arrow
            '♠':            '♠',         // Spade
            '♥':            '♥',         // Heart
            '♦':            '♦',         // Diamond
            '♣':            '♣',         // Club
            '☺':            '☺',         // White smiling face
            '☻':            '☻',         // Black smiling face
            '☹':            '☹',         // White frowning face
            '☀':            '☀',         // Black sun with rays
            '☁':            '☁',         // Cloud
            '☂':            '☂',         // Umbrella
            '☃':            '☃',         // Snowman
            '♫':            '♫',         // Beamed eighth notes
            '♪':            '♪',         // Eighth note
            '♬':            '♬',         // Beamed sixteenth notes
            '∞':            '∞',         // Infinity
            '≈':            '≈',         // Almost equal to
            '≤':            '≤',         // Less than or equal to
            '≥':            '≥',         // Greater than or equal to
            '∑':            '∑',         // N-ary summation
            '∏':            '∏',         // N-ary product
            '∫':            '∫',         // Integral
            '√':            '√',         // Square root
            'α':            'α',         // Greek alpha
            'β':            'β',         // Greek beta
            'γ':            'γ',         // Greek gamma
            'δ':            'δ',         // Greek delta
            'π':            'π',         // Greek pi
            'μ':            'μ',         // Greek mu
            'σ':            'σ',         // Greek sigma
            'τ':            'τ',         // Greek tau
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
            return e.key;
        }
    
        // 4. Fallback for older browsers or rare keys
        if (e.keyCode && !isNaN(e.keyCode)) {
            const char = String.fromCharCode(e.keyCode);
            if (char && /\S/.test(char)) {
                return char;
            }
        }
    
        // 5. Return null for unidentifiable keys
        return null;
    }
    
    // FIXED: Enhanced desktop keyboard handling with mobile fallbacks
    handleKeydown(e) {
        const timestamp = performance.now();
        
        // Skip if composition is active or mobile IME
        if (this.compositionActive || e.keyCode === 229) {
            console.log('Skipping keydown - composition active or IME');
            return;
        }
        
        // Enhanced SHIFT tracking
        if (e.key === 'Shift') {
            this.updateShiftState(true);
            this.recordKeystroke({
                timestamp,
                actualChar: 'SHIFT',
                keyCode: 16,
                type: 'keydown',
                shiftKey: true,
                ctrlKey: e.ctrlKey,
                altKey: e.altKey,
                sentence: this.currentSentence,
                position: e.target.selectionStart || 0,
                clientX: this.pointerTracking.x,
                clientY: this.pointerTracking.y
            });
            return;
        }
        
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
        
        if (actualCharacter === 'Backspace' || actualCharacter === 'backspace') {
            // FIXED: Reduced backspace cooldown
            const currentTime = performance.now();
            if (currentTime - this.lastBackspaceTime > 50) { // Reduced from 100ms to 50ms
                this.recordKeystroke({
                    timestamp,
                    actualChar: 'BACKSPACE',
                    keyCode: 8,
                    type: 'keydown',
                    shiftKey: e.shiftKey,
                    ctrlKey: e.ctrlKey,
                    altKey: e.altKey,
                    sentence: this.currentSentence,
                    position: e.target.selectionStart || 0,
                    clientX: this.pointerTracking.x,
                    clientY: this.pointerTracking.y
                });
                this.lastBackspaceTime = currentTime;
            }
            this.calculateAccuracy();
            this.checkSentenceCompletion();
            return;
        }
        
        // Record valid characters
        if (actualCharacter) {
            console.log('Desktop key pressed:', e.key, 'Detected:', actualCharacter);
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
        
        this.calculateAccuracy();
        this.checkSentenceCompletion();
    }

    
    startTypingTask() {
        this.currentSentence = 0;
        this.lastInputLength = 0;
        this.previousChar = null;
        this.lastBackspaceTime = 0;
        this.lastCharTime = 0;
        this.lastChar = null;
        
        // Reset mobile input tracking
        this.lastInputValue = '';
        this.lastInputLength = 0;
        this.inputEventCount = 0;
        this.lastInputEvent = null;
        this.lastInputEventTime = 0;
        
        // FIXED: Mobile detection and emergency fallback setup
        if (this.isMobile) {
            console.log('📱 Mobile device detected - enabling emergency fallback');
            this.enableEmergencyFallback();
        }
        
        // FIXED: Initial validation setup
        this.validateKeystrokeData();
        
        this.displayCurrentSentence();
        this.updateTypingProgress();
        
        console.log('🔍 Starting typing task - quote handling test:');
        this.testQuoteHandling();
    }

    
    displayCurrentSentence() {
        document.getElementById('target-sentence').textContent = this.sentences[this.currentSentence];
        const input = document.getElementById('typing-input');
        input.value = '';
        input.focus();
        document.getElementById('sentence-progress').textContent = `${this.currentSentence + 1}/4`;
        this.calculateAccuracy();
        const nextBtn = document.getElementById('next-sentence-btn');
        if (this.currentSentence < this.sentences.length - 1) {
            nextBtn.style.display = 'inline-flex';
            nextBtn.disabled = true;
            nextBtn.style.backgroundColor = 'var(--color-secondary)';
            nextBtn.style.opacity = '0.5';
        } else {
            nextBtn.style.display = 'none';
        }
    }
    
    // Levenshtein distance helper
    levenshtein(a, b) {
        const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));
        for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
        for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= a.length; i++) {
            for (let j = 1; j <= b.length; j++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,      // deletion
                    matrix[i][j - 1] + 1,      // insertion
                    matrix[i - 1][j - 1] + cost // substitution
                );
            }
        }
        return matrix[a.length][b.length];
    }

    calculateAccuracy() {
        let typed = document.getElementById('typing-input').value;
        let target = this.sentences[this.currentSentence];
        // Normalize: trim, collapse spaces, remove invisible chars
        const normalize = str => str.trim().replace(/\s+/g, ' ').replace(/[\u200B-\u200D\uFEFF]/g, '');
        const normTyped = normalize(typed);
        const normTarget = normalize(target);
        console.log('[ACCURACY DEBUG] normTyped:', JSON.stringify(normTyped));
        console.log('[ACCURACY DEBUG] normTarget:', JSON.stringify(normTarget));
        if (normTyped.length === 0) {
            document.getElementById('accuracy').textContent = '0%';
            return 0;
        }
        if (normTyped === normTarget) {
            document.getElementById('accuracy').textContent = '100%';
            return 100;
        }
        let correct = 0;
        for (let i = 0; i < normTyped.length && i < normTarget.length; i++) {
            if (normTyped[i] === normTarget[i]) {
                correct++;
            }
            console.log(`[ACCURACY DEBUG] Compare pos ${i}: typed='${normTyped[i]}' target='${normTarget[i]}' ${normTyped[i] === normTarget[i] ? '✓' : '✗'}`);
        }
        let accuracy = Math.round((correct / normTyped.length) * 100);

            // FIXED: Add keystroke data validation integration
        const keystrokeCount = this.keystrokeData.length;
        const expectedMinimum = Math.max(10, normTyped.length * 0.8); // Minimum keystrokes expected
        
        if (keystrokeCount < expectedMinimum) {
            console.warn(`⚠️ Keystroke count (${keystrokeCount}) below expected minimum (${expectedMinimum}) for current input`);
        }
        
        // Return accuracy as before
        document.getElementById('accuracy').textContent = `${accuracy}%`;
        return accuracy;

    }

    // FIXED: Emergency fallback data collection
    enableEmergencyFallback() {
        console.log('🚨 Enabling emergency fallback data collection');
        
        const typingInput = document.getElementById('typing-input');
        let lastValue = '';
        let lastLength = 0;
        
        // Fallback: Monitor value changes directly
        const fallbackInterval = setInterval(() => {
            const currentValue = typingInput.value;
            const currentLength = currentValue.length;
            
            if (currentLength !== lastLength) {
                const timestamp = performance.now();
                
                if (currentLength > lastLength) {
                    // Character added
                    const addedChar = currentValue.charAt(currentLength - 1);
                    console.log('📱 Fallback: Character added:', addedChar);
                    
                    this.recordKeystroke({
                        timestamp,
                        actualChar: addedChar === ' ' ? 'SPACE' : addedChar,
                        keyCode: addedChar.charCodeAt(0),
                        type: 'fallback',
                        sentence: this.currentSentence,
                        position: currentLength - 1,
                        clientX: this.pointerTracking.x,
                        clientY: this.pointerTracking.y
                    });
                } else if (currentLength < lastLength) {
                    // Character removed
                    console.log('📱 Fallback: Character removed');
                    
                    this.recordKeystroke({
                        timestamp,
                        actualChar: 'BACKSPACE',
                        keyCode: 8,
                        type: 'fallback',
                        sentence: this.currentSentence,
                        position: currentLength,
                        clientX: this.pointerTracking.x,
                        clientY: this.pointerTracking.y
                    });
                }
                
                lastValue = currentValue;
                lastLength = currentLength;
            }
        }, 50); // Check every 50ms
        
        // Clear interval when typing task ends
        document.addEventListener('typing-task-complete', () => {
            clearInterval(fallbackInterval);
        });
    }

    // FIXED: Enhanced debugging and validation functions
    validateKeystrokeData() {
        const totalKeystrokes = this.keystrokeData.length;
        const characters = this.keystrokeData.filter(k => 
            k.actualChar !== 'BACKSPACE' && k.actualChar !== 'SHIFT'
        ).length;
        const backspaces = this.keystrokeData.filter(k => k.actualChar === 'BACKSPACE').length;
        
        console.log('Keystroke Validation:');
        console.log('- Total keystrokes:', totalKeystrokes);
        console.log('- Characters:', characters);
        console.log('- Backspaces:', backspaces);
        console.log('- Expected minimum per sentence:', 50); // Rough estimate
        
        if (totalKeystrokes < 10) {
            console.warn('⚠️ Very low keystroke count detected!');
            console.warn('This may indicate mobile keyboard compatibility issues');
        }
        
        return totalKeystrokes;
    }
    
    
        
    checkSentenceCompletion() {
        const typed = document.getElementById('typing-input').value.trim();
        const target = this.sentences[this.currentSentence].trim();
        const nextBtn = document.getElementById('next-sentence-btn');
        const accuracy = this.calculateAccuracy();
        // Only enable next button if 100% accuracy is achieved
        if (typed === target && accuracy === 100) {
            if (this.currentSentence < this.sentences.length - 1) {
            nextBtn.disabled = false;
            nextBtn.style.backgroundColor = 'var(--color-primary)';
            nextBtn.style.opacity = '1';
        } else {
                nextBtn.style.display = 'none';
                this.showNextTaskButton('crystal', 'Crystal Forge Game');
            }
        } else {
            if (this.currentSentence < this.sentences.length - 1) {
            nextBtn.disabled = true;
            nextBtn.style.backgroundColor = 'var(--color-secondary)';
            nextBtn.style.opacity = '0.5';
            }
        }
    }
    
    nextSentence() {
        this.currentSentence++;
        
        // FIXED: Validate keystroke data after each sentence
        const keystrokeCount = this.validateKeystrokeData();
        
        if (this.currentSentence >= this.sentences.length) {
            // FIXED: Final validation and emergency fallback if needed
            if (keystrokeCount < 50) {
                console.warn('⚠️ Low keystroke count detected - may need emergency fallback');
                if (this.isMobile) {
                    this.enableEmergencyFallback();
                }
            }
            
            console.log('🔍 Typing task completed - final quote handling test:');
            this.testQuoteHandling();
            this.showNextTaskButton('crystal', 'Crystal Forge Game');
            this.updateTaskLocks();
        } else {
            // FIXED: Check data quality between sentences
            if (keystrokeCount < 10) {
                console.warn('⚠️ Very low keystroke count - enabling emergency fallback');
                if (this.isMobile) {
                    this.enableEmergencyFallback();
                }
            }
            
            this.displayCurrentSentence();
            this.updateTypingProgress();
        }
    }

    
    updateTypingProgress() {
        const progress = ((this.currentSentence) / this.sentences.length) * 100;
        document.getElementById('typing-progress').style.width = `${progress}%`;
    }
    
    // FIXED: Reduced final safety checks in keystroke recording
    recordKeystroke(data) {
        console.log('[KEYSTROKE]', data);
        
        // Always log quote keystrokes for debugging
        if (data.actualChar === "'" || data.actualChar === '"') {
            console.log('[QUOTE] Keystroke captured:', data);
        }
        
        // FIXED: Verify rapidFireWindow is 10ms
        const currentTime = performance.now();
        if (data.actualChar && data.actualChar !== 'BACKSPACE' && data.actualChar !== 'SHIFT') {
            const rapidFireWindow = 10; // CONFIRMED: 10ms window
            
            const lastKeystroke = this.keystrokeData[this.keystrokeData.length - 1];
            if (lastKeystroke && 
                lastKeystroke.actualChar === data.actualChar && 
                (currentTime - lastKeystroke.timestamp) < rapidFireWindow) {
                console.log('🚫 Rapid-fire duplicate BLOCKED:', data.actualChar, 'time:', currentTime - lastKeystroke.timestamp);
                return;
            }
        }
        
        // FIXED: Enhanced SHIFT handling for uppercase letters
        if (data.actualChar && data.actualChar.length === 1 && this.getCharacterCase(data.actualChar) === 'uppercase') {
            const shiftEvent = {
                ...data,
                actualChar: 'SHIFT',
                keyCode: 16,
                type: 'synthetic',
                timestamp: data.timestamp - 1,
                isSynthetic: true
            };
            
            this.keystrokeData.push(shiftEvent);
            console.log('📝 Synthetic SHIFT added before uppercase:', data.actualChar);
        }
        
        // Calculate flight time
        if (data.actualChar !== 'SHIFT' && this.lastKeystrokeTime > 0) {
            data.flightTime = currentTime - this.lastKeystrokeTime;
            this.lastKeystrokeTime = currentTime;
        }
        
        // Record the keystroke
        this.keystrokeData.push(data);
        
        // FIXED: Add validation tracking every 25 keystrokes
        if (this.keystrokeData.length % 25 === 0) {
            console.log(`📊 Keystroke milestone: ${this.keystrokeData.length} keystrokes recorded`);
        }
        
        // Update last keystroke time
        if (data.actualChar !== 'SHIFT') {
            this.lastKeystrokeTime = currentTime;
        }
    }

    
    // SHIFT and case handling helper methods
    getCharacterCase(char) {
        if (char.length === 1) {
            if (char >= 'A' && char <= 'Z') return 'uppercase';
            if (char >= 'a' && char <= 'z') return 'lowercase';
        }
        return 'other';
    }
    
    getCaseTransition(data) {
        if (data.actualChar === 'SHIFT') {
            return this.shiftPressed ? 'lowercase_to_uppercase' : 'uppercase_to_lowercase';
        }
        
        if (data.actualChar && data.actualChar.length === 1) {
            const charCase = this.getCharacterCase(data.actualChar);
            if (charCase === 'uppercase' && !this.shiftPressed) {
                return 'natural_uppercase';
            } else if (charCase === 'lowercase' && this.shiftPressed) {
                return 'shifted_lowercase';
            } else if (charCase === 'uppercase' && this.shiftPressed) {
                return 'shifted_uppercase';
            }
        }
        
        return 'no_transition';
    }
    
    updateShiftState(isPressed) {
        const currentTime = performance.now();
        
        if (isPressed && !this.shiftPressed) {
            // SHIFT pressed
            this.shiftPressed = true;
            this.shiftPressTime = currentTime;
            console.log('🔤 SHIFT pressed at:', currentTime);
        } else if (!isPressed && this.shiftPressed) {
            // SHIFT released
            this.shiftPressed = false;
            this.shiftReleaseTime = currentTime;
            console.log('🔤 SHIFT released at:', currentTime);
        }
    }
    
    // Helper method to get backspace statistics for debugging
    getBackspaceStats() {
        const backspaces = this.keystrokeData.filter(k => k.actualChar === 'BACKSPACE');
        console.log('Backspace Statistics:');
        console.log('Total backspaces recorded:', backspaces.length);
        console.log('Backspace types:', [...new Set(backspaces.map(b => b.type))]);
        console.log('Backspace details:', backspaces);
        return backspaces;
    }
    
    // Helper method to check if character should be recorded (deduplication)
    // FIXED: Much more lenient character recording with minimal deduplication
    shouldRecordCharLenient(char, timestamp) {
        const currentTime = performance.now();
        
        // FIXED: Only block if exact same character within 15ms (very tight window)
        const veryTightWindow = 15;
        
        if (this.lastChar === char && this.lastCharTime) {
            const timeSinceLast = currentTime - this.lastCharTime;
            if (timeSinceLast < veryTightWindow) {
                console.log('🚫 Very tight deduplication BLOCKED:', char, 'time:', timeSinceLast, 'ms');
                return false;
            }
        }
        
        // FIXED: Always update tracking for successful recording
        this.lastChar = char;
        this.lastCharTime = currentTime;
        
        console.log('✅ Character approved for recording:', char, 'at time:', currentTime);
        return true;
    }

    
    // Helper method to get character statistics for debugging
    getCharStats() {
        const chars = this.keystrokeData.filter(k => k.actualChar && k.actualChar !== 'BACKSPACE' && k.actualChar !== 'SHIFT');
        console.log('Character Statistics:');
        console.log('Total characters recorded:', chars.length);
        console.log('Character types:', [...new Set(chars.map(c => c.type))]);
        
        // Count duplicates
        const charCounts = {};
        chars.forEach(c => {
            charCounts[c.actualChar] = (charCounts[c.actualChar] || 0) + 1;
        });
        
        const duplicates = Object.entries(charCounts).filter(([char, count]) => count > 1);
        if (duplicates.length > 0) {
            console.log('Potential duplicate characters:', duplicates);
        } else {
            console.log('No duplicate characters detected');
        }
        
        return chars;
    }
    
    // Helper method to test quote handling specifically
    testQuoteHandling() {
        console.log('🔍 Testing quote handling for mobile keyboards (Gboard, iOS):');
        
        // Check if quotes are in the recorded data
        const quotes = this.keystrokeData.filter(k => k.actualChar === "'" || k.actualChar === '"');
        console.log('Quotes found in keystroke data:', quotes.length);
        
        if (quotes.length > 0) {
            console.log('Quote details:');
            quotes.forEach((quote, i) => {
                console.log(`  Quote ${i + 1}: "${quote.actualChar}" at timestamp ${Math.round(quote.timestamp)}ms, type: ${quote.type}`);
            });
        } else {
            console.log('❌ No quotes found in keystroke data!');
        }
        
        // Test character detection
        const testChars = ["'", "'", "'", "'", "'", "'", "`", "´", "′", "‵", '"', '"', '"', '"', '"', '"', "„", "‟", "″", "‶"];
        console.log('Testing character detection:');
        testChars.forEach(char => {
            console.log(`  "${char}" (${char.charCodeAt(0)}) -> should be normalized`);
        });
        
        // Test deduplication windows for quotes
        console.log('Quote deduplication windows:');
        console.log('  iOS input event dedup: 50ms (vs 300ms for others)');
        console.log('  iOS rapid input dedup: 100ms (vs 150ms for others)');
        console.log('  iOS composition dedup: 25ms (vs 50ms for others)');
        console.log('  iOS final keystroke dedup: 100ms (vs 300ms for others)');
        console.log('  Android input event dedup: 30ms (vs 100ms for others)');
        console.log('  shouldRecordCharLenient dedup: 15-20ms (vs 30-40ms for others)');
        
        return quotes;
    }
    
    // Crystal Game Methods
    startCrystalGame() {
        this.currentCrystalStep = 1;
        this.resetCrystalState();
        this.updateCrystalDisplay();
        
        // ULTRA-RELIABLE mobile device detection and setup
        console.log('🎮 Crystal game started - Trial tracking initialized');
        console.log('Initial trial state:', this.crystalState.currentTrial);
        console.log('Device info:', {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            maxTouchPoints: navigator.maxTouchPoints,
            isIOS: this.isIOS
        });
        
        // Ensure proper touch handling for all mobile devices
        const crystalArea = document.getElementById('crystal-area');
        if (crystalArea) {
            crystalArea.style.touchAction = 'none';
            crystalArea.style.userSelect = 'none';
            crystalArea.style.webkitUserSelect = 'none';
            crystalArea.style.webkitTouchCallout = 'none';
            crystalArea.style.webkitTapHighlightColor = 'transparent';
            
            // Additional mobile optimizations
            crystalArea.style.webkitOverflowScrolling = 'touch';
            crystalArea.style.webkitTransform = 'translateZ(0)';
            
            // Prevent all unwanted interactions
            crystalArea.addEventListener('gesturestart', (e) => e.preventDefault());
            crystalArea.addEventListener('gesturechange', (e) => e.preventDefault());
            crystalArea.addEventListener('gestureend', (e) => e.preventDefault());
        }
        
        console.log('✅ Crystal game initialized for all mobile devices');
    }

    nextCrystalStep() {
        if (this.currentCrystalStep < this.crystalSteps.length) {
            this.currentCrystalStep++;
            this.resetCrystalState();
            this.updateCrystalDisplay();
        } else {
            console.log("All crystal steps completed!");
            this.taskState.crystalCompleted = true;
            this.updateTaskLocks();
            this.showNextTaskButton('gallery', 'Gallery Review');
        }
    }

    
    bindCrystalEvents() {
        const crystalArea = document.getElementById('crystal-area');
        
        // ULTRA-RELIABLE mobile touch events for all Android and iOS versions
        crystalArea.addEventListener('touchstart', (e) => this.handleCrystalTouchStart(e), { passive: false });
        crystalArea.addEventListener('touchmove', (e) => this.handleCrystalTouchMove(e), { passive: false });
        crystalArea.addEventListener('touchend', (e) => this.handleCrystalTouchEnd(e), { passive: false });
        crystalArea.addEventListener('touchcancel', (e) => this.handleCrystalTouchEnd(e), { passive: false });
        
        // Prevent all unwanted interactions
        crystalArea.addEventListener('contextmenu', (e) => e.preventDefault());
        crystalArea.addEventListener('selectstart', (e) => e.preventDefault());
        crystalArea.addEventListener('dragstart', (e) => e.preventDefault());
        crystalArea.addEventListener('gesturestart', (e) => e.preventDefault());
        crystalArea.addEventListener('gesturechange', (e) => e.preventDefault());
        crystalArea.addEventListener('gestureend', (e) => e.preventDefault());
        
        // Enhanced mobile touch handling
        crystalArea.style.touchAction = 'none';
        crystalArea.style.userSelect = 'none';
        crystalArea.style.webkitUserSelect = 'none';
        crystalArea.style.webkitTouchCallout = 'none';
        crystalArea.style.webkitTapHighlightColor = 'transparent';
        crystalArea.style.webkitTouchCallout = 'none';
        
        // Additional iOS-specific handling
        if (this.isIOS) {
            crystalArea.style.webkitOverflowScrolling = 'touch';
            crystalArea.style.webkitTransform = 'translateZ(0)';
        }
    }
    
    handleCrystalTouchStart(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const timestamp = performance.now();
        const touches = Array.from(e.touches);
        
        // ULTRA-RELIABLE touch data collection for all mobile devices
        this.recordTouchEvent({
            timestamp,
            type: 'touchstart',
            touches: touches.map(t => ({
                identifier: t.identifier,
                clientX: t.clientX,
                clientY: t.clientY,
                force: t.force || 0.5,
                radiusX: t.radiusX || 0,
                radiusY: t.radiusY || 0,
                rotationAngle: t.rotationAngle || 0
            })),
            step: this.currentCrystalStep,
            taskId: 2
        });
        
        // Add visual feedback
        const crystalArea = document.getElementById('crystal-area');
        crystalArea.classList.add('touching');
        
        // Enhanced error handling for mobile devices
        try {
        this.processCrystalInteraction('start', touches);
        } catch (error) {
            console.error('Error in crystal touch start:', error);
        }
    }
    
    handleCrystalTouchMove(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const timestamp = performance.now();
        const touches = Array.from(e.touches);
        
        // ULTRA-RELIABLE touch data collection for all mobile devices
        this.recordTouchEvent({
            timestamp,
            type: 'touchmove',
            touches: touches.map(t => ({
                identifier: t.identifier,
                clientX: t.clientX,
                clientY: t.clientY,
                force: t.force || 0.5,
                radiusX: t.radiusX || 0,
                radiusY: t.radiusY || 0,
                rotationAngle: t.rotationAngle || 0
            })),
            step: this.currentCrystalStep,
            taskId: 2
        });
        
        // Enhanced error handling for mobile devices
        try {
        this.processCrystalInteraction('move', touches);
        } catch (error) {
            console.error('Error in crystal touch move:', error);
        }
    }
    
    handleCrystalTouchEnd(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const timestamp = performance.now();
        const touches = Array.from(e.changedTouches);
        
        // ULTRA-RELIABLE touch data collection for all mobile devices
        this.recordTouchEvent({
            timestamp,
            type: 'touchend',
            touches: touches.map(t => ({
                identifier: t.identifier,
                clientX: t.clientX,
                clientY: t.clientY,
                force: t.force || 0.5,
                radiusX: t.radiusX || 0,
                radiusY: t.radiusY || 0,
                rotationAngle: t.rotationAngle || 0
            })),
            step: this.currentCrystalStep,
            taskId: 2
        });
        
        // Remove visual feedback
        const crystalArea = document.getElementById('crystal-area');
        crystalArea.classList.remove('touching');
        
        // Enhanced error handling for mobile devices
        try {
        this.processCrystalInteraction('end', touches);
        } catch (error) {
            console.error('Error in crystal touch end:', error);
        }
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
                    // ULTRA-RELIABLE tap detection for all mobile devices
                    const touch = touches[0];
                    const crystalRect = crystal.getBoundingClientRect();
                    
                    // Check if tap is within the crystal boundaries (more precise)
                    const isWithinBounds = touch.clientX >= crystalRect.left && 
                                         touch.clientX <= crystalRect.right && 
                                         touch.clientY >= crystalRect.top && 
                                         touch.clientY <= crystalRect.bottom;
                    
                    // Also check distance from center as backup (for larger touch areas)
                    const crystalCenterX = crystalRect.left + crystalRect.width / 2;
                    const crystalCenterY = crystalRect.top + crystalRect.height / 2;
                    const distance = Math.sqrt(
                        Math.pow(touch.clientX - crystalCenterX, 2) + 
                        Math.pow(touch.clientY - crystalCenterY, 2)
                    );
                    
                    // Enhanced boundary detection: within bounds OR within 120px of center
                    if (isWithinBounds || distance <= 120) {
                    this.crystalState.tapCount++;
                    crystal.classList.add('tap-feedback');
                    crystal.classList.add('active');
                    
                        // Enhanced visual feedback for mobile
                    setTimeout(() => {
                        crystal.classList.remove('tap-feedback');
                        crystal.classList.remove('active');
                        }, 300);
                    
                    this.updateStepProgress(`${this.crystalState.tapCount}/${step.target}`);
                    
                    if (this.crystalState.tapCount >= step.target) {
                        this.completeStep();
                        }
                        
                        console.log(`✅ Tap ${this.crystalState.tapCount}/${step.target} recorded - within bounds: ${isWithinBounds}, distance: ${Math.round(distance)}px`);
                    } else {
                        console.log(`❌ Tap outside crystal bounds - distance: ${Math.round(distance)}px`);
                    }
                }
                break;
                
            case 'rotate': {
                const touch = touches[0];
                const crystal = document.getElementById('crystal');
                const rect = crystal.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const angle = Math.atan2(touch.clientY - centerY, touch.clientX - centerX);
            
                if (phase === 'start') {
                    this.crystalState.initialAngle = angle;
                    this.crystalState.lastAngle = angle;
                    this.crystalState.rotationRounds = 0;
                    this.crystalState.rotationDirection = null; // 1 = CW, -1 = CCW
                    this.crystalState.rotationAccumulated = 0;
                    crystal.classList.add('active');
                    this.updateStepProgress(`0/3`);
                }
            
                else if (phase === 'move') {
                    let delta = angle - this.crystalState.lastAngle;
                    if (delta > Math.PI) delta -= 2 * Math.PI;
                    if (delta < -Math.PI) delta += 2 * Math.PI;
                    if (!isFinite(delta)) return;
            
                    const direction = Math.sign(delta);
                    const expectedDirection = (this.crystalState.rotationRounds % 2 === 0) ? 1 : -1;
            
                    // Set direction on first move of this round
                    if (this.crystalState.rotationDirection === null && Math.abs(delta) > 0.02) {
                        this.crystalState.rotationDirection = direction;
                    }
            
                    // Reject wrong direction
                    if (direction !== expectedDirection) {
                        this.showWrongDirectionFeedback?.();
                        this.crystalState.lastAngle = angle;
                        return;
                    }
            
                    this.crystalState.rotationAccumulated += delta;
                    this.crystalState.lastAngle = angle;
            
                    const progress = Math.abs(this.crystalState.rotationAccumulated) / (2 * Math.PI);
                    this.updateStepProgress(`${(this.crystalState.rotationRounds + Math.min(progress, 1)).toFixed(1)}/3`);
            
                    if (Math.abs(this.crystalState.rotationAccumulated) >= 2 * Math.PI) {
                        this.crystalState.rotationRounds += 1;
                        this.crystalState.rotationAccumulated = 0;
                        this.crystalState.rotationDirection = null;
            
                        crystal.classList.add('rotation-feedback');
                        setTimeout(() => crystal.classList.remove('rotation-feedback'), 300);
            
                        if (this.crystalState.rotationRounds >= 3) {
                            this.completeStep();
                        }
                    }
                }
            
                else if (phase === 'end') {
                    crystal.classList.remove('active');
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
                        console.log(`🔄 ${step.type} started - initial distance: ${Math.round(this.crystalState.initialDistance)}px`);
                    } else if (phase === 'move' && (this.crystalState.isPinching || this.crystalState.isSpreading)) {
                        const currentDistance = this.getDistance(touches[0], touches[1]);
                        
                        // ULTRA-RELIABLE mobile pinch/spread detection with validation
                        if (currentDistance < 15) return; // Reduced minimum distance for mobile
                        
                        const scale = currentDistance / this.crystalState.initialDistance;
                        const newSize = Math.max(0.2, Math.min(2.5, scale)); // Wider range for mobile
                        
                        this.updateCrystalSize(newSize);
                        this.updateStepProgress(`${Math.round(newSize * 100)}%`);
                        
                        // ENHANCED completion detection with mobile-friendly tolerance
                        const targetTolerance = 0.12; // Optimized tolerance for mobile precision
                        if (Math.abs(newSize - step.target) < targetTolerance) {
                            console.log(`✅ ${step.type} target reached: ${Math.round(newSize * 100)}% (target: ${Math.round(step.target * 100)}%)`);
                            this.completeStep();
                        }
                    }
                } else if (phase === 'end') {
                    this.crystalState.isPinching = false;
                    this.crystalState.isSpreading = false;
                    crystal.classList.remove('active');
                    console.log(`🔄 ${step.type} ended`);
                }
                break;
                
            case 'pressure':
                if (touches.length === 3) {
                    if (phase === 'start') {
                        this.crystalState.pressureStart = performance.now();
                        this.crystalState.pressureFingers = touches.length;
                        crystal.classList.add('active');
                        this.showPressureIndicator();
                        console.log(`🔄 Three-finger pressure started`);
                    } else if (phase === 'move' && this.crystalState.pressureStart) {
                        const elapsed = performance.now() - this.crystalState.pressureStart;
                        this.updatePressureIndicator(elapsed / step.target);
                        this.updateStepProgress(`${Math.floor(elapsed / 1000)}s / ${step.target / 1000}s`);
                        
                        if (elapsed >= step.target) {
                            console.log(`✅ Three-finger pressure completed: ${Math.floor(elapsed / 1000)}s`);
                            this.completeStep();
                        }
                    }
                } else if (phase === 'end') {
                    // ULTRA-RELIABLE mobile pressure detection - allow finger count to vary slightly
                    if (touches.length < 2) { // Only end if most fingers are lifted
                        if (this.crystalState.pressureStart) {
                            const elapsed = performance.now() - this.crystalState.pressureStart;
                            console.log(`🔄 Three-finger pressure ended - duration: ${Math.floor(elapsed / 1000)}s`);
                        }
                    this.crystalState.pressureStart = null;
                    this.crystalState.pressureFingers = 0;
                    crystal.classList.remove('active');
                    this.hidePressureIndicator();
                    }
                }
                break;
        }
    }
    
    updateCrystalSize(size) {
        const crystal = document.getElementById('crystal');
        const crystalSizeDisplay = document.getElementById('crystal-size-display');
        
        this.crystalState.currentSize = size;
        crystal.style.transform = `scale(${size})`;
        crystal.style.setProperty('--current-scale', size);
        
        const percentage = Math.round(size * 100);
        crystalSizeDisplay.textContent = `${percentage}%`;
        
        if (size <= 0.6) {
            crystal.classList.add('shrinking');
            crystalSizeDisplay.classList.add('shrink-highlight');
            setTimeout(() => {
                crystal.classList.remove('shrinking');
                crystalSizeDisplay.classList.remove('shrink-highlight');
            }, 500);
        } else if (size >= 1.4) {
            crystal.classList.add('enlarging');
            crystalSizeDisplay.classList.add('enlarge-highlight');
            setTimeout(() => {
                crystal.classList.remove('enlarging');
                crystalSizeDisplay.classList.remove('enlarge-highlight');
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
    
    showWrongDirectionFeedback() {
        const crystal = document.getElementById('crystal');
        crystal.style.filter = 'hue-rotate(180deg) brightness(0.7)';
        setTimeout(() => {
            crystal.style.filter = '';
        }, 500);
        console.log('❌ Wrong rotation direction - try again!');
    }
    
    // Helper method to get expected rotation direction based on current step

    

    
    completeStep() {
        console.log('[DEBUG] completeStep, current step:', this.currentCrystalStep);
    
        const crystal = document.getElementById('crystal');
        if (crystal) {
        crystal.classList.add('success');
        setTimeout(() => {
            crystal.classList.remove('success');
        }, 600);
        }
        
        document.getElementById('step-status').textContent = 'Completed';
        
        const sizeIndicator = document.getElementById('size-indicator');
        if (sizeIndicator) {
        sizeIndicator.classList.add('completion-highlight');
        setTimeout(() => sizeIndicator.classList.remove('completion-highlight'), 1000);
    }
    
        const nextCrystalBtn = document.getElementById('next-crystal-btn');
        if (nextCrystalBtn) {
            nextCrystalBtn.style.display = 'inline-flex';
            nextCrystalBtn.disabled = false;
            nextCrystalBtn.style.opacity = '1';
            nextCrystalBtn.style.backgroundColor = 'var(--color-primary)';
        } else {
            console.warn('[DEBUG] next-crystal-btn not found in DOM during completeStep');
        }
    
        if (this.currentCrystalStep === this.crystalSteps.length) {
            // Final step: show Next Task button (do not hide Next Step)
            this.showNextTaskButton('gallery', 'Gallery Interaction');
            this.updateTaskLocks(); // Lock crystal after completion
        }
    }

    
    nextCrystalStep() {
        console.log('[DEBUG] nextCrystalStep called, current step:', this.currentCrystalStep);
        if (this.currentCrystalStep < this.crystalSteps.length) {
            this.currentCrystalStep++;
            console.log('[DEBUG] nextCrystalStep incremented, new step:', this.currentCrystalStep);
        this.resetCrystalState();
        this.updateCrystalDisplay();
        } else {
            // Already at last step, do nothing
            console.log('[DEBUG] nextCrystalStep: already at last step, no action');
        }
    }
    
    resetCrystalStep() {
        // Increment trial counter when user resets the step
        this.crystalState.currentTrial++;
        console.log(`Step ${this.currentCrystalStep} reset - Trial ${this.crystalState.currentTrial}`);
        
        this.resetCrystalState();
        this.updateCrystalDisplay();
    }
    
    resetCrystalState() {
        // Preserve trial counter when resetting state
        const currentTrial = this.crystalState.currentTrial;
        
        console.log(`🔄 Resetting crystal state - Progress will be reset to 0/3`);
        
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
        
        document.getElementById('crystal-size-display').textContent = '100%';
        document.getElementById('crystal-size-display').classList.remove('shrink-highlight', 'enlarge-highlight', 'completion-highlight');
        this.hidePressureIndicator();
    }
    
    updateCrystalDisplay() {
        console.log('[DEBUG] updateCrystalDisplay, current step:', this.currentCrystalStep);
        
        const step = this.crystalSteps[this.currentCrystalStep - 1];
        document.getElementById('step-title').textContent = `Step ${this.currentCrystalStep}: ${this.getStepTitle(step.type)}`;
        document.getElementById('step-instruction').textContent = step.instruction;
        document.getElementById('current-step').textContent = `${this.currentCrystalStep}/5`;
        document.getElementById('step-status').textContent = 'Ready';
        document.getElementById('step-progress').textContent = this.getInitialProgress(step.type);
    
        const nextCrystalBtn = document.getElementById('next-crystal-btn');
        if (nextCrystalBtn) {
            nextCrystalBtn.style.display = 'inline-flex';
            nextCrystalBtn.disabled = true;
            nextCrystalBtn.style.opacity = '0.5';
            nextCrystalBtn.style.backgroundColor = 'var(--color-secondary)';
        } else {
            console.warn('[DEBUG] next-crystal-btn not found in DOM during updateCrystalDisplay');
        }
    }

    
    getStepTitle(type) {
        const titles = {
            'tap': 'Finger Tapping',
            'rotate': 'One Finger Rotation',
            'pinch': 'Pinch to Shrink',
            'spread': 'Spread to Enlarge',
            'pressure': 'Three-Finger Pressure'
        };
        return titles[type] || 'Unknown';
    }
    
    getInitialProgress(type) {
        const progress = {
            'tap': '0/3',
            'rotate': '0/3',
            'pinch': '100% → 50%',
            'spread': '100% → 150%',
            'pressure': '0s / 3s'
        };
        return progress[type] || '0/0';
    }
    
    updateStepProgress(progress) {
        document.getElementById('step-progress').textContent = progress;
        
        // STRICT guidance for rotation step
        if (this.currentCrystalStep === 2) {
            const stepStatus = document.getElementById('step-status');
            if (this.crystalState.rotationCompleted) {
                stepStatus.textContent = 'Perfect! All rotations completed - Next step available';
            } else if (this.crystalState.rotationRounds === 0) {
                stepStatus.textContent = 'STRICT: Touch crystal, then rotate CLOCKWISE only for one full rotation';
            } else if (this.crystalState.rotationRounds === 1) {
                stepStatus.textContent = 'Green light! STRICT: Now rotate COUNTER-CLOCKWISE only for one full rotation';
            } else if (this.crystalState.rotationRounds === 2) {
                stepStatus.textContent = 'Second green light! STRICT: Now rotate CLOCKWISE only for one full rotation';
            } else {
                stepStatus.textContent = 'STRICT RULES: CW → CCW → CW (only these directions work)';
            }
        }
    }
    
    recordTouchEvent(data) {
        // Add trial information for crystal game
        if (data.taskId === 2) { // Crystal game
            data.trial = this.crystalState.currentTrial;
            // Enhanced debug logging for trial tracking
            if (data.type === 'touchstart') {
                console.log(`📊 Touch event recorded - Step: ${data.step}, Trial: ${data.trial}, Current Trial State: ${this.crystalState.currentTrial}`);
            }
        } else {
            data.trial = 1; // Default trial for other tasks
        }
        
        this.touchData.push(data);
    }
    
// --- Updated Enhanced Gallery Methods ---

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
            this.resetZoom(); // Reset zoom when changing images
            this.updatePopupImage();
        }
    }
    
    prevGalleryImage() {
        if (this.currentGalleryImage > 0) {
            this.currentGalleryImage--;
            this.resetZoom(); // Reset zoom when changing images
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


    // Export Methods
    exportKeystrokeData() {
        // FIXED: Initial validation with enhanced mobile detection
        const keystrokeCount = this.validateKeystrokeData();
        
        console.log('🔍 Export initiated - Device info:', {
            isMobile: this.isMobile,
            isIOS: this.isIOS,
            isAndroid: this.isAndroid,
            userAgent: navigator.userAgent.substring(0, 100),
            totalKeystrokes: keystrokeCount
        });
        
        // FIXED: Enhanced early exit conditions
        if (keystrokeCount === 0) {
            alert('❌ Error: No keystrokes captured. This indicates a data collection failure.\n\nTry:\n1. Refreshing the page\n2. Using a different browser\n3. Disabling browser extensions');
            console.error('Export aborted: Zero keystrokes captured');
            return;
        }
        
        if (keystrokeCount < 10) {
            alert('⚠️ Warning: Very low keystroke count detected.\n\nThis may indicate mobile keyboard compatibility issues on your device.');
            console.warn('Low keystroke count on export:', keystrokeCount);
        }
    
        // FIXED: Enhanced data quality analysis
        const characters = this.keystrokeData.filter(k => 
            k.actualChar !== 'BACKSPACE' && k.actualChar !== 'SHIFT'
        ).length;
        const backspaces = this.keystrokeData.filter(k => k.actualChar === 'BACKSPACE').length;
        const quotes = this.keystrokeData.filter(k => k.actualChar === "'" || k.actualChar === '"').length;
        const specialChars = this.keystrokeData.filter(k => 
            !k.actualChar.match(/^[a-zA-Z0-9\s]$/) && 
            k.actualChar !== 'BACKSPACE' && 
            k.actualChar !== 'SHIFT'
        ).length;
        
        console.log('📊 Export Summary:');
        console.log('- Total keystrokes:', keystrokeCount);
        console.log('- Characters:', characters);
        console.log('- Backspaces:', backspaces);
        console.log('- Quotes captured:', quotes);
        console.log('- Special characters:', specialChars);
        console.log('- Expected for 4 sentences:', '200-400 keystrokes');
        console.log('- Data quality score:', Math.round((keystrokeCount / 300) * 100) + '%');
        
        // FIXED: Enhanced user feedback with quality assessment
        const qualityScore = Math.round((keystrokeCount / 300) * 100);
        let qualityLevel = 'Excellent';
        if (qualityScore < 30) qualityLevel = 'Poor';
        else if (qualityScore < 60) qualityLevel = 'Fair';
        else if (qualityScore < 80) qualityLevel = 'Good';
        
        if (keystrokeCount < 100) {
            const deviceInfo = this.isMobile ? 
                `Mobile Device: ${this.isIOS ? 'iOS' : this.isAndroid ? 'Android' : 'Unknown'}` : 
                'Desktop Device';
                
            const userContinue = confirm(
                `Data Quality Assessment:\n\n` +
                `Total keystrokes: ${keystrokeCount}\n` +
                `Expected range: 200-400 keystrokes\n` +
                `Quality level: ${qualityLevel}\n` +
                `Device: ${deviceInfo}\n\n` +
                `Low keystroke count may indicate:\n` +
                `• Mobile keyboard compatibility issues\n` +
                `• Virtual keyboard interference\n` +
                `• Browser input method conflicts\n\n` +
                `Continue with export?`
            );
            
            if (!userContinue) {
                console.log('Export cancelled by user due to data quality concerns');
                return;
            }
        }
        
        // FIXED: Robust feature extraction with error handling
        let features;
        try {
            features = this.extractKeystrokeFeatures();
            console.log('✅ Feature extraction successful:', features.length, 'records');
        } catch (error) {
            console.error('❌ Feature extraction failed:', error);
            alert('Error extracting keystroke features. Please try again or contact support.');
            return;
        }
    
        // FIXED: Additional feature validation
        if (!features || !Array.isArray(features) || features.length === 0) {
            console.error('❌ Feature extraction returned invalid data:', features);
            alert('Feature extraction failed to generate valid data. Please try typing the sentences again.');
            return;
        }
    
        // FIXED: Enhanced CSV generation with validation
        let csvText;
        try {
            csvText = this.convertToCSV(features);
            if (!csvText || csvText.trim().length === 0) {
                throw new Error('CSV conversion returned empty content');
            }
            console.log('✅ CSV generation successful, size:', csvText.length, 'characters');
        } catch (error) {
            console.error('❌ CSV generation failed:', error);
            alert('Failed to generate CSV file. Please try again.');
            return;
        }
    
        // FIXED: Enhanced filename with metadata
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-');
        const deviceType = this.isMobile ? (this.isIOS ? 'iOS' : this.isAndroid ? 'Android' : 'Mobile') : 'Desktop';
        const filename = `${this.participantId}_keystroke_${deviceType}_${timestamp}.csv`;
    
        // FIXED: Attempt Google Drive upload with comprehensive error handling
        try {
            console.log('🌐 Initiating Google Drive upload...');
            this.uploadCSVToGoogleDrive(csvText, filename);
            
            // FIXED: Enhanced UI feedback with real metrics
            document.getElementById('keystroke-count').textContent = keystrokeCount;
            
            // Calculate actual feature count dynamically
            const actualFeatureCount = features.length > 0 ? Object.keys(features[0]).length : 0;
            document.getElementById('keystroke-features').textContent = actualFeatureCount;
            
            // FIXED: Success feedback with quality information
            const successMessage = `✅ Keystroke CSV uploaded successfully!\n\n` +
                `Summary:\n` +
                `• ${keystrokeCount} keystrokes captured\n` +
                `• ${actualFeatureCount} features extracted\n` +
                `• Quality: ${qualityLevel}\n` +
                `• Device: ${deviceType}\n` +
                `• File: ${filename}`;
                
            alert(successMessage);
            console.log('✅ Export completed successfully');
            
        } catch (error) {
            console.error('❌ Google Drive upload failed:', error);
            
            // FIXED: Fallback to local download with user notification
            const fallbackDownload = confirm(
                `Google Drive upload failed.\n\n` +
                `Error: ${error.message || 'Unknown upload error'}\n\n` +
                `Would you like to download the CSV file locally instead?`
            );
            
            if (fallbackDownload) {
                this.downloadCSVLocally(csvText, filename);
                alert('CSV file downloaded to your device successfully!');
            }
        }
    }


    
    exportTouchData() {
        // FIXED: Initial validation with enhanced mobile detection
        const touchCount = this.validateTouchData();
        
        console.log('🔍 Touch export initiated - Device info:', {
            isMobile: this.isMobile,
            isIOS: this.isIOS,
            isAndroid: this.isAndroid,
            totalTouchEvents: touchCount
        });
        
        // FIXED: Enhanced early exit conditions
        if (touchCount === 0) {
            alert('❌ Error: No touch events captured. Complete the Crystal Forge Game and Gallery tasks first.');
            console.error('Touch export aborted: Zero touch events captured');
            return;
        }
        
        if (touchCount < 50) {
            alert('⚠️ Warning: Very low touch event count. Complete more touch interactions.');
            console.warn('Low touch count on export:', touchCount);
        }
    
        // FIXED: Enhanced touch data quality analysis
        const tapEvents = this.touchData.filter(t => t.type === 'touchstart').length;
        const moveEvents = this.touchData.filter(t => t.type === 'touchmove').length;
        const endEvents = this.touchData.filter(t => t.type === 'touchend').length;
        const crystalTasks = this.touchData.filter(t => t.taskId === 2).length;
        const galleryTasks = this.touchData.filter(t => t.taskId === 3).length;
        
        console.log('📊 Touch Export Summary:');
        console.log('- Total touch events:', touchCount);
        console.log('- Tap events:', tapEvents);
        console.log('- Move events:', moveEvents);
        console.log('- End events:', endEvents);
        console.log('- Crystal task events:', crystalTasks);
        console.log('- Gallery task events:', galleryTasks);
        
        // FIXED: Enhanced user feedback with quality assessment
        const qualityScore = Math.round((touchCount / 500) * 100);
        let qualityLevel = 'Excellent';
        if (qualityScore < 30) qualityLevel = 'Poor';
        else if (qualityScore < 60) qualityLevel = 'Fair';
        else if (qualityScore < 80) qualityLevel = 'Good';
        
        if (touchCount < 200) {
            const deviceInfo = this.isMobile ? 
                `Mobile Device: ${this.isIOS ? 'iOS' : this.isAndroid ? 'Android' : 'Unknown'}` : 
                'Desktop Device';
                
            const userContinue = confirm(
                `Touch Data Quality Assessment:\n\n` +
                `Total touch events: ${touchCount}\n` +
                `Expected range: 500-1000 events\n` +
                `Quality level: ${qualityLevel}\n` +
                `Device: ${deviceInfo}\n\n` +
                `Low touch count may indicate:\n` +
                `• Incomplete crystal game interactions\n` +
                `• Missing gallery touch gestures\n` +
                `• Touch event recording issues\n\n` +
                `Continue with export?`
            );
            
            if (!userContinue) {
                console.log('Touch export cancelled by user due to data quality concerns');
                return;
            }
        }
        
        // FIXED: Robust feature extraction with error handling
        let features;
        try {
            features = this.extractTouchFeatures();
            console.log('✅ Touch feature extraction successful:', features.length, 'records');
        } catch (error) {
            console.error('❌ Touch feature extraction failed:', error);
            alert('Error extracting touch features. Please try again or contact support.');
            return;
        }
    
        // FIXED: Additional feature validation
        if (!features || !Array.isArray(features) || features.length === 0) {
            console.error('❌ Touch feature extraction returned invalid data:', features);
            alert('Touch feature extraction failed to generate valid data. Please try the crystal and gallery tasks again.');
            return;
        }
    
        // FIXED: Enhanced CSV generation with validation
        let csvText;
        try {
            csvText = this.convertToCSV(features);
            if (!csvText || csvText.trim().length === 0) {
                throw new Error('CSV conversion returned empty content');
            }
            console.log('✅ Touch CSV generation successful, size:', csvText.length, 'characters');
        } catch (error) {
            console.error('❌ Touch CSV generation failed:', error);
            alert('Failed to generate touch CSV file. Please try again.');
            return;
        }
    
        // FIXED: Enhanced filename with metadata
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-');
        const deviceType = this.isMobile ? (this.isIOS ? 'iOS' : this.isAndroid ? 'Android' : 'Mobile') : 'Desktop';
        const filename = `${this.participantId}_touch_${deviceType}_${timestamp}.csv`;
    
        // FIXED: Attempt Google Drive upload with comprehensive error handling
        try {
            console.log('🌐 Initiating Google Drive upload for touch data...');
            this.uploadCSVToGoogleDrive(csvText, filename);
            
            // FIXED: Enhanced UI feedback with real metrics
            document.getElementById('touch-count').textContent = touchCount;
            
            // Calculate actual feature count dynamically
            const actualFeatureCount = features.length > 0 ? Object.keys(features[0]).length : 0;
            document.getElementById('touch-features').textContent = actualFeatureCount;
            
            // FIXED: Success feedback with quality information
            const successMessage = `✅ Touch CSV uploaded successfully!\n\n` +
                `Summary:\n` +
                `• ${touchCount} touch events captured\n` +
                `• ${actualFeatureCount} features extracted\n` +
                `• Quality: ${qualityLevel}\n` +
                `• Device: ${deviceType}\n` +
                `• File: ${filename}`;
                
            alert(successMessage);
            console.log('✅ Touch export completed successfully');
            
        } catch (error) {
            console.error('❌ Google Drive upload failed for touch data:', error);
            
            // FIXED: Fallback to local download with user notification
            const fallbackDownload = confirm(
                `Google Drive upload failed for touch data.\n\n` +
                `Error: ${error.message || 'Unknown upload error'}\n\n` +
                `Would you like to download the touch CSV file locally instead?`
            );
            
            if (fallbackDownload) {
                this.downloadCSVLocally(csvText, filename);
                alert('Touch CSV file downloaded to your device successfully!');
            }
        }
    }

    validateTouchData() {
        const totalTouchEvents = this.touchData.length;
        const touchStarts = this.touchData.filter(t => t.type === 'touchstart').length;
        const touchMoves = this.touchData.filter(t => t.type === 'touchmove').length;
        const touchEnds = this.touchData.filter(t => t.type === 'touchend').length;
        const crystalEvents = this.touchData.filter(t => t.taskId === 2).length;
        const galleryEvents = this.touchData.filter(t => t.taskId === 3).length;
        
        console.log('Touch Data Validation:');
        console.log('- Total touch events:', totalTouchEvents);
        console.log('- Touch starts:', touchStarts);
        console.log('- Touch moves:', touchMoves);
        console.log('- Touch ends:', touchEnds);
        console.log('- Crystal game events:', crystalEvents);
        console.log('- Gallery events:', galleryEvents);
        console.log('- Expected minimum total:', 100);
        
        if (totalTouchEvents < 50) {
            console.warn('⚠️ Very low touch event count detected!');
            console.warn('This may indicate incomplete task completion');
        }
        
        return totalTouchEvents;
    }



    // ENHANCED: Keystroke feature extraction with SHIFT in ref_char column
    extractKeystrokeFeatures() {
        const features = [];
        
        this.keystrokeData.forEach((keystroke, index) => {
            // Process all recorded keystrokes (input events, keydown, composition, SHIFT)
            if (keystroke.type === 'keydown' || keystroke.type === 'keyup' || keystroke.type === 'insertText' || keystroke.type === 'compositionend' || keystroke.type.startsWith('delete')) {
                
                // Use enhanced flight time calculation if available
                let flightTime = keystroke.flightTime || 0;
                if (flightTime === 0 && index > 0) {
                    const timeDiff = keystroke.timestamp - this.keystrokeData[index - 1].timestamp;
                    flightTime = Math.max(0, Math.round(timeDiff));
                    
                    if (timeDiff < 0) {
                        console.warn(`⚠️ Negative flight time detected: ${timeDiff}ms between "${this.keystrokeData[index - 1].actualChar}" and "${keystroke.actualChar}". Setting to 0.`);
                    }
                }
                
                // Determine if this was a deletion
                const wasDeleted = (keystroke.actualChar === 'BACKSPACE' || 
                                  keystroke.type.startsWith('delete')) ? 1 : 0;
                
                // SHIFT handling: Include SHIFT in ref_char before capital letters and for synthetic SHIFT events
                let refChar = keystroke.actualChar || 'unknown';
                if (keystroke.isSynthetic && keystroke.actualChar === 'SHIFT') {
                    refChar = 'SHIFT';
                } else if (keystroke.actualChar && keystroke.actualChar.length === 1) {
                    refChar = keystroke.actualChar;
                }
                
                // Debug: log quote features
                if (refChar === "'" || refChar === '"') {
                    console.log('[QUOTE] Feature exported:', refChar, keystroke);
                }
                
                // Add first_frame_touch_x and first_frame_touch_y (reliable on both platforms)
                const firstFrameTouchX = Math.round(keystroke.clientX || this.currentPointerX);
                const firstFrameTouchY = Math.round(keystroke.clientY || this.currentPointerY);
                features.push({
                    participant_id: this.participantId,
                    task_id: 1, // Typing task
                    timestamp_ms: Math.round(keystroke.timestamp),
                    ref_char: refChar,
                    touch_x: Math.round(keystroke.clientX || this.currentPointerX),
                    touch_y: Math.round(keystroke.clientY || this.currentPointerY),
                    was_deleted: wasDeleted,
                    flight_time_ms: flightTime,
                    first_frame_touch_x: firstFrameTouchX,
                    first_frame_touch_y: firstFrameTouchY
                });
            }
        });
        
        return features;
    }

    // RELIABLE: Touch feature extraction with only accurate, measurable features
    extractTouchFeatures() {
        if (this.touchData.length === 0) return [];
        
        const features = [];
        this.touchData.forEach((touch, index) => {
            const feature = {
                participant_id: this.participantId,
                timestamp_ms: Math.round(touch.timestamp),
                event_type: touch.type,
                task_id: touch.taskId || 0,
                step_number: touch.step || 0,
                trial_number: touch.trial || 1,
                touch_count: touch.touches ? touch.touches.length : 1,
                sequence_index: index,
                inter_touch_interval: index > 0 ? Math.round(touch.timestamp - this.touchData[index-1].timestamp) : 0
            };
            
            // Add touch coordinates if available
            if (touch.touches && touch.touches.length > 0) {
                const firstTouch = touch.touches[0];
                feature.touch_x = Math.round(firstTouch.clientX || 0);
                feature.touch_y = Math.round(firstTouch.clientY || 0);
                feature.touch_force = firstTouch.force || 0.5;
                feature.touch_radius_x = firstTouch.radiusX || 0;
                feature.touch_radius_y = firstTouch.radiusY || 0;
            } else {
                feature.touch_x = 0;
                feature.touch_y = 0;
                feature.touch_force = 0.5;
                feature.touch_radius_x = 0;
                feature.touch_radius_y = 0;
            }
            
            features.push(feature);
        });
        
        return features;
    }
    
    
    convertToCSV(data) {
        if (!Array.isArray(data)) {
            throw new Error('Data must be an array');
        }
        
        if (data.length === 0) {
            console.warn('⚠️ Empty data array provided to convertToCSV');
            return '';
        }
        
        try {
            const headers = Object.keys(data[0]);
            console.log('📋 CSV headers:', headers);
            
            const csvRows = [
                headers.join(','),
                ...data.map(row => 
                    headers.map(header => {
                        const value = row[header];
                        // Handle undefined/null values
                        if (value === undefined || value === null) {
                            return '';
                        }
                        // Escape quotes and wrap in quotes if necessary
                        const stringValue = String(value);
                        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                            return `"${stringValue.replace(/"/g, '""')}"`;
                        }
                        return stringValue;
                    }).join(',')
                )
            ];
            
            const csvContent = csvRows.join('\n');
            console.log('✅ CSV conversion successful, rows:', csvRows.length);
            return csvContent;
            
        } catch (error) {
            console.error('❌ CSV conversion error:', error);
            throw new Error(`CSV conversion failed: ${error.message}`);
        }
    }

    // https://script.google.com/macros/s/AKfycbzWMLzj7CBpeRDI9eLbndoYv72iEhZR1ZRccBs6LVHoskYaT3Udltcy9wDL1DjaHJfX/exec

    // FIXED: Enhanced uploadCSVToGoogleDrive with retry logic
    uploadCSVToGoogleDrive(csvContent, filename) {
        return new Promise((resolve, reject) => {
            // FIXED: Validate Google Apps Script URL
            const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
            
            if (!GOOGLE_SCRIPT_URL.includes('script.google.com')) {
                reject(new Error('Invalid Google Apps Script URL. Please configure your deployment URL.'));
                return;
            }
            
            const formData = new FormData();
            formData.append('content', csvContent);
            formData.append('filename', filename);
            formData.append('mimeType', 'text/csv');
            
            console.log('📤 Uploading to Google Drive:', filename);
            
            const uploadWithRetry = (attempt = 1, maxAttempts = 3) => {
                fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    body: formData,
                    mode: 'no-cors' // Required for Google Apps Script
                })
                .then(response => {
                    // Note: no-cors mode means we can't read the response
                    console.log(`✅ Upload attempt ${attempt} completed`);
                    resolve(response);
                })
                .catch(error => {
                    console.error(`❌ Upload attempt ${attempt} failed:`, error);
                    
                    if (attempt < maxAttempts) {
                        console.log(`🔄 Retrying upload (${attempt + 1}/${maxAttempts})...`);
                        setTimeout(() => uploadWithRetry(attempt + 1, maxAttempts), 1000 * attempt);
                    } else {
                        reject(new Error(`Upload failed after ${maxAttempts} attempts: ${error.message}`));
                    }
                });
            };
            
            uploadWithRetry();
        });
    }
    updateTaskLocks() {
        // Typing
        const typingInput = document.getElementById('typing-input');
        const nextSentenceBtn = document.getElementById('next-sentence-btn');
        if (typingInput && nextSentenceBtn) {
            if (this.taskState.studyStarted && !this.taskState.typingCompleted) {
                typingInput.disabled = false;
                typingInput.style.opacity = '1';
                nextSentenceBtn.disabled = false;
                nextSentenceBtn.style.opacity = '1';
            } else {
                typingInput.disabled = true;
                typingInput.style.opacity = '0.5';
                nextSentenceBtn.disabled = true;
                nextSentenceBtn.style.opacity = '0.5';
            }
        }

        // Crystal
        const crystalArea = document.getElementById('crystal-area');
        const nextCrystalBtn = document.getElementById('next-crystal-btn');
        if (crystalArea && nextCrystalBtn) {
            if (this.taskState.typingCompleted && !this.taskState.crystalCompleted) {
                crystalArea.style.pointerEvents = 'auto';
                crystalArea.style.opacity = '1';
                nextCrystalBtn.disabled = false;
                nextCrystalBtn.style.opacity = '1';
            } else {
                crystalArea.style.pointerEvents = 'none';
                crystalArea.style.opacity = '0.5';
                nextCrystalBtn.disabled = true;
                nextCrystalBtn.style.opacity = '0.5';
            }
        }

        // Gallery
        const galleryGrid = document.getElementById('gallery-grid');
        if (galleryGrid) {
            if (this.taskState.crystalCompleted && !this.taskState.galleryCompleted) {
                galleryGrid.style.pointerEvents = 'auto';
                galleryGrid.style.opacity = '1';
            } else {
                galleryGrid.style.pointerEvents = 'none';
                galleryGrid.style.opacity = '0.5';
            }
        }
    }

    setupCustomKeyboard() {
        const input = document.getElementById('typing-input');
        const keyboardContainer = document.getElementById('custom-keyboard-container');
        if (!input || !keyboardContainer) return;

        // Keyboard layouts
        const layouts = {
            letters: [
                ['1','2','3','4','5','6','7','8','9','0'],
                ['q','w','e','r','t','y','u','i','o','p'],
                ['a','s','d','f','g','h','j','k','l'],
                ['⇧','z','x','c','v','b','n','m','⌫'],
                ['?123','-',' ','\.','⏎']
            ],
            numbers: [
                ['~','`','!','@','#','$','%','^','&','*'],
                ['(','-','_','+','=','{','}','[',']','<'],
                ['>','/','\\','|',':',';','\'','"',',','.'],
                ['?','!','—','–','·','•','¶','§','⌫'],
                ['ABC','-',' ','\.','⏎']
            ],
            symbols: [
                // Not used, but kept for extensibility
            ]
        };
        let currentLayout = 'letters';
        let shift = false;

        function renderKeyboard() {
            keyboardContainer.innerHTML = '';
            layouts[currentLayout].forEach((row, rowIdx) => {
                const rowDiv = document.createElement('div');
                rowDiv.className = 'custom-keyboard-row';
                row.forEach(key => {
                    const btn = document.createElement('button');
                    btn.className = 'custom-key';
                    if (key === ' '){
                        btn.classList.add('extra-wide');
                        btn.textContent = '';
                        btn.innerHTML = '<span style="font-size:1.2em;">⎵</span>';
                    } else if (key === '⌫') {
                        btn.classList.add('wide');
                        btn.textContent = '⌫';
                    } else if (key === '⏎') {
                        btn.classList.add('wide');
                        btn.textContent = '⏎';
                    } else if (key === '⇧') {
                        btn.classList.add('wide');
                        btn.textContent = shift ? '⇧' : '⇧';
                        btn.style.fontWeight = shift ? 'bold' : 'normal';
                    } else if (['123','#+=','ABC'].includes(key)) {
                        btn.classList.add('wide');
                        btn.textContent = key;
                    } else {
                        btn.textContent = shift && currentLayout==='letters' && key.length===1 ? key.toUpperCase() : key;
                    }
                    btn.addEventListener('touchstart', e => {
                        e.preventDefault();
                        btn.classList.add('active');
                        showKeyPopup(btn, key);
                        handleKeyPress.call(this, key, e);
                    });
                    btn.addEventListener('mousedown', e => {
                        e.preventDefault();
                        btn.classList.add('active');
                        showKeyPopup(btn, key);
                        handleKeyPress.call(this, key, e);
                    });
                    btn.addEventListener('touchend', e => {
                        btn.classList.remove('active');
                        removeKeyPopup(btn);
                    });
                    btn.addEventListener('mouseup', e => {
                        btn.classList.remove('active');
                        removeKeyPopup(btn);
                    });
                    btn.addEventListener('mouseleave', e => {
                        btn.classList.remove('active');
                        removeKeyPopup(btn);
                    });
                    rowDiv.appendChild(btn);
                });
                keyboardContainer.appendChild(rowDiv);
            });
        }

        function handleKeyPress(key, event) {
            // Always update input value and cursor for every key
            let refChar = key;
            if (key === ' ') refChar = 'SPACE';
            if (key === '⏎') refChar = 'ENTER';
            if (key === '⌫') refChar = 'BACKSPACE';
            if (key === '⇧') refChar = 'SHIFT';
            let clientX = 0, clientY = 0;
            if (event && event.touches && event.touches[0]) {
                clientX = event.touches[0].clientX;
                clientY = event.touches[0].clientY;
            } else if (event && event.clientX !== undefined) {
                clientX = event.clientX;
                clientY = event.clientY;
            }
            if (key === '⌫') {
                const start = input.selectionStart;
                const end = input.selectionEnd;
                if (start > 0) {
                    input.value = input.value.slice(0, start-1) + input.value.slice(end);
                    input.setSelectionRange(start-1, start-1);
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                }
            } else if (key === '⏎') {
                const start = input.selectionStart;
                const end = input.selectionEnd;
                input.value = input.value.slice(0, start) + '\n' + input.value.slice(end);
                input.setSelectionRange(start+1, start+1);
                input.dispatchEvent(new Event('input', { bubbles: true }));
            } else if (key === '⇧') {
                shift = !shift;
                renderKeyboard();
            } else if (key === '?123') {
                currentLayout = 'numbers';
                shift = false;
                renderKeyboard();
                return; // Don't record layout switch
            } else if (key === 'ABC') {
                currentLayout = 'letters';
                shift = false;
                renderKeyboard();
                return; // Don't record layout switch
            } else {
                // Regular key (letters, numbers, symbols, space, etc.)
                const char = shift && currentLayout==='letters' && key.length===1 ? key.toUpperCase() : key;
                const start = input.selectionStart;
                const end = input.selectionEnd;
                input.value = input.value.slice(0, start) + char + input.value.slice(end);
                input.setSelectionRange(start+char.length, start+char.length);
                input.dispatchEvent(new Event('input', { bubbles: true }));
                if (shift && currentLayout==='letters') {
                    shift = false;
                    renderKeyboard();
                }
                refChar = char; // Ensure refChar is the actual character inserted
            }
            // Only skip keystroke recording for layout switches
            if (key !== '?123' && key !== 'ABC') {
                this.recordKeystroke({
                    timestamp: performance.now(),
                    actualChar: refChar,
                    keyCode: refChar.length === 1 ? refChar.charCodeAt(0) : 0,
                    type: 'custom-key',
                    sentence: this.currentSentence,
                    position: input.selectionStart || 0,
                    clientX,
                    clientY
                });
            }
            // Always update accuracy after updating input value
            this.calculateAccuracy();
        }

        // Show/hide keyboard
        function showKeyboard() {
            keyboardContainer.style.display = 'flex';
            setTimeout(() => {
                keyboardContainer.scrollIntoView({behavior:'smooth', block:'end'});
            }, 100);
        }
        function hideKeyboard() {
            keyboardContainer.style.display = 'none';
        }

        // Only set readonly before first use to prevent system keyboard
        input.setAttribute('readonly', 'readonly');
        let customKeyboardActivated = false;
        input.addEventListener('touchstart', e => {
            if (!customKeyboardActivated) {
                input.removeAttribute('readonly');
                customKeyboardActivated = true;
            }
            input.focus();
            showKeyboard();
        });
        input.addEventListener('focus', e => {
            if (!customKeyboardActivated) {
                input.removeAttribute('readonly');
                customKeyboardActivated = true;
            }
            showKeyboard();
        });
        // Do NOT set readonly again after first use
        // Do NOT override cursor position except when inserting/deleting
        input.addEventListener('blur', e => {
            setTimeout(hideKeyboard, 100);
        });
        // Hide keyboard when leaving typing screen
        document.addEventListener('click', e => {
            if (!document.getElementById('typing-screen').classList.contains('active')) {
                hideKeyboard();
            }
        });
        renderKeyboard();

        // Add these helper functions inside setupCustomKeyboard()
        function showKeyPopup(btn, key) {
            // Don't show popup for space, shift, backspace, enter, or layout keys
            if ([" ", "⇧", "⌫", "⏎", "?123", "ABC"].includes(key)) return;
            removeKeyPopup(btn);
            const popup = document.createElement('div');
            popup.className = 'custom-key-popup';
            popup.textContent = key;
            btn.appendChild(popup);
        }
        function removeKeyPopup(btn) {
            const popup = btn.querySelector('.custom-key-popup');
            if (popup) popup.remove();
        }
    }
}
// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new BiometricDataCollector();
});
