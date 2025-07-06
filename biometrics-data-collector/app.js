class BiometricDataCollector {
    constructor() {
        this.participantId = '';
        this.currentScreen = 'welcome';
        this.currentSentence = 0;
        this.currentCrystalStep = 1;
        this.currentGalleryImage = 0;
        
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        
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
        
        this.sentences = [
            "Dr. Smith's Lab-42 discovered H2O molecules can freeze at -5 degree Celsius under pressure.",
            "The CEO's Q3 report showed $2.8M profit and 15% growth across all divisions.",
            "Agent X-007 decoded the message: 'Meet @ Pier 9 on July 4th at 3:30 PM.'",
            "Tesla's Model S hit 0-60 mph in 2.1 seconds - breaking the previous record!"
        ];
        
        this.crystalSteps = [
            { id: 1, instruction: "Tap the crystal exactly 3 times with your index finger", target: 3, type: 'tap' },
            { id: 2, instruction: "Touch anywhere on crystal, then rotate: CW → CCW → CW (green light after each rotation)", target: 3, type: 'rotate' },
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
        document.getElementById('start-btn').addEventListener('click', () => {
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
        document.getElementById('next-crystal-btn').addEventListener('click', () => this.nextCrystalStep());
        
        this.bindGalleryEvents();
        document.getElementById('finish-gallery-btn').addEventListener('click', () => this.switchScreen('export'));
        
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
        
        const currentTime = performance.now();
        
        const eventSignature = `${inputType}-${data}-${value.length}-${pos}`;
        
        if (data && inputType === 'insertText') {
            // ULTRA-STRICT deduplication for all mobile devices
            if (this.lastInputEvent === eventSignature && 
                this.lastInputEventTime && 
                (currentTime - this.lastInputEventTime) < 300) {
                console.log('🚫 Mobile duplicate input event BLOCKED (ultra-strict):', data, 'signature:', eventSignature, 'time since last:', currentTime - this.lastInputEventTime, 'ms');
                return;
            }
            
            if (this.lastChar === data && 
                this.lastCharTime && 
                (currentTime - this.lastCharTime) < 300) {
                console.log('🚫 Mobile duplicate character BLOCKED (ultra-strict):', data, 'time since last:', currentTime - this.lastCharTime, 'ms');
                return;
            }
            
            if (value === this.lastInputValue && data) {
                console.log('🚫 Mobile duplicate input event BLOCKED (value unchanged):', data);
                return;
            }
            
            if (value.length === this.lastInputLength && data && !inputType?.startsWith('delete')) {
                console.log('🚫 Mobile duplicate input event BLOCKED (length unchanged):', data);
                return;
            }
            
            if (this.lastInputEventTime && (currentTime - this.lastInputEventTime) < 150) {
                console.log('🚫 Mobile input event BLOCKED (rapid input):', data, 'time since last:', currentTime - this.lastInputEventTime, 'ms');
                return;
            }
            
            // ADDITIONAL: Block iOS-specific double input issues
            if (this.isIOS && this.lastInputEventTime && (currentTime - this.lastInputEventTime) < 200) {
                console.log('🚫 iOS duplicate input BLOCKED:', data, 'time since last:', currentTime - this.lastInputEventTime, 'ms');
                return;
            }
        }
        
        if (this.isIOS && this.compositionActive && inputType === 'insertText') {
            console.log('iOS composition active, skipping insertText');
            return;
        }
        
        this.lastInputValue = value;
        this.lastInputLength = value.length;
        this.lastInputEvent = eventSignature;
        this.lastInputEventTime = currentTime;
        this.inputEventCount++;
        
        if (data && inputType === 'insertText') {
            console.log(`📱 Mobile input event: "${data}" | Event #${this.inputEventCount} | Signature: ${eventSignature}`);
        }
    
        if (inputType && inputType.startsWith('delete')) {
            if (inputType === 'deleteContentBackward' || inputType === 'deleteContent' || inputType === 'deleteWordBackward') {
                const currentTime = performance.now();
                
                if (currentTime - this.lastBackspaceTime > this.backspaceCooldown) {
                    this.recordKeystroke({
                        timestamp: timestamp - 0.5,
                        actualChar: 'BACKSPACE',
                        keyCode: 8,
                        type: inputType,
                        sentence: this.currentSentence,
                        position: pos,
                        clientX: this.pointerTracking.x,
                        clientY: this.pointerTracking.y
                    });
                    console.log('Mobile backspace recorded:', inputType, 'at time:', currentTime);
                    
                    this.lastBackspaceTime = currentTime;
                } else {
                    console.log('Mobile backspace duplicate ignored:', inputType, 'time since last:', currentTime - this.lastBackspaceTime);
                }
            }
            return;
        }

    
        // Handle text insertion
        else if (inputType === 'insertText' && data) {
            for (let i = 0; i < data.length; i++) {
                const char = data[i];
                const posOffset = pos - data.length + i;
              

                
                if (char === ' ') {
                    // SPACE character
                    this.recordKeystroke({
                        timestamp: timestamp + i,
                        actualChar: 'SPACE',
                        keyCode: 32,
                        type: inputType,
                        sentence: this.currentSentence,
                        position: pos - data.length + i,
                        clientX: this.pointerTracking.x,
                        clientY: this.pointerTracking.y
                    });
                }
                else {
                    // Enhanced character handling for all characters including quotes and smart characters
                    let refChar = char;
                    
                    // Debug: Log the actual character being processed
                    console.log('Processing character:', char, 'charCode:', char.charCodeAt(0), 'type:', inputType);
                    
                    // Handle smart quotes and apostrophes (common in mobile keyboards)
                    if (char === "'" || char === "'" || char === "'" || char === "'" || char === "'" || char === "'" || char === '`' || char === '´' || char === '′' || char === '‵') {
                        refChar = "'"; // Single quote/apostrophe - all variants
                        console.log('✅ Single quote detected:', char, '-> stored as:', refChar);
                    } else if (char === '"' || char === '"' || char === '"' || char === '"' || char === '"' || char === '"' || char === '„' || char === '‟' || char === '″' || char === '‶') {
                        refChar = '"'; // Double quote - all variants
                        console.log('✅ Double quote detected:', char, '-> stored as:', refChar);
                    } else if (char === '-' || char === '–' || char === '—') {
                        refChar = '-'; // Hyphen/dash
                    } else if (char === '.' || char === '…') {
                        refChar = '.'; // Period/ellipsis
                    } else if (char === ',' || char === '،') {
                        refChar = ','; // Comma
                    } else if (char === '!' || char === '¡') {
                        refChar = '!'; // Exclamation
                    } else if (char === '?' || char === '¿') {
                        refChar = '?'; // Question mark
                    } else if (char === '@') {
                        refChar = '@'; // At symbol
                    } else if (char === '#') {
                        refChar = '#'; // Hash
                    } else if (char === '$' || char === '€' || char === '£' || char === '¥') {
                        refChar = '$'; // Dollar/currency
                    } else if (char === '%') {
                        refChar = '%'; // Percent
                    } else if (char === '&') {
                        refChar = '&'; // Ampersand
                    } else if (char === '*') {
                        refChar = '*'; // Asterisk
                    } else if (char === '(') {
                        refChar = '('; // Left parenthesis
                    } else if (char === ')') {
                        refChar = ')'; // Right parenthesis
                    } else if (char === '+' || char === '±') {
                        refChar = '+'; // Plus
                    } else if (char === '=' || char === '≠') {
                        refChar = '='; // Equals
                    } else if (char === '[' || char === '【') {
                        refChar = '['; // Left bracket
                    } else if (char === ']' || char === '】') {
                        refChar = ']'; // Right bracket
                    } else if (char === '{' || char === '｛') {
                        refChar = '{'; // Left brace
                    } else if (char === '}' || char === '｝') {
                        refChar = '}'; // Right brace
                    } else if (char === '\\' || char === '＼') {
                        refChar = '\\'; // Backslash
                    } else if (char === '|' || char === '｜') {
                        refChar = '|'; // Pipe
                    } else if (char === ';' || char === '；') {
                        refChar = ';'; // Semicolon
                    } else if (char === ':' || char === '：') {
                        refChar = ':'; // Colon
                    } else if (char === '/' || char === '／') {
                        refChar = '/'; // Forward slash
                    } else if (char === '<' || char === '＜') {
                        refChar = '<'; // Less than
                    } else if (char === '>' || char === '＞') {
                        refChar = '>'; // Greater than
                    } else if (char === '`' || char === '｀') {
                        refChar = '`'; // Backtick
                    } else if (char === '~' || char === '～') {
                        refChar = '~'; // Tilde
                    } else if (char === '^' || char === '＾') {
                        refChar = '^'; // Caret
                    } else if (char === '_' || char === '＿') {
                        refChar = '_'; // Underscore
                    } else if (char === '°' || char === '℃' || char === '℉') {
                        refChar = '°'; // Degree symbol
                    } else if (char === '©' || char === '®' || char === '™') {
                        refChar = char; // Copyright symbols
                    } else if (char === '§' || char === '¶') {
                        refChar = char; // Section symbols
                    } else if (char === '†' || char === '‡') {
                        refChar = char; // Dagger symbols
                    } else if (char === '•' || char === '·' || char === '▪' || char === '▫') {
                        refChar = '•'; // Bullet points
                    } else if (char === '✓' || char === '✔' || char === '☑') {
                        refChar = '✓'; // Check marks
                    } else if (char === '✗' || char === '✘' || char === '☒') {
                        refChar = '✗'; // X marks
                    } else if (char === '→' || char === '←' || char === '↑' || char === '↓') {
                        refChar = char; // Arrows
                    } else if (char === '♠' || char === '♥' || char === '♦' || char === '♣') {
                        refChar = char; // Card suits
                    } else if (char === '☺' || char === '☻' || char === '☹') {
                        refChar = char; // Emoticons
                    } else if (char === '☀' || char === '☁' || char === '☂' || char === '☃') {
                        refChar = char; // Weather symbols
                    } else if (char === '♫' || char === '♪' || char === '♬') {
                        refChar = char; // Music symbols
                    } else if (char === '∞' || char === '≈' || char === '≤' || char === '≥') {
                        refChar = char; // Math symbols
                    } else if (char === '∑' || char === '∏' || char === '∫' || char === '√') {
                        refChar = char; // Advanced math symbols
                    } else if (char === 'α' || char === 'β' || char === 'γ' || char === 'δ') {
                        refChar = char; // Greek letters
                    } else if (char === 'π' || char === 'μ' || char === 'σ' || char === 'τ') {
                        refChar = char; // More Greek letters
                    } else {
                        // For all other characters, use as-is
                        refChar = char;
                    }
                    
                    // Debug logging for quote characters
                    if (char === "'" || char === "'" || char === "'" || char === "'" || char === "'" || char === "'" || char === '`' || char === '´' || char === '′' || char === '‵' || char === '"' || char === '"' || char === '"' || char === '"' || char === '"' || char === '"' || char === '„' || char === '‟' || char === '″' || char === '‶') {
                        console.log('🔍 Quote processing complete - Final refChar:', refChar);
                    }
                    
                    // FINAL: Check if character should be recorded (comprehensive deduplication)
                    if (this.shouldRecordChar(refChar, timestamp + i)) {
                        // ADDITIONAL SAFETY: Check if this exact character was just recorded
                        const lastKeystroke = this.keystrokeData[this.keystrokeData.length - 1];
                        if (lastKeystroke && 
                            lastKeystroke.actualChar === refChar && 
                            (timestamp + i - lastKeystroke.timestamp) < 500) { // 500ms safety window
                            console.log('🚫 FINAL BLOCK: Character duplicate detected in keystroke data:', refChar);
                            return;
                        }
                        
                        console.log('📝 Recording keystroke:', refChar, 'type:', inputType, 'timestamp:', timestamp + i);
                        this.recordKeystroke({
                            timestamp: timestamp + i,
                            actualChar: refChar,
                            keyCode: char.charCodeAt(0),
                            type: inputType,
                            sentence: this.currentSentence,
                            position: pos - data.length + i,
                            clientX: this.pointerTracking.x,
                            clientY: this.pointerTracking.y
                        });
                        
                        // Update last character and time for mobile deduplication
                        this.lastChar = refChar;
                        this.lastCharTime = timestamp + i;
                    } else {
                        console.log('❌ Character duplicate ignored:', refChar);
                    }
                }
                
                // Update previous character for next iteration
                this.previousChar = char;
            }
        }

    
        // Handle other input types like paste, cut, etc.
        else if (inputType && data) {
            let refChar = data;
            
            // Debug: Log the actual data being processed
            console.log('Processing other input data:', data, 'charCode:', data.charCodeAt(0), 'type:', inputType);
    
            if (data === ' ') {
                refChar = 'SPACE';
            } else if (data === "'" || data === "'" || data === "'" || data === "'" || data === "'" || data === "'" || data === '`' || data === '´' || data === '′' || data === '‵') {
                refChar = "'"; // Single quote/apostrophe - all variants
                console.log('✅ Single quote detected (other input):', data, '-> stored as:', refChar);
            } else if (data === '"' || data === '"' || data === '"' || data === '"' || data === '"' || data === '"' || data === '„' || data === '‟' || data === '″' || data === '‶') {
                refChar = '"'; // Double quote - all variants
                console.log('✅ Double quote detected (other input):', data, '-> stored as:', refChar);
            } else if (data === '–' || data === '—') {
                refChar = '-'; // En dash and em dash
            } else if (data === '…') {
                refChar = '.'; // Ellipsis
            } else if (data === '،') {
                refChar = ','; // Arabic comma
            } else if (data === '¡') {
                refChar = '!'; // Inverted exclamation
            } else if (data === '¿') {
                refChar = '?'; // Inverted question
            } else if (data === '€' || data === '£' || data === '¥') {
                refChar = '$'; // Other currency symbols
            } else if (data === '±') {
                refChar = '+'; // Plus-minus
            } else if (data === '≠') {
                refChar = '='; // Not equals
            } else if (data === '【') {
                refChar = '['; // Fullwidth left bracket
            } else if (data === '】') {
                refChar = ']'; // Fullwidth right bracket
            } else if (data === '｛') {
                refChar = '{'; // Fullwidth left brace
            } else if (data === '｝') {
                refChar = '}'; // Fullwidth right brace
            } else if (data === '＼') {
                refChar = '\\'; // Fullwidth backslash
            } else if (data === '｜') {
                refChar = '|'; // Fullwidth pipe
            } else if (data === '；') {
                refChar = ';'; // Fullwidth semicolon
            } else if (data === '：') {
                refChar = ':'; // Fullwidth colon
            } else if (data === '／') {
                refChar = '/'; // Fullwidth forward slash
            } else if (data === '＜') {
                refChar = '<'; // Fullwidth less than
            } else if (data === '＞') {
                refChar = '>'; // Fullwidth greater than
            } else if (data === '｀') {
                refChar = '`'; // Fullwidth backtick
            } else if (data === '～') {
                refChar = '~'; // Fullwidth tilde
            } else if (data === '＾') {
                refChar = '^'; // Fullwidth caret
            } else if (data === '＿') {
                refChar = '_'; // Fullwidth underscore
            } else if (data === '℃' || data === '℉') {
                refChar = '°'; // Temperature symbols
            } else if (data === '©' || data === '®' || data === '™') {
                refChar = data; // Copyright symbols
            } else if (data === '§' || data === '¶') {
                refChar = data; // Section symbols
            } else if (data === '†' || data === '‡') {
                refChar = data; // Dagger symbols
            } else if (data === '•' || data === '·' || data === '▪' || data === '▫') {
                refChar = '•'; // Bullet points
            } else if (data === '✓' || data === '✔' || data === '☑') {
                refChar = '✓'; // Check marks
            } else if (data === '✗' || data === '✘' || data === '☒') {
                refChar = '✗'; // X marks
            } else if (data === '→' || data === '←' || data === '↑' || data === '↓') {
                refChar = data; // Arrows
            } else if (data === '♠' || data === '♥' || data === '♦' || data === '♣') {
                refChar = data; // Card suits
            } else if (data === '☺' || data === '☻' || data === '☹') {
                refChar = data; // Emoticons
            } else if (data === '☀' || data === '☁' || data === '☂' || data === '☃') {
                refChar = data; // Weather symbols
            } else if (data === '♫' || data === '♪' || data === '♬') {
                refChar = data; // Music symbols
            } else if (data === '∞' || data === '≈' || data === '≤' || data === '≥') {
                refChar = data; // Math symbols
            } else if (data === '∑' || data === '∏' || data === '∫' || data === '√') {
                refChar = data; // Advanced math symbols
            } else if (data === 'α' || data === 'β' || data === 'γ' || data === 'δ') {
                refChar = data; // Greek letters
            } else if (data === 'π' || data === 'μ' || data === 'σ' || data === 'τ') {
                refChar = data; // More Greek letters
            } else if (data === data.toUpperCase() && data.match(/[A-Z]/)) {
                refChar = 'SHIFT';
            } else if (data === 'π' || data === 'μ' || data === 'σ' || data === 'τ') {
                refChar = data; // More Greek letters
            } else {
                // For all other characters, use as-is
                refChar = data;
            }
            
            // Debug logging for quote characters
            if (data === "'" || data === "'" || data === "'" || data === "'" || data === "'" || data === "'" || data === '`' || data === '´' || data === '′' || data === '‵' || data === '"' || data === '"' || data === '"' || data === '"' || data === '"' || data === '"' || data === '„' || data === '‟' || data === '″' || data === '‶') {
                console.log('🔍 Quote processing complete (other input) - Final refChar:', refChar);
            }
    

    
            // Check if character should be recorded (deduplication)
            if (this.shouldRecordChar(refChar, timestamp)) {
                console.log('📝 Recording keystroke (other input):', refChar, 'type:', inputType, 'timestamp:', timestamp);
                this.recordKeystroke({
                    timestamp,
                    actualChar: refChar,
                    keyCode: data.charCodeAt(0),
                    type: inputType,
                    sentence: this.currentSentence,
                    position: pos - 1,
                    clientX: this.pointerTracking.x,
                    clientY: this.pointerTracking.y
                });
                
                // Update last character and time for mobile deduplication
                this.lastChar = refChar;
                this.lastCharTime = timestamp;
            } else {
                console.log('❌ Character duplicate ignored (other input):', refChar);
            }
            
            // Update previous character
            this.previousChar = data;
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

        if (actualCharacter === 'Backspace' || actualCharacter === 'backspace') {
            // Only record Backspace once on keydown with deduplication
            const currentTime = performance.now();
            
            // Check if enough time has passed since last backspace to avoid duplicates
            if (currentTime - this.lastBackspaceTime > this.backspaceCooldown) {
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
                console.log('Desktop backspace recorded at time:', currentTime);
                
                // Update last backspace time
                this.lastBackspaceTime = currentTime;
            } else {
                console.log('Desktop backspace duplicate ignored, time since last:', currentTime - this.lastBackspaceTime);
            }
            return;  // Don't record further
        }
        
                
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
    
    // Mobile-only keystroke handling - no desktop keyboard support needed
    // All keystroke recording is handled through input events for mobile keyboards (Gboard, iOS)
    
    startTypingTask() {
        this.currentSentence = 0;
        this.lastInputLength = 0; // FIXED: Reset at task start
        this.previousChar = null; // FIXED: Reset previousChar at task start
        this.lastBackspaceTime = 0; // Reset backspace tracking
        this.lastCharTime = 0; // Reset character tracking
        this.lastChar = null; // Reset character tracking
        
        // Reset mobile input tracking
        this.lastInputValue = '';
        this.lastInputLength = 0;
        this.inputEventCount = 0;
        this.lastInputEvent = null;
        this.lastInputEventTime = 0;
        
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
        
        // FIXED: Reset lastInputLength when starting new sentence
        this.lastInputLength = 0;
        // FIXED: Reset previousChar when starting new sentence
        this.previousChar = null;
        // Reset backspace tracking for new sentence
        this.lastBackspaceTime = 0;
        // Reset character tracking for new sentence
        this.lastCharTime = 0;
        this.lastChar = null;
        
        // Reset mobile input tracking for new sentence
        this.lastInputValue = '';
        this.lastInputLength = 0;
        this.inputEventCount = 0;
        this.lastInputEvent = null;
        this.lastInputEventTime = 0;
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
        // Debug logging for quote characters
        if (data.actualChar === "'" || data.actualChar === '"') {
            console.log('Recording keystroke with quote:', data.actualChar, 'type:', data.type);
        }
        // Debug logging for backspace
        if (data.actualChar === 'Backspace') {
            console.log('Recording backspace keystroke:', data.type, 'timestamp:', data.timestamp);
        }
        this.keystrokeData.push(data);
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
    shouldRecordChar(char, timestamp) {
        const currentTime = performance.now();
        
        // ULTRA-STRICT mobile deduplication for all Android/iOS versions
        if (this.lastChar === char) {
            const timeSinceLast = currentTime - this.lastCharTime;
            
            // BLOCK: Any duplicate character within 250ms (increased for mobile reliability)
            if (timeSinceLast < 250) {
                console.log('🚫 Character duplicate BLOCKED (ultra-strict):', char, 'time since last:', timeSinceLast, 'ms');
                return false;
            }
            
            // BLOCK: Duplicates within 500ms for same character (mobile double-tap protection)
            if (timeSinceLast < 500) {
                console.log('🚫 Character duplicate BLOCKED (extended protection):', char, 'time since last:', timeSinceLast, 'ms');
                return false;
            }
        }
        
        // ADDITIONAL: Block rapid character input (mobile keyboard protection)
        if (this.lastCharTime && (currentTime - this.lastCharTime) < 50) {
            console.log('🚫 Character input BLOCKED (rapid input protection):', char, 'time since last:', currentTime - this.lastCharTime, 'ms');
            return false;
        }
        
        // Update tracking
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
                    // Reset rotation state for new attempt
                    this.crystalState.initialAngle = angle;
                    this.crystalState.lastAngle = angle;
                    this.crystalState.rotationRounds = 0;
                    this.crystalState.rotationDirection = null; // 1 = CW, -1 = CCW
                    this.crystalState.rotationAccumulated = 0;
                    this.crystalState.rotationSequence = []; // Track rotation sequence: CW=1, CCW=-1
                    this.crystalState.rotationCompleted = false; // Track if task is completed
                    crystal.classList.add('active');
                    this.updateStepProgress(`0/3 (CW → CCW → CW)`);
                    console.log('🔄 Rotation started - touch anywhere on crystal surface');
                }
            
                else if (phase === 'move') {
                    // BLOCK: If rotation task is already completed, ignore all movements
                    if (this.crystalState.rotationCompleted) {
                        console.log('🚫 Rotation task completed - ignoring additional movements');
                        return;
                    }
                    
                    let delta = angle - this.crystalState.lastAngle;
                    if (delta > Math.PI) delta -= 2 * Math.PI;
                    if (delta < -Math.PI) delta += 2 * Math.PI;
                    if (!isFinite(delta)) return;
            
                    // ULTRA-RELIABLE mobile rotation detection
                    const minDelta = 0.01; // Minimum movement threshold
                    if (Math.abs(delta) < minDelta) return;
            
                    const direction = Math.sign(delta);
                    
                    // Set direction on first significant move of this round
                    if (this.crystalState.rotationDirection === null && Math.abs(delta) > minDelta) {
                        this.crystalState.rotationDirection = direction;
                        console.log(`🔄 Rotation direction set: ${direction === 1 ? 'CW' : 'CCW'}`);
                    }
            
                    // STRICT direction validation - no tolerance for wrong direction
                    if (this.crystalState.rotationDirection !== null && direction !== this.crystalState.rotationDirection) {
                        // Block wrong direction rotations completely
                        if (Math.abs(delta) > 0.05) {
                            this.showWrongDirectionFeedback();
                            this.crystalState.lastAngle = angle;
                            console.log(`❌ Wrong rotation direction! Expected: ${this.crystalState.rotationDirection === 1 ? 'CW' : 'CCW'}, Got: ${direction === 1 ? 'CW' : 'CCW'}`);
                            return;
                        }
                    }
            
                    this.crystalState.rotationAccumulated += delta;
                    this.crystalState.lastAngle = angle;
            
                    const progress = Math.abs(this.crystalState.rotationAccumulated) / (2 * Math.PI);
                    this.updateStepProgress(`${(this.crystalState.rotationRounds + Math.min(progress, 1)).toFixed(1)}/3 (CW → CCW → CW)`);
            
                    // Check for full rotation completion
                    if (Math.abs(this.crystalState.rotationAccumulated) >= 2 * Math.PI) {
                        // Record the completed rotation direction
                        const completedDirection = this.crystalState.rotationDirection;
                        this.crystalState.rotationSequence.push(completedDirection);
                        
                        this.crystalState.rotationRounds += 1;
                        this.crystalState.rotationAccumulated = 0;
                        this.crystalState.rotationDirection = null;
            
                        // Show green light feedback
                        crystal.classList.add('rotation-feedback');
                        setTimeout(() => crystal.classList.remove('rotation-feedback'), 800);
                        
                        console.log(`✅ Rotation ${this.crystalState.rotationRounds} completed: ${completedDirection === 1 ? 'CW' : 'CCW'}`);
                        console.log(`📊 Rotation sequence: [${this.crystalState.rotationSequence.map(d => d === 1 ? 'CW' : 'CCW').join(', ')}]`);
                        
                        // Update progress to show completed rotation
                        this.updateStepProgress(`${this.crystalState.rotationRounds}/3 (CW → CCW → CW)`);
            
                        // Check if we have the correct sequence: CW → CCW → CW
                        if (this.crystalState.rotationRounds >= 3) {
                            const expectedSequence = [1, -1, 1]; // CW, CCW, CW
                            const actualSequence = this.crystalState.rotationSequence.slice(-3);
                            
                            if (JSON.stringify(actualSequence) === JSON.stringify(expectedSequence)) {
                                console.log('✅ Correct rotation sequence achieved: CW → CCW → CW');
                                this.crystalState.rotationCompleted = true; // Mark as completed
                                this.completeStep();
                            } else {
                                console.log('❌ Wrong rotation sequence! Need: CW → CCW → CW');
                                console.log(`Got: [${actualSequence.map(d => d === 1 ? 'CW' : 'CCW').join(' → ')}]`);
                                // Reset to allow correct sequence
                                this.crystalState.rotationRounds = 0;
                                this.crystalState.rotationSequence = [];
                                this.crystalState.rotationCompleted = false;
                                this.updateStepProgress(`0/3 (CW → CCW → CW) - Try again!`);
                            }
                        }
                    }
                }
            
                else if (phase === 'end') {
                    crystal.classList.remove('active');
                    console.log('🔄 Rotation touch ended');
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
    
    completeStep() {
        const crystal = document.getElementById('crystal');
        crystal.classList.add('success');
        
        setTimeout(() => {
            crystal.classList.remove('success');
        }, 600);
        
        document.getElementById('step-status').textContent = 'Completed';
        document.getElementById('next-crystal-btn').disabled = false;
        
        const crystalSizeDisplay = document.getElementById('crystal-size-display');
        crystalSizeDisplay.classList.add('completion-highlight');
        setTimeout(() => crystalSizeDisplay.classList.remove('completion-highlight'), 1000);
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
        
        // Reset trial counter for new step
        this.crystalState.currentTrial = 1;
        console.log(`Moving to step ${this.currentCrystalStep} - Trial reset to 1`);
        
        this.resetCrystalState();
        this.updateCrystalDisplay();
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
            rotationSequence: [], // Reset rotation sequence
            rotationCompleted: false, // Reset rotation completion status
            // Preserve trial tracking
            currentTrial: currentTrial,
            stepStartTime: performance.now()
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
            'rotate': 'One-Finger Rotation (CW→CCW→CW)',
            'pinch': 'Pinch to Shrink',
            'spread': 'Spread to Enlarge',
            'pressure': 'Three-Finger Pressure'
        };
        return titles[type] || 'Unknown';
    }
    
    getInitialProgress(type) {
        const progress = {
            'tap': '0/3',
            'rotate': '0/3 (Touch & rotate CW→CCW→CW)',
            'pinch': '100% → 50%',
            'spread': '100% → 150%',
            'pressure': '0s / 3s'
        };
        return progress[type] || '0/0';
    }
    
    updateStepProgress(progress) {
        document.getElementById('step-progress').textContent = progress;
        
        // Enhanced guidance for rotation step
        if (this.currentCrystalStep === 2) {
            const stepStatus = document.getElementById('step-status');
            if (this.crystalState.rotationCompleted) {
                stepStatus.textContent = 'Perfect! All rotations completed';
            } else if (this.crystalState.rotationRounds === 0) {
                stepStatus.textContent = 'Touch crystal and rotate clockwise';
            } else if (this.crystalState.rotationRounds === 1) {
                stepStatus.textContent = 'Now rotate counter-clockwise';
            } else if (this.crystalState.rotationRounds === 2) {
                stepStatus.textContent = 'Finally rotate clockwise again';
            } else {
                stepStatus.textContent = 'Follow the sequence: CW → CCW → CW';
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


    // Export Methods
    exportKeystrokeData() {
        const features = this.extractKeystrokeFeatures();
        const csv = this.convertToCSV(features);
        const filename = `${this.participantId}_keystroke.csv`;
    
        this.uploadCSVToGoogleDrive(csv, filename);
    
        document.getElementById('keystroke-count').textContent = this.keystrokeData.length;
        document.getElementById('keystroke-features').textContent = '8'; // 8 features (removed trial_id)
    }

    
    exportTouchData() {
        const features = this.extractTouchFeatures();
        const csv = this.convertToCSV(features);
        const filename = `${this.participantId}_touch.csv`;

        this.uploadCSVToGoogleDrive(csv, filename);
    
        document.getElementById('touch-count').textContent = this.touchData.length;
        document.getElementById('touch-features').textContent = '9'; // 9 features: participant_id, task_id, trial, timestamp_ms, touch_x, touch_y, btn_touch_state, inter_touch_timing, pressure
    }


    // FIXED: Enhanced keystroke feature extraction with proper character handling
    extractKeystrokeFeatures() {
        const features = [];
        
        this.keystrokeData.forEach((keystroke, index) => {
            // Process all recorded keystrokes (input events, keydown, composition)
            if (keystroke.type === 'keydown' || keystroke.type === 'insertText' || keystroke.type === 'compositionend' || keystroke.type.startsWith('delete')) {
                // FIXED: Calculate flight time with validation to prevent negative values
                let flightTime = 0;
                if (index > 0) {
                    const timeDiff = keystroke.timestamp - this.keystrokeData[index - 1].timestamp;
                    // Ensure flight time is never negative
                    flightTime = Math.max(0, Math.round(timeDiff));
                    
                    // Log any potential timing issues for debugging
                    if (timeDiff < 0) {
                        console.warn(`⚠️ Negative flight time detected: ${timeDiff}ms between "${this.keystrokeData[index - 1].actualChar}" and "${keystroke.actualChar}". Setting to 0.`);
                    }
                }
                
                // Determine if this was a deletion
                const wasDeleted = (keystroke.actualChar === 'BACKSPACE' || 
                                  keystroke.type.startsWith('delete')) ? 1 : 0;
                
                features.push({
                    participant_id: this.participantId,
                    task_id: 1, // Typing task
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

    
    // RELIABLE: Touch feature extraction with only accurate, measurable features
    extractTouchFeatures() {
        const features = [];
        
        this.touchData.forEach((touch, index) => {
            // Base features that are always reliable across all devices
            const baseFeature = {
                participant_id: this.participantId,
                task_id: touch.taskId,
                trial: touch.trial || 1, // Trial number (1 for first attempt, 2+ for retries)
                timestamp_ms: Math.round(touch.timestamp),
                touch_x: Math.round(touch.touches[0]?.clientX || 0),
                touch_y: Math.round(touch.touches[0]?.clientY || 0),
                btn_touch_state: touch.type,
                inter_touch_timing: index > 0 ? Math.round(touch.timestamp - this.touchData[index - 1].timestamp) : 0
            };
            
            // RELIABLE PRESSURE: Only include when force is actually available and meaningful
            // Most mobile devices don't support pressure/force, so we'll use a default value
            if (touch.touches[0]?.force !== undefined && touch.touches[0].force > 0 && touch.touches[0].force <= 1) {
                baseFeature.pressure = Math.round(touch.touches[0].force * 1000) / 1000; // 3 decimal precision
            } else {
                // Use default pressure value for devices that don't support force
                baseFeature.pressure = 0.5; // Default pressure value
            }
            
            features.push(baseFeature);
        });
        
        return features;
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
// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new BiometricDataCollector();
});
