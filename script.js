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
    
    // NEW MODE SELECTOR ELEMENTS
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
    currentMode: 'strict' // Default is strict
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
    currentState.totalErrors = 0;
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
    
    // Apply Mode class
    if (currentState.currentMode === 'zen') {
        elements.textDisplay.classList.add('zen-mode');
    } else {
        elements.textDisplay.classList.remove('zen-mode');
    }


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
    
    // Update help message based on mode
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

    // FIX: Focus on Input
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
        $all('.paragraph-title').forEach(el => el.classList.remove('active'));
        elements.startTestBtn.disabled = true; 
        
        loadParagraphTitles(currentState.currentLevel);

    } else {
        if (currentState.selectedText) {
             const activeId = $all('.paragraph-title.active')[0]?.dataset.id;
             if (activeId) {
                // Quickly re-select paragraph to re-render spans
                selectParagraph(parseInt(activeId)); 
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

// NEW: Handle Mode Change
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

// NEW LISTENERS for Mode Selector
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