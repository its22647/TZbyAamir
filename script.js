// NOTE: This file assumes 'paragraphData' is loaded from 'content.js'

// --- DOM Selectors ---
const $ = selector => document.querySelector(selector);
const $all = selector => document.querySelectorAll(selector);

const elements = {
    body: $('body'),
    // Updated: Replaced paragraphList with paragraphSelector
    paragraphSelector: $('#paragraph-selector'),
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
    
    // Mode Selector Elements
    strictModeBtn: $('#strict-mode-btn'), 
    zenModeBtn: $('#zen-mode-btn'),
    modeOptions: $all('.mode-option'),

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
    displayErrors: 0,
    totalErrors: 0, 
    startTime: 0,
    timeLimit: 60, 
    timerInterval: null,
    isRunning: false,
    currentLevel: 'easy',
    hasError: false,
    currentMode: 'strict' 
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

// Update to load titles into the SELECT dropdown
function loadParagraphTitles(level) {
    currentState.currentLevel = level;
    elements.paragraphSelector.innerHTML = '';
    elements.paragraphSelector.disabled = true;

    const filteredData = typeof paragraphData !== 'undefined' ? paragraphData.filter(p => p.level === level) : [];

    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.innerText = filteredData.length > 0 ? `Select a paragraph (${filteredData.length} available)` : `No paragraphs for this level`;
    defaultOption.disabled = true;
    defaultOption.selected = true;
    elements.paragraphSelector.appendChild(defaultOption);

    if (filteredData.length > 0) {
        filteredData.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.innerText = p.title;
            elements.paragraphSelector.appendChild(option);
        });
        elements.paragraphSelector.disabled = false;
    }
}

// Function to select paragraph by ID from the dropdown value
function selectParagraph(id) {
    // Convert ID to integer as it comes as string from select value
    const paragraphId = parseInt(id);

    if (currentState.isRunning || !paragraphId) {
        // If test is running or no valid ID is selected, just return
        return; 
    }
    
    clearInterval(currentState.timerInterval);
    currentState.isRunning = false;
    currentState.typedText = '';
    currentState.displayErrors = 0;
    currentState.totalErrors = 0;
    currentState.hasError = false; 
    elements.typingInput.value = ''; 
    elements.typingInput.blur(); 
    
    const paragraph = paragraphData.find(p => p.id === paragraphId);
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
    
    // Apply Mode class
    if (currentState.currentMode === 'zen') {
        elements.textDisplay.classList.add('zen-mode');
    } else {
        elements.textDisplay.classList.remove('zen-mode');
    }

    // Ensure the dropdown shows the active selection
    elements.paragraphSelector.value = paragraphId;

    elements.timerSpan.innerText = currentState.timeLimit;
    elements.wpmSpan.innerText = 0;
    elements.accuracySpan.innerText = 100;
    elements.resultsModal.style.display = 'none';
    elements.paragraphSelectorContainer.classList.remove('disabled'); 
    elements.levelTabs.forEach(tab => tab.classList.remove('disabled'));

    elements.typingInput.focus();
    elements.startTestBtn.disabled = false;
    
    updateHelpMessage();
}

function updateHelpMessage() {
    elements.helpMessage.style.display = 'block';
    if (currentState.selectedText === '') {
        elements.helpMessage.innerText = "Select a Level and a Title to begin!";
    } else if (currentState.currentMode === 'strict') {
        elements.helpMessage.innerText = "Strict Mode 🔒: Typing stops on the first error. Go for 100% accuracy!";
    } else {
        elements.helpMessage.innerText = "Zen Mode 🧘: Errors will not stop your typing, and the text will not highlight errors.";
    }
}

function handleInput(event) {
    if (currentState.selectedText === '') return; 
    
    const { value } = elements.typingInput;

    if (!currentState.isRunning && value.length > 0) {
        startTest();
    }
    
    const isDeleting = event.inputType === 'deleteContentBackward';
    const oldLength = currentState.typedText.length;

    // STRICT MODE CHECK (Stop typing if error exists and mode is strict)
    if (currentState.currentMode === 'strict' && currentState.hasError && !isDeleting) {
        if (value.length > oldLength) {
            elements.typingInput.value = currentState.typedText;
            return; 
        }
    }
    
    // ERROR TRACKING FOR METRICS (Works in both modes)
    if (!isDeleting && value.length > oldLength) {
        const charIndex = oldLength; 
        const expectedChar = currentState.selectedText[charIndex];
        const typedChar = value[charIndex];
        
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
            displayErrors++; 
        }
    });

    currentState.displayErrors = displayErrors;
    
    // Update hasError flag for Strict Mode check
    let currentPositionError = false;
    const currentTypedLength = currentState.typedText.length;
    if (currentTypedLength > 0 && currentState.selectedText[currentTypedLength - 1] !== currentState.typedText[currentTypedLength - 1]) {
        currentPositionError = true;
    }
    currentState.hasError = currentPositionError; 
    
    autoScroll(); 
    updateMetrics(); 

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

    elements.typingInput.focus(); 

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
    
    updateMetrics(); 

    elements.paragraphSelectorContainer.classList.remove('disabled');
    elements.levelTabs.forEach(tab => tab.classList.remove('disabled'));
    elements.startTestBtn.disabled = false;

    if (silent) return; 

    const wpm = elements.wpmSpan.innerText;
    const accuracy = elements.accuracySpan.innerText;
    
    elements.finalWpm.innerText = wpm;
    elements.finalAccuracy.innerText = `${accuracy}%`;
    elements.finalErrors.innerText = currentState.totalErrors; 
    
    elements.resultsModal.style.display = 'flex'; 
    elements.typingInput.blur();
}

function resetTest(fullReset = true) {
    // Basic state reset
    clearInterval(currentState.timerInterval);
    currentState.isRunning = false;
    currentState.typedText = '';
    currentState.displayErrors = 0;
    currentState.totalErrors = 0;
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
    
    // Apply Mode class based on current state
    if (currentState.currentMode === 'zen') {
        elements.textDisplay.classList.add('zen-mode');
    } else {
        elements.textDisplay.classList.remove('zen-mode');
    }

    if (fullReset) {
        currentState.selectedText = '';
        elements.textDisplay.innerHTML = '<span class="placeholder">Select a Level and then choose a Title to begin!</span>';
        elements.paragraphSelector.value = ''; // Reset dropdown
        elements.startTestBtn.disabled = true; 
        
        loadParagraphTitles(currentState.currentLevel);

    } else {
        if (currentState.selectedText) {
             const activeId = elements.paragraphSelector.value;
             if (activeId) {
                // Quickly re-select paragraph to re-render spans
                selectParagraph(activeId); 
             }
             elements.startTestBtn.disabled = false;
        }
    }
    
    updateHelpMessage();
    elements.typingInput.focus(); 
}

function updateMetrics() {
    const typedChars = currentState.typedText.length;
    
    if (typedChars === 0 && !currentState.isRunning) return;

    const correctedChars = typedChars - currentState.displayErrors;
    // Total keystrokes is all typed characters (good/bad) + all historical bad characters
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

    const wpm = timeElapsed > 0 ? Math.round((correctedChars / 5) / timeElapsed) : 0;
    
    // Accuracy: (Correct Characters typed) / (Total Keystrokes)
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
    
    // Reset to initial state after level change
    resetTest(true); 
}

function handleModeChange(mode) {
    if (currentState.isRunning || currentState.currentMode === mode) return; 

    currentState.currentMode = mode;
    
    elements.modeOptions.forEach(btn => btn.classList.remove('active'));
    $(`[data-mode="${mode}"]`).classList.add('active');
    
    // Reset test to apply mode and update help message/text styling
    if (currentState.selectedText) {
        resetTest(false);
    } else {
        resetTest(true);
    }
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

// NEW LISTENER for Paragraph Dropdown change
elements.paragraphSelector.addEventListener('change', (e) => selectParagraph(e.target.value));

// LISTENERS for Mode Selector
elements.strictModeBtn.addEventListener('click', () => handleModeChange('strict'));
elements.zenModeBtn.addEventListener('click', () => handleModeChange('zen'));

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