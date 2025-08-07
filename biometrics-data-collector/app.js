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
        
        // Inactivity tracking
        this.inactivityTimer = null;
        this.inactivityTimeout = 3 * 60 * 1000; // 3 minutes in milliseconds
        this.lastActivityTime = Date.now();
        this.autoCapitalizeNext = false;
        this.userShiftOverride = false; // track if user toggled shift
        this.capsLockEnabled = false; // Track Caps Lock state
        this.shiftTimestamps = []; // Track Shift press timestamps


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
        

        this.lastSpaceTime = 0;
        this.lastCharTime = 0;
        this.lastChar = null;
        this.previousChar = null;
        this.lastCapitalLetterTime = 0;
        this.capitalLetterCount = 0; // Track capital letters for debugging
        this.lastRecordedKeystroke = null; // Track last recorded keystroke to prevent duplicates
        
        if (this.isIOS) {
            this.spaceCooldown = 300;
            this.charCooldown = 50;
        } else if (this.isAndroid) {
            this.spaceCooldown = 250;
            this.charCooldown = 30;
            this.lastBackspaceType = '';
        } else {
            this.spaceCooldown = 200;
            this.charCooldown = 20;
        }
        
        this.lastInputValue = '';
        this.inputEventCount = 0;
        this.lastInputEvent = null;
        this.lastInputEventTime = 0;
        this.inputEventCooldown = this.isIOS ? 50 : 30;
        
        // iOS-specific deduplication tracking
        this.iOSInputHistory = [];
        this.iOSLastProcessedEvent = null;
        
        this.lastKeystrokeTime = 0;
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
            zoomPersistent: false
        };
        
        // Typing task data
        this.sentences = [
            "Dr. Smith's Lab-42 discovered H2O molecules can freeze at -5 degree Celsius under pressure.",
            "The CEO's Q3 report showed $2.8M profit and 15% growth across all divisions.",
            "Agent X-007 decoded the message: 'Meet @ Pier 9 on July 4th at 3:30 PM.'",
            "Tesla's Model S hit 0-60 mph in 2.1 seconds - breaking the previous record!"
        ];
        
        this.crystalSteps = [
            { id: 1, instruction: "Tap the crystal exactly 3 times with your finger. Each tap will make the crystal glow. Complete all 3 taps to proceed.", target: 3, type: 'tap' },
            { id: 2, instruction: "Touch the crystal, then rotate your finger CLOCKWISE in a complete circle. After the teal glow, rotate COUNTER-CLOCKWISE in a complete circle. After the second teal glow, rotate CLOCKWISE again in a complete circle. Complete all 3 rotations to proceed.", target: 3, type: 'rotate' },
            { id: 3, instruction: "Place two fingers on the crystal and pinch them together to shrink the crystal to 50% of its original size. The crystal will glow when you reach the target size.", target: 0.5, type: 'pinch' },
            { id: 4, instruction: "Place two fingers on the crystal and spread them apart to enlarge the crystal to 150% of its original size. The crystal will glow when you reach the target size.", target: 1.5, type: 'spread' },
            { id: 5, instruction: "Tap the crystal facets in the exact order they light up (green dots). Follow the sequence carefully to activate all 10 facets. Each correct tap will make the facet glow blue.", target: 10, type: 'facet_tap' }
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
            rotationCompleted: false,
            wrongDirectionStarted: false,
            currentTrial: 1,
            stepStartTime: null,
            facets: [],
            currentFacetIndex: 0,
            tappedFacets: new Set(),
            facetSequence: []
        };
        
        // Touch tracking for scroll detection
        this.crystalTouchStart = null;
        
        // Generate 20 unique random images for each session
        const randomSeeds = Array.from({length: 20}, () => Math.floor(Math.random() * 1000000));
        this.galleryImages = randomSeeds.map(seed => `https://picsum.photos/seed/${seed}/800/600`);
        

        this.gesturePath = {};
        this.gesturePathLength = {};
        
        this.deviceInfo = this.detectDeviceInfo();
        
        this.init();

        // In the BiometricDataCollector class constructor, add:
        this.firstFrameTouches = [];
        this.firstFrameHeatmap = [];
        this.firstFrameOverlapVectors = [];
        // 1. In the BiometricDataCollector constructor, add dwell tracking:
        this.keyDwellStartTimes = {};

        // In constructor, add hand detection state:
        this.handDetectionData = {
            leftHandKeys: ['q', 'w', 'e', 'r', 't', 'a', 's', 'd', 'f', 'g', 'z', 'x', 'c', 'v', 'b'],
            rightHandKeys: ['y', 'u', 'i', 'o', 'p', 'h', 'j', 'k', 'l', 'n', 'm'],
            centerKeys: ['space', 'backspace', 'shift'],
            recentKeyPresses: [],
            recentTouchPositions: [],
            handUsageHistory: [],
            currentHandPrediction: 'unknown'
        };

    }
    
    // Update detectDeviceInfo to be async and use Client Hints if available
    async detectDeviceInfo() {
        let deviceModel = 'Unknown';
        let platform = 'Unknown';
        let platformVersion = 'Unknown';
        let browser_name = 'Unknown';
        let browser_version = 'Unknown';
        const userAgent = navigator.userAgent;

        // --- Browser detection (existing logic, keep as is) ---
        // Special handling for iOS browsers
        if (/CriOS/.test(userAgent)) {
            browser_name = 'Chrome';
            const match = userAgent.match(/CriOS\/(\d+\.\d+)/);
            if (match) browser_version = match[1];
        } else if (/FxiOS/.test(userAgent)) {
            browser_name = 'Firefox';
            const match = userAgent.match(/FxiOS\/(\d+\.\d+)/);
            if (match) browser_version = match[1];
        } else if (/EdgiOS/.test(userAgent)) {
            browser_name = 'Edge';
            const match = userAgent.match(/EdgiOS\/(\d+\.\d+)/);
            if (match) browser_version = match[1];
        } else if (/OPiOS/.test(userAgent)) {
            browser_name = 'Opera';
            const match = userAgent.match(/OPiOS\/(\d+\.\d+)/);
            if (match) browser_version = match[1];
        }
        // Enhanced Android browser detection
        else if (/Android/.test(userAgent)) {
            if (/EdgA\//.test(userAgent)) {
                browser_name = 'Edge';
                const match = userAgent.match(/EdgA\/(\d+\.\d+)/);
                if (match) browser_version = match[1];
            } else if (/OPR\//.test(userAgent)) {
                browser_name = 'Opera';
                const match = userAgent.match(/OPR\/(\d+\.\d+)/);
                if (match) browser_version = match[1];
            } else if (/SamsungBrowser\//.test(userAgent)) {
                browser_name = 'Samsung Internet';
                const match = userAgent.match(/SamsungBrowser\/(\d+\.\d+)/);
                if (match) browser_version = match[1];
            } else if (/Firefox\//.test(userAgent)) {
                browser_name = 'Firefox';
                const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
                if (match) browser_version = match[1];
            } else if (/Chrome\//.test(userAgent)) {
                browser_name = 'Chrome';
                const match = userAgent.match(/Chrome\/(\d+\.\d+)/);
                if (match) browser_version = match[1];
            } else if (/wv/.test(userAgent) || /Version\//.test(userAgent)) {
                browser_name = 'Android WebView';
                const match = userAgent.match(/Version\/(\d+\.\d+)/);
                if (match) browser_version = match[1];
            }
        }
        // Fallback to previous logic for other platforms
        else if (/Edg\//.test(userAgent)) {
            browser_name = 'Edge';
            const match = userAgent.match(/Edg\/(\d+\.\d+)/);
            if (match) browser_version = match[1];
        } else if (/OPR\//.test(userAgent)) {
            browser_name = 'Opera';
            const match = userAgent.match(/OPR\/(\d+\.\d+)/);
            if (match) browser_version = match[1];
        } else if (/Chrome\//.test(userAgent) && !/Edg\//.test(userAgent) && !/OPR\//.test(userAgent)) {
            browser_name = 'Chrome';
            const match = userAgent.match(/Chrome\/(\d+\.\d+)/);
            if (match) browser_version = match[1];
        } else if (/Firefox\//.test(userAgent)) {
            browser_name = 'Firefox';
            const match = userAgent.match(/Firefox\/(\d+\.\d+)/);
            if (match) browser_version = match[1];
        } else if (/Safari\//.test(userAgent) && !/Chrome\//.test(userAgent) && !/Edg\//.test(userAgent) && !/OPR\//.test(userAgent)) {
            browser_name = 'Safari';
            const match = userAgent.match(/Version\/(\d+\.\d+)/);
            if (match) browser_version = match[1];
        }

        // --- Device detection ---
        if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
            try {
                const values = await navigator.userAgentData.getHighEntropyValues(['model', 'platform', 'platformVersion']);
                if (values.model) deviceModel = values.model;
                if (values.platform) platform = values.platform;
                if (values.platformVersion) platformVersion = values.platformVersion;
            } catch (e) {
                // fallback below
            }
        }
        // Fallback for older browsers
        if (deviceModel === 'Unknown') {
            // Try to extract model from user agent (may be generic)
            const modelMatch = userAgent.match(/Android.*?;\s*([^)]+)\)/);
            if (modelMatch) {
                deviceModel = modelMatch[1].split('Build')[0].trim();
            }
            if (/Android/.test(userAgent)) platform = 'Android';
            const versionMatch = userAgent.match(/Android (\d+(\.\d+)?)/);
            if (versionMatch) platformVersion = versionMatch[1];
        }

        let deviceInfo = {
            device_type: /iPad|iPhone|iPod/.test(userAgent) ? 'iOS' : /Android/.test(userAgent) ? 'Android' : 'Mobile',
            device_model: deviceModel,
            browser_name: browser_name,
            browser_version: browser_version,
            os_name: platform,
            os_version: platformVersion,
            platform: `${deviceModel} (${browser_name})`
        };
        console.log('Device Info:', deviceInfo);
        return deviceInfo;
    }
    
    // In constructor and init, update to await this.detectDeviceInfo()
    // ... existing code ...
    async init() {
        this.deviceInfo = await this.detectDeviceInfo();
        this.bindEvents();
        this.generateParticipantId();
        this.initializeGallery();
        this.setupPointerTracking();
        this.updateTaskLocks();
        this.setupInactivityTracking();
    }
// ... existing code ...
    // In constructor, call this.init() as before (no change needed)

    setupPointerTracking() {
        // Modern cursor logic from provided code
        document.addEventListener('mousemove', (e) => {
            this.currentPointerX = e.clientX;
            this.currentPointerY = e.clientY;
            this.pointerTracking = {
                x: e.clientX,
                y: e.clientY,
                timestamp: performance.now()
            };
        });
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                this.currentPointerX = touch.clientX;
                this.currentPointerY = touch.clientY;
                this.pointerTracking = {
                    x: touch.clientX,
                    y: touch.clientY,
                    timestamp: performance.now()
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
                    y: touch.clientY,
                    timestamp: performance.now()
                };
            }
        });
        document.addEventListener('touchend', (e) => {
            if (e.changedTouches.length > 0) {
                const touch = e.changedTouches[0];
                this.pointerTracking = {
                    x: touch.clientX,
                    y: touch.clientY,
                    timestamp: performance.now()
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

        const phoneModelElement = document.getElementById('phone-model');
        const browserNameElement = document.getElementById('browser-name');
        const deviceModelElement = document.getElementById('device-model');
        if (phoneModelElement) {
          phoneModelElement.textContent = this.deviceInfo.device_model;
        }
        if (browserNameElement) {
          browserNameElement.textContent = this.deviceInfo.browser_name;
        }
        if (deviceModelElement) {
          deviceModelElement.textContent = this.deviceInfo.device_model;
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
            this.startInactivityTimer(); // Start inactivity timer when study begins
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
            
            typingInput.addEventListener('compositionstart', function(e) {
                console.log('Composition started - monitoring for clipboard content');
            });
            
            typingInput.addEventListener('input', function(e) {
                if (isProgrammaticInput) {
                    // For programmatic input (custom keyboard), do not interfere with caret
                    this.lastInputValue = e.target.value;
                    return;
                }
                const currentValue = e.target.value;
                const previousValue = this.lastInputValue || '';
                if (currentValue.length > previousValue.length + 1) {
                    console.log('Potential paste detected - blocking');
                    e.target.value = previousValue;
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
            console.log('Composition ended:', e.data);
        });
        typingInput.addEventListener('input', (e) => {
            this.handleTypingInput(e);
            setTimeout(() => this.updateAutoCapState(), 0);
        });
        typingInput.addEventListener('keyup', (e) => {
            setTimeout(() => this.updateAutoCapState(), 0);
        });
        typingInput.addEventListener('click', (e) => {
            setTimeout(() => this.updateAutoCapState(), 0);
        });
        typingInput.addEventListener('focus', (e) => {
            setTimeout(() => this.updateAutoCapState(), 0);
        });
        
        // Remove keydown and keyup handlers to prevent duplicate recording
        // All keystroke recording is now handled in handleTypingInput
        typingInput.addEventListener('focus', (e) => {
            // Modern cursor logic from provided code
            const rect = e.target.getBoundingClientRect();
            this.currentPointerX = rect.left + rect.width / 2;
            this.currentPointerY = rect.top + rect.height / 2;
            this.pointerTracking.x = this.currentPointerX;
            this.pointerTracking.y = this.currentPointerY;
            this.updateAutoCapState();
        });
        typingInput.addEventListener('click', (e) => {
            // Modern cursor logic from provided code
            this.currentPointerX = e.clientX;
            this.currentPointerY = e.clientY;
            this.pointerTracking.x = e.clientX;
            this.pointerTracking.y = e.clientY;
            this.updateAutoCapState();
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
            const featureNames = keystrokeFeatures.length > 0 ? Object.keys(keystrokeFeatures[0]) : [];
            const keystrokeFeatureCount = featureNames.length;
            document.getElementById('keystroke-features').textContent = keystrokeFeatureCount;
            document.getElementById('keystroke-feature-list').textContent = featureNames.join(', ');
            const touchFeatures = this.extractTouchFeatures();
            const touchFeatureNames = touchFeatures.length > 0 ? Object.keys(touchFeatures[0]) : [];
            const touchFeatureCount = touchFeatureNames.length;
            document.getElementById('touch-features').textContent = touchFeatureCount;
            document.getElementById('touch-feature-list').textContent = touchFeatureNames.join(', ');
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
                // Position the gallery button right after the Reset Current Step button
                const crystalControls = document.querySelector('.crystal-controls');
                if (crystalControls) {
                    // Insert the button right after the reset button to keep them in the same row
                    const resetBtn = document.getElementById('reset-step-btn');
                    if (resetBtn) {
                        resetBtn.insertAdjacentElement('afterend', nextTaskBtn);
                    } else {
                        crystalControls.appendChild(nextTaskBtn);
                    }
                } else {
                    const crystalSection = document.getElementById('crystal-screen');
                    crystalSection.appendChild(nextTaskBtn);
                }
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
    
    handleTypingInput(e) {
        const { inputType, data } = e;
        const inputEl = e.target;
        const value = inputEl.value;
        const pos = inputEl.selectionStart || value.length;
        const timestamp = performance.now();
        const currentTime = performance.now();
        
        const eventSignature = `${inputType}-${data}-${value.length}-${pos}`;

        const inputValue = e.target.value;
        const caretPos = e.target.selectionStart;
        
        // iOS: Early duplicate detection before processing
        if (this.isIOS && data && inputType === 'insertText') {
            const currentTime = performance.now();
            
            // Check if this exact event was processed recently
            if (this.iOSLastProcessedEvent && 
                this.iOSLastProcessedEvent.signature === eventSignature &&
                (currentTime - this.iOSLastProcessedEvent.timestamp) < 100) {
                console.log('🚫 iOS early duplicate BLOCKED:', data, 'signature:', eventSignature);
                return;
            }
            
            // Update last processed event
            this.iOSLastProcessedEvent = {
                signature: eventSignature,
                timestamp: currentTime
            };
        }
        
        // Enhanced iOS deduplication for input events
        if (data && inputType === 'insertText') {
        
            // Quote deduplication logic (preserve your existing code)
            const isQuote = data === "'" || data === "`" || data === '´' || data === '′' || data === '‵' ||
                             data === '"' || data === '„' || data === '‟' || data === '″' || data === '‶';
            
            if (isQuote) {
                console.log('🔍 Quote input detected:', data, 'charCode:', data.charCodeAt(0), 'type:', inputType);
            }
            
            // iOS: More aggressive deduplication
            if (this.isIOS) {
                const dedupWindow = isQuote ? 50 : 150; // Longer window for iOS
                if (this.lastInputEvent === eventSignature && 
                    this.lastInputEventTime && 
                    (currentTime - this.lastInputEventTime) < dedupWindow) {
                    console.log('🚫 iOS duplicate input event BLOCKED:', data, 'time since last:', currentTime - this.lastInputEventTime, 'ms');
                    return;
                }
                
                // Additional check for rapid character input
                if (this.lastChar === data && this.lastCharTime && 
                    (currentTime - this.lastCharTime) < 100) {
                    console.log('🚫 iOS rapid character input BLOCKED:', data, 'time since last:', currentTime - this.lastCharTime, 'ms');
                    return;
                }
            } else if (this.isAndroid) {
                const dedupWindow = isQuote ? 30 : 100;
                if (this.lastInputEvent === eventSignature && 
                    this.lastInputEventTime && 
                    (currentTime - this.lastInputEventTime) < dedupWindow) {
                    console.log('🚫 Android duplicate input event BLOCKED:', data, 'time since last:', currentTime - this.lastInputEventTime, 'ms');
                    return;
                }
            }
        }
        
        
        this.lastInputValue = value;
        this.lastInputLength = value.length;
        this.lastInputEvent = eventSignature;
        this.lastInputEventTime = currentTime;
        this.inputEventCount++;

                // Check for . + space sequence to set autoCapitalizeNext flag
        const lastTwo = inputValue.slice(-2);
        if (lastTwo === '. ') {
            this.autoCapitalizeNext = true;
        }
        
        // Capitalize just the next letter after ". " unless shift was clicked
        if (this.autoCapitalizeNext && data && inputType === 'insertText' && data.length === 1 && data.match(/[a-z]/)) {
            const before = inputValue.substring(0, caretPos - 1);
            const after = inputValue.substring(caretPos);
            e.target.value = before + data.toUpperCase() + after;
            this.autoCapitalizeNext = false;
            return;
        }

        
        if (data && inputType === 'insertText') {
            console.log(`📱 Mobile input event: "${data}" | Event #${this.inputEventCount} | Platform: ${this.isIOS ? 'iOS' : this.isAndroid ? 'Android' : 'Desktop'}`);
        }

        // --- SPACE, SHIFT, BACKSPACE LOGIC FROM PROVIDED CODE ---
        // Handle SPACE
        if (data === ' ') {
                    this.recordKeystroke({
                timestamp,
                actualChar: 'SPACE',
                refChar: 'SPACE',
                keyCode: 32,
                        type: inputType,
                        sentence: this.currentSentence,
                position: pos - 1,
                        clientX: Math.round(this.pointerTracking.x || this.currentPointerX),
                        clientY: Math.round(this.pointerTracking.y || this.currentPointerY)
                    });
            this.lastChar = 'SPACE';
            this.lastCharTime = timestamp;
            console.log(`✅ SPACE recorded (${this.isIOS ? 'iOS' : this.isAndroid ? 'Android' : 'Desktop'}): cooldown: ${this.spaceCooldown} ms`);
            this.calculateAccuracy();
            this.checkSentenceCompletion();
            this.updateTypingFeedback();
            return;
        }
    
        // Handle BACKSPACE - Record every backspace press
        if (inputType && inputType.startsWith('delete')) {
            this.recordKeystroke({
                timestamp,
                actualChar: 'BACKSPACE',
                keyCode: 8,
                type: inputType,
                sentence: this.currentSentence,
                position: pos,
                clientX: Math.round(this.pointerTracking.x || this.currentPointerX),
                clientY: Math.round(this.pointerTracking.y || this.currentPointerY)
            });
            console.log('✅ Backspace recorded (every press)');
            this.calculateAccuracy();
            this.checkSentenceCompletion();
            this.updateTypingFeedback();
            this.updateAutoCapState();
            return;
        }


                // Handle capital letters - record directly without SHIFT or † symbol
        if (data && data.length === 1 && data.match(/[A-Z]/)) {
            this.capitalLetterCount++;
            console.log(`🔤 Capital letter #${this.capitalLetterCount} detected: ${data} on ${this.isIOS ? 'iOS' : this.isAndroid ? 'Android' : 'Desktop'}`);
            
            this.recordKeystroke({
                timestamp,
                actualChar: data,
                keyCode: data.charCodeAt(0),
                type: inputType,
                sentence: this.currentSentence,
                position: pos - 1,
                clientX: Math.round(this.pointerTracking.x || this.currentPointerX),
                clientY: Math.round(this.pointerTracking.y || this.currentPointerY)
            });
            this.lastChar = data;
            this.lastKeystrokeTime = timestamp;
            this.calculateAccuracy();
            this.checkSentenceCompletion();
            this.updateTypingFeedback();
            return;
        }


        // Handle text insertion
        else if (inputType === 'insertText' && data) {
            for (let i = 0; i < data.length; i++) {
                const char = data[i];
                const posOffset = pos - data.length + i;
                
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
                    refChar = char; // Store as-is for $, €, £, ¥
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
                
                                // Check if character should be recorded (simplified deduplication)
                // For quotes, use more lenient deduplication
                const isQuote = refChar === "'" || refChar === '"';
                if (this.shouldRecordChar(refChar, timestamp + i, isQuote)) {
                    
                    console.log('📝 Recording keystroke:', refChar, 'type:', inputType, 'timestamp:', timestamp + i);
                        this.recordKeystroke({
                        timestamp: timestamp + i,
                            actualChar: refChar,
                        keyCode: char.charCodeAt(0),
                            type: inputType,
                            sentence: this.currentSentence,
                        position: pos - data.length + i,
                            clientX: Math.round(this.pointerTracking.x || this.currentPointerX),
                            clientY: Math.round(this.pointerTracking.y || this.currentPointerY)
                        });
                        
                    // Update last character and time for mobile deduplication
                        this.lastChar = refChar;
                    this.lastCharTime = timestamp + i;
                } else {
                    console.log('❌ Character duplicate ignored:', refChar);
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

            if (data === "'" || data === "'" || data === "'" || data === "'" || data === "'" || data === "'" || data === '`' || data === '´' || data === '′' || data === '‵') {
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
                refChar = char; // Store as-is for $, €, £, ¥
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
            }
            
            // Debug logging for quote characters
            if (data === "'" || data === "'" || data === "'" || data === "'" || data === "'" || data === "'" || data === '`' || data === '´' || data === '′' || data === '‵' || data === '"' || data === '"' || data === '"' || data === '"' || data === '"' || data === '"' || data === '„' || data === '‟' || data === '″' || data === '‶') {
                console.log('🔍 Quote processing complete (other input) - Final refChar:', refChar);
            }
            
                        // Check if character should be recorded (simplified deduplication)
            // For quotes, use more lenient deduplication
            const isQuote = refChar === "'" || refChar === '"';
            // In your character processing loop:
            if (char.match(/[a-z]/)) {
                if (this.capsLockEnabled) {
                    // Caps lock is on - make uppercase
                    char = char.toUpperCase();
                } else if (this.autoCapitalizeNext && !this.userShiftOverride) {
                    // Auto-capitalize after period
                    char = char.toUpperCase();
                    this.autoCapitalizeNext = false;
                } else if (this.userShiftOverride) {
                    // User pressed shift once
                    char = char.toUpperCase();
                    this.userShiftOverride = false; // Reset after use
                }
            }

            if (this.shouldRecordChar(refChar, timestamp, isQuote)) {
                
                console.log('📝 Recording keystroke (other input):', refChar, 'type:', inputType, 'timestamp:', timestamp);
                    this.recordKeystroke({
                        timestamp: timestamp,
                        actualChar: refChar,
                        keyCode: data.charCodeAt(0),
                        type: inputType,
                        sentence: this.currentSentence,
                        position: pos - 1,
                        clientX: Math.round(this.pointerTracking.x || this.currentPointerX),
                        clientY: Math.round(this.pointerTracking.y || this.currentPointerY)
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
        this.updateTypingFeedback();
        // Always update auto-cap state after any input
        this.updateAutoCapState();
        
        // Update hand usage display
        this.updateHandUsageDisplay();
    }




    setKeyboardCaps(isCaps) {
        const keys = document.querySelectorAll('.key[data-key]');
        keys.forEach(key => {
            const keyValue = key.getAttribute('data-key');
            if (keyValue && keyValue.length === 1 && /[a-z]/i.test(keyValue)) {
                // If Caps Lock is enabled, always show uppercase
                key.textContent = (this.capsLockEnabled || isCaps) ? keyValue.toUpperCase() : keyValue.toLowerCase();
            }
        });
    }



    updateKeyboardDisplay() {
        if (this.capsLockEnabled) {
            this.setKeyboardCaps(true);
        } else if (this.autoCapitalizeNext && !this.userShiftOverride) {
            this.setKeyboardCaps(true);
        } else if (this.userShiftOverride) {
            this.setKeyboardCaps(true);
        } else {
            this.setKeyboardCaps(false);
        }
    }


    
    updateTypingFeedback() {
        // Feedback system logic from provided code
        const typed = document.getElementById('typing-input').value;
        const target = this.sentences[this.currentSentence];
        const feedbackDisplay = document.getElementById('typing-feedback-display');
        if (!feedbackDisplay || !target) return;
        let feedbackHTML = '';
        for (let i = 0; i < target.length; i++) {
            if (i < typed.length) {
                if (typed[i] === target[i]) {
                    feedbackHTML += `<span class="typed-correct">${this.escapeHtml(target[i])}</span>`;
                } else {
                    feedbackHTML += `<span class="typed-incorrect">${this.escapeHtml(target[i])}</span>`;
                }
            } else {
                feedbackHTML += `<span class="to-type">${this.escapeHtml(target[i])}</span>`;
            }
        }
        for (let i = target.length; i < typed.length; i++) {
            feedbackHTML += `<span class="typed-incorrect">${this.escapeHtml(typed[i])}</span>`;
        }
        feedbackDisplay.innerHTML = feedbackHTML;
        // Always update feedback container activation
        const feedbackContainer = document.querySelector('.typing-feedback-container');
        if (feedbackContainer) {
            if (typed === target && this.calculateAccuracy() === 100) {
                feedbackContainer.classList.add('activated');
            } else {
                feedbackContainer.classList.remove('activated');
            }
        }
    }
    escapeHtml(text) {
        // Helper from provided code
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    normalizeCharacter(char) {
        // Normalize all euro and pound variants to the correct symbol
        if (char === '€' || char === '\u20AC') {
            return '§';
        } else if (char === '£' || char === '\u00A3') {
            return '¶';
        }
        if (char === "'" || char === "'" || char === "'" || char === "'" || char === "'" || char === "'" || char === '`' || char === '´' || char === '′' || char === '‵') {
            return "'";
        } else if (char === '"' || char === '"' || char === '"' || char === '"' || char === '"' || char === '"' || char === '„' || char === '‟' || char === '″' || char === '‶') {
            return '"';
        } else if (char === '-' || char === '–' || char === '—') {
            return '-';
        } else if (char === '.' || char === '…') {
            return '.';
        } else if (char === ',' || char === '،') {
            return ',';
        } else if (char === '!' || char === '¡') {
            return '!';
        } else if (char === '?' || char === '¿') {
            return '?';
        } else if (char === '@') {
            return '@';
        } else if (char === '#') {
            return '#';
        } else if (char === '$' || char === '€' || char === '£' || char === '¥') {
            return char; // Store as-is for $, €, £, ¥
        } else if (char === '%') {
            return '%';
        } else if (char === '&') {
            return '&';
        } else if (char === '*') {
            return '*';
        } else if (char === '(') {
            return '(';
        } else if (char === ')') {
            return ')';
        } else if (char === '+' || char === '±') {
            return '+';
        } else if (char === '=' || char === '≠') {
            return '=';
        } else if (char === '[' || char === '【') {
            return '[';
        } else if (char === ']' || char === '】') {
            return ']';
        } else if (char === '{' || char === '｛') {
            return '{';
        } else if (char === '}' || char === '｝') {
            return '}';
        } else if (char === '\\' || char === '＼') {
            return '\\';
        } else if (char === '|' || char === '｜') {
            return '|';
        } else if (char === ';' || char === '；') {
            return ';';
        } else if (char === ':' || char === '：') {
            return ':';
        } else if (char === '/' || char === '／') {
            return '/';
        } else if (char === '<' || char === '＜') {
            return '<';
        } else if (char === '>' || char === '＞') {
            return '>';
        } else if (char === '`' || char === '｀') {
            return '`';
        } else if (char === '~' || char === '～') {
            return '~';
        } else if (char === '^' || char === '＾') {
            return '^';
        } else if (char === '_' || char === '＿') {
            return '_';
        } else if (char === '°' || char === '℃' || char === '℉') {
            return '°';
        } else if (char === '©' || char === '®' || char === '™') {
            return char;
        } else if (char === '§' || char === '¶') {
            return char;
        } else if (char === '†' || char === '‡') {
            return char;
        } else if (char === '•' || char === '·' || char === '▪' || char === '▫') {
            return '•';
        } else if (char === '✓' || char === '✔' || char === '☑') {
            return '✓';
        } else if (char === '✗' || char === '✘' || char === '☒') {
            return '✗';
        } else if (char === '→' || char === '←' || char === '↑' || char === '↓') {
            return char;
        } else if (char === '♠' || char === '♥' || char === '♦' || char === '♣') {
            return char;
        } else if (char === '☺' || char === '☻' || char === '☹') {
            return char;
        } else if (char === '☀' || char === '☁' || char === '☂' || char === '☃') {
            return char;
        } else if (char === '♫' || char === '♪' || char === '♬') {
            return char;
        } else if (char === '∞' || char === '≈' || char === '≤' || char === '≥') {
            return char;
        } else if (char === '∑' || char === '∏' || char === '∫' || char === '√') {
            return char;
        } else if (char === 'α' || char === 'β' || char === 'γ' || char === 'δ') {
            return char;
        } else if (char === 'π' || char === 'μ' || char === 'σ' || char === 'τ') {
            return char;
        } else {
            return char;
        }
    }
    
    getActualTypedCharacter(e, inputValue = '') {
        if (e.keyCode === 229 || e.key === 'Unidentified' || e.key === 'Process') {
            if (inputValue.length > this.lastInputLength) {
                return inputValue.slice(-1);
            }
            return null;
        }
    
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
            '€':            '§',         // Euro replaced with section sign
            '£':            '¶',         // Pound replaced with pilcrow
            '¥':            '¥',         // Yen
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
    
    // handleKeydown and handleKeyup methods removed to prevent duplicate keystroke recording
    // All keystroke recording is now handled in handleTypingInput method
    
    startTypingTask() {
        this.currentSentence = 0;
        
        this.lastInputLength = 0;
        this.previousChar = null;
        this.lastSpaceTime = 0;
        this.lastCharTime = 0;
        this.lastChar = null;
        this.lastCapitalLetterTime = 0;
        this.capitalLetterCount = 0;
        this.lastRecordedKeystroke = null;
        
        this.lastInputValue = '';
        this.inputEventCount = 0;
        this.lastInputEvent = null;
        this.lastInputEventTime = 0;
        
        this.compositionActive = false;
        
        // Reset iOS-specific tracking
        this.iOSInputHistory = [];
        this.iOSLastProcessedEvent = null;
        
        this.displayCurrentSentence();
        this.updateTypingProgress();
        
        console.log(`🔍 Starting typing task (${this.isIOS ? 'iOS' : this.isAndroid ? 'Android' : 'Desktop'}) - Cooldown settings:`);
        console.log(`  Space: ${this.spaceCooldown}ms`);
        console.log(`  Characters: ${this.charCooldown}ms`);
        
        console.log('🔍 Quote handling test:');
        this.testQuoteHandling();
        
        console.log('🔍 Backspace handling test:');
        this.testBackspaceHandling();
    }
    
    displayCurrentSentence() {
        document.getElementById('target-sentence').textContent = this.sentences[this.currentSentence];
        const input = document.getElementById('typing-input');
        // Save caret position before clearing value
        const caretPos = input.selectionStart;
        input.value = '';
        // Restore caret to start (0) after clearing
        input.setSelectionRange(0, 0);
        input.focus();
        document.getElementById('sentence-progress').textContent = `${this.currentSentence + 1}/4`;
        const nextBtn = document.getElementById('next-sentence-btn');
        if (this.currentSentence === this.sentences.length - 1) {
            // Remove the button from the DOM entirely on the fourth sentence page
            if (nextBtn) nextBtn.remove();
            // If the fourth sentence is already completed with 100% accuracy, show the Next Task button
            const typed = document.getElementById('typing-input').value;
            const target = this.sentences[this.currentSentence];
            if (typed === target && this.calculateAccuracy() === 100) {
                this.showNextTaskButton('crystal', 'Crystal Forge Game');
            }
        } else {
            if (nextBtn) {
                nextBtn.disabled = true;
                nextBtn.style.display = 'inline-flex';
                nextBtn.style.backgroundColor = 'var(--color-secondary)';
                nextBtn.style.opacity = '0.5';
            }
        }
        this.updateTypingFeedback();
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
    
        const nextButton = document.getElementById('next-sentence-btn');
        const feedbackContainer = document.querySelector('.typing-feedback-container');
        
        if (nextButton && feedbackContainer) {
            if (accuracy === 100) {
                nextButton.disabled = false;
                nextButton.classList.remove('btn--disabled');
                nextButton.classList.add('activated');
                feedbackContainer.classList.add('activated');
            } else {
                nextButton.disabled = true;
                nextButton.classList.add('btn--disabled');
                nextButton.classList.remove('activated');
                feedbackContainer.classList.remove('activated');
            }
        }
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
        if (typed === target && accuracy === 100) {
            if (this.currentSentence === this.sentences.length - 1) {
                // Only remove the button, do not show next task here
                if (nextBtn) nextBtn.remove();
                // Always show Next Task button for Crystal Forge Game when 4th sentence is complete
                this.showNextTaskButton('crystal', 'Crystal Forge Game');
            } else {
                nextBtn.disabled = false;
                nextBtn.classList.add('next-task-btn--deep');
                nextBtn.textContent = 'Next Sentence (100% Accuracy Required)';
            }
        } else {
            if (nextBtn) {
                nextBtn.disabled = true;
                nextBtn.classList.remove('next-task-btn--deep');
                nextBtn.classList.remove('btn--disabled');
                nextBtn.classList.add('btn--primary');
                nextBtn.textContent = 'Next Sentence (100% Accuracy Required)';
                nextBtn.style.display = 'inline-flex';
            }
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
        // Enhanced iOS deduplication - check against actual recorded data
        const currentTime = performance.now();
        
        // Analyze hand usage for this keystroke
        const handUsage = this.analyzeHandUsage(data);
        data.handUsage = handUsage;
        
        if (this.isIOS) {
            // Skip deduplication for BACKSPACE
            if (data.actualChar === 'BACKSPACE') {
                console.log(`✅ iOS: BACKSPACE bypassing deduplication (always record)`);
            } else {
                // Check for duplicates in the last 10 keystrokes with a 200ms window
                const recentKeystrokes = this.keystrokeData.slice(-10);
                const duplicateFound = recentKeystrokes.some(ks => {
                    const timeDiff = currentTime - ks.timestamp;
                    return ks.actualChar === data.actualChar && 
                           ks.type === data.type && 
                           timeDiff < 200; // 200ms window for iOS
                });
                
                if (duplicateFound) {
                    console.log(`🚫 iOS FINAL CHECK: Duplicate keystroke BLOCKED: ${data.actualChar} (type: ${data.type})`);
                    return;
                }
            }
        } else {
            // Original deduplication for Android/Desktop
            if (this.lastRecordedKeystroke) {
                const timeDiff = currentTime - this.lastRecordedKeystroke.timestamp;
                const charDiff = data.actualChar === this.lastRecordedKeystroke.actualChar;
                const typeDiff = data.type === this.lastRecordedKeystroke.type;
                
                // If same character, same type, and within 50ms, it's likely a duplicate
                if (charDiff && typeDiff && timeDiff < 50) {
                    console.log(`🚫 Duplicate keystroke BLOCKED: ${data.actualChar} (${timeDiff}ms since last)`);
                    return;
                }
            }
        }
        
        if (['BACKSPACE', 'SPACE', 'ENTER', 'TAB', 'escape', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'delete', 'home', 'end'].includes(data.actualChar)) {
            console.log(`[DEBUG] Special key recorded:`, data);
        }
        
        if (data.actualChar === "'" || data.actualChar === '"') {
            console.log('[QUOTE] Keystroke captured:', data);
        }
        
        // Prevent recording synthetic events (no longer needed since we removed SHIFT/†)
        if (data.isSynthetic) {
            console.log('🚫 Synthetic event skipped:', data.actualChar);
            return;
        }
        // Enhanced flight time calculation
        let flightTime = 0;
        if (this.lastKeystrokeTime > 0) {
            flightTime = currentTime - this.lastKeystrokeTime;
            // Ensure flight time is not negative
            if (flightTime < 0) {
                console.warn(`⚠️ Negative flight time detected: ${flightTime}ms, setting to 0`);
                flightTime = 0;
            }
        }

        // Add flight time to the data
        data.flightTime = Math.round(flightTime);
        
        // Log flight time for debugging
        if (flightTime > 0) {
            console.log(`⏱️ Flight time: ${flightTime}ms from "${this.lastChar || 'start'}" to "${data.actualChar}"`);
        }

        // Handle character case data
        if (data.actualChar && data.actualChar !== 'BACKSPACE') {
            data.characterCase = this.getCharacterCase(data.actualChar);
        }

        // Update last keystroke time
        this.lastKeystrokeTime = currentTime;

        // Log specific events
        if (data.actualChar === "'" || data.actualChar === '"') {
            console.log('Recording keystroke with quote:', data.actualChar, 'type:', data.type);
        }
        if (data.actualChar === 'BACKSPACE') {
            console.log('Recording backspace keystroke:', data.type, 'timestamp:', data.timestamp);
        }


        this.keystrokeData.push(data);
        
        // Track this keystroke to prevent duplicates
        this.lastRecordedKeystroke = {
            timestamp: data.timestamp,
            actualChar: data.actualChar,
            type: data.type
        };
    }
    
    getCharacterCase(char) {
        if (char.length === 1) {
            if (char >= 'A' && char <= 'Z') return 'uppercase';
            if (char >= 'a' && char <= 'z') return 'lowercase';
        }
        return 'other';
    }
    

    
    getBackspaceStats() {
        const backspaces = this.keystrokeData.filter(k => k.actualChar === 'BACKSPACE');
        console.log('Backspace Statistics:');
        console.log('Total backspaces recorded:', backspaces.length);
        console.log('Backspace types:', [...new Set(backspaces.map(b => b.type))]);
        
        // Group backspaces by timestamp to detect rapid sequences
        const backspaceGroups = [];
        let currentGroup = [];
        
        backspaces.forEach((backspace, index) => {
            if (index === 0) {
                currentGroup.push(backspace);
            } else {
                const timeDiff = backspace.timestamp - backspaces[index - 1].timestamp;
                if (timeDiff < 500) { // Group backspaces within 500ms
                    currentGroup.push(backspace);
                } else {
                    if (currentGroup.length > 0) {
                        backspaceGroups.push([...currentGroup]);
                    }
                    currentGroup = [backspace];
                }
            }
        });
        
        if (currentGroup.length > 0) {
            backspaceGroups.push(currentGroup);
        }
        
        console.log('Backspace sequences:');
        backspaceGroups.forEach((group, index) => {
            console.log(`  Sequence ${index + 1}: ${group.length} backspaces in ${Math.round(group[group.length - 1].timestamp - group[0].timestamp)}ms`);
        });
        
        console.log('Backspace details:', backspaces);
        return backspaces;
    }
    
        shouldRecordChar(char, timestamp, isQuote = false) {
        const currentTime = performance.now();
    
        // Special handling for BACKSPACE - always allow it to be recorded
        if (char === 'BACKSPACE') {
            console.log(`✅ BACKSPACE always approved for recording (backspace press)`);
            return true;
        }
    
        // iOS: Enhanced deduplication for all characters except BACKSPACE
        if (this.isIOS) {
            // Check for recent duplicate keystrokes in the actual data
            const recentKeystrokes = this.keystrokeData.slice(-5);
            const duplicateFound = recentKeystrokes.some(ks => {
                const timeDiff = currentTime - ks.timestamp;
                return ks.actualChar === char && timeDiff < 10; // 10ms window for iOS (was 150)
            });
            
            if (duplicateFound) {
                console.log(`🚫 iOS duplicate BLOCKED: ${char} already recorded recently`);
                return false;
            }
            
            // Check iOS input history for duplicates
            const recentInputs = this.iOSInputHistory.slice(-3);
            const inputDuplicate = recentInputs.some(input => {
                const timeDiff = currentTime - input.timestamp;
                return input.char === char && timeDiff < 10; // 10ms window
            });
            
            if (inputDuplicate) {
                console.log(`🚫 iOS input history duplicate BLOCKED: ${char}`);
                return false;
            }
            
            // Additional check for rapid input events
            if (this.lastChar === char && this.lastCharTime) {
                const timeSinceLast = currentTime - this.lastCharTime;
                if (timeSinceLast < 10) { // 10ms cooldown for all characters on iOS (was 100)
                    console.log(`🚫 iOS rapid input BLOCKED: ${char} - time since last: ${timeSinceLast}ms`);
                    return false;
                }
            }
            
            // Update tracking variables
            this.lastChar = char;
            this.lastCharTime = currentTime;
            this.lastInputEvent = char;
            this.lastInputEventTime = currentTime;
            
            // Add to iOS input history
            this.iOSInputHistory.push({
                char: char,
                timestamp: currentTime
            });
            
            // Keep only last 10 entries
            if (this.iOSInputHistory.length > 10) {
                this.iOSInputHistory.shift();
            }
            
            console.log(`✅ iOS character approved for recording: ${char} at time: ${currentTime}`);
            return true;
        }
    
        // Android/Desktop: Keep existing cooldown logic
        // Determine deduplication window based on character type and platform
        let dedupWindow;
        if (char === 'SPACE') {
            dedupWindow = 10; // was this.spaceCooldown
        } else if (isQuote) {
            dedupWindow = 5; // was 20/30
        } else {
            dedupWindow = 5; // was this.charCooldown
        }
    
        // Enhanced Android capital letter deduplication
        if (this.isAndroid && char.match(/[A-Z]/)) {
            const recentKeystrokes = this.keystrokeData.slice(-5);
            const duplicateCapital = recentKeystrokes.find(ks => 
                ks.actualChar === char && 
                (currentTime - ks.timestamp) < 10 // was 250
            );
            if (duplicateCapital) {
                console.log(`🚫 Android capital letter duplicate BLOCKED in shouldRecordChar: ${char} already recorded`);
                return false;
            }
    
            // Use shorter cooldown for capital letters on Android
            dedupWindow = Math.min(dedupWindow, 10);
        }
    
        // General deduplication for Android/Desktop
        if (this.lastChar === char && this.lastCharTime) {
            const timeSinceLast = currentTime - this.lastCharTime;
            if (timeSinceLast < dedupWindow) {
                console.log(`🚫 Deduplication (${this.isAndroid ? 'Android' : 'Desktop'}): ${char} duplicate BLOCKED - time since last: ${timeSinceLast}ms (window: ${dedupWindow}ms)`);
                return false;
            }
        }
    
        // Platform-specific rapid input deduplication for Android
        if (this.isAndroid) {
            if (this.lastInputEvent === char && this.lastInputEventTime && (currentTime - this.lastInputEventTime) < 5) { // was 20
                console.log(`🚫 Android input event duplicate BLOCKED: ${char} - time since last: ${currentTime - this.lastInputEventTime}ms`);
                return false;
            }
        }
    
        // Synthetic capital letter deduplication for Android/Desktop
        const recentSynthetic = this.keystrokeData.slice(-3).find(ks => 
            ks.isSynthetic && ks.actualChar === char && ks.actualChar !== 'SHIFT' && 
            (currentTime - ks.timestamp) < 10 // was 500
        );
        if (recentSynthetic) {
            console.log(`🚫 Synthetic capital letter duplicate BLOCKED: ${char} already recorded synthetically`);
            return false;
        }
    
        // Update tracking variables for Android/Desktop
        this.lastChar = char;
        this.lastCharTime = currentTime;
        this.lastInputEvent = char;
        this.lastInputEventTime = currentTime;
    
        console.log(`✅ Character approved for recording (${this.isAndroid ? 'Android' : 'Desktop'}): ${char} at time: ${currentTime}, cooldown: ${dedupWindow}ms`);
        return true;
    }

    
    getCharStats() {
        const chars = this.keystrokeData.filter(k => k.actualChar && k.actualChar !== 'BACKSPACE' && k.actualChar !== 'SHIFT');
        console.log('Character Statistics:');
        console.log('Total characters recorded:', chars.length);
        console.log('Character types:', [...new Set(chars.map(c => c.type))]);
        
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
    
    testQuoteHandling() {
        console.log('🔍 Testing quote handling for mobile keyboards (Gboard, iOS):');
        
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
        
        const testChars = ["'", "'", "'", "'", "'", "'", "`", "´", "′", "‵", '"', '"', '"', '"', '"', '"', "„", "‟", "″", "‶"];
        console.log('Testing character detection:');
        testChars.forEach(char => {
            console.log(`  "${char}" (${char.charCodeAt(0)}) -> should be normalized`);
        });
        
        console.log('Quote deduplication windows:');
        console.log('  iOS input event dedup: 50ms (vs 300ms for others)');
        console.log('  iOS rapid input dedup: 100ms (vs 150ms for others)');
        console.log('  iOS composition dedup: 25ms (vs 50ms for others)');
        console.log('  iOS final keystroke dedup: 100ms (vs 300ms for others)');
        console.log('  Android input event dedup: 30ms (vs 100ms for others)');
        console.log('  shouldRecordChar dedup: 15-20ms (vs 30-40ms for others)');
        
        // Add capital letter debugging
        console.log('🔍 Capital letter debugging:');
        const capitalLetters = this.keystrokeData.filter(k => k.actualChar && k.actualChar.match(/[A-Z]/));
        console.log('Capital letters found in keystroke data:', capitalLetters.length);
        
        if (capitalLetters.length > 0) {
            console.log('Capital letter details:');
            capitalLetters.forEach((cap, i) => {
                console.log(`  Capital ${i + 1}: "${cap.actualChar}" at timestamp ${Math.round(cap.timestamp)}ms, type: ${cap.type}, synthetic: ${cap.isSynthetic || false}`);
            });
        }
        

        
        return quotes;
    }
    
    testBackspaceHandling() {
        console.log('🔍 Testing backspace handling:');
        
        const backspaces = this.keystrokeData.filter(k => k.actualChar === 'BACKSPACE');
        console.log('Backspaces found in keystroke data:', backspaces.length);
        
        if (backspaces.length > 0) {
            console.log('Backspace details:');
            backspaces.forEach((backspace, i) => {
                console.log(`  Backspace ${i + 1}: timestamp ${Math.round(backspace.timestamp)}ms, type: ${backspace.type}, synthetic: ${backspace.isSynthetic || false}`);
            });
        } else {
            console.log('❌ No backspaces found in keystroke data!');
        }
        
        // Test rapid backspace sequences
        console.log('Backspace deduplication settings:');
        console.log('  iOS: No deduplication (all backspaces recorded)');
        console.log('  Android/Desktop: Standard deduplication applies');
        
        return backspaces;
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
        
        // Get crystal area dimensions dynamically
        const crystalArea = document.getElementById('crystal-area');
        const crystal = document.getElementById('crystal');
        
        if (!crystalArea || !crystal) {
            console.warn('Crystal elements not found, using default positioning');
            return this.generateDefaultFacets();
        }
        
        const areaRect = crystalArea.getBoundingClientRect();
        const crystalRect = crystal.getBoundingClientRect();
        
        // Calculate center and safe radius based on actual crystal size
        const centerX = areaRect.width / 2;
        const centerY = areaRect.height / 2;
        
        // Use the smaller dimension to ensure facets stay within bounds
        const crystalRadius = Math.min(crystalRect.width, crystalRect.height) / 2;
        const safeRadius = Math.max(20, crystalRadius * 0.6); // 60% of crystal radius, minimum 20px
        
        console.log(`📱 Mobile device detected - Crystal radius: ${Math.round(crystalRadius)}px, Safe radius: ${Math.round(safeRadius)}px`);
        
        // Create 10 facets positioned within the crystal
        for (let i = 0; i < 10; i++) {
            let radius, angle;
            
            // Create different layers of facets within the crystal
            if (i < 4) {
                // Inner ring - 4 facets (closest to center)
                radius = safeRadius * 0.4;
                angle = (i * Math.PI * 2) / 4;
            } else if (i < 8) {
                // Middle ring - 4 facets
                radius = safeRadius * 0.7;
                angle = ((i - 4) * Math.PI * 2) / 4 + Math.PI / 4; // Offset by 45 degrees
            } else {
                // Outer ring - 2 facets (still within crystal)
                radius = safeRadius * 0.9;
                angle = ((i - 8) * Math.PI * 2) / 2;
            }
            
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            // Ensure facet is within bounds
            const facetRadius = Math.min(15, safeRadius * 0.15); // Responsive facet size
            
            facets.push({
                id: i,
                x: Math.round(x),
                y: Math.round(y),
                radius: facetRadius,
                active: false,
                tapped: false,
                sequence: i,
                lastTapTime: 0 // Track last tap time to prevent double-taps
            });
        }
        
        console.log(`✅ Generated ${facets.length} facets within crystal bounds`);
        return facets;
    }
    
    // Fallback method for default positioning
    generateDefaultFacets() {
        const facets = [];
        const centerX = 200;
        const centerY = 200;
        const baseRadius = 35; // Even smaller for safety
        
        for (let i = 0; i < 10; i++) {
            let radius, angle;
            
            if (i < 4) {
                radius = baseRadius * 0.4;
                angle = (i * Math.PI * 2) / 4;
            } else if (i < 8) {
                radius = baseRadius * 0.7;
                angle = ((i - 4) * Math.PI * 2) / 4 + Math.PI / 4;
            } else {
                radius = baseRadius * 0.9;
                angle = ((i - 8) * Math.PI * 2) / 2;
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
                sequence: i,
                lastTapTime: 0
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
        const timestamp = performance.now();
        const touches = Array.from(e.touches);
        
        // Store initial touch position for scroll detection
        this.crystalTouchStart = {
            x: touches[0].clientX,
            y: touches[0].clientY,
            time: timestamp
        };
        
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
        const timestamp = performance.now();
        const touches = Array.from(e.touches);
        
        // Check if this is a scroll gesture (vertical movement > horizontal movement)
        if (this.crystalTouchStart && touches.length === 1) {
            const deltaX = Math.abs(touches[0].clientX - this.crystalTouchStart.x);
            const deltaY = Math.abs(touches[0].clientY - this.crystalTouchStart.y);
            const timeDelta = timestamp - this.crystalTouchStart.time;
            
            // If vertical movement is significantly more than horizontal movement, allow scrolling
            if (deltaY > deltaX * 1.5 && deltaY > 10 && timeDelta > 50) {
                // This is likely a scroll gesture, don't prevent default
                return;
            }
        }
        
        // Prevent default only for crystal interactions
        e.preventDefault();
        e.stopPropagation();
        
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
        const timestamp = performance.now();
        const touches = Array.from(e.changedTouches);
        
        // Check if this was a scroll gesture
        if (this.crystalTouchStart && touches.length === 1) {
            const deltaX = Math.abs(touches[0].clientX - this.crystalTouchStart.x);
            const deltaY = Math.abs(touches[0].clientY - this.crystalTouchStart.y);
            const timeDelta = timestamp - this.crystalTouchStart.time;
            
            // If vertical movement is significantly more than horizontal movement, allow scrolling
            if (deltaY > deltaX * 1.5 && deltaY > 10 && timeDelta > 50) {
                // This was a scroll gesture, don't prevent default
                this.crystalTouchStart = null;
                return;
            }
        }
        
        // Prevent default only for crystal interactions
        e.preventDefault();
        e.stopPropagation();
        
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
        
        // Clear touch start data
        this.crystalTouchStart = null;
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
                    const currentTime = performance.now();
                    const tappedFacet = this.findTappedFacet(touch.clientX, touch.clientY);
                    
                    if (tappedFacet) {
                        // Prevent rapid double-taps on the same facet
                        const timeSinceLastTap = currentTime - tappedFacet.lastTapTime;
                        if (timeSinceLastTap < 300) { // 300ms cooldown
                            console.log(`⏱️ Tap too fast on facet ${tappedFacet.id}, ignoring`);
                            return;
                        }
                        
                        // Update last tap time
                        tappedFacet.lastTapTime = currentTime;
                        
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
                                // Highlight next facet with delay to prevent confusion
                                setTimeout(() => {
                                    this.highlightNextFacet();
                                }, 200);
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
                    } else {
                        // Tap outside facets - provide feedback
                        console.log(`❌ Tap outside facet areas`);
                        crystal.classList.add('error-feedback');
                        setTimeout(() => {
                            crystal.classList.remove('error-feedback');
                        }, 300);
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
            // Hide Next Step button after final step
            if (nextCrystalBtn) {
                nextCrystalBtn.style.display = 'none';
            }
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
            // Add delay to ensure DOM is fully rendered
            setTimeout(() => {
                this.crystalState.facets = this.generateFacets();
                this.renderFacets();
            }, 100);
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
        if (this.currentCrystalStep === 5) {
            // Remove the next step button entirely in step 5
            if (nextCrystalBtn) {
                nextCrystalBtn.remove();
            }
            // Add delay to ensure DOM is fully rendered for facets
            setTimeout(() => {
                this.crystalState.facets = this.generateFacets();
                this.renderFacets();
            }, 100);
        } else if (nextCrystalBtn) {
            nextCrystalBtn.style.display = 'inline-flex';
            nextCrystalBtn.disabled = true;
            nextCrystalBtn.style.opacity = '0.5';
            nextCrystalBtn.style.backgroundColor = 'var(--color-secondary)';
        } else {
            console.warn('[DEBUG] next-crystal-btn not found in DOM during updateCrystalDisplay');
        }
        
        // Initialize facets for step 5
        if (this.currentCrystalStep === 5) {
            // Add delay to ensure DOM is fully rendered
            setTimeout(() => {
                this.crystalState.facets = this.generateFacets();
                this.renderFacets();
            }, 100);
        }
    }

    
    getStepTitle(type) {
        const titles = {
            'tap': 'Step 1: Finger Tapping (3 Taps)',
            'rotate': 'Step 2: Finger Rotation (3 Circles)',
            'pinch': 'Step 3: Pinch to Shrink (50%)',
            'spread': 'Step 4: Spread to Enlarge (150%)',
            'pressure': 'Step 5: Three-Finger Pressure',
            'facet_tap': 'Step 5: Facet Sequence Tapping (10 Facets)'
        };
        return titles[type] || 'Unknown';
    }
    
    getInitialProgress(type) {
        const progress = {
            'tap': 'Taps: 0/3',
            'rotate': 'Rotations: 0/3',
            'pinch': 'Target: 50% (Current: 100%)',
            'spread': 'Target: 150% (Current: 100%)',
            'pressure': 'Hold Time: 0s / 3s',
            'facet_tap': 'Facets: 0/10'
        };
        return progress[type] || '0/0';
    }
    
    updateStepProgress(progress) {
        document.getElementById('step-progress').textContent = progress;
        
        // Enhanced guidance for all steps
        const stepStatus = document.getElementById('step-status');
        
        if (this.currentCrystalStep === 1) {
            // Tap step guidance
            if (this.crystalState.tapCount === 0) {
                stepStatus.textContent = 'Ready: Tap the crystal 3 times with your finger';
            } else if (this.crystalState.tapCount < 3) {
                stepStatus.textContent = `Progress: ${this.crystalState.tapCount}/3 taps completed. Continue tapping!`;
            } else {
                stepStatus.textContent = '✅ Complete! All 3 taps finished. Click "Next Step" to continue.';
            }
        } else if (this.currentCrystalStep === 2) {
            // Rotation step guidance
            if (this.crystalState.rotationCompleted) {
                stepStatus.textContent = '✅ Perfect! All 3 rotations completed. Click "Next Step" to continue.';
            } else if (this.crystalState.rotationRounds === 0) {
                stepStatus.textContent = 'Step 1: Touch the crystal, then rotate your finger CLOCKWISE in a complete circle';
            } else if (this.crystalState.rotationRounds === 1) {
                stepStatus.textContent = 'Step 2: Great! Now rotate COUNTER-CLOCKWISE in a complete circle';
            } else if (this.crystalState.rotationRounds === 2) {
                stepStatus.textContent = 'Step 3: Almost done! Now rotate CLOCKWISE again in a complete circle';
            } else {
                stepStatus.textContent = 'Rotation Pattern: CLOCKWISE → COUNTER-CLOCKWISE → CLOCKWISE';
            }
        } else if (this.currentCrystalStep === 3) {
            // Pinch step guidance
            const currentSize = Math.round(this.crystalState.currentSize * 100);
            if (currentSize > 50) {
                stepStatus.textContent = `Current: ${currentSize}% - Pinch fingers together to reach 50%`;
            } else {
                stepStatus.textContent = '✅ Perfect! Crystal shrunk to 50%. Click "Next Step" to continue.';
            }
        } else if (this.currentCrystalStep === 4) {
            // Spread step guidance
            const currentSize = Math.round(this.crystalState.currentSize * 100);
            if (currentSize < 150) {
                stepStatus.textContent = `Current: ${currentSize}% - Spread fingers apart to reach 150%`;
            } else {
                stepStatus.textContent = '✅ Perfect! Crystal enlarged to 150%. Click "Next Step" to continue.';
            }
        } else if (this.currentCrystalStep === 5) {
            // Facet tapping step guidance
            if (this.crystalState.currentFacetIndex === 0) {
                stepStatus.textContent = 'Ready: Tap the facets in the order they light up (green dots)';
            } else if (this.crystalState.currentFacetIndex < 10) {
                stepStatus.textContent = `Progress: ${this.crystalState.currentFacetIndex}/10 facets activated. Continue the sequence!`;
            } else {
                stepStatus.textContent = '✅ Complete! All 10 facets activated. Click "Next Step" to continue.';
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

        // Only allow swipe to change image if not pinching or panning and scale ≈ 1
        if (!this.galleryZoom.isPinching && !this.galleryZoom.isPanning
            && e.changedTouches.length === 1 && Math.abs(this.galleryZoom.scale - 1) < 0.05) {
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
        
        const scale = this.galleryZoom.scale;
        
        // Apply transform first to get accurate dimensions
        img.style.transform = 
            `translate(${this.galleryZoom.translateX}px, ${this.galleryZoom.translateY}px) ` +
            `scale(${scale})`;
        
        // Clamp translation so image cannot be moved beyond its edges
        if (img && ctr && scale > 1) {
            // Get the actual displayed image dimensions after scaling
            const imgRect = img.getBoundingClientRect();
            const ctrRect = ctr.getBoundingClientRect();
            
            // Calculate the actual scaled image dimensions
            const scaledImgWidth = imgRect.width;
            const scaledImgHeight = imgRect.height;
            const ctrWidth = ctrRect.width;
            const ctrHeight = ctrRect.height;
            
            // Calculate max allowed translation to prevent black areas
            const maxX = Math.max(0, (scaledImgWidth - ctrWidth) / 2);
            const maxY = Math.max(0, (scaledImgHeight - ctrHeight) / 2);
            
            // Clamp the translation values
            this.galleryZoom.translateX = Math.max(-maxX, Math.min(maxX, this.galleryZoom.translateX));
            this.galleryZoom.translateY = Math.max(-maxY, Math.min(maxY, this.galleryZoom.translateY));
            
            // Re-apply transform with clamped values
            img.style.transform = 
                `translate(${this.galleryZoom.translateX}px, ${this.galleryZoom.translateY}px) ` +
                `scale(${scale})`;
        }
        
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
        
        // Also export hand usage summary
        this.exportHandUsageSummary();
    
        document.getElementById('keystroke-count').textContent = this.keystrokeData.length;
        // Dynamically set feature count and list
        const featureNames = features.length > 0 ? Object.keys(features[0]) : [];
        document.getElementById('keystroke-features').textContent = featureNames.length;
        document.getElementById('keystroke-feature-list').textContent = featureNames.join(', ');
    }

    
    exportTouchData() {
        const features = this.extractTouchFeatures();
        const csv = this.convertToCSV(features);
        const filename = `${this.participantId}_touch.csv`;

        this.uploadCSVToGoogleDrive(csv, filename);
    
        document.getElementById('touch-count').textContent = this.touchData.length;
        // Dynamically set feature count and list
        const featureNames = features.length > 0 ? Object.keys(features[0]) : [];
        document.getElementById('touch-features').textContent = featureNames.length;
        document.getElementById('touch-feature-list').textContent = featureNames.join(', ');
    }

    // ENHANCED: Keystroke feature extraction with proper flight time handling
    extractKeystrokeFeatures() {
        const features = [];
        this.keystrokeData.forEach((keystroke, index) => {
            if (keystroke.type === 'keydown' || keystroke.type === 'keyup' || keystroke.type === 'insertText' || keystroke.type === 'compositionend' || keystroke.type.startsWith('delete') || keystroke.type === 'custom-keyboard') {
                // Skip synthetic events (no longer needed since we removed SHIFT/†)
                if (keystroke.isSynthetic) {
                    console.log(`🚫 Skipping synthetic event in feature extraction: ${keystroke.actualChar}`);
                    return;
                }
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
                if (keystroke.actualChar && keystroke.actualChar.length === 1) {
                    refChar = keystroke.actualChar;
                }
                // Remove browser_name from features
                features.push({
                    participant_id: this.participantId,
                    task_id: 1,
                    timestamp_ms: Math.round(keystroke.timestamp),
                    ref_char: refChar,
                    touch_x: Math.round(keystroke.clientX || this.currentPointerX),
                    touch_y: Math.round(keystroke.clientY || this.currentPointerY),
                    key_x: keystroke.key_x || '',
                    key_y: keystroke.key_y || '',
                    was_deleted: wasDeleted,
                    flight_time_ms: flightTime, // Use the flight time as recorded
                    dwell_time_ms: keystroke.dwell_time_ms || '',
                    hand_usage: keystroke.handUsage || 'unknown'
                });
            }
        });
        return features;
    }

    // RELIABLE: Touch feature extraction with device model and browser name as separate columns
    extractTouchFeatures() {
        const features = [];
        let lastTimestamp = null;
        let lastTrialStep = null;
        this.touchData.forEach((touch, index) => {
            let task_step_label = '';
            if (touch.taskId === 2) {
                task_step_label = `1(${touch.step || 1})`;
            } else if (touch.taskId === 3) {
                task_step_label = '2';
            } else {
                task_step_label = '';
            }
            const trialStep = `${touch.trial || 1}_${touch.step || 1}`;
            // Set inter_touch_timing to null for the first event of each gesture/trial/step
            let interTouchTiming = null;
            if (lastTrialStep === trialStep && lastTimestamp !== null) {
                interTouchTiming = Math.round(touch.timestamp - lastTimestamp);
            }
            lastTimestamp = touch.timestamp;
            lastTrialStep = trialStep;
            const baseFeature = {
                participant_id: this.participantId,
                task_id: task_step_label,
                trial: touch.trial || 1,
                timestamp_ms: Math.round(touch.timestamp),
                touch_x: Math.round(touch.touches[0]?.clientX || 0),
                touch_y: Math.round(touch.touches[0]?.clientY || 0),
                btn_touch_state: touch.type,
                num_touch_points: Array.isArray(touch.touches) ? touch.touches.length : 1,
                path_length_px: this.gesturePathLength[trialStep] || 0
                // browser_name removed
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
    
        // Add device and browser info as a comment line at the top
        let deviceInfoLine = '';
        if (this.deviceInfo) {
            deviceInfoLine = `Device: ${this.deviceInfo.device_model} | Browser: ${this.deviceInfo.browser_name} ${this.deviceInfo.browser_version}`;
        }
    
        const csvContent = [
            deviceInfoLine,
            headers.join(','), // header row
            ...data.map(row => 
                headers.map(header => escapeCsv(row[header])).join(',')
            )
        ].filter(Boolean).join('\n');
    
        // Add UTF-8 BOM to ensure Excel and others recognize encoding
        return '\uFEFF' + csvContent;
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
            alert(`✅ ${filename} uploaded to Drive.`);
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
                typingInput.readOnly = false;
                typingInput.style.opacity = '1';
                nextSentenceBtn.disabled = false;
                nextSentenceBtn.style.opacity = '1';
            } else {
                typingInput.readOnly = true;
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
        
        // Find which facet was tapped with improved detection
        for (const facet of this.crystalState.facets) {
            const distance = Math.sqrt(
                Math.pow(relativeX - facet.x, 2) + 
                Math.pow(relativeY - facet.y, 2)
            );
            
            // Use a slightly larger hit area for better touch detection
            const hitRadius = facet.radius + 5; // 5px buffer for easier tapping
            
            if (distance <= hitRadius) {
                console.log(`🎯 Facet ${facet.id} detected at distance ${Math.round(distance)}px (hit radius: ${hitRadius}px)`);
                return facet;
            }
        }
        
        console.log(`❌ No facet detected at (${Math.round(relativeX)}, ${Math.round(relativeY)})`);
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
            
            // Create highlight for next facet with smaller size to stay within crystal
            const highlight = document.createElement('div');
            highlight.className = 'facet-highlight';
            highlight.style.left = `${nextFacet.x - nextFacet.radius - 3}px`; // Reduced offset
            highlight.style.top = `${nextFacet.y - nextFacet.radius - 3}px`; // Reduced offset
            highlight.style.width = `${(nextFacet.radius + 3) * 2}px`; // Smaller highlight
            highlight.style.height = `${(nextFacet.radius + 3) * 2}px`; // Smaller highlight
            
            const crystalArea = document.getElementById('crystal-area');
            crystalArea.appendChild(highlight);
        }
    }
    
    renderFacets() {
        // Remove existing facets
        const existingFacets = document.querySelectorAll('.crystal-facet, .facet-highlight');
        existingFacets.forEach(el => el.remove());
        
        // Render all facets with improved visibility
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
            
            // Add data attributes for debugging
            facetElement.setAttribute('data-facet-id', facet.id);
            facetElement.setAttribute('data-sequence', facet.sequence);
            
            const crystalArea = document.getElementById('crystal-area');
            crystalArea.appendChild(facetElement);
        });
        
        // Highlight next facet with improved visibility
        this.highlightNextFacet();
        
        console.log(`🎮 Rendered ${this.crystalState.facets.length} facets, current index: ${this.crystalState.currentFacetIndex}`);
    }

    setupInactivityTracking() {
        // Activity events to reset the timer
        const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click', 'input'];
        
        activityEvents.forEach(event => {
            document.addEventListener(event, () => {
                this.resetInactivityTimer();
            }, { passive: true });
        });
    }
    
    startInactivityTimer() {
        this.lastActivityTime = Date.now();
        this.inactivityTimer = setTimeout(() => {
            this.terminateSession();
        }, this.inactivityTimeout);
        console.log('⏰ Inactivity timer started - session will terminate after 3 minutes of inactivity');
    }
    
    resetInactivityTimer() {
        if (this.taskState.studyStarted) {
            this.lastActivityTime = Date.now();
            if (this.inactivityTimer) {
                clearTimeout(this.inactivityTimer);
            }
            this.inactivityTimer = setTimeout(() => {
                this.terminateSession();
            }, this.inactivityTimeout);
        }
    }
    
    stopInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = null;
        }
    }
    
    terminateSession() {
        console.log('⏰ Session terminated due to inactivity (3 minutes)');
        
        // Clear all data
        this.keystrokeData = [];
        this.touchData = [];
        this.gesturePath = {};
        this.gesturePathLength = {};
        
        // Reset task state
        this.taskState = {
            studyStarted: false,
            typingCompleted: false,
            crystalCompleted: false,
            galleryCompleted: false
        };
        
        // Reset current positions
        this.currentSentence = 0;
        this.currentCrystalStep = 1;
        this.currentGalleryImage = 0;
        
        // Generate new participant ID
        this.generateParticipantId();
        
        // Stop inactivity timer
        this.stopInactivityTimer();
        
        // Return to welcome screen
        this.switchScreen('welcome');
        
        // Show notification to user
        this.showInactivityNotification();
    }
    
    showInactivityNotification() {
        // Create and show a notification
        const notification = document.createElement('div');
        notification.className = 'inactivity-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <h3>Session Expired</h3>
                <p>Your session was terminated due to 3 minutes of inactivity.</p>
                <p>A new session has been started. Please click "Start Study" to begin again.</p>
                <button onclick="this.parentElement.parentElement.remove()">OK</button>
            </div>
        `;
        notification.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--inact-bg, rgba(0,0,0,0.8));
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;
        const content = notification.querySelector('.notification-content');
        content.style.cssText = `
            background: var(--inact-content-bg, white);
            color: var(--inact-content-text, #222);
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            max-width: 400px;
            margin: 20px;
            box-shadow: 0 2px 16px rgba(0,0,0,0.18);
        `;
        content.querySelector('button').style.cssText = `
            background: var(--color-primary, #20cfcf);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 15px;
        `;
        document.body.appendChild(notification);
        // Add dark mode support
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            notification.style.setProperty('--inact-bg', 'rgba(0,0,0,0.92)');
            content.style.setProperty('--inact-content-bg', '#232323');
            content.style.setProperty('--inact-content-text', '#ffe58f');
        }
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
    }

    // Add this method to BiometricDataCollector:
    updateAutoCapState() {
        const input = document.getElementById('typing-input');
        if (!input) return;
        const value = input.value;
        const caret = input.selectionStart;
        // If caret at position 0, always auto-cap
        if (caret === 0) {
            this.autoCapitalizeNext = true;
        } else {
            // Check for . + space sequence just before caret
            const before = value.substring(0, caret);
            if (/\. $/.test(before)) {
                this.autoCapitalizeNext = true;
            } else {
                this.autoCapitalizeNext = false;
            }
        }
        this.updateKeyboardDisplay();
    }

    // Add hand detection methods:
    analyzeHandUsage(keystrokeData) {
        const { actualChar, clientX, clientY, timestamp } = keystrokeData;
        
        // Skip if no position data
        if (!clientX || !clientY) return 'unknown';
        
        // Add to recent data
        this.handDetectionData.recentKeyPresses.push({
            char: actualChar.toLowerCase(),
            x: clientX,
            y: clientY,
            timestamp
        });
        
        // Keep only last 15 key presses for faster adaptation
        if (this.handDetectionData.recentKeyPresses.length > 15) {
            this.handDetectionData.recentKeyPresses.shift();
        }
        
        // Analyze the recent data (keystrokes and touch positions)
        if (this.handDetectionData.recentKeyPresses.length < 5) {
            return 'unknown';
        }

        // Use sliding window for better prediction
        const handPrediction = this.analyzeSlidingWindow();
        
        // Update hand usage history
        this.handDetectionData.handUsageHistory.push({
            timestamp,
            prediction: handPrediction
        });
        
        // Keep only last 50 predictions
        if (this.handDetectionData.handUsageHistory.length > 50) {
            this.handDetectionData.handUsageHistory.shift();
        }
        
        this.handDetectionData.currentHandPrediction = handPrediction;
        return handPrediction;
    }

    // Sliding window analysis for better hand detection
    analyzeSlidingWindow() {
        const recent = this.handDetectionData.recentKeyPresses;
        if (recent.length < 3) return 'unknown';

        // Get screen dimensions
        const screenWidth = window.innerWidth;

        // Analyze the most recent 3-5 keystrokes or touch positions
        const windowSize = Math.min(5, recent.length);
        const recentWindow = recent.slice(-windowSize);

        // Calculate average position of recent touches/key presses
        const avgX = recentWindow.reduce((sum, press) => sum + press.x, 0) / recentWindow.length;

        // Simple thresholds - prioritize left/right over both
        const leftThreshold = screenWidth * 0.45;   // Left 45% of screen
        const rightThreshold = screenWidth * 0.55;  // Right 45% of screen

        // Analyze position relative to screen
        const leftSide = avgX < leftThreshold;
        const rightSide = avgX > rightThreshold;

        // Check for two-handed pattern (very conservative)
        const xSpread = Math.max(...recentWindow.map(p => p.x)) - Math.min(...recentWindow.map(p => p.x));
        const veryWideSpread = xSpread > screenWidth * 0.7; // Much higher threshold for "both"

        // Additional check: if touches are spread across both sides (very conservative)
        const leftTouches = recentWindow.filter(p => p.x < leftThreshold).length;
        const rightTouches = recentWindow.filter(p => p.x > rightThreshold).length;
        const bothSidesUsed = leftTouches >= 3 && rightTouches >= 3; // Higher threshold for "both"

        // Only return 'both' if very clear evidence
        if (veryWideSpread && bothSidesUsed) return 'both';
        if (leftSide) return 'left';
        if (rightSide) return 'right';

        // If unclear, default to unknown
        return 'unknown';
    }

    // Analyze which hand is being used based on key history
    analyzeKeysByHand() {
        const recent = this.handDetectionData.recentKeyPresses;
        let leftHandCount = 0;
        let rightHandCount = 0;
        let centerCount = 0;

        recent.forEach(press => {
            const char = press.char;
            if (this.handDetectionData.leftHandKeys.includes(char)) {
                leftHandCount++;
            } else if (this.handDetectionData.rightHandKeys.includes(char)) {
                rightHandCount++;
            } else if (this.handDetectionData.centerKeys.includes(char)) {
                centerCount++;
            }
        });

        const total = leftHandCount + rightHandCount + centerCount;
        if (total === 0) return 'unknown';

        const leftRatio = leftHandCount / total;
        const rightRatio = rightHandCount / total;

        // More conservative thresholds
        if (leftRatio > 0.7) return 'left';
        if (rightRatio > 0.7) return 'right';
        if (leftRatio > 0.4 && rightRatio > 0.4) return 'both';
        return 'unknown';
    }

    // Update hand usage history for further analysis
    getHandUsageStats() {
        const history = this.handDetectionData.handUsageHistory;
        if (history.length === 0) return { left: 0, right: 0, both: 0, unknown: 0 };

        const stats = { left: 0, right: 0, both: 0, unknown: 0 };
        history.forEach(entry => {
            if (entry.prediction in stats) {
                stats[entry.prediction]++;
            }
        });

        const total = history.length;
        Object.keys(stats).forEach(key => {
            stats[key] = Math.round((stats[key] / total) * 100);
        });

        return stats;
    }

    // Update hand usage display with statistics
    updateHandUsageDisplay() {
        const currentUsage = this.getCurrentHandUsage();
        const stats = this.getHandUsageStats();
        const sessionConfidence = this.getSessionHandConfidence();

        let handDisplay = document.getElementById('hand-usage-display');
        if (!handDisplay) {
            handDisplay = document.createElement('div');
            handDisplay.id = 'hand-usage-display';
            handDisplay.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 10px;
                border-radius: 5px;
                font-size: 12px;
                z-index: 1000;
                font-family: monospace;
                min-width: 200px;
            `;
            document.body.appendChild(handDisplay);
        }

        const handEmoji = {
            'left': '👈',
            'right': '👉',
            'both': '🤲',
            'unknown': '❓'
        };

        // Determine dominant hand
        const dominantHand = Object.keys(stats).reduce((a, b) => stats[a] > stats[b] ? a : b);

        const transitionEmoji = {
            'stable': '🟢',
            'transitioning': '🟡',
            'mixed': '🔴'
        };

        handDisplay.innerHTML = `
            <div><strong>Hand Detection:</strong></div>
            <div>${handEmoji[currentUsage.hand]} Current: ${currentUsage.hand.toUpperCase()}</div>
            <div>🏆 Dominant: ${handEmoji[dominantHand]} ${dominantHand.toUpperCase()}</div>
            <div>📊 Confidence: ${sessionConfidence}%</div>
            <div>${transitionEmoji[currentUsage.handTransition]} ${currentUsage.handTransition.toUpperCase()}</div>
            <div><strong>Session Stats:</strong></div>
            <div>Left: ${stats.left}% | Right: ${stats.right}% | Both: ${stats.both}%</div>
            <div>Data points: ${this.handDetectionData.recentKeyPresses.length}</div>
        `;
    }

    // Session confidence based on hand usage
    getSessionHandConfidence() {
        const history = this.handDetectionData.handUsageHistory;
        if (history.length < 10) return 0;

        const predictions = history.map(entry => entry.prediction);
        const mostCommon = predictions.reduce((acc, pred) => {
            acc[pred] = (acc[pred] || 0) + 1;
            return acc;
        }, {});

        const maxPrediction = Math.max(...Object.values(mostCommon));
        return Math.round((maxPrediction / predictions.length) * 100);
    }

    // Get current hand usage
    getCurrentHandUsage() {
        const lastPrediction = this.handDetectionData.handUsageHistory.slice(-1)[0];
        return lastPrediction ? lastPrediction : { hand: 'unknown', handTransition: 'stable' };
    }

    predictHandFromPatterns() {
        const recent = this.handDetectionData.recentKeyPresses;
        if (recent.length < 10) return 'unknown';
        
        // Primary method: Position-based analysis (most reliable for mobile)
        const positionBasedPrediction = this.analyzeTouchPositions();
        
        // Secondary method: Key-based analysis (for validation)
        const keyBasedPrediction = this.analyzeKeysByHand();
        
        // Tertiary method: Timing pattern analysis
        const timingBasedPrediction = this.analyzeTimingPatterns();
        
        // Weighted combination with position as primary
        const predictions = [
            { method: 'position', prediction: positionBasedPrediction, weight: 0.6 },
            { method: 'key', prediction: keyBasedPrediction, weight: 0.3 },
            { method: 'timing', prediction: timingBasedPrediction, weight: 0.1 }
        ];
        
        return this.combinePredictions(predictions);
    }

    analyzeTouchPositions() {
        const recent = this.handDetectionData.recentKeyPresses;
        if (recent.length < 3) return 'unknown';
        
        // Get screen dimensions
        const screenWidth = window.innerWidth;
        
        // Calculate average touch position
        const avgX = recent.reduce((sum, press) => sum + press.x, 0) / recent.length;
        
        // Simple thresholds - prioritize left/right over both
        const leftThreshold = screenWidth * 0.45;   // Left 45% of screen
        const rightThreshold = screenWidth * 0.55;  // Right 45% of screen
        
        // Analyze position relative to screen
        const leftSide = avgX < leftThreshold;
        const rightSide = avgX > rightThreshold;
        
        // Check for two-handed pattern (very conservative)
        const xSpread = Math.max(...recent.map(p => p.x)) - Math.min(...recent.map(p => p.x));
        const veryWideSpread = xSpread > screenWidth * 0.7; // Much higher threshold
        
        // Additional check: if touches are spread across both sides (very conservative)
        const leftTouches = recent.filter(p => p.x < leftThreshold).length;
        const rightTouches = recent.filter(p => p.x > rightThreshold).length;
        const bothSidesUsed = leftTouches >= 3 && rightTouches >= 3; // Higher threshold
        
        // Only return 'both' if very clear evidence
        if (veryWideSpread && bothSidesUsed) return 'both';
        if (leftSide) return 'left';
        if (rightSide) return 'right';
        
        // If unclear, default to unknown
        return 'unknown';
    }

    analyzeTimingPatterns() {
        const recent = this.handDetectionData.recentKeyPresses;
        if (recent.length < 5) return 'unknown';
        
        // Calculate timing patterns
        const intervals = [];
        for (let i = 1; i < recent.length; i++) {
            intervals.push(recent[i].timestamp - recent[i-1].timestamp);
        }
        
        // Analyze timing consistency
        const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
        const stdDev = Math.sqrt(variance);
        
        // Two-handed typing tends to be more consistent (lower variance)
        // Single-handed typing may have more variation
        const consistencyRatio = stdDev / avgInterval;
        
        if (consistencyRatio < 0.3) return 'both';
        if (consistencyRatio > 0.6) return 'left'; // Assuming left hand is less practiced
        return 'right';
    }

    combinePredictions(predictions) {
        const scores = { left: 0, right: 0, both: 0, unknown: 0 };
        
        predictions.forEach(({ prediction, weight }) => {
            if (prediction in scores) {
                scores[prediction] += weight;
            }
        });
        
        // Find the prediction with highest score
        const maxScore = Math.max(...Object.values(scores));
        const bestPrediction = Object.keys(scores).find(key => scores[key] === maxScore);
        
        return bestPrediction || 'unknown';
    }

    calculateHandConfidence() {
        const recent = this.handDetectionData.recentKeyPresses;
        if (recent.length < 10) return 0;
        
        // Calculate confidence based on multiple factors:
        
        // 1. Position consistency (how clustered the touches are)
        const avgX = recent.reduce((sum, press) => sum + press.x, 0) / recent.length;
        const xVariance = recent.reduce((sum, press) => sum + Math.pow(press.x - avgX, 2), 0) / recent.length;
        const xStdDev = Math.sqrt(xVariance);
        const screenWidth = window.innerWidth;
        const positionConsistency = Math.max(0, 1 - (xStdDev / (screenWidth * 0.3))); // Normalize to 0-1
        
        // 2. Key usage consistency (how strongly one hand dominates)
        const keyAnalysis = this.analyzeKeysByHand();
        const leftCount = recent.filter(p => this.handDetectionData.leftHandKeys.includes(p.char)).length;
        const rightCount = recent.filter(p => this.handDetectionData.rightHandKeys.includes(p.char)).length;
        const total = leftCount + rightCount;
        const keyConsistency = total > 0 ? Math.abs(leftCount - rightCount) / total : 0;
        
        // 3. Data sufficiency (more data = higher confidence)
        const dataSufficiency = Math.min(1, recent.length / 20);
        
        // Combine factors with weights
        const confidence = (positionConsistency * 0.5) + (keyConsistency * 0.3) + (dataSufficiency * 0.2);
        
        return Math.min(1, Math.max(0, confidence)); // Ensure 0-1 range
    }

    getCurrentHandUsage() {
        return {
            hand: this.handDetectionData.currentHandPrediction,
            confidence: this.calculateHandConfidence(),
            recentPatterns: this.handDetectionData.recentKeyPresses.slice(-5),
            handTransition: this.detectHandTransition()
        };
    }

    detectHandTransition() {
        const history = this.handDetectionData.handUsageHistory;
        if (history.length < 10) return 'stable';
        
        // Look at last 10 predictions to detect transitions
        const recentPredictions = history.slice(-10).map(h => h.prediction);
        const uniquePredictions = [...new Set(recentPredictions)];
        
        if (uniquePredictions.length > 2) {
            return 'mixed';
        } else if (uniquePredictions.length === 2) {
            return 'transitioning';
        } else {
            return 'stable';
        }
    }

}
// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const collector = new BiometricDataCollector();

    // Set --key-count for each keyboard row for perfect grid alignment
    const keyboardRows = document.querySelectorAll('#custom-keyboard .keyboard-row');
    keyboardRows.forEach(row => {
        // Only count visible keys (in case of dynamic layouts)
        const keys = Array.from(row.children).filter(
            el => el.classList && el.classList.contains('key') && el.offsetParent !== null
        );
        row.style.setProperty('--key-count', keys.length);
    });

    // Custom Keyboard Logic
    const typingInput = document.getElementById('typing-input');
    const customKeyboard = document.getElementById('custom-keyboard');
    let isShift = false;
    let isSymbols = false;
    
    const CAPSLOCK_WINDOW = 350; // ms

    // Prevent native keyboard by setting inputmode and tabindex
    typingInput.setAttribute('inputmode', 'none');
    typingInput.setAttribute('tabindex', '0');

    // Only show custom keyboard on focus
    typingInput.addEventListener('focus', (e) => {
        customKeyboard.style.display = 'block';
    });
    typingInput.addEventListener('blur', (e) => {
        // Optionally hide keyboard on blur
        // setTimeout(() => { customKeyboard.style.display = 'none'; }, 200);
    });


    // Hide keyboard if clicking outside
    function isKeyboardOrInput(target) {
      return customKeyboard.contains(target) || target === typingInput;
    }
    document.addEventListener('mousedown', (e) => {
      if (!isKeyboardOrInput(e.target)) {
        customKeyboard.style.display = 'none';
      }
    });
    document.addEventListener('touchend', (e) => {
      if (!isKeyboardOrInput(e.target)) {
        customKeyboard.style.display = 'none';
      }
    });

    // Remove .active from all keys utility
    function removeAllActiveKeys() {
        customKeyboard.querySelectorAll('.key.active').forEach(key => key.classList.remove('active'));
    }

    // Keyboard key press handler
    customKeyboard.addEventListener('click', (e) => {
        if (!e.target.classList.contains('key')) return;
        // Remove .active from all keys at the start (iOS fix)
        removeAllActiveKeys();
        // --- Add active class for 0.25s visual feedback ---
        e.target.classList.add('active');
        e.target.addEventListener('mouseup', function removeActiveClick() { e.target.classList.remove('active'); }, { once: true });
        e.target.addEventListener('mouseleave', function removeActiveClick() { e.target.classList.remove('active'); }, { once: true });
        setTimeout(() => e.target.classList.remove('active'), 10); // Remove after 10ms for instant feedback
        // --- End active class logic ---
        // ... existing code ...
        // As a safety net, remove .active from all keys after 10ms
        setTimeout(removeAllActiveKeys, 10);
        // ... existing code ...
        const key = e.target.getAttribute('data-key');
        let value = typingInput.value;
        let caret = typingInput.selectionStart;
        let newValue = value;
        let insertChar = '';
        let handled = false;
        const rect = e.target.getBoundingClientRect();
        const keyX = rect.left + rect.width / 2;
        const keyY = rect.top + rect.height / 2;
        // Always use the actual click location for touch_x/touch_y
        let touchX = (typeof e.clientX === 'number') ? e.clientX : keyX;
        let touchY = (typeof e.clientY === 'number') ? e.clientY : keyY;
        if (e instanceof PointerEvent) {
            touchX = e.clientX;
            touchY = e.clientY;
        } else if (e.changedTouches && e.changedTouches[0]) {
            touchX = e.changedTouches[0].clientX;
            touchY = e.changedTouches[0].clientY;
        } else if (e.targetTouches && e.targetTouches[0]) {
            touchX = e.targetTouches[0].clientX;
            touchY = e.targetTouches[0].clientY;
        }
        let newCaret = caret;
        if (key === 'backspace') {
            if (caret > 0) {
                newValue = value.slice(0, caret - 1) + value.slice(caret);
                newCaret = caret - 1;
                insertChar = 'BACKSPACE';
                handled = true;
            }
        } else if (key === 'space') {
            newValue = value.slice(0, caret) + ' ' + value.slice(caret);
            newCaret = caret + 1;
            insertChar = ' ';
            handled = true;
        } else if (key === 'enter') {
            insertChar = '\n';
            handled = true;
        } 
        // --- Standard shift logic ---
        else if (key === 'shift') {
            // Always record Shift key press before any logic
            const timestamp = performance.now();
            collector.recordKeystroke({
                timestamp,
                actualChar: 'SHIFT',
                refChar: 'SHIFT',
                keyCode: 16,
                type: 'custom-keyboard',
                sentence: collector.currentSentence,
                position: caret,
                clientX: Math.round(touchX),
                clientY: Math.round(touchY),
                key_x: Math.round(keyX),
                key_y: Math.round(keyY),
                dwell_time_ms: ''
            });
            const now = performance.now();
            // Remove old timestamps (older than 1s)
            collector.shiftTimestamps = collector.shiftTimestamps.filter(ts => now - ts < 1000);
            collector.shiftTimestamps.push(now);
            // Check for double shift within 0.5s
            if (
                collector.shiftTimestamps.length >= 2 &&
                (collector.shiftTimestamps[collector.shiftTimestamps.length - 1] - collector.shiftTimestamps[collector.shiftTimestamps.length - 2] < 350)
            ) {
                // Toggle Caps Lock
                collector.capsLockEnabled = !collector.capsLockEnabled;
                collector.userShiftOverride = false;
                isShift = false;
                collector.shiftTimestamps = []; // Reset
                collector.updateKeyboardDisplay();
                updateKeyboardCase();
                return;
            }
            if (collector.capsLockEnabled) {
                // If Caps Lock is on, pressing Shift disables it
                collector.capsLockEnabled = false;
                collector.userShiftOverride = false;
                isShift = false;
                collector.shiftTimestamps = [];
                collector.updateKeyboardDisplay();
                updateKeyboardCase();
                return;
            }
            if (collector.autoCapitalizeNext) {
                collector.userShiftOverride = !collector.userShiftOverride;
                updateKeyboardCase();
            } else {
                isShift = !isShift;
                collector.userShiftOverride = isShift;
                updateKeyboardCase();
                collector.updateKeyboardDisplay();
            }
            handled = false;
            console.log('Shift key handled - isShift:', isShift, 'userShiftOverride:', collector.userShiftOverride, 'autoCapitalizeNext:', collector.autoCapitalizeNext, 'capsLockEnabled:', collector.capsLockEnabled);
        }
        else if (key === '?123') {
            isSymbols = true;
            updateKeyboardLayout();
            return;
        } else if (key === 'ABC') {
            isSymbols = false;
            updateKeyboardLayout();
            return;
        } else {
            // Normal character
            let char = key;
            // --- AUTO-CAPITALIZATION FOR CUSTOM KEYBOARD ---
            if (collector.capsLockEnabled && char.length === 1 && /[a-z]/.test(char)) {
                char = char.toUpperCase();
            } else if ((collector.autoCapitalizeNext && !collector.userShiftOverride) && char.length === 1 && /[a-z]/.test(char)) {
                char = char.toUpperCase();
                collector.autoCapitalizeNext = false;
                collector.updateKeyboardDisplay();
            } else if (isShift && !isSymbols && char.length === 1 && /[a-z]/.test(char)) {
                char = char.toUpperCase();
            } else if (isShift && !isSymbols && char.length === 1 && /[A-Z]/.test(char)) {
                char = char.toLowerCase();
            }
            newValue = value.slice(0, caret) + char + value.slice(caret);
            newCaret = caret + 1;
            insertChar = char;
            handled = true;
            // If shift is active, turn off shift after one letter (like standard keyboard)
            if (isShift) {
                isShift = false;
                collector.userShiftOverride = false;
                updateKeyboardCase();
                collector.updateKeyboardDisplay();
            }
            console.log('Character processed:', char, 'shift:', isShift);
        }
        // --- Add active class for 0.25s visual feedback ---
        e.target.classList.add('active');
        // Remove .active from all keys before adding to current
        customKeyboard.querySelectorAll('.key.active').forEach(key => key.classList.remove('active'));
        const removeActive = () => e.target.classList.remove('active');
        e.target.addEventListener('mouseup', removeActive, { once: true });
        e.target.addEventListener('mouseleave', removeActive, { once: true });
        setTimeout(removeActive, 100); // Remove after 10ms for instant feedback
        // --- End active class logic ---
        // Record keystroke for shift key separately (outside handled block)
        if (key === 'shift') {
            const timestamp = performance.now();
            collector.recordKeystroke({
                timestamp,
                actualChar: 'SHIFT',
                refChar: 'SHIFT',
                keyCode: 16,
                type: 'custom-keyboard',
                sentence: collector.currentSentence,
                position: caret,
                clientX: Math.round(touchX),
                clientY: Math.round(touchY),
                key_x: Math.round(keyX),
                key_y: Math.round(keyY),
                dwell_time_ms: ''
            });
        }
        
        if (handled) {
            console.log('Handling input (click):', insertChar, 'newValue:', newValue);
            isProgrammaticInput = true;
            typingInput.value = newValue;
            // Only set focus if not already focused
            if (document.activeElement !== typingInput) {
                typingInput.focus();
            }
            // Only set caret if a character was inserted or deleted
            if (insertChar && insertChar !== 'SHIFT') {
                setTimeout(() => {
                    typingInput.setSelectionRange(newCaret, newCaret);
                    isProgrammaticInput = false;
                }, 0);
            } else {
                isProgrammaticInput = false;
            }
            const timestamp = performance.now();
            let actualChar = insertChar;
            let refChar = insertChar;
            if (insertChar === ' ') {
                actualChar = 'SPACE';
                refChar = 'SPACE';
            }
            // Only record keystroke if there's an actual character to insert
            if (insertChar && insertChar !== 'SHIFT') {
                collector.recordKeystroke({
                    timestamp,
                    actualChar: actualChar,
                    refChar: refChar,
                    keyCode: insertChar === 'BACKSPACE' ? 8 : insertChar === ' ' ? 32 : (insertChar.charCodeAt ? insertChar.charCodeAt(0) : 0),
                    type: 'custom-keyboard',
                    sentence: collector.currentSentence,
                    position: newCaret,
                    clientX: Math.round(touchX),
                    clientY: Math.round(touchY),
                    key_x: Math.round(keyX),
                    key_y: Math.round(keyY),
                    dwell_time_ms: ''
                });
            }
            collector.calculateAccuracy();
            collector.checkSentenceCompletion();
            collector.updateTypingFeedback();
            setTimeout(() => collector.updateAutoCapState(), 0);
        }
        // As a safety net, remove .active from all keys after 100ms
        setTimeout(() => {
            customKeyboard.querySelectorAll('.key.active').forEach(key => key.classList.remove('active'));
        }, 100);
    });

    function updateKeyboardCase() {
        const keys = customKeyboard.querySelectorAll('.keyboard-letters .key');
        let showUppercase;
        if (collector.capsLockEnabled) {
            showUppercase = true;
        } else if (collector.autoCapitalizeNext) {
            showUppercase = !collector.userShiftOverride;
        } else {
            showUppercase = isShift;
        }
        keys.forEach(btn => {
            const key = btn.getAttribute('data-key');
            if (key && key.length === 1 && /[a-z]/.test(key)) {
                btn.textContent = showUppercase ? key.toUpperCase() : key;
            }
        });
        console.log('updateKeyboardCase called - showUppercase:', showUppercase, 'autoCapitalizeNext:', collector.autoCapitalizeNext, 'userShiftOverride:', collector.userShiftOverride, 'isShift:', isShift, 'capsLockEnabled:', collector.capsLockEnabled);
    }
    function updateKeyboardLayout() {
        const letterRows = customKeyboard.querySelectorAll('.keyboard-row.keyboard-letters');
        const symbolRows = customKeyboard.querySelectorAll('.keyboard-row.keyboard-symbols');
        if (isSymbols) {
            letterRows.forEach(r => r.style.setProperty('display', 'none', 'important'));
            symbolRows.forEach(r => r.style.setProperty('display', 'flex', 'important'));
        } else {
            letterRows.forEach(r => r.style.setProperty('display', 'flex', 'important'));
            symbolRows.forEach(r => r.style.setProperty('display', 'none', 'important'));
        }
    }
    
    customKeyboard.addEventListener('touchstart', (e) => {
        const target = e.target.closest('.key');
        if (!target) return;
        const key = target.getAttribute('data-key');
        const touch = e.touches[0];
        if (key && touch) {
            collector.keyDwellStartTimes[key] = performance.now();
        }
    }, { passive: true });
    customKeyboard.addEventListener('touchend', (e) => {
        const target = e.target.closest('.key');
        if (!target) return;
        const key = target.getAttribute('data-key');
        const touch = e.changedTouches[0];
        if (key && touch) {
            const dwellStart = collector.keyDwellStartTimes[key];
            const dwellTime = dwellStart ? Math.round(performance.now() - dwellStart) : '';
            // Find the last keystroke for this key and add dwell_time_ms (match by actualChar and key_x/key_y)
            for (let i = collector.keystrokeData.length - 1; i >= 0; i--) {
                const k = collector.keystrokeData[i];
                if ((k.actualChar === key || (key === 'backspace' && k.actualChar === 'BACKSPACE') || (key === 'shift' && k.actualChar === 'SHIFT')) &&
                    k.key_x !== undefined && k.key_y !== undefined && k.dwell_time_ms === '') {
                    k.dwell_time_ms = dwellTime;
                    break;
                }
            }
            delete collector.keyDwellStartTimes[key];
        }
    }, { passive: true });
    // Ensure the custom keyboard instantly shows up if user touches or clicks within the typing input container
    if (typingInput) {
        typingInput.addEventListener('touchstart', (e) => {
            customKeyboard.style.display = 'block';
        });
        typingInput.addEventListener('click', (e) => {
            customKeyboard.style.display = 'block';
        });
    }

    // Ensure only the correct keyboard layout is visible on load
    updateKeyboardLayout();
    // --- Fix for sticky .active on touch devices ---
    customKeyboard.addEventListener('touchstart', (e) => {
        const target = e.target.closest('.key');
        if (!target) return;
        // Remove .active from all keys before adding to current
        removeAllActiveKeys();
        target.classList.add('active');
        e.preventDefault();
    }, { passive: false });

    // Remove .active from all keys on touchcancel (iOS fix)
    customKeyboard.addEventListener('touchcancel', removeAllActiveKeys);
    // Global document-level handlers as failsafe for iOS
    document.addEventListener('touchend', removeAllActiveKeys, true);
    document.addEventListener('touchcancel', removeAllActiveKeys, true);

    // Add this improved touchend handler:
    customKeyboard.addEventListener('touchend', (e) => {
        const target = e.target.closest('.key');
        if (!target) return;
        // Remove .active from all keys at the start (iOS fix)
        removeAllActiveKeys();
        target.classList.add('active');
        setTimeout(() => {
            target.classList.remove('active');
        }, 10); // Remove after 10ms for instant feedback
        setTimeout(removeAllActiveKeys, 10);
        // Simulate click logic
        const key = target.getAttribute('data-key');
        let value = typingInput.value;
        let caret = typingInput.selectionStart;
        let newValue = value;
        let insertChar = '';
        let handled = false;
        const rect = target.getBoundingClientRect();
        const keyX = rect.left + rect.width / 2;
        const keyY = rect.top + rect.height / 2;
        // Always use the actual touch location for touch_x/touch_y
        let touchX = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientX : keyX;
        let touchY = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientY : keyY;
        let newCaret = caret;
        if (key === 'backspace') {
            if (caret > 0) {
                newValue = value.slice(0, caret - 1) + value.slice(caret);
                newCaret = caret - 1;
                insertChar = 'BACKSPACE';
                handled = true;
            }
        } else if (key === 'space') {
            newValue = value.slice(0, caret) + ' ' + value.slice(caret);
            newCaret = caret + 1;
            insertChar = ' ';
            handled = true;
        } else if (key === 'enter') {
            insertChar = '\n';
            handled = true;
        } else if (key?.toLowerCase?.() === 'shift') {
            // Always record Shift key press before any logic
            const timestamp = performance.now();
            collector.recordKeystroke({
                timestamp,
                actualChar: 'SHIFT',
                refChar: 'SHIFT',
                keyCode: 16,
                type: 'custom-keyboard',
                sentence: collector.currentSentence,
                position: caret,
                clientX: Math.round(touchX),
                clientY: Math.round(touchY),
                key_x: Math.round(keyX),
                key_y: Math.round(keyY),
                dwell_time_ms: ''
            });
            const now = performance.now();
            collector.shiftTimestamps = collector.shiftTimestamps.filter(ts => now - ts < 1000);
            collector.shiftTimestamps.push(now);
            if (
                collector.shiftTimestamps.length >= 2 &&
                (collector.shiftTimestamps[collector.shiftTimestamps.length - 1] - collector.shiftTimestamps[collector.shiftTimestamps.length - 2] < 350)
            ) {
                collector.capsLockEnabled = !collector.capsLockEnabled;
                collector.userShiftOverride = false;
                isShift = false;
                collector.shiftTimestamps = [];
                collector.updateKeyboardDisplay();
                updateKeyboardCase();
                return;
            }
            if (collector.capsLockEnabled) {
                collector.capsLockEnabled = false;
                collector.userShiftOverride = false;
                isShift = false;
                collector.shiftTimestamps = [];
                collector.updateKeyboardDisplay();
                updateKeyboardCase();
                return;
            }
            if (collector.autoCapitalizeNext) {
                collector.userShiftOverride = !collector.userShiftOverride;
                updateKeyboardCase();
            } else {
                isShift = !isShift;
                collector.userShiftOverride = isShift;
                updateKeyboardCase();
                collector.updateKeyboardDisplay();
            }
            handled = false;
            console.log('Shift key handled (touch) - isShift:', isShift, 'userShiftOverride:', collector.userShiftOverride, 'autoCapitalizeNext:', collector.autoCapitalizeNext, 'capsLockEnabled:', collector.capsLockEnabled);
        } else if (key === '?123') {
            isSymbols = true;
            updateKeyboardLayout();
            return;
        } else if (key === 'ABC') {
            isSymbols = false;
            updateKeyboardLayout();
            return;
        } else {
            // Normal character
            let char = key;
            if (collector.capsLockEnabled && char.length === 1 && /[a-z]/.test(char)) {
                char = char.toUpperCase();
            } else if ((collector.autoCapitalizeNext && !collector.userShiftOverride) && char.length === 1 && /[a-z]/.test(char)) {
                char = char.toUpperCase();
                collector.autoCapitalizeNext = false;
                collector.userShiftOverride = false;
                collector.updateKeyboardDisplay();
            } else if ((collector.autoCapitalizeNext && collector.userShiftOverride) && char.length === 1 && /[a-z]/.test(char)) {
                char = char.toLowerCase();
                collector.autoCapitalizeNext = false;
                collector.userShiftOverride = false;
                collector.updateKeyboardDisplay();
            } else if (isShift && !isSymbols && char.length === 1 && /[a-z]/.test(char)) {
                char = char.toUpperCase();
            } else if (isShift && !isSymbols && char.length === 1 && /[A-Z]/.test(char)) {
                char = char.toLowerCase();
            }
            newValue = value.slice(0, caret) + char + value.slice(caret);
            newCaret = caret + 1;
            insertChar = char;
            handled = true;
            // If shift is active, turn off shift after one letter (like standard keyboard)
            if (isShift) {
                isShift = false;
                collector.userShiftOverride = false;
                updateKeyboardCase();
                collector.updateKeyboardDisplay();
            }
            console.log('Character processed (touch):', char, 'shift:', isShift);
        }
        
        // Record keystroke for shift key separately (outside handled block)
        if (key === 'shift') {
            const timestamp = performance.now();
            collector.recordKeystroke({
                timestamp,
                actualChar: 'SHIFT',
                refChar: 'SHIFT',
                keyCode: 16,
                type: 'custom-keyboard',
                sentence: collector.currentSentence,
                position: caret,
                clientX: Math.round(touchX),
                clientY: Math.round(touchY),
                key_x: Math.round(keyX),
                key_y: Math.round(keyY),
                dwell_time_ms: ''
            });
        }
        
        if (handled) {
            console.log('Handling input (touch):', insertChar, 'newValue:', newValue);
            isProgrammaticInput = true;
            typingInput.value = newValue;
            // Only set focus if not already focused
            if (document.activeElement !== typingInput) {
                typingInput.focus();
            }
            // Only set caret if a character was inserted or deleted
            if (insertChar && insertChar !== 'SHIFT') {
                setTimeout(() => {
                    typingInput.setSelectionRange(newCaret, newCaret);
                    isProgrammaticInput = false;
                }, 0);
            } else {
                isProgrammaticInput = false;
            }
            const timestamp = performance.now();
            let actualChar = insertChar;
            let refChar = insertChar;
            if (insertChar === ' ') {
                actualChar = 'SPACE';
                refChar = 'SPACE';
            }
            // Fix: Ensure only the symbol is stored for pilcrow and section sign
            if (insertChar === '¶' || insertChar === '§') {
                actualChar = insertChar;
                refChar = insertChar;
            }
            // Only record keystroke if there's an actual character to insert
            if (insertChar && insertChar !== 'SHIFT') {
                collector.recordKeystroke({
                    timestamp,
                    actualChar: actualChar,
                    refChar: refChar,
                    keyCode: insertChar === 'BACKSPACE' ? 8 : insertChar === ' ' ? 32 : (insertChar.charCodeAt ? insertChar.charCodeAt(0) : 0),
                    type: 'custom-keyboard',
                    sentence: collector.currentSentence,
                    position: newCaret,
                    clientX: Math.round(touchX),
                    clientY: Math.round(touchY),
                    key_x: Math.round(keyX),
                    key_y: Math.round(keyY),
                    dwell_time_ms: ''
                });
            }
            collector.calculateAccuracy();
            collector.checkSentenceCompletion();
            collector.updateTypingFeedback();
            setTimeout(() => collector.updateAutoCapState(), 0);
        }
        // As a safety net, remove .active from all keys after 10ms
        setTimeout(() => {
            customKeyboard.querySelectorAll('.key.active').forEach(key => key.classList.remove('active'));
        }, 10);
    }, { passive: true });                      
});

// After all customKeyboard event listeners, add this global handler:
document.addEventListener('touchend', function() {
    document.querySelectorAll('#custom-keyboard .key.active').forEach(key => key.classList.remove('active'));
}, { passive: true });
document.addEventListener('touchcancel', function() {
    document.querySelectorAll('#custom-keyboard .key.active').forEach(key => key.classList.remove('active'));
}, { passive: true });
// Global updateKeyboardCase function
function updateKeyboardCase() {
    const keys = customKeyboard.querySelectorAll('.keyboard-letters .key');
    keys.forEach(btn => {
        const key = btn.getAttribute('data-key');
        if (key && key.length === 1 && /[a-z]/.test(key)) {
            // Show uppercase if shift is active
            const shouldShowUppercase = isShift;
            btn.textContent = shouldShowUppercase ? key.toUpperCase() : key;
        }
    });
    console.log('Global updateKeyboardCase called - isShift:', isShift);
}
