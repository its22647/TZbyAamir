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
    // LEVEL SELECTOR REMOVED - Using Tabs now
    timeSelector: $('#time-selector'),
    helpMessage: $('#help-message'),
    
    // NEW SELECTORS
    paragraphSelectorContainer: $('#paragraph-selector-container'), 
    startTestBtn: $('#start-test-btn'),
    levelTabs: $all('.level-tab'), // NEW: All level tabs
    
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
    currentLevel: 'easy', // Default level set to easy
    hasError: false 
};

// --- Core Functions ---

// Auto-Scroll Logic 
function autoScroll() {
    // ... (logic remains the same) ...
    const currentSpan = $('.current');
    if (!currentSpan) return;

    const display = elements.textDisplay;
    const currentPos = currentSpan.offsetTop;
    const displayScrollTop = display.scrollTop;
    const displayHeight = display.clientHeight;

    const SCROLL_MARGIN = 150; 

    if (currentPos > displayScrollTop + displayHeight - SCROLL_MARGIN) {
        display.scrollTop += 60; 
    }
    
    if (currentPos < displayScrollTop) {
        display.scrollTop = currentPos - (displayHeight / 3) + 30; 
    }
}

// 1. UI: Paragraph titles load karna
function loadParagraphTitles(level) {
    currentState.currentLevel = level;
    elements.paragraphList.innerHTML = '';
    
    const filteredData = paragraphData.filter(p => p.level === level);

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
    if (currentState.isRunning) {
        console.warn('Cannot select a new paragraph while the test is running.');
        return; 
    }
    
    // 1. STATE CLEAR (Forceful reset of typing data)
    clearInterval(currentState.timerInterval);
    currentState.isRunning = false;
    currentState.typedText = '';
    currentState.errors = 0;
    currentState.hasError = false; 
    elements.typingInput.value = ''; 
    elements.typingInput.blur(); // Focus temporarily removed
    
    // 2. GET NEW DATA
    const paragraph = paragraphData.find(p => p.id === id);
    if (!paragraph) return;

    // 3. Update Current State
    currentState.selectedText = paragraph.text;
    elements.textDisplay.innerHTML = '';
    elements.textDisplay.scrollTop = 0; 

    // 4. RENDER TEXT
    paragraph.text.split('').forEach((char, index) => {
        const span = document.createElement('span');
        span.innerText = char;
        if (index === 0) {
            span.classList.add('current'); 
        }
        elements.textDisplay.appendChild(span);
    });

    // 5. UI: Previous Deselect and New Activate
    $all('.paragraph-title').forEach(el => el.classList.remove('active'));
    $(`[data-id="${id}"]`).classList.add('active');

    // 6. UI: Metrics and Buttons Reset
    elements.timerSpan.innerText = currentState.timeLimit;
    elements.wpmSpan.innerText = 0;
    elements.accuracySpan.innerText = 100;
    elements.resultsModal.style.display = 'none';
    elements.paragraphSelectorContainer.classList.remove('disabled'); 
    elements.levelTabs.forEach(tab => tab.classList.remove('disabled'));

    
    // Final focus and ready state
    elements.typingInput.focus();
    elements.startTestBtn.disabled = false;
    elements.helpMessage.innerText = "Paragraph selected. Click 'Start Test' or begin typing to start!";
    elements.helpMessage.style.display = 'block';
}

// 3. Logic: Typing aur Comparison
function handleInput(event) {
    if (currentState.selectedText === '') return; 
    
    const { value } = elements.typingInput;

    // Start test automatically if typing begins before button click (Fallback)
    if (!currentState.isRunning && value.length > 0) {
        startTest();
    }
    
    // ... (rest of handleInput logic remains the same for strict mode and comparison) ...
    // ... (Only the comparison part is shown for brevity in this comment)
    
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
    
    spans.forEach((span, index) => {
        const expectedChar = currentState.selectedText[index];
        const typedChar = currentState.typedText[index];

        span.classList.remove('correct', 'incorrect', 'current'); 
        
        if (typedChar === undefined) {
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

    const currentTypedLength = currentState.typedText.length;
    let currentPositionError = false;
    if (currentTypedLength > 0 && currentState.selectedText[currentTypedLength - 1] !== currentState.typedText[currentTypedLength - 1]) {
        currentPositionError = true;
    }

    currentState.errors = errors;
    currentState.hasError = currentPositionError; 
    
    autoScroll(); 
    updateMetrics();

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

    // Sidebar/Tabs aur Start Button Disable karna
    elements.paragraphSelectorContainer.classList.add('disabled');
    elements.levelTabs.forEach(tab => tab.classList.add('disabled'));
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

    // Sidebar/Tabs aur Start Button Enable karna
    elements.paragraphSelectorContainer.classList.remove('disabled');
    elements.levelTabs.forEach(tab => tab.classList.remove('disabled'));
    elements.startTestBtn.disabled = false;

    if (silent) return; 

    const wpm = elements.wpmSpan.innerText;
    const accuracy = elements.accuracySpan.innerText;
    
    elements.finalWpm.innerText = wpm;
    elements.finalAccuracy.innerText = `${accuracy}%`;
    elements.finalErrors.innerText = currentState.errors;
    
    elements.resultsModal.style.display = 'block';
    elements.typingInput.blur();
}

// Restart State Clear Fix
function resetTest(fullReset = true) {
    // Basic state reset
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
    elements.resultsModal.style.display = 'none'; 
    elements.paragraphSelectorContainer.classList.remove('disabled'); 
    elements.levelTabs.forEach(tab => tab.classList.remove('disabled'));

    $all('#text-display span').forEach(span => {
        span.classList.remove('correct', 'incorrect', 'current');
    });

    if (fullReset) {
        // Full Reset: Go back to initial state
        currentState.selectedText = '';
        elements.textDisplay.innerHTML = '<span class="placeholder">Select a Level and then choose a Title to begin!</span>';
        $all('.paragraph-title').forEach(el => el.classList.remove('active'));
        elements.startTestBtn.disabled = true; 
        elements.helpMessage.innerText = "Select a Level and a Title to begin!";
        elements.helpMessage.style.display = 'block';

        // Re-load titles for the active tab (which is 'easy' by default on full reset)
        loadParagraphTitles(currentState.currentLevel);

    } else {
        // Quick Reset: Restart current paragraph
        if (currentState.selectedText) {
             const activeId = $all('.paragraph-title.active')[0]?.dataset.id;
             if (activeId) {
                // Re-select paragraph to reload text and set cursor
                selectParagraph(parseInt(activeId)); 
             }
             // Quick reset par Start button enable
             elements.startTestBtn.disabled = false;
             elements.helpMessage.style.display = 'block';
             elements.helpMessage.innerText = "Paragraph selected. Click 'Start Test' or begin typing to start!";
        }
    }
    
    elements.typingInput.focus(); 
}

// 5. Metrics Calculation
function updateMetrics() {
    // ... (logic remains the same) ...
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

// 7. UI: Level Tab Change (NEW FUNCTION)
function handleLevelChange(newLevel) {
    if (currentState.isRunning) return; // Block change if running

    // Deselect old active tab and activate new one
    elements.levelTabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.level === newLevel) {
            tab.classList.add('active');
        }
    });

    currentState.currentLevel = newLevel;
    
    // Clear display and load new titles
    elements.textDisplay.innerHTML = '<span class="placeholder">Select a Title from the current Level to begin!</span>';
    loadParagraphTitles(newLevel);
    
    // Reset buttons and help message
    resetTest(true); 
}

// 8. UI: Time Setting Change
function handleTimeChange(e) {
    currentState.timeLimit = parseInt(e.target.value);
    // Timer display update and full reset required
    resetTest(true);
}


// --- Event Listeners ---
elements.typingInput.addEventListener('input', handleInput);
elements.startTestBtn.addEventListener('click', startTest);
elements.restartBtn.addEventListener('click', () => resetTest(false)); 
elements.modalRestartBtn.addEventListener('click', () => resetTest(true));

elements.themeSelector.addEventListener('change', (e) => changeTheme(e.target.value));
elements.timeSelector.addEventListener('change', handleTimeChange); // Time selector uses its own handler

// New: Add listener for each level tab
elements.levelTabs.forEach(tab => {
    tab.addEventListener('click', (e) => handleLevelChange(e.target.dataset.level));
});


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Set initial active level
    const initialLevel = elements.levelTabs[0].dataset.level;
    currentState.currentLevel = initialLevel;
    
    // Load titles for the initial active level
    loadParagraphTitles(initialLevel);
    
    // Set initial time limit
    currentState.timeLimit = parseInt(elements.timeSelector.value);

    // Initial Full Reset (disables Start button)
    resetTest(true); 
});