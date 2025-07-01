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

    // Enhanced gallery zoom state with pinch support and double-click
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
      // Double-click/tap detection
      lastClickTime: 0,
      lastTapTime: 0,
      clickTimeout: null,
      tapTimeout: null,
      doubleClickThreshold: 400, // milliseconds
      doubleTapThreshold: 400,
      zoomLevel: 2 // Default zoom level for double-click
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
  }

  setupPointerTracking() {
    // Track mouse movement
    document.addEventListener('mousemove', (e) => {
      this.currentPointerX = e.clientX;
      this.currentPointerY = e.clientY;
      this.pointerTracking = { x: e.clientX, y: e.clientY };
    });

    // Track touch movement
    document.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        this.currentPointerX = touch.clientX;
        this.currentPointerY = touch.clientY;
        this.pointerTracking = { x: touch.clientX, y: touch.clientY };
      }
    });

    // Track touch start
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

    // Typing task - Enhanced mobile-friendly event handling
    const typingInput = document.getElementById('typing-input');

    // Composition events for mobile IME handling
    typingInput.addEventListener('compositionstart', (e) => {
      this.compositionActive = true;
    });

    typingInput.addEventListener('compositionupdate', (e) => {
      // Track composition updates but don't record as final keystrokes
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
    });

    // Enhanced input event with inputType for reliable character detection
    typingInput.addEventListener('input', (e) => {
      this.handleTypingInput(e);
    });

    // Keydown for additional handling (non-composition events)
    typingInput.addEventListener('keydown', (e) => {
      if (this.compositionActive || e.keyCode === 229) {
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
    typingInput.addEventListener('copy', e => e.preventDefault());
    typingInput.addEventListener('cut', e => e.preventDefault());
    typingInput.addEventListener('drop', e => e.preventDefault());
    typingInput.addEventListener('contextmenu', e => e.preventDefault());

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

  // Enhanced mobile-friendly keystroke detection using inputType
  handleTypingInput(e) {
    const { inputType, data } = e;
    const inputEl = e.target;
    const value = inputEl.value;
    const pos = inputEl.selectionStart || value.length;
    const timestamp = performance.now();

    // Handle deletion events (backspace, delete)
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
    // Handle text insertion
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
    // Handle other input types
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

  // Enhanced character detection with better mobile support
  getActualTypedCharacter(e, inputValue = '') {
    // Handle mobile IME / virtual keyboard composition events
    if (e.keyCode === 229 || e.key === 'Unidentified' || e.key === 'Process') {
      if (inputValue.length > this.lastInputLength) {
        return inputValue.slice(-1);
      }
      return null;
    }

    // Handle well-known special keys
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

    // Handle printable characters
    if (e.key && e.key.length === 1) {
      return e.key;
    }

    // Fallback for older browsers
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
          crystal.classList.add('tap-feedback', 'active');
          setTimeout(() => {
            crystal.classList.remove('tap-feedback', 'active');
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
        } else if (phase === 'move' && this.crystalState.isRotating && touches.length === 2) {
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
        } else if (phase === 'end' && touches.length < 2) {
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

  // Gallery Methods
  initializeGallery() {
    const grid = document.getElementById('gallery-grid');
    grid.innerHTML = '';

    this.galleryImages.forEach((url, index) => {
      const imageContainer = document.createElement('div');
      imageContainer.className = 'gallery-item';
      imageContainer.setAttribute('tabindex', '0');
      imageContainer.setAttribute('role', 'button');
      imageContainer.setAttribute('aria-label', `View image ${index + 1}`);

      const img = document.createElement('img');
      img.src = url;
      img.alt = `Gallery image ${index + 1}`;
      img.loading = 'lazy';

      imageContainer.appendChild(img);
      imageContainer.addEventListener('click', () => this.openImagePopup(index));
      imageContainer.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.openImagePopup(index);
        }
      });

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

    // Handle double-tap detection for mobile
    if (!this.galleryZoom.isPinching && e.changedTouches.length === 1) {
      const endX = e.changedTouches[0].clientX;
      const diffX = this.galleryTouchStart.x - endX;
      const currentTime = Date.now();

      // Check for swipe gesture (navigation)
      if (Math.abs(diffX) > 50 && this.galleryZoom.scale <= 1.1) {
        if (diffX > 0) {
          this.nextGalleryImage();
        } else {
          this.prevGalleryImage();
        }
      } else {
        // Check for double-tap zoom
        const timeSinceLastTap = currentTime - this.galleryZoom.lastTapTime;
        if (timeSinceLastTap <= this.galleryZoom.doubleTapThreshold) {
          // Double-tap detected
          this.handleDoubleTapZoom(e.changedTouches[0]);
        }
        this.galleryZoom.lastTapTime = currentTime;
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

  // Double-tap zoom handler for mobile
  handleDoubleTapZoom(touch) {
    const popup = document.querySelector('.image-popup.active');
    if (!popup) return;

    const rect = popup.getBoundingClientRect();
    const centerX = touch.clientX - rect.left;
    const centerY = touch.clientY - rect.top;

    if (this.galleryZoom.scale > 1.1) {
      // Zoom out to original size
      this.resetZoom();
    } else {
      // Zoom in to 2x scale
      this.galleryZoom.scale = this.galleryZoom.zoomLevel;
      this.updateImageTransform();
      this.updateZoomLevel();
    }

    // Record the double-tap event
    this.recordTouchEvent({
      timestamp: performance.now(),
      type: 'doubletap',
      touches: [{
        identifier: touch.identifier || 0,
        clientX: touch.clientX,
        clientY: touch.clientY,
        force: touch.force || 0.5
      }],
      step: this.currentGalleryImage + 1,
      taskId: 3,
      zoomAction: this.galleryZoom.scale > 1.1 ? 'zoom_in' : 'zoom_out'
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
        <button class="close-popup" aria-label="Close image">&times;</button>
        <div class="popup-image-container">
          <img class="popup-image" alt="Gallery image">
        </div>
        <div class="popup-counter"></div>
        <div class="zoom-controls">
          <button class="zoom-out" aria-label="Zoom out">-</button>
          <span class="zoom-level">100%</span>
          <button class="zoom-in" aria-label="Zoom in">+</button>
          <button class="zoom-reset" aria-label="Reset zoom">Reset</button>
        </div>
        <div class="popup-nav">
          <button class="popup-prev" aria-label="Previous image">‹</button>
          <button class="popup-next" aria-label="Next image">›</button>
        </div>
      </div>
    `;

    document.body.appendChild(popup);

    // Bind popup events
    popup.querySelector('.close-popup').addEventListener('click', () => this.closeImagePopup());
    popup.querySelector('.popup-overlay').addEventListener('click', () => this.closeImagePopup());
    popup.querySelector('.popup-prev').addEventListener('click', () => this.prevGalleryImage());
    popup.querySelector('.popup-next').addEventListener('click', () => this.nextGalleryImage());
    popup.querySelector('.zoom-in').addEventListener('click', () => this.zoomIn());
    popup.querySelector('.zoom-out').addEventListener('click', () => this.zoomOut());
    popup.querySelector('.zoom-reset').addEventListener('click', () => this.resetZoom());

    // **NEW: Add double-click zoom functionality for desktop**
    const popupImage = popup.querySelector('.popup-image');
    popupImage.addEventListener('dblclick', (e) => this.handleDoubleClickZoom(e));

    // **NEW: Add click event listener for mobile double-tap (fallback)**
    popupImage.addEventListener('click', (e) => this.handleImageClick(e));

    // Keyboard navigation
    popup.addEventListener('keydown', (e) => {
      switch(e.key) {
        case 'Escape':
          this.closeImagePopup();
          break;
        case 'ArrowLeft':
          this.prevGalleryImage();
          break;
        case 'ArrowRight':
          this.nextGalleryImage();
          break;
        case '+':
        case '=':
          this.zoomIn();
          break;
        case '-':
          this.zoomOut();
          break;
        case '0':
          this.resetZoom();
          break;
      }
    });

    popup.setAttribute('tabindex', '0');
  }

  // **NEW: Handle double-click zoom for desktop**
  handleDoubleClickZoom(e) {
    e.preventDefault();
    e.stopPropagation();

    if (this.galleryZoom.scale > 1.1) {
      // Zoom out to original size
      this.resetZoom();
    } else {
      // Zoom in to specified zoom level
      this.galleryZoom.scale = this.galleryZoom.zoomLevel;
      this.updateImageTransform();
      this.updateZoomLevel();
    }

    // Record the double-click event
    this.recordTouchEvent({
      timestamp: performance.now(),
      type: 'doubleclick',
      touches: [{
        identifier: 0,
        clientX: e.clientX,
        clientY: e.clientY,
        force: 0.5
      }],
      step: this.currentGalleryImage + 1,
      taskId: 3,
      zoomAction: this.galleryZoom.scale > 1.1 ? 'zoom_in' : 'zoom_out'
    });
  }

  // **NEW: Handle single click events (for mobile double-tap detection fallback)**
  handleImageClick(e) {
    const currentTime = Date.now();
    const timeSinceLastClick = currentTime - this.galleryZoom.lastClickTime;

    if (timeSinceLastClick <= this.galleryZoom.doubleClickThreshold) {
      // Double-click detected (fallback for mobile devices that don't support dblclick)
      this.handleDoubleClickZoom(e);
    } else {
      // Single click - set up timer for potential double-click
      if (this.galleryZoom.clickTimeout) {
        clearTimeout(this.galleryZoom.clickTimeout);
      }
    }

    this.galleryZoom.lastClickTime = currentTime;
  }

  closeImagePopup() {
    const popup = document.querySelector('.image-popup');
    if (popup) {
      popup.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  updatePopupImage() {
    const img = document.querySelector('.popup-image');
    const counter = document.querySelector('.popup-counter');
    
    if (img && counter) {
      img.src = this.galleryImages[this.currentGalleryImage];
      counter.textContent = `${this.currentGalleryImage + 1} / ${this.galleryImages.length}`;
    }
  }

  nextGalleryImage() {
    this.currentGalleryImage = (this.currentGalleryImage + 1) % this.galleryImages.length;
    this.updatePopupImage();
    this.resetZoom();
  }

  prevGalleryImage() {
    this.currentGalleryImage = (this.currentGalleryImage - 1 + this.galleryImages.length) % this.galleryImages.length;
    this.updatePopupImage();
    this.resetZoom();
  }

  zoomIn() {
    this.galleryZoom.scale = Math.min(3.0, this.galleryZoom.scale * 1.2);
    this.updateImageTransform();
    this.updateZoomLevel();
  }

  zoomOut() {
    this.galleryZoom.scale = Math.max(0.5, this.galleryZoom.scale / 1.2);
    this.updateImageTransform();
    this.updateZoomLevel();
  }

  resetZoom() {
    this.galleryZoom.scale = 1;
    this.galleryZoom.translateX = 0;
    this.galleryZoom.translateY = 0;
    this.updateImageTransform();
    this.updateZoomLevel();
  }

  updateImageTransform() {
    const img = document.querySelector('.popup-image');
    if (img) {
      img.style.transform = `scale(${this.galleryZoom.scale}) translate(${this.galleryZoom.translateX}px, ${this.galleryZoom.translateY}px)`;
    }
  }

  updateZoomLevel() {
    const zoomLevel = document.querySelector('.zoom-level');
    if (zoomLevel) {
      zoomLevel.textContent = `${Math.round(this.galleryZoom.scale * 100)}%`;
    }
  }

  // Export Methods
  exportKeystrokeData() {
    const data = {
      participantId: this.participantId,
      taskType: 'keystroke',
      timestamp: new Date().toISOString(),
      data: this.keystrokeData,
      summary: {
        totalKeystrokes: this.keystrokeData.length,
        sentences: this.sentences.length,
        averageTypingSpeed: this.calculateTypingSpeed(),
        accuracy: this.calculateOverallAccuracy()
      }
    };

    this.downloadJSON(data, `keystroke_data_${this.participantId}.json`);
  }

  exportTouchData() {
    const data = {
      participantId: this.participantId,
      taskType: 'touch',
      timestamp: new Date().toISOString(),
      data: this.touchData,
      summary: {
        totalTouchEvents: this.touchData.length,
        crystalSteps: this.crystalSteps.length,
        galleryImages: this.galleryImages.length
      }
    };

    this.downloadJSON(data, `touch_data_${this.participantId}.json`);
  }

  calculateTypingSpeed() {
    if (this.keystrokeData.length < 2) return 0;
    
    const firstKeystroke = this.keystrokeData[0];
    const lastKeystroke = this.keystrokeData[this.keystrokeData.length - 1];
    const timeElapsed = (lastKeystroke.timestamp - firstKeystroke.timestamp) / 1000 / 60; // minutes
    
    const totalCharacters = this.keystrokeData.filter(k => k.actualChar && k.actualChar.length === 1).length;
    return Math.round(totalCharacters / timeElapsed);
  }

  calculateOverallAccuracy() {
    // Calculate based on final text accuracy for all sentences
    let totalAccuracy = 0;
    for (let i = 0; i < this.sentences.length; i++) {
      // This would need to be stored during typing task
      totalAccuracy += 100; // Simplified for this example
    }
    return Math.round(totalAccuracy / this.sentences.length);
  }

  downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.biometricCollector = new BiometricDataCollector();
});
