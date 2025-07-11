class BiometricDataCollector {
    constructor() {
        this.participantId = '';
        this.currentScreen = 'welcome';
        this.currentSentence = 0;
        this.currentCrystalStep = 1;
        this.currentGalleryImage = 0;
        
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
        
        this.shiftPressed = false;
        this.shiftPressTime = 0;
        this.shiftReleaseTime = 0;
        this.lastKeystrokeTime = 0;
        this.currentCase = 'lowercase';
        this.flightTimeData = [];
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
            { id: 5, instruction: "Tap the crystal facets in the order they light up. Follow the sequence to activate all 25 facets.", target: 25, type: 'facet_tap' }
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
            stepStartTime: null,
            // Facet tapping state
            facets: [],
            currentFacetIndex: 0,
            tappedFacets: new Set(),
            facetSequence: []
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
        

        this.gesturePath = {};
        this.gesturePathLength = {};
        
        this.deviceInfo = this.detectDeviceInfo();
        
        this.init();
    }
    
    detectDeviceInfo() {
        const userAgent = navigator.userAgent;
        
        let deviceInfo = {
            device_type: 'unknown',
            device_model: 'unknown',
            browser_name: 'unknown',
            browser_version: 'unknown',
            os_name: 'unknown',
            os_version: 'unknown',
            platform: 'unknown'
        };
        
        if (/iPad|iPhone|iPod/.test(userAgent)) {
            deviceInfo.device_type = 'iOS';
            deviceInfo.os_name = 'iOS';
            
            const iosMatch = userAgent.match(/OS (\d+_\d+)/);
            if (iosMatch) {
                deviceInfo.os_version = iosMatch[1].replace('_', '.');
            }
            
            if (/iPhone/.test(userAgent)) {
                if (/iPhone OS 17_0/.test(userAgent)) deviceInfo.device_model = 'iPhone 15 Pro Max';
                else if (/iPhone OS 16_0/.test(userAgent)) deviceInfo.device_model = 'iPhone 14 Pro Max';
                else if (/iPhone OS 15_0/.test(userAgent)) deviceInfo.device_model = 'iPhone 13 Pro Max';
                else if (/iPhone OS 14_0/.test(userAgent)) deviceInfo.device_model = 'iPhone 12 Pro Max';
                else if (/iPhone OS 13_0/.test(userAgent)) deviceInfo.device_model = 'iPhone 11 Pro Max';
                else deviceInfo.device_model = 'iPhone (Unknown Model)';
            }
            else if (/iPad/.test(userAgent)) {
                deviceInfo.device_model = 'iPad';
            }
        }
        else if (/Android/.test(userAgent)) {
            deviceInfo.device_type = 'Android';
            deviceInfo.os_name = 'Android';
            
            const androidMatch = userAgent.match(/Android (\d+\.?\d*)/);
            if (androidMatch) {
                deviceInfo.os_version = androidMatch[1];
            }
            
            const modelMatch = userAgent.match(/\(Linux.*?;\s*([^;]+)\s*Build/);
            if (modelMatch) {
                const model = modelMatch[1].trim();
                if (model.includes('SM-')) {
                    const samsungMatch = model.match(/SM-([A-Z0-9]+)/);
                    if (samsungMatch) {
                        const modelCode = samsungMatch[1];
                        switch(modelCode) {
                            case 'G991': deviceInfo.device_model = 'Samsung Galaxy S21'; break;
                            case 'G998': deviceInfo.device_model = 'Samsung Galaxy S21 Ultra'; break;
                            case 'G996': deviceInfo.device_model = 'Samsung Galaxy S21+'; break;
                            case 'G781': deviceInfo.device_model = 'Samsung Galaxy S20 FE'; break;
                            case 'G970': deviceInfo.device_model = 'Samsung Galaxy S10e'; break;
                            case 'G973': deviceInfo.device_model = 'Samsung Galaxy S10'; break;
                            case 'G975': deviceInfo.device_model = 'Samsung Galaxy S10+'; break;
                            case 'N976': deviceInfo.device_model = 'Samsung Galaxy Note 10+'; break;
                            default: deviceInfo.device_model = `Samsung Galaxy (${modelCode})`;
                        }
                    }
                } else if (model.includes('Pixel')) {
                    deviceInfo.device_model = model;
                } else if (model.includes('OnePlus')) {
                    deviceInfo.device_model = model;
                } else {
                    deviceInfo.device_model = model;
                }
            }
        }
        else {
            deviceInfo.device_type = 'Mobile';
            deviceInfo.device_model = 'Unknown Mobile Device';
            deviceInfo.os_name = 'Unknown';
            deviceInfo.os_version = 'Unknown';
        }
        
        if (/Chrome/.test(userAgent) && !/Edge/.test(userAgent)) {
            deviceInfo.browser_name = 'Chrome';
            const chromeMatch = userAgent.match(/Chrome\/(\d+\.\d+)/);
            if (chromeMatch) {
                deviceInfo.browser_version = chromeMatch[1];
            }
        } else if (/Firefox/.test(userAgent)) {
            deviceInfo.browser_name = 'Firefox';
            const firefoxMatch = userAgent.match(/Firefox\/(\d+\.\d+)/);
            if (firefoxMatch) {
                deviceInfo.browser_version = firefoxMatch[1];
            }
        } else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
            deviceInfo.browser_name = 'Safari';
            const safariMatch = userAgent.match(/Version\/(\d+\.\d+)/);
            if (safariMatch) {
                deviceInfo.browser_version = safariMatch[1];
            }
        } else if (/Edge/.test(userAgent)) {
            deviceInfo.browser_name = 'Edge';
            const edgeMatch = userAgent.match(/Edge\/(\d+\.\d+)/);
            if (edgeMatch) {
                deviceInfo.browser_version = edgeMatch[1];
            }
        } else if (/Opera/.test(userAgent)) {
            deviceInfo.browser_name = 'Opera';
            const operaMatch = userAgent.match(/Opera\/(\d+\.\d+)/);
            if (operaMatch) {
                deviceInfo.browser_version = operaMatch[1];
            }
        } else {
            deviceInfo.browser_name = 'Unknown Browser';
            deviceInfo.browser_version = 'Unknown';
        }
        
        deviceInfo.platform = `${deviceInfo.device_model} (${deviceInfo.browser_name})`;
        
        console.log('Device Info:', deviceInfo);
        
        return deviceInfo;
    }
    
    init() {
        this.bindEvents();
        this.generateParticipantId();
        this.initializeGallery();
        this.setupPointerTracking();
        this.updateTaskLocks();
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
        
        const deviceInfoElement = document.getElementById('device-info');
        const browserInfoElement = document.getElementById('browser-info');
        
        if (deviceInfoElement) {
            deviceInfoElement.textContent = `${this.deviceInfo.device_model} (${this.deviceInfo.os_name} ${this.deviceInfo.os_version})`;
        }
        
        if (browserInfoElement) {
            browserInfoElement.textContent = `${this.deviceInfo.browser_name} ${this.deviceInfo.browser_version}`;
        }

        // Column 1: Phone Model, Column 2: Browser Name
        const phoneModelElement = document.getElementById('phone-model'); // Column 1
        const browserNameElement = document.getElementById('browser-name'); // Column 2
        if (phoneModelElement) {
          phoneModelElement.textContent = this.deviceInfo.device_model;
        }
        if (browserNameElement) {
          browserNameElement.textContent = this.deviceInfo.browser_name;
        }
    }
    
    bindEvents() {
        document.getElementById('start-btn').addEventListener('click', () => {
            this.taskState.studyStarted = true;
            this.taskState.typingCompleted = false;
            this.taskState.crystalCompleted = false;
            this.taskState.galleryCompleted = false;
            this.updateTaskLocks();
            this.switchScreen('typing');
            this.startTypingTask();
        });
        // Consent checkbox logic
        const consentCheckbox = document.getElementById('consent-checkbox');
        const startBtn = document.getElementById('start-btn');
        if (consentCheckbox && startBtn) {
            consentCheckbox.addEventListener('change', function() {
                startBtn.disabled = !this.checked;
                if (this.checked) {
                    startBtn.classList.remove('btn--disabled');
                } else {
                    startBtn.classList.add('btn--disabled');
                }
            });
        }
        const typingInput = document.getElementById('typing-input');
        if (typingInput) {
            typingInput.addEventListener('copy', function(e) { 
                e.preventDefault(); 
                e.stopPropagation();
                this.showCopyBlockedFeedback();
                return false;
            }.bind(this));
            typingInput.addEventListener('cut', function(e) { 
                e.preventDefault(); 
                e.stopPropagation();
                this.showCopyBlockedFeedback();
                return false;
            }.bind(this));
            typingInput.addEventListener('paste', function(e) { 
                e.preventDefault(); 
                e.stopPropagation();
                this.showCopyBlockedFeedback();
                return false;
            }.bind(this));
            
            typingInput.addEventListener('drop', function(e) { 
                e.preventDefault(); 
                e.stopPropagation();
                return false;
            });
            
            typingInput.addEventListener('contextmenu', function(e) { 
                e.preventDefault(); 
                e.stopPropagation();
                return false;
            });
            
            typingInput.addEventListener('keydown', function(e) {
                if (e.ctrlKey || e.metaKey) {
                    if (e.key === 'c' || e.key === 'C' || 
                        e.key === 'v' || e.key === 'V' || 
                        e.key === 'x' || e.key === 'X' || 
                        e.key === 'a' || e.key === 'A') {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    }
                }
                
                if (e.shiftKey && e.key === 'Insert') {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
            });
            
            /*
            typingInput.addEventListener('selectstart', function(e) { 
                e.preventDefault(); 
                return false;
            });
            
            typingInput.addEventListener('mousedown', function(e) {
                e.preventDefault();
                setTimeout(() => {
                    typingInput.setSelectionRange(typingInput.value.length, typingInput.value.length);
                }, 0);
                return false;
            });
            
            typingInput.addEventListener('mouseup', function(e) {
                setTimeout(() => {
                    typingInput.setSelectionRange(typingInput.value.length, typingInput.value.length);
                }, 0);
            });
            
            typingInput.addEventListener('touchstart', function(e) {
                e.preventDefault();
                setTimeout(() => {
                    typingInput.setSelectionRange(typingInput.value.length, typingInput.value.length);
                }, 0);
                return false;
            });
            */
            
            typingInput.addEventListener('compositionstart', function(e) {
                console.log('Composition started - monitoring for clipboard content');
            });
            
            typingInput.addEventListener('input', function(e) {
                const currentValue = e.target.value;
                const previousValue = this.lastInputValue || '';
                
                if (currentValue.length > previousValue.length + 1) {
                    console.log('Potential paste detected - blocking');
                    e.target.value = previousValue;
                    setTimeout(() => {
                        typingInput.setSelectionRange(typingInput.value.length, typingInput.value.length);
                    }, 0);
                    return false;
                }
                
                this.lastInputValue = currentValue;
            }.bind(this));
            
            if (navigator.clipboard) {
                const originalWriteText = navigator.clipboard.writeText;
                const originalReadText = navigator.clipboard.readText;
                
                navigator.clipboard.writeText = function() {
                    console.log('Clipboard write blocked');
                    return Promise.reject(new Error('Clipboard access blocked'));
                };
                
                navigator.clipboard.readText = function() {
                    console.log('Clipboard read blocked');
                    return Promise.reject(new Error('Clipboard access blocked'));
                };
            }
            
            const originalExecCommand = document.execCommand;
            document.execCommand = function(command, ...args) {
                if (command === 'copy' || command === 'cut' || command === 'paste') {
                    console.log(`execCommand ${command} blocked`);
                    return false;
                }
                return originalExecCommand.call(this, command, ...args);
            };
        }
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
        typingInput.addEventListener('keyup', (e) => {
            if (this.compositionActive || e.keyCode === 229) {
                return;
            }
            this.handleKeyup(e);
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
        typingInput.addEventListener('paste', (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });
        typingInput.addEventListener('copy', (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });
        typingInput.addEventListener('cut', (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });
        typingInput.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });
        typingInput.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });
        const sentenceDisplay = document.querySelector('.sentence-display');
        if (sentenceDisplay) {
            sentenceDisplay.addEventListener('copy', function(e) { 
                e.preventDefault(); 
                e.stopPropagation();
                this.showCopyBlockedFeedback();
                return false;
            }.bind(this));
            /*
            sentenceDisplay.addEventListener('selectstart', function(e) { 
                e.preventDefault(); 
                return false;
            });
            sentenceDisplay.addEventListener('contextmenu', function(e) { 
                e.preventDefault(); 
                e.stopPropagation();
                this.showCopyBlockedFeedback();
                return false;
            }.bind(this));
            sentenceDisplay.addEventListener('mousedown', function(e) { 
                e.preventDefault(); 
                return false;
            });
            sentenceDisplay.addEventListener('touchstart', function(e) { 
                e.preventDefault(); 
                return false;
            });
            */
        }
        
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
        if (screenName === 'export') {
            const keystrokeFeatures = this.extractKeystrokeFeatures();
            const keystrokeFeatureCount = keystrokeFeatures.length > 0 ? Object.keys(keystrokeFeatures[0]).length : 0;
            document.getElementById('keystroke-features').textContent = keystrokeFeatureCount;
            const touchFeatures = this.extractTouchFeatures();
            const touchFeatureCount = touchFeatures.length > 0 ? Object.keys(touchFeatures[0]).length : 0;
            document.getElementById('touch-features').textContent = touchFeatureCount;
        }
    }
    
    smoothScrollToScreen(targetScreen) {
        targetScreen.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
        });
        
        setTimeout(() => {
            window.scrollTo({
                top: targetScreen.offsetTop,
                behavior: 'smooth'
            });
        }, 100);
    }
    
    showNextTaskButton(targetScreen, taskName) {
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
    handleTypingInput(e) {
        const { inputType, data } = e;
        const inputEl = e.target;
        const value = inputEl.value;
        const pos = inputEl.selectionStart || value.length;
        const timestamp = performance.now();
    
        const currentTime = performance.now();
        
        const eventSignature = `${inputType}-${data}-${value.length}-${pos}`;
        
        if (data && inputType === 'insertText') {
            // Special handling for quotes - less aggressive deduplication
            const isQuote = data === "'" || data === "'" || data === "'" || data === "'" || data === "'" || data === "'" || data === '`' || data === '´' || data === '′' || data === '‵' || data === '"' || data === '"' || data === '"' || data === '"' || data === '"' || data === '"' || data === '„' || data === '‟' || data === '″' || data === '‶';
            
            if (isQuote) {
                console.log('🔍 Quote input detected:', data, 'charCode:', data.charCodeAt(0), 'type:', inputType);
            }
            
            // iOS-specific deduplication to prevent double character recording
            if (this.isIOS) {
                // For quotes, use much more lenient deduplication
                const dedupWindow = isQuote ? 50 : 300; // 50ms for quotes vs 300ms for others
                
                // Check for exact same input event within dedup window
                if (this.lastInputEvent === eventSignature && 
                    this.lastInputEventTime && 
                    (currentTime - this.lastInputEventTime) < dedupWindow) {
                    console.log('🚫 iOS duplicate input event BLOCKED:', data, 'time since last:', currentTime - this.lastInputEventTime, 'ms');
                    return;
                }
                
                // Check for same character within dedup window
                if (this.lastChar === data && 
                    this.lastCharTime && 
                    (currentTime - this.lastCharTime) < dedupWindow) {
                    console.log('🚫 iOS duplicate character BLOCKED:', data, 'time since last:', currentTime - this.lastCharTime, 'ms');
                    return;
                }
                
                // Check for rapid input events (iOS keyboard lag) - more lenient for quotes
                const rapidWindow = isQuote ? 100 : 150; // 100ms for quotes vs 150ms for others
                if (this.lastInputEventTime && (currentTime - this.lastInputEventTime) < rapidWindow) {
                    console.log('🚫 iOS rapid input BLOCKED:', data, 'time since last:', currentTime - this.lastInputEventTime, 'ms');
                    return;
                }
            } else {
                // Android deduplication - less aggressive for quotes
                const dedupWindow = isQuote ? 30 : 100; // 30ms for quotes vs 100ms for others
                if (this.lastInputEvent === eventSignature && 
                    this.lastInputEventTime && 
                    (currentTime - this.lastInputEventTime) < dedupWindow) {
                    console.log('🚫 Android duplicate input event BLOCKED:', data, 'time since last:', currentTime - this.lastInputEventTime, 'ms');
                    return;
                }
            }
        }
        
        // iOS-specific composition handling
        if (this.isIOS && this.compositionActive && inputType === 'insertText') {
            console.log('iOS composition active, skipping insertText');
            return;
        }
        
        // Additional iOS protection: block composition events that might cause duplicates
        // More lenient for quotes
        if (this.isIOS && inputType === 'insertText' && this.lastInputEventTime) {
            const isQuote = data === "'" || data === "'" || data === "'" || data === "'" || data === "'" || data === "'" || data === '`' || data === '´' || data === '′' || data === '‵' || data === '"' || data === '"' || data === '"' || data === '"' || data === '"' || data === '"' || data === '„' || data === '‟' || data === '″' || data === '‶';
            const timeSinceLast = currentTime - this.lastInputEventTime;
            const compositionWindow = isQuote ? 25 : 50; // 25ms for quotes vs 50ms for others
            if (timeSinceLast < compositionWindow) {
                console.log('🚫 iOS composition duplicate BLOCKED:', data, 'time since last:', timeSinceLast, 'ms');
                return;
            }
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
            
            // Update accuracy and check sentence completion after backspace
            this.calculateAccuracy();
            this.checkSentenceCompletion();
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
                    
                    // SPECIAL CASE: Handle SHIFT logic for case changes
                    // Only record SHIFT if going from lowercase to uppercase, not from uppercase to lowercase
                    if (char === char.toUpperCase() && char.match(/[A-Z]/)) {
                        // Check if previous character was lowercase
                        if (this.previousChar && this.previousChar === this.previousChar.toLowerCase() && this.previousChar.match(/[a-z]/)) {
                            // Going from lowercase to uppercase - record SHIFT first, then the letter
                            this.recordKeystroke({
                                timestamp: timestamp + i - 0.5,
                                actualChar: 'SHIFT',
                                keyCode: 16,
                                type: inputType,
                                sentence: this.currentSentence,
                                position: pos - data.length + i,
                                clientX: this.pointerTracking.x,
                                clientY: this.pointerTracking.y
                            });
                        }
                        // Record the uppercase letter
                        refChar = char;
                    } else if (char === char.toLowerCase() && char.match(/[a-z]/)) {
                        // Lowercase letter - no SHIFT needed
                        refChar = char;
                    }
                    
                    // Debug logging for quote characters
                    if (char === "'" || char === "'" || char === "'" || char === "'" || char === "'" || char === "'" || char === '`' || char === '´' || char === '′' || char === '‵' || char === '"' || char === '"' || char === '"' || char === '"' || char === '"' || char === '"' || char === '„' || char === '‟' || char === '″' || char === '‶') {
                        console.log('🔍 Quote processing complete - Final refChar:', refChar);
                    }
                    
                    // Check if character should be recorded (simplified deduplication)
                    // For quotes, use more lenient deduplication
                    const isQuote = refChar === "'" || refChar === '"';
                    if (this.shouldRecordChar(refChar, timestamp + i, isQuote)) {
                        
                        // Final iOS safety check: prevent duplicate in keystroke data
                        // More lenient for quotes
                        if (this.isIOS) {
                            const lastKeystroke = this.keystrokeData[this.keystrokeData.length - 1];
                            const quoteDedupWindow = isQuote ? 100 : 300; // 100ms for quotes vs 300ms for others
                            if (lastKeystroke && 
                                lastKeystroke.actualChar === refChar && 
                                (timestamp + i - lastKeystroke.timestamp) < quoteDedupWindow) {
                                console.log('🚫 iOS final duplicate BLOCKED in keystroke data:', refChar);
                                return;
                            }
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
                // SPECIAL CASE: Handle SHIFT logic for case changes
                // Check if previous character was lowercase
                if (this.previousChar && this.previousChar === this.previousChar.toLowerCase() && this.previousChar.match(/[a-z]/)) {
                    // Going from lowercase to uppercase - record SHIFT first, then the letter
                this.recordKeystroke({
                        timestamp: timestamp - 0.5,
                    actualChar: 'SHIFT',
                    keyCode: 16,
                    type: inputType,
                    sentence: this.currentSentence,
                    position: pos - 1,
                    clientX: this.pointerTracking.x,
                    clientY: this.pointerTracking.y
                });
                }
                // Record the uppercase letter
                refChar = data;
            } else if (data === data.toLowerCase() && data.match(/[a-z]/)) {
                // Lowercase letter - no SHIFT needed
                refChar = data;
            }
            
            // Debug logging for quote characters
            if (data === "'" || data === "'" || data === "'" || data === "'" || data === "'" || data === "'" || data === '`' || data === '´' || data === '′' || data === '‵' || data === '"' || data === '"' || data === '"' || data === '"' || data === '"' || data === '"' || data === '„' || data === '‟' || data === '″' || data === '‶') {
                console.log('🔍 Quote processing complete (other input) - Final refChar:', refChar);
            }
            
            // Check if character should be recorded (simplified deduplication)
            // For quotes, use more lenient deduplication
            const isQuote = refChar === "'" || refChar === '"';
            if (this.shouldRecordChar(refChar, timestamp, isQuote)) {
                
                // Final iOS safety check: prevent duplicate in keystroke data
                // More lenient for quotes
                // if (this.isIOS) {
                //     const lastKeystroke = this.keystrokeData[this.keystrokeData.length - 1];
                //     const quoteDedupWindow = isQuote ? 100 : 300; // 100ms for quotes vs 300ms for others
                //     if (lastKeystroke && 
                //         lastKeystroke.actualChar === refChar && 
                //         (timestamp - lastKeystroke.timestamp) < quoteDedupWindow) {
                //         console.log('🚫 iOS final duplicate BLOCKED in keystroke data (other input):', refChar);
                //         return;
                //     }
                // }
                
                console.log('📝 Recording keystroke (other input):', refChar, 'type:', inputType, 'timestamp:', timestamp);
                this.recordKeystroke({
                    timestamp: timestamp,
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
        }
    
        // Update accuracy and check sentence completion after any input
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
            
            // Update accuracy and check sentence completion after backspace
            this.calculateAccuracy();
            this.checkSentenceCompletion();
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
        
        // Update accuracy and check sentence completion after any keydown
        this.calculateAccuracy();
        this.checkSentenceCompletion();
    }
    
    handleKeyup(e) {
        const timestamp = performance.now();
        



        
        // Enhanced SHIFT tracking
        if (e.key === 'Shift') {
            this.updateShiftState(false);
            this.recordKeystroke({
                timestamp,
                actualChar: 'SHIFT',
                keyCode: 16,
                type: 'keyup',
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
            // Only record Backspace once on keyup with deduplication
            const currentTime = performance.now();
            
            // Check if enough time has passed since last backspace to avoid duplicates
            if (currentTime - this.lastBackspaceTime > this.backspaceCooldown) {
                this.recordKeystroke({
                    timestamp,
                    actualChar: 'BACKSPACE',
                    keyCode: 8,
                    type: 'keyup',
                    shiftKey: e.shiftKey,
                    ctrlKey: e.ctrlKey,
                    altKey: e.altKey,
                    sentence: this.currentSentence,
                    position: e.target.selectionStart || 0,
                    clientX: this.pointerTracking.x,
                    clientY: this.pointerTracking.y
                });
                console.log('Backspace recorded at time:', currentTime);
                
                // Update last backspace time
                this.lastBackspaceTime = currentTime;
            } else {
                console.log('Backspace duplicate ignored, time since last:', currentTime - this.lastBackspaceTime);
            }
            
            // Update accuracy and check sentence completion after backspace
            this.calculateAccuracy();
            this.checkSentenceCompletion();
            return;  // Don't record further
        }
        
                
        // Only record if we have a valid character
        if (actualCharacter) {
            console.log('Key released:', e.key, 'KeyCode:', e.keyCode, 'Detected:', actualCharacter);
            
            this.recordKeystroke({
                timestamp,
                actualChar: actualCharacter,
                keyCode: e.keyCode,
                type: 'keyup',
                shiftKey: e.shiftKey,
                ctrlKey: e.ctrlKey,
                altKey: e.altKey,
                sentence: this.currentSentence,
                position: e.target.selectionStart || 0,
                clientX: this.pointerTracking.x,
                clientY: this.pointerTracking.y
            });
        }
        
        // Update accuracy and check sentence completion after any keyup
        this.calculateAccuracy();
        this.checkSentenceCompletion();
    }
    
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
        
        // Test quote handling for debugging
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
        nextBtn.disabled = true;
        nextBtn.style.display = 'inline-flex';
        nextBtn.style.backgroundColor = 'var(--color-secondary)';
        nextBtn.style.opacity = '0.5';
    }
    
    calculateAccuracy() {
        const typed = document.getElementById('typing-input').value;
        const target = this.sentences[this.currentSentence];
        
        console.log('🔍 Accuracy calculation:', {
            typed: `"${typed}"`,
            target: `"${target}"`,
            typedLength: typed.length,
            targetLength: target.length
        });
        
        let accuracy = 0;
        if (typed === target) {
            document.getElementById('accuracy').textContent = '100%';
            accuracy = 100;
            console.log('✅ Perfect match - 100% accuracy');
        } else {
            let correct = 0;
            const minLength = Math.min(typed.length, target.length);
            
            for (let i = 0; i < minLength; i++) {
                if (typed[i] === target[i]) {
                    correct++;
                }
            }
            
            accuracy = Math.round((correct / target.length) * 100);
            document.getElementById('accuracy').textContent = `${accuracy}%`;
            console.log(`📊 Accuracy: ${correct}/${target.length} = ${accuracy}%`);
        }
    
        // NEW: Enable/disable Next Sentence button based on accuracy
        const nextButton = document.getElementById('next-sentence-btn');
        if (nextButton) {
            if (accuracy === 100) {
                nextButton.disabled = false;
                nextButton.classList.remove('btn--disabled');
            } else {
                nextButton.disabled = true;
                nextButton.classList.add('btn--disabled');
            }
        }
    
        // Animate accuracy ring
        const accuracyRing = document.getElementById('accuracy-ring');
        const accuracyValue = document.getElementById('accuracy');
        const encourage = document.querySelector('.accuracy-encourage');
    
        if (accuracyRing && accuracyValue) {
            let percent = Math.max(0, Math.min(accuracy, 100));
            const circumference = 2 * Math.PI * 26;
            const offset = circumference * (1 - percent / 100);
            accuracyRing.setAttribute('stroke-dasharray', circumference);
            accuracyRing.setAttribute('stroke-dashoffset', offset);
    
            if (encourage) {
                if (percent === 100) {
                    encourage.textContent = 'Perfect! 🎉';
                    encourage.style.color = 'var(--color-success)';
                } else if (percent >= 80) {
                    encourage.textContent = 'Great job! Almost there!';
                    encourage.style.color = 'var(--color-primary)';
                } else if (percent >= 50) {
                    encourage.textContent = 'Keep going! 💪';
                    encourage.style.color = 'var(--color-warning)';
                } else {
                    encourage.textContent = 'You can do it!';
                    encourage.style.color = 'var(--color-error)';
                }
            }
        }
    
        return accuracy;
    }

    
    checkSentenceCompletion() {
        const typed = document.getElementById('typing-input').value;
        const target = this.sentences[this.currentSentence];
        const nextBtn = document.getElementById('next-sentence-btn');
        const accuracy = this.calculateAccuracy();
        // Only enable next button and show fireworks if 100% accuracy is achieved
        if (typed === target && accuracy === 100) {
            if (this.currentSentence === this.sentences.length - 1) {
                // Last sentence: hide next sentence button, show next task button
                nextBtn.style.display = 'none';
                this.showNextTaskButton('crystal', 'Crystal Forge Game');
            } else {
                nextBtn.disabled = false;
                nextBtn.classList.add('next-task-btn--deep');
            }

        } else {
            nextBtn.disabled = true;
            nextBtn.classList.remove('next-task-btn--deep');
            nextBtn.style.display = 'inline-flex';
        }
    }
    
    nextSentence() {
        this.currentSentence++;
        if (this.currentSentence >= this.sentences.length) {
            this.showNextTaskButton('crystal', 'Crystal Forge Game');
            this.updateTaskLocks();
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
        // Always log quote keystrokes for debugging
        if (data.actualChar === "'" || data.actualChar === '"') {
            console.log('[QUOTE] Keystroke captured:', data);
        }
        const isQuote = data.actualChar === "'" || data.actualChar === '"';
        // FINAL iOS safety check to prevent double character recording
        // More lenient for quotes to ensure they are captured
        if (this.isIOS && data.actualChar && data.actualChar !== 'BACKSPACE' && data.actualChar !== 'SHIFT' && !isQuote) {
            const currentTime = performance.now();
            const isQuote = data.actualChar === "'" || data.actualChar === '"';
            const dedupWindow = isQuote ? 100 : 300; // 100ms for quotes vs 300ms for others
            
            // Check if this exact character was recorded very recently
            const recentKeystrokes = this.keystrokeData.slice(-5); // Check last 5 keystrokes
            const duplicateFound = recentKeystrokes.some(ks => 
                ks.actualChar === data.actualChar && 
                (currentTime - ks.timestamp) < dedupWindow
            );
            if (duplicateFound) {
                console.log('🚫 iOS FINAL CHECK: Duplicate character BLOCKED:', data.actualChar, 'window:', dedupWindow, 'ms');
                return;
            }
        }

        // Calculate flight time (time between keystrokes)
        const currentTime = performance.now();
        let prevKeystrokeTime = this.lastKeystrokeTime > 0 ? this.lastKeystrokeTime : currentTime;
        let flightTime = 0;
        if (this.lastKeystrokeTime > 0 && data.actualChar !== 'SHIFT') {
            flightTime = currentTime - this.lastKeystrokeTime;
        }




        // Enhanced SHIFT handling for capital letters
        if (
            data.actualChar &&
            data.actualChar.length === 1 &&
            this.getCharacterCase(data.actualChar) === 'uppercase'
        ) {
            // Always insert a synthetic SHIFT event before the uppercase letter
            let split = 0.4 + Math.random() * 0.2; // 0.4 to 0.6
            let shiftFlight = flightTime * split;
            let capFlight = flightTime * (1 - split);
            // Synthetic SHIFT event
            const shiftEvent = {
                ...data,
                actualChar: 'SHIFT',
                keyCode: 16,
                type: 'keydown',
                timestamp: prevKeystrokeTime + shiftFlight,
                flightTime: Math.round(shiftFlight),
                shiftKey: true,
                shiftPressed: true,
                isSynthetic: true
            };
            // Capital letter event
            const capEvent = {
                ...data,
                timestamp: prevKeystrokeTime + shiftFlight + capFlight,
                flightTime: Math.round(capFlight),
                shiftKey: true,
                shiftPressed: true
            };
            // iOS deduplication: ensure no duplicate SHIFT or capital letter events
            if (this.isIOS) {
                const recent = this.keystrokeData.slice(-4);
                if (!recent.some(e => e.actualChar === 'SHIFT' && Math.abs(e.timestamp - shiftEvent.timestamp) < 10)) {
                    this.keystrokeData.push(shiftEvent);
                }
                if (!recent.some(e => e.actualChar === data.actualChar && Math.abs(e.timestamp - capEvent.timestamp) < 10)) {
                    this.keystrokeData.push(capEvent);
                }
            } else {
                this.keystrokeData.push(shiftEvent);
                this.keystrokeData.push(capEvent);
            }
            // Update lastKeystrokeTime
            this.lastKeystrokeTime = capEvent.timestamp;
            this.lastChar = data.actualChar;
            return;
        }

        // Enhanced SHIFT handling for actual SHIFT key
        if (data.actualChar === 'SHIFT') {
            data.shiftAction = this.shiftPressed ? 'release' : 'press';
            data.shiftDuration = this.shiftPressed ? (currentTime - this.shiftPressTime) : 0;
            data.caseTransition = this.getCaseTransition(data);
            console.log(`🔤 SHIFT ${data.shiftAction}: ${data.caseTransition}, duration: ${data.shiftDuration.toFixed(2)}ms`);
        } else if (data.actualChar && data.actualChar !== 'BACKSPACE') {
            // Add SHIFT context to regular characters
            data.shiftPressed = this.shiftPressed;
            data.characterCase = this.getCharacterCase(data.actualChar);
            data.caseTransition = this.getCaseTransition(data);
        }

        // Update last keystroke time
        if (data.actualChar !== 'SHIFT') {
            this.lastKeystrokeTime = currentTime;
        }

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
    shouldRecordChar(char, timestamp, isQuote = false) {
        const currentTime = performance.now();
        // For quotes, use much more lenient deduplication to ensure they are captured
        const dedupWindow = isQuote ? 15 + Math.random() * 5 : 30 + Math.random() * 10; // 15-20ms for quotes vs 30-40ms for others
        if (this.lastChar === char && this.lastCharTime) {
            const timeSinceLast = currentTime - this.lastCharTime;
            if (timeSinceLast < dedupWindow) {
                console.log('🚫 Tight deduplication: Character duplicate BLOCKED:', char, 'time since last:', timeSinceLast, 'ms (window:', dedupWindow.toFixed(1), 'ms)');
            return false;
        }
        }
        // Update tracking
        this.lastChar = char;
        this.lastCharTime = currentTime;
        this.lastInputEvent = char;
        this.lastInputEventTime = currentTime;
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
        console.log('  shouldRecordChar dedup: 15-20ms (vs 30-40ms for others)');
        
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

    // Generate facet positions around the crystal
    generateFacets() {
        const facets = [];
        const centerX = 200; // Crystal center X
        const centerY = 200; // Crystal center Y
        const baseRadius = 80; // Base distance from center
        
        // Create 25 facets in a visually appealing pattern
        for (let i = 0; i < 25; i++) {
            let radius, angle;
            
            // Create different layers of facets
            if (i < 8) {
                // Inner ring - 8 facets
                radius = baseRadius * 0.6;
                angle = (i * Math.PI * 2) / 8;
            } else if (i < 16) {
                // Middle ring - 8 facets
                radius = baseRadius * 1.0;
                angle = ((i - 8) * Math.PI * 2) / 8 + Math.PI / 8; // Offset by 22.5 degrees
            } else {
                // Outer ring - 9 facets
                radius = baseRadius * 1.4;
                angle = ((i - 16) * Math.PI * 2) / 9;
            }
            
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            facets.push({
                id: i,
                x: Math.round(x),
                y: Math.round(y),
                radius: 12,
                active: false,
                tapped: false,
                sequence: i
            });
        }
        
        return facets;
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
                
            case 'facet_tap':
                if (phase === 'start' && touches.length === 1) {
                    const touch = touches[0];
                    const tappedFacet = this.findTappedFacet(touch.clientX, touch.clientY);
                    
                    if (tappedFacet) {
                        // Check if this is the correct facet in sequence
                        if (tappedFacet.sequence === this.crystalState.currentFacetIndex) {
                            // Correct facet tapped
                            tappedFacet.tapped = true;
                            this.crystalState.tappedFacets.add(tappedFacet.id);
                            this.crystalState.currentFacetIndex++;
                            
                            // Visual feedback
                            this.highlightFacet(tappedFacet, 'success');
                            
                            // Update progress
                            this.updateStepProgress(`${this.crystalState.currentFacetIndex}/${step.target}`);
                            
                            console.log(`✅ Facet ${tappedFacet.id} tapped correctly - Progress: ${this.crystalState.currentFacetIndex}/${step.target}`);
                            
                            // Check if all facets are tapped
                            if (this.crystalState.currentFacetIndex >= step.target) {
                                console.log(`✅ All facets tapped! Task completed.`);
                                this.completeStep();
                            } else {
                                // Highlight next facet
                                this.highlightNextFacet();
                            }
                        } else {
                            // Wrong facet tapped
                            this.highlightFacet(tappedFacet, 'error');
                            console.log(`❌ Wrong facet tapped: ${tappedFacet.id}, expected: ${this.crystalState.currentFacetIndex}`);
                            
                            // Show error feedback
                            crystal.classList.add('error-feedback');
                            setTimeout(() => {
                                crystal.classList.remove('error-feedback');
                            }, 300);
                        }
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
            crystal.style.filter = 'brightness(0.9)';
        } else if (size > 1.3) {
            crystal.style.filter = 'brightness(1.1)';
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
        crystal.style.filter = 'drop-shadow(0 0 8px #FF4F64)';
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
            totalRotation: 0,
            lastAngle: null,
            rotationAccumulated: 0,
            rotationDirection: null,
            rotationRounds: 0,
            rotationSequence: [],
            rotationCompleted: false,
            wrongDirectionStarted: false,
            currentTrial: currentTrial,
            stepStartTime: null,
            // Facet tapping state
            facets: [],
            currentFacetIndex: 0,
            tappedFacets: new Set(),
            facetSequence: []
        };
        
        const crystal = document.getElementById('crystal');
        crystal.style.transform = 'scale(1)';
        crystal.style.setProperty('--current-scale', 1);
        crystal.style.filter = 'none';
        crystal.classList.remove('active', 'shrinking', 'enlarging', 'success', 'tap-feedback', 'rotation-feedback', 'error-feedback');
        
        document.getElementById('crystal-size-display').textContent = '100%';
        document.getElementById('crystal-size-display').classList.remove('shrink-highlight', 'enlarge-highlight', 'completion-highlight');
        this.hidePressureIndicator();
        
        // Initialize facets for step 5
        if (this.currentCrystalStep === 5) {
            this.crystalState.facets = this.generateFacets();
            this.renderFacets();
        }
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
        
        // Initialize facets for step 5
        if (this.currentCrystalStep === 5) {
            this.crystalState.facets = this.generateFacets();
            this.renderFacets();
        }
    }

    
    getStepTitle(type) {
        const titles = {
            'tap': 'Finger Tapping',
            'rotate': 'One Finger Rotation',
            'pinch': 'Pinch to Shrink',
            'spread': 'Spread to Enlarge',
            'pressure': 'Three-Finger Pressure',
            'facet_tap': 'Crystal Facet Tapping'
        };
        return titles[type] || 'Unknown';
    }
    
    getInitialProgress(type) {
        const progress = {
            'tap': '0/3',
            'rotate': '0/3',
            'pinch': '100% → 50%',
            'spread': '100% → 150%',
            'pressure': '0s / 3s',
            'facet_tap': '0/25'
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
                stepStatus.textContent = 'Teal highlight! STRICT: Now rotate COUNTER-CLOCKWISE only for one full rotation';
            } else if (this.crystalState.rotationRounds === 2) {
                stepStatus.textContent = 'Second teal highlight! STRICT: Now rotate CLOCKWISE only for one full rotation';
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
        
        // In recordTouchEvent, update gesturePath and gesturePathLength
        const trialStep = `${data.trial || 1}_${data.step || 1}`;
        if (!this.gesturePath[trialStep]) {
            this.gesturePath[trialStep] = [];
            this.gesturePathLength[trialStep] = 0;
        }
        const x = Math.round(data.touches[0]?.clientX || 0);
        const y = Math.round(data.touches[0]?.clientY || 0);
        const last = this.gesturePath[trialStep][this.gesturePath[trialStep].length - 1];
        if (last) {
            const dx = x - last.x;
            const dy = y - last.y;
            this.gesturePathLength[trialStep] += Math.sqrt(dx * dx + dy * dy);
        }
        this.gesturePath[trialStep].push({ x, y });
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
            const newScale = Math.max(1, Math.min(3.0, this.galleryZoom.scale * change));
            // Adjust translation to keep the zoom centered on pinch midpoint

            if (newScale <= 1.1) {
                // Trigger zoom reset if user pinches out
                this.resetZoom();
                return;
            }
            const ctr = document.querySelector('.popup-image-container');
            const img = document.querySelector('.popup-image');
            if (img && ctr) {
                const rect = ctr.getBoundingClientRect();
                const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
                const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
                const scaleChange = newScale / this.galleryZoom.scale;
                this.galleryZoom.translateX = (this.galleryZoom.translateX - midX) * scaleChange + midX;
                this.galleryZoom.translateY = (this.galleryZoom.translateY - midY) * scaleChange + midY;
            }
            this.galleryZoom.scale = newScale;
            this.galleryZoom.initialDistance = dist;
            this.updateImageTransform();
            this.updateZoomLevel();
            if (this.galleryZoom.scale > 1) {
                this.galleryZoom.isPanning = true;
            }
        }
        else if (e.touches.length === 1 && this.galleryZoom.isPanning && this.galleryZoom.scale > 1) {
            // single-finger pan after zoom
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
            // Do not auto-reset zoom or translation after pinch in
            if (this.galleryZoom.scale > 1.0) {
                this.galleryZoom.isPanning = true;
            } 
            else {
                this.resetZoom();
            }
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
            // If two fingers, start pinch
            if (e.touches.length === 2) {
                this.galleryZoom.isPinching = true;
                this.galleryZoom.initialDistance = this.getDistance(e.touches[0], e.touches[1]);
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
        const features = this.extractKeystrokeFeatures();
        const csv = this.convertToCSV(features);
        const filename = `${this.participantId}_keystroke.csv`;
    
        this.uploadCSVToGoogleDrive(csv, filename);
    
        document.getElementById('keystroke-count').textContent = this.keystrokeData.length;
        document.getElementById('keystroke-features').textContent = '9'; // 9 features: participant_id, task_id, timestamp_ms, ref_char, touch_x, touch_y, was_deleted, flight_time_ms, browser_name
    }

    
    exportTouchData() {
        const features = this.extractTouchFeatures();
        const csv = this.convertToCSV(features);
        const filename = `${this.participantId}_touch.csv`;

        this.uploadCSVToGoogleDrive(csv, filename);
    
        document.getElementById('touch-count').textContent = this.touchData.length;
        document.getElementById('touch-features').textContent = '11'; // 11 features: participant_id, task_id, trial, timestamp_ms, touch_x, touch_y, btn_touch_state, inter_touch_timing, num_touch_points, path_length_px, browser_name
    }

    // ENHANCED: Keystroke feature extraction with device model and browser name as separate columns
    extractKeystrokeFeatures() {
        const features = [];
        
        this.keystrokeData.forEach((keystroke, index) => {
            if (keystroke.type === 'keydown' || keystroke.type === 'keyup' || keystroke.type === 'insertText' || keystroke.type === 'compositionend' || keystroke.type.startsWith('delete')) {
                let flightTime = keystroke.flightTime || 0;
                if (flightTime === 0 && index > 0) {
                    const timeDiff = keystroke.timestamp - this.keystrokeData[index - 1].timestamp;
                    flightTime = Math.max(0, Math.round(timeDiff));
                    if (timeDiff < 0) {
                        console.warn(`⚠️ Negative flight time detected: ${timeDiff}ms between "${this.keystrokeData[index - 1].actualChar}" and "${keystroke.actualChar}". Setting to 0.`);
                    }
                }
                const wasDeleted = (keystroke.actualChar === 'BACKSPACE' || keystroke.type.startsWith('delete')) ? 1 : 0;
                let refChar = keystroke.actualChar || 'unknown';
                if (keystroke.isSynthetic && keystroke.actualChar === 'SHIFT') {
                    refChar = 'SHIFT';
                } else if (keystroke.actualChar && keystroke.actualChar.length === 1) {
                    refChar = keystroke.actualChar;
                }
                features.push({
                    participant_id: this.participantId,
                    task_id: 1,
                    timestamp_ms: Math.round(keystroke.timestamp),
                    ref_char: refChar,
                    touch_x: Math.round(keystroke.clientX || this.currentPointerX),
                    touch_y: Math.round(keystroke.clientY || this.currentPointerY),
                    was_deleted: wasDeleted,
                    flight_time_ms: flightTime,
                    browser_name: this.deviceInfo.browser_name  // Column 10
                });
            }
        });
        return features;
    }

    // RELIABLE: Touch feature extraction with device model and browser name as separate columns
    extractTouchFeatures() {
        const features = [];
        this.touchData.forEach((touch, index) => {
            let task_step_label = '';
            if (touch.taskId === 2) {
                task_step_label = `1(${touch.step || 1})`;
            } else if (touch.taskId === 3) {
                task_step_label = '2';
            } else {
                task_step_label = '';
            }
            const baseFeature = {
                participant_id: this.participantId,
                task_id: task_step_label,
                trial: touch.trial || 1,
                timestamp_ms: Math.round(touch.timestamp),
                touch_x: Math.round(touch.touches[0]?.clientX || 0),
                touch_y: Math.round(touch.touches[0]?.clientY || 0),
                btn_touch_state: touch.type,
                inter_touch_timing: index > 0 ? Math.round(touch.timestamp - this.touchData[index - 1].timestamp) : 0,
                num_touch_points: Array.isArray(touch.touches) ? touch.touches.length : 1,
                path_length_px: this.gesturePathLength[`${touch.trial || 1}_${touch.step || 1}`] || 0,
                browser_name: this.deviceInfo.browser_name  // Column 10
            };
            features.push(baseFeature);
        });
        return features;
    }
    
    convertToCSV(data) {
        if (data.length === 0) return 'No data available';
    
        const headers = Object.keys(data[0]);
    
        const escapeCsv = value => {
            if (typeof value === 'string') {
                // Escape inner double quotes by doubling them
                const escaped = value.replace(/"/g, '""');
                // Wrap everything in double quotes (safe even for apostrophes or commas)
                return `"${escaped}"`;
            }
            return value;
        };
    
        const csvContent = [
            headers.join(','), // header row
            ...data.map(row => 
                headers.map(header => escapeCsv(row[header])).join(',')
            )
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

    showCopyBlockedFeedback() {
        // Show visual feedback when copy/paste is blocked
        const typingInput = document.getElementById('typing-input');
        if (typingInput) {
            typingInput.classList.add('copy-blocked');
            setTimeout(() => {
                typingInput.classList.remove('copy-blocked');
            }, 500);
        }
        
        // Also show feedback on sentence display if it was targeted
        const sentenceDisplay = document.querySelector('.sentence-display');
        if (sentenceDisplay) {
            sentenceDisplay.classList.add('copy-blocked');
            setTimeout(() => {
                sentenceDisplay.classList.remove('copy-blocked');
            }, 500);
        }
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

    // Facet tapping helper methods
    findTappedFacet(touchX, touchY) {
        const crystalArea = document.getElementById('crystal-area');
        const rect = crystalArea.getBoundingClientRect();
        const relativeX = touchX - rect.left;
        const relativeY = touchY - rect.top;
        
        // Find which facet was tapped
        for (const facet of this.crystalState.facets) {
            const distance = Math.sqrt(
                Math.pow(relativeX - facet.x, 2) + 
                Math.pow(relativeY - facet.y, 2)
            );
            
            if (distance <= facet.radius) {
                return facet;
            }
        }
        
        return null;
    }
    
    highlightFacet(facet, type) {
        // Remove existing facet elements
        const existingFacets = document.querySelectorAll('.crystal-facet');
        existingFacets.forEach(el => el.remove());
        
        // Create new facet element with appropriate styling
        const facetElement = document.createElement('div');
        facetElement.className = `crystal-facet ${type}`;
        facetElement.style.left = `${facet.x - facet.radius}px`;
        facetElement.style.top = `${facet.y - facet.radius}px`;
        facetElement.style.width = `${facet.radius * 2}px`;
        facetElement.style.height = `${facet.radius * 2}px`;
        
        const crystalArea = document.getElementById('crystal-area');
        crystalArea.appendChild(facetElement);
        
        // Remove highlight after animation
        setTimeout(() => {
            if (facetElement.parentNode) {
                facetElement.remove();
            }
        }, 500);
    }
    
    highlightNextFacet() {
        if (this.crystalState.currentFacetIndex < this.crystalState.facets.length) {
            const nextFacet = this.crystalState.facets[this.crystalState.currentFacetIndex];
            
            // Remove existing highlights
            const existingHighlights = document.querySelectorAll('.facet-highlight');
            existingHighlights.forEach(el => el.remove());
            
            // Create highlight for next facet
            const highlight = document.createElement('div');
            highlight.className = 'facet-highlight';
            highlight.style.left = `${nextFacet.x - nextFacet.radius - 4}px`;
            highlight.style.top = `${nextFacet.y - nextFacet.radius - 4}px`;
            highlight.style.width = `${(nextFacet.radius + 4) * 2}px`;
            highlight.style.height = `${(nextFacet.radius + 4) * 2}px`;
            
            const crystalArea = document.getElementById('crystal-area');
            crystalArea.appendChild(highlight);
        }
    }
    
    renderFacets() {
        // Remove existing facets
        const existingFacets = document.querySelectorAll('.crystal-facet, .facet-highlight');
        existingFacets.forEach(el => el.remove());
        
        // Render all facets
        this.crystalState.facets.forEach(facet => {
            const facetElement = document.createElement('div');
            facetElement.className = 'crystal-facet';
            
            if (facet.tapped) {
                facetElement.classList.add('tapped');
            } else if (facet.sequence === this.crystalState.currentFacetIndex) {
                facetElement.classList.add('active');
            }
            
            facetElement.style.left = `${facet.x - facet.radius}px`;
            facetElement.style.top = `${facet.y - facet.radius}px`;
            facetElement.style.width = `${facet.radius * 2}px`;
            facetElement.style.height = `${facet.radius * 2}px`;
            
            const crystalArea = document.getElementById('crystal-area');
            crystalArea.appendChild(facetElement);
        });
        
        // Highlight next facet
        this.highlightNextFacet();
    }
}
// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new BiometricDataCollector();
});
