// NOTE: This file assumes 'paragraphData' is loaded from 'content.js'

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
    timeSelector: $('#time-selector'),
    helpMessage: $('#help-message'),
    
    paragraphSelectorContainer: $('#paragraph-selector-container'), 
    startTestBtn: $('#start-test-btn'),
    levelTabs: $all('.level-tab'), 
    
    // MODAL ELEMENTS
    resultsModal: $('#results-modal'),
    modalRestartBtn: $('#modal-restart-btn'),
    modalCloseBtn: $('#modal-close-btn'), 
    finalWpm: $('#final-wpm'),
    finalAccuracy: $('#final-accuracy'),
    finalErrors: $('#final-errors')
};

// --- State Variables ---
let currentState = {
    selectedText: '',
    typedText: '',
    // 'displayErrors' tracks current WRONG characters for highlighting
    displayErrors: 0,
    // 'totalErrors' tracks ALL errors, even if corrected (for persistent accuracy)
    totalErrors: 0, 
    startTime: 0,
    timeLimit: 60, 
    timerInterval: null,
    isRunning: false,
    currentLevel: 'easy',
    hasError: false 
};

// --- Core Functions ---

function autoScroll() {
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

function loadParagraphTitles(level) {
    currentState.currentLevel = level;
    elements.paragraphList.innerHTML = '';
    
    const filteredData = typeof paragraphData !== 'undefined' ? paragraphData.filter(p => p.level === level) : [];

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

function selectParagraph(id) {
    if (currentState.isRunning) {
        console.warn('Cannot select a new paragraph while the test is running.');
        return; 
    }
    
    clearInterval(currentState.timerInterval);
    currentState.isRunning = false;
    currentState.typedText = '';
    currentState.displayErrors = 0;
    currentState.totalErrors = 0; // RESET totalErrors
    currentState.hasError = false; 
    elements.typingInput.value = ''; 
    elements.typingInput.blur(); 
    
    const paragraph = paragraphData.find(p => p.id === id);
    if (!paragraph) return;

    currentState.selectedText = paragraph.text;
    elements.textDisplay.innerHTML = '';
    elements.textDisplay.scrollTop = 0; 

    paragraph.text.split('').forEach((char, index) => {
        const span = document.createElement('span');
        span.innerText = char;
        if (index === 0) {
            span.classList.add('current'); 
        }
        elements.textDisplay.appendChild(span);
    });

    $all('.paragraph-title').forEach(el => el.classList.remove('active'));
    $(`[data-id="${id}"]`).classList.add('active');

    elements.timerSpan.innerText = currentState.timeLimit;
    elements.wpmSpan.innerText = 0;
    elements.accuracySpan.innerText = 100;
    elements.resultsModal.style.display = 'none';
    elements.paragraphSelectorContainer.classList.remove('disabled'); 
    elements.levelTabs.forEach(tab => tab.classList.remove('disabled'));

    elements.typingInput.focus();
    elements.startTestBtn.disabled = false;
    elements.helpMessage.innerText = "Paragraph selected. Click 'Start Test' or begin typing to start!";
    elements.helpMessage.style.display = 'block';
}

function handleInput(event) {
    if (currentState.selectedText === '') return; 
    
    const { value } = elements.typingInput;

    if (!currentState.isRunning && value.length > 0) {
        startTest();
    }
    
    // Check if the user is DELETING
    const isDeleting = event.inputType === 'deleteContentBackward';
    const oldLength = currentState.typedText.length;

    // STRICT MODE CHECK (Uncorrected error means no forward typing)
    if (currentState.hasError && !isDeleting) {
        if (value.length > oldLength) {
            elements.typingInput.value = currentState.typedText;
            return; 
        }
    }
    
    // --- CORE TYPING LOGIC ---
    // Check if the character typed just NOW was an error and UPDATE totalErrors
    if (!isDeleting && value.length > oldLength) {
        const charIndex = oldLength; // New character is at old length index
        const expectedChar = currentState.selectedText[charIndex];
        const typedChar = value[charIndex];
        
        // If the newly typed character is WRONG, increment totalErrors
        if (typedChar && typedChar !== expectedChar) {
            currentState.totalErrors++;
        }
    }
    
    currentState.typedText = value;
    let displayErrors = 0;
    const spans = $all('#text-display span');
    
    // Re-highlight the text based on current value
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
            displayErrors++; // Only count visible errors for UI
        }
    });

    // Update state variables
    currentState.displayErrors = displayErrors;
    
    // Determine if the current position is an error (for strict mode)
    const currentTypedLength = currentState.typedText.length;
    let currentPositionError = false;
    if (currentTypedLength > 0 && currentState.selectedText[currentTypedLength - 1] !== currentState.typedText[currentTypedLength - 1]) {
        currentPositionError = true;
    }
    currentState.hasError = currentPositionError; 
    
    autoScroll(); 
    updateMetrics(); // Real-time update

    if (currentState.typedText.length === currentState.selectedText.length) {
        endTest(true); 
    }
}

function startTest() {
    if (currentState.selectedText === '' || currentState.isRunning) return; 
    
    currentState.isRunning = true;
    currentState.startTime = Date.now();
    elements.helpMessage.style.display = 'none';
    elements.textDisplay.scrollTop = 0; 
    elements.resultsModal.style.display = 'none'; 

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

function endTest(completed, silent = false) {
    currentState.isRunning = false;
    clearInterval(currentState.timerInterval);
    
    updateMetrics(); // Final update

    elements.paragraphSelectorContainer.classList.remove('disabled');
    elements.levelTabs.forEach(tab => tab.classList.remove('disabled'));
    elements.startTestBtn.disabled = false;

    if (silent) return; 

    const wpm = elements.wpmSpan.innerText;
    const accuracy = elements.accuracySpan.innerText;
    
    elements.finalWpm.innerText = wpm;
    elements.finalAccuracy.innerText = `${accuracy}%`;
    elements.finalErrors.innerText = currentState.totalErrors; // Show total errors including corrected ones
    
    elements.resultsModal.style.display = 'flex'; 
    elements.typingInput.blur();
}

function resetTest(fullReset = true) {
    // Basic state reset
    clearInterval(currentState.timerInterval);
    currentState.isRunning = false;
    currentState.typedText = '';
    currentState.displayErrors = 0;
    currentState.totalErrors = 0; // RESET totalErrors
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
        // Full Reset: Go back to initial state (Select Paragraph screen)
        currentState.selectedText = '';
        elements.textDisplay.innerHTML = '<span class="placeholder">Select a Level and then choose a Title to begin!</span>';
        $all('.paragraph-title').forEach(el => el.classList.remove('active'));
        elements.startTestBtn.disabled = true; 
        elements.helpMessage.innerText = "Select a Level and a Title to begin!";
        elements.helpMessage.style.display = 'block';

        loadParagraphTitles(currentState.currentLevel);

    } else {
        // Quick Reset: Restart current paragraph
        if (currentState.selectedText) {
             const activeId = $all('.paragraph-title.active')[0]?.dataset.id;
             if (activeId) {
                selectParagraph(parseInt(activeId)); 
             }
             elements.startTestBtn.disabled = false;
             elements.helpMessage.style.display = 'block';
             elements.helpMessage.innerText = "Paragraph selected. Click 'Start Test' or begin typing to start!";
        }
    }
    
    elements.typingInput.focus(); 
}

function updateMetrics() {
    const typedChars = currentState.typedText.length;
    
    if (typedChars === 0 && !currentState.isRunning) return;

    // Corrected Characters (used for WPM)
    const correctedChars = typedChars - currentState.displayErrors;
    
    // Total Keystrokes attempted: Correctly typed characters + ALL errors (visible or corrected)
    // This is the total attempt count, used as the denominator for accuracy.
    const totalKeystrokes = typedChars + currentState.totalErrors; 

    let timeElapsed;
    
    if (currentState.isRunning) {
         timeElapsed = (Date.now() - currentState.startTime) / 60000;
    } else {
         const timerValue = parseInt(elements.timerSpan.innerText);
         timeElapsed = (currentState.timeLimit - timerValue) / 60;
         
         if (timeElapsed <= 0 && typedChars === currentState.selectedText.length) {
              timeElapsed = (Date.now() - currentState.startTime) / 60000;
         } else if (timeElapsed <= 0) {
              timeElapsed = currentState.timeLimit / 60;
         }
    }

    // WPM: Based on CORRECTED characters
    const wpm = timeElapsed > 0 ? Math.round((correctedChars / 5) / timeElapsed) : 0;
    
    // Accuracy: (Typed Characters - Display Errors) / Total Keystrokes (Typed + Total Errors)
    // This is the calculation for persistent error counting.
    const netAccuracy = (totalKeystrokes === 0) 
        ? 100 
        : Math.max(0, Math.round(((typedChars - currentState.displayErrors) / totalKeystrokes) * 100));
        
    
    elements.wpmSpan.innerText = wpm;
    elements.accuracySpan.innerText = netAccuracy;
}


function changeTheme(theme) {
    elements.body.className = `theme-${theme}`;
}

function handleLevelChange(newLevel) {
    if (currentState.isRunning) return; 

    elements.levelTabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.level === newLevel) {
            tab.classList.add('active');
        }
    });

    currentState.currentLevel = newLevel;
    
    elements.textDisplay.innerHTML = '<span class="placeholder">Select a Title from the current Level to begin!</span>';
    loadParagraphTitles(newLevel);
    
    resetTest(true); 
}

function handleTimeChange(e) {
    currentState.timeLimit = parseInt(e.target.value);
    resetTest(true);
}


// --- Event Listeners ---
elements.typingInput.addEventListener('input', handleInput);
elements.startTestBtn.addEventListener('click', startTest);
elements.restartBtn.addEventListener('click', () => resetTest(false)); 
elements.modalRestartBtn.addEventListener('click', () => resetTest(true));

// FIX: Cross button triggers a full reset to prevent continuation.
elements.modalCloseBtn.addEventListener('click', () => {
    elements.resultsModal.style.display = 'none';
    resetTest(true); 
    elements.typingInput.focus(); 
});

elements.themeSelector.addEventListener('change', (e) => changeTheme(e.target.value));
elements.timeSelector.addEventListener('change', handleTimeChange); 

elements.levelTabs.forEach(tab => {
    tab.addEventListener('click', (e) => handleLevelChange(e.target.dataset.level));
});


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    const initialLevel = elements.levelTabs[0].dataset.level;
    currentState.currentLevel = initialLevel;
    
    loadParagraphTitles(initialLevel);
    currentState.timeLimit = parseInt(elements.timeSelector.value);
    resetTest(true); 
});