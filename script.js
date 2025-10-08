// --- DOM Selectors ---
const $ = selector => document.querySelector(selector);
const $all = selector => document.querySelectorAll(selector);

const elements = {
    body: $('body'),
    paragraphList: $('#paragraph-list'),
    textDisplay: $('#text-display'),
    typingInput: $('#typing-input'),
    timerSpan: $('#timer'),
    wpmSpan: $('#wpm'),
    accuracySpan: $('#accuracy'),
    restartBtn: $('#restart-btn'),
    themeSelector: $('#theme-selector'),
    levelSelector: $('#level-selector'),
    timeSelector: $('#time-selector'),
    helpMessage: $('#help-message'),
    
    // NEW SELECTORS
    paragraphSelectorContainer: $('#paragraph-selector-container'), 
    startTestBtn: $('#start-test-btn'), 
    
    // MODAL ELEMENTS
    resultsModal: $('#results-modal'),
    modalRestartBtn: $('#modal-restart-btn'),
    finalWpm: $('#final-wpm'),
    finalAccuracy: $('#final-accuracy'),
    finalErrors: $('#final-errors')
};

// --- State Variables ---
let currentState = {
    selectedText: '',
    typedText: '',
    errors: 0,
    startTime: 0,
    timeLimit: 60, 
    timerInterval: null,
    isRunning: false,
    currentLevel: 'medium',
    hasError: false // Strict Mode Flag
};

// --- Core Functions ---

// Auto-Scroll Logic 
function autoScroll() {
    const currentSpan = $('.current');
    if (!currentSpan) return;

    const display = elements.textDisplay;
    const currentPos = currentSpan.offsetTop;
    const displayScrollTop = display.scrollTop;
    const displayHeight = display.clientHeight;

    const SCROLL_MARGIN = 150; 

    // Scroll Down
    if (currentPos > displayScrollTop + displayHeight - SCROLL_MARGIN) {
        display.scrollTop += 60; 
    }
    
    // Scroll Up (on backspace)
    if (currentPos < displayScrollTop) {
        display.scrollTop = currentPos - (displayHeight / 3) + 30; 
    }
}

// 1. UI: Paragraph titles load karna
function loadParagraphTitles() {
    elements.paragraphList.innerHTML = '';
    
    const filteredData = paragraphData.filter(p => p.level === currentState.currentLevel);

    if (filteredData.length === 0) {
        elements.paragraphList.innerHTML = '<p style="color:red; text-align:center;">No paragraphs found for this level!</p>';
        return;
    }

    filteredData.forEach(p => {
        const div = document.createElement('div');
        div.className = 'paragraph-title';
        div.innerText = p.title;
        div.dataset.id = p.id;
        div.addEventListener('click', () => selectParagraph(p.id));
        elements.paragraphList.appendChild(div);
    });
}

// 2. UI: Paragraph select karna aur display karna (FIXED LAG/SELECTION ISSUE)
function selectParagraph(id) {
    // 1. BLOCKING: Agar test chal raha hai, to koi bhi paragraph select na karen.
    if (currentState.isRunning) {
        console.warn('Cannot select a new paragraph while the test is running.');
        return; 
    }
    
    // 2. STATE CLEAR: Pichle input ko hamesha clear karein jab naya select ho raha ho.
    clearInterval(currentState.timerInterval);
    currentState.isRunning = false;
    currentState.typedText = '';
    currentState.errors = 0;
    currentState.hasError = false; 
    elements.typingInput.value = ''; // Input value clear

    // 3. GET NEW DATA
    const paragraph = paragraphData.find(p => p.id === id);
    if (!paragraph) return;

    // 4. Update Current State
    currentState.selectedText = paragraph.text;
    elements.textDisplay.innerHTML = '';
    elements.textDisplay.scrollTop = 0; // Scroll reset

    // 5. RENDER TEXT
    paragraph.text.split('').forEach((char, index) => {
        const span = document.createElement('span');
        span.innerText = char;
        if (index === 0) {
            span.classList.add('current'); 
        }
        elements.textDisplay.appendChild(span);
    });

    // 6. UI: Previous Deselect and New Activate
    $all('.paragraph-title').forEach(el => el.classList.remove('active'));
    $(`[data-id="${id}"]`).classList.add('active');

    // 7. UI: Metrics and Buttons Reset
    elements.timerSpan.innerText = currentState.timeLimit;
    elements.wpmSpan.innerText = 0;
    elements.accuracySpan.innerText = 100;
    elements.resultsModal.style.display = 'none';
    elements.paragraphSelectorContainer.classList.remove('disabled'); // Ensure selector is active

    
    // Final focus and ready state
    elements.typingInput.focus();
    elements.startTestBtn.disabled = false;
    elements.helpMessage.innerText = "Click 'Start Test' button or press the first key to begin!";
    elements.helpMessage.style.display = 'block';
}

// 3. Logic: Typing aur Comparison (handleInput - Strict Mode Implemented)
function handleInput(event) {
    if (currentState.selectedText === '') return; 
    
    const { value } = elements.typingInput;

    // Start test automatically if typing begins before button click (Fallback)
    if (!currentState.isRunning && value.length > 0) {
        startTest();
    }
    
    // STRICT MODE CHECK: Block new input if there's an error and user isn't using backspace
    if (currentState.hasError && event.inputType !== 'deleteContentBackward') {
        if (value.length > currentState.typedText.length) {
            elements.typingInput.value = currentState.typedText;
            return; 
        }
    }
    
    currentState.typedText = value;
    let errors = 0;
    const spans = $all('#text-display span');
    
    // Comparison Loop
    spans.forEach((span, index) => {
        const expectedChar = currentState.selectedText[index];
        const typedChar = currentState.typedText[index];

        // Clear all previous highlights
        span.classList.remove('correct', 'incorrect', 'current'); 
        
        if (typedChar === undefined) {
            // Set 'current' pointer
            if (index === currentState.typedText.length) {
                span.classList.add('current'); 
            }
        } else if (typedChar === expectedChar) {
            span.classList.add('correct');
        } else {
            span.classList.add('incorrect');
            errors++;
        }
    });

    // Check for errors at current position for strict mode
    const currentTypedLength = currentState.typedText.length;
    let currentPositionError = false;
    if (currentTypedLength > 0 && currentState.selectedText[currentTypedLength - 1] !== currentState.typedText[currentTypedLength - 1]) {
        currentPositionError = true;
    }

    currentState.errors = errors;
    
    // Update Strict Mode flag: True if the *last* character typed is an error
    currentState.hasError = currentPositionError; 
    
    autoScroll(); 
    updateMetrics();

    // Check for completion
    if (currentState.typedText.length === currentState.selectedText.length) {
        endTest(true); 
    }
}

// 4. Timer aur Test Controls
function startTest() {
    if (currentState.selectedText === '' || currentState.isRunning) return; 
    
    currentState.isRunning = true;
    currentState.startTime = Date.now();
    elements.helpMessage.style.display = 'none';
    elements.textDisplay.scrollTop = 0; 
    elements.resultsModal.style.display = 'none'; 

    // Sidebar aur Start Button Disable karna
    elements.paragraphSelectorContainer.classList.add('disabled');
    elements.startTestBtn.disabled = true;

    let timeLeft = currentState.timeLimit;
    elements.timerSpan.innerText = timeLeft;

    currentState.timerInterval = setInterval(() => {
        timeLeft--;
        elements.timerSpan.innerText = timeLeft;
        updateMetrics(); 

        if (timeLeft <= 0) {
            clearInterval(currentState.timerInterval);
            endTest(false); 
        }
    }, 1000);
}

// MODAL IMPLEMENTATION: endTest function
function endTest(completed, silent = false) {
    currentState.isRunning = false;
    clearInterval(currentState.timerInterval);
    
    updateMetrics(); 

    // Sidebar aur Start Button Enable karna
    elements.paragraphSelectorContainer.classList.remove('disabled');
    elements.startTestBtn.disabled = false;

    if (silent) return; // Agar test interrupt hua hai, to modal na dikhayein

    const wpm = elements.wpmSpan.innerText;
    const accuracy = elements.accuracySpan.innerText;
    
    // 1. Modal ke stats update karna
    elements.finalWpm.innerText = wpm;
    elements.finalAccuracy.innerText = `${accuracy}%`;
    elements.finalErrors.innerText = currentState.errors;
    
    // 2. Modal show karna
    elements.resultsModal.style.display = 'block';
    
    // 3. Input focus remove karna
    elements.typingInput.blur();
}

// Restart State Clear Fix
function resetTest(fullReset = true) {
    clearInterval(currentState.timerInterval);
    currentState.isRunning = false;
    currentState.typedText = '';
    currentState.errors = 0;
    currentState.hasError = false; 
    
    elements.typingInput.value = '';
    
    elements.timerSpan.innerText = currentState.timeLimit;
    elements.wpmSpan.innerText = 0;
    elements.accuracySpan.innerText = 100;
    elements.textDisplay.scrollTop = 0; 
    elements.resultsModal.style.display = 'none'; // Modal bhi band karna
    
    elements.paragraphSelectorContainer.classList.remove('disabled'); // Ensure sidebar is enabled on reset
    
    $all('#text-display span').forEach(span => {
        span.classList.remove('correct', 'incorrect', 'current');
    });

    if (fullReset) {
        currentState.selectedText = '';
        elements.textDisplay.innerHTML = '<span class="placeholder">Select a paragraph from the left to begin!</span>';
        $all('.paragraph-title').forEach(el => el.classList.remove('active'));
        // Full reset par Start button disable
        elements.startTestBtn.disabled = true; 
        elements.helpMessage.innerText = "Select a paragraph from the left to begin!";
        elements.helpMessage.style.display = 'block';

    } else {
        // Restart current test (Faster fix) - sirf pichla selected paragraph dobara load hoga.
        if (currentState.selectedText) {
             const activeId = $all('.paragraph-title.active')[0]?.dataset.id;
             if (activeId) {
                // Manually re-trigger selectParagraph to reload text and set focus
                selectParagraph(parseInt(activeId)); 
             }
             // Quick reset par Start button enable (kyunki paragraph selected hai)
             elements.startTestBtn.disabled = false;
             elements.helpMessage.style.display = 'block';
             elements.helpMessage.innerText = "Click 'Start Test' button or press the first key to begin!";
        }
    }
    
    elements.typingInput.focus(); 
}

// 5. Metrics Calculation (WPM & Accuracy)
function updateMetrics() {
    const totalChars = currentState.typedText.length;
    
    if (totalChars === 0 && !currentState.isRunning) return;

    const correctChars = totalChars - currentState.errors;
    const timeElapsed = (Date.now() - currentState.startTime) / 60000; 

    const wpm = timeElapsed > 0 ? Math.round((correctChars / 5) / timeElapsed) : 0;
    const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100;

    elements.wpmSpan.innerText = wpm;
    elements.accuracySpan.innerText = accuracy;
}

// 6. UI: Theme Change
function changeTheme(theme) {
    elements.body.className = `theme-${theme}`;
}

// 7. UI: Settings Change
function handleSettingsChange() {
    const newLevel = elements.levelSelector.value;
    const newTime = parseInt(elements.timeSelector.value);

    if (currentState.currentLevel !== newLevel || currentState.timeLimit !== newTime) {
        currentState.currentLevel = newLevel;
        currentState.timeLimit = newTime;
        loadParagraphTitles();
        currentState.selectedText = ''; 
        resetTest(true); 
    }
}

// --- Event Listeners ---
elements.typingInput.addEventListener('input', handleInput);
// Start Test button
elements.startTestBtn.addEventListener('click', startTest);
// Restart button on metrics bar (fast reset of current test)
elements.restartBtn.addEventListener('click', () => resetTest(false)); 
// Restart button inside modal (full reset to select new paragraph)
elements.modalRestartBtn.addEventListener('click', () => resetTest(true));

elements.themeSelector.addEventListener('change', (e) => changeTheme(e.target.value));
elements.levelSelector.addEventListener('change', handleSettingsChange);
elements.timeSelector.addEventListener('change', handleSettingsChange);


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    currentState.currentLevel = elements.levelSelector.value;
    currentState.timeLimit = parseInt(elements.timeSelector.value);
    
    loadParagraphTitles(); 
    resetTest(true); 
});