const twitchPlayer = document.getElementById('twitchPlayer');
const chatSidebar = document.getElementById('chatSidebar'); 
const twitchChatIframe = document.getElementById('twitchChatIframe');
const mainContent = document.getElementById('mainContent'); 
const chatIframeContainer = document.getElementById('chatIframeContainer');

const optionsToggleBtn = document.getElementById('optionsToggleBtn');
const optionsMenu = document.getElementById('optionsMenu');

const shrinkTwitchPlayerBtn = document.getElementById('shrinkTwitchPlayer');
const expandTwitchPlayerBtn = document.getElementById('expandTwitchPlayer');
const positionTopLeftBtn = document.getElementById('positionTopLeft');
const positionTopRightBtn = document.getElementById('positionTopRight');
const positionBottomLeftBtn = document.getElementById('positionBottomLeft');
const positionBottomRightBtn = document.getElementById('positionBottomRight');
const toggleChatDockBtn = document.getElementById('toggleChatDock');
const toggleTwitchPlayerVisibilityBtn = document.getElementById('toggleTwitchPlayerVisibility');
const toggleChatVisibilityBtn = document.getElementById('toggleChatVisibilityBtn');
const toggleBrowserFullscreenBtn = document.getElementById('toggleBrowserFullscreen');

const CHAT_VISIBLE_WIDTH = 350; 
const CHAT_MIN_WIDTH = 0; 

const ANIMATION_DURATION = 350; 
let isGlobalAnimating = false; 

let minTwitchWidth = 213;
let minTwitchHeight = 120;
let maxTwitchWidth = 854;
let maxTwitchHeight = 480;

const defaultTwitchWidth = 427;
const defaultTwitchHeight = 240;

let isPlayerDockedToChat = false; 
let isChatHidden = false; 
let isTwitchPlayerHidden = false; 
let currentTwitchPosition = 'topLeft'; // Śledzenie aktualnej pozycji, gdy nie jest zadokowany

function adjustKickPlayerSize() {
    const mainContentRect = mainContent.getBoundingClientRect();
    const aspectRatio = 16 / 9; 

    let kickWidth = mainContentRect.width;
    let kickHeight = kickWidth / aspectRatio;

    const kickPlayer = document.getElementById('kickPlayer');
    kickPlayer.style.width = '100%';
    kickPlayer.style.height = `${kickHeight}px`;
}

function setGlobalAnimationState(state) {
    isGlobalAnimating = state;
    const allMenuButtons = optionsMenu.querySelectorAll('button');
    allMenuButtons.forEach(btn => {
        if (state) {
            btn.classList.add('disabled-button');
            btn.setAttribute('disabled', 'true');
        } else {
            btn.classList.remove('disabled-button');
            btn.removeAttribute('disabled');
        }
    });
    if (state) {
        optionsToggleBtn.classList.add('disabled-button');
        optionsToggleBtn.setAttribute('disabled', 'true');
    } else {
        optionsToggleBtn.classList.remove('disabled-button');
        optionsToggleBtn.removeAttribute('disabled');
    }
}


// --- OBSŁUGA MENU OPCJI ---
let isMenuOpen = false;

function toggleOptionsMenu() {
    if (isGlobalAnimating) return; 
    isMenuOpen = !isMenuOpen;
    if (isMenuOpen) {
        optionsMenu.classList.add('show');
    } else {
        optionsMenu.classList.remove('show');
    }
}

optionsToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation(); 
    toggleOptionsMenu();
});

document.addEventListener('click', (e) => {
    if (isMenuOpen && !optionsMenu.contains(e.target) && e.target !== optionsToggleBtn) {
        toggleOptionsMenu();
    }
});

// --- ZARZĄDZANIE PLAYEREM TTV (ROZMIAR I POZYCJA) ---
function updateTwitchPlayer(newWidth = twitchPlayer.offsetWidth, newHeight = twitchPlayer.offsetHeight, newPosition = null) {
    if (isGlobalAnimating) return; 
    setGlobalAnimationState(true); 

    // Obliczanie nowego rozmiaru
    let finalWidth = Math.min(Math.max(newWidth, minTwitchWidth), maxTwitchWidth);
    let finalHeight = (finalWidth * 9) / 16;
    finalHeight = Math.min(Math.max(finalHeight, minTwitchHeight), maxTwitchHeight);

    // Zastosuj nowy rozmiar
    twitchPlayer.style.width = `${finalWidth}px`;
    twitchPlayer.style.height = `${finalHeight}px`;

    // Obsługa opacity (widoczności) Twitcha
    if (isTwitchPlayerHidden) {
        twitchPlayer.style.opacity = '0';
    } else {
        twitchPlayer.style.opacity = '1';
    }

    // Obliczanie nowej pozycji
    if (newPosition) {
        const kickPlayerRect = document.getElementById('kickPlayer').getBoundingClientRect();
        const padding = 10; 

        let targetLeft, targetTop;

        switch (newPosition) {
            case 'topLeft':
                targetLeft = kickPlayerRect.left + padding;
                targetTop = kickPlayerRect.top + padding;
                currentTwitchPosition = 'topLeft'; // Aktualizuj, że jest na tej pozycji
                break;
            case 'topRight':
                targetLeft = kickPlayerRect.right - finalWidth - padding;
                targetTop = kickPlayerRect.top + padding;
                currentTwitchPosition = 'topRight'; // Aktualizuj, że jest na tej pozycji
                break;
            case 'bottomLeft':
                targetLeft = kickPlayerRect.left + padding;
                targetTop = kickPlayerRect.bottom - finalHeight - padding;
                currentTwitchPosition = 'bottomLeft'; // Aktualizuj, że jest na tej pozycji
                break;
            case 'bottomRight':
                targetLeft = kickPlayerRect.right - finalWidth - padding;
                targetTop = kickPlayerRect.bottom - finalHeight - padding;
                currentTwitchPosition = 'bottomRight'; // Aktualizuj, że jest na tej pozycji
                break;
            case 'docked': 
                const chatSidebarRect = chatSidebar.getBoundingClientRect(); 
                targetLeft = chatSidebarRect.left; 
                targetTop = chatSidebarRect.top;
                currentTwitchPosition = 'docked'; // Aktualizuj, że jest zadokowany
                break;
            default:
                // Jeżeli pozycja nie jest podana, użyj aktualnej lub domyślnej
                const currentRect = twitchPlayer.getBoundingClientRect();
                targetLeft = currentRect.left;
                targetTop = currentRect.top;
                break;
        }

        const mainContentRect = mainContent.getBoundingClientRect();
        twitchPlayer.style.left = `${targetLeft - mainContentRect.left}px`;
        twitchPlayer.style.top = `${targetTop - mainContentRect.top}px`;
    }

    // Obsługa stanu dokowania
    if (newPosition === 'docked') {
        isPlayerDockedToChat = true;
        toggleChatDockBtn.textContent = 'Odeślij TTV z czatu';
        const playerHeightOnDock = twitchPlayer.offsetHeight;
        twitchChatIframe.style.height = `calc(100% - ${playerHeightOnDock}px)`;
        twitchChatIframe.style.top = `${playerHeightOnDock}px`; 
        twitchChatIframe.style.position = 'relative'; 
    } else if (isPlayerDockedToChat && newPosition !== 'docked') { 
        // Oddokowanie - upewnij się, że czat wraca do pełnej wysokości
        isPlayerDockedToChat = false;
        toggleChatDockBtn.textContent = 'Dokuj TTV nad czat';
        twitchChatIframe.style.height = `100%`;
        twitchChatIframe.style.top = `0px`;
        twitchChatIframe.style.position = 'static'; 
    }

    setTimeout(() => {
        adjustKickPlayerSize(); 
        setGlobalAnimationState(false); 
    }, ANIMATION_DURATION); 

    toggleOptionsMenu(); 
}

shrinkTwitchPlayerBtn.addEventListener('click', () => {
    if (isGlobalAnimating) return;
    // Jeżeli jest zadokowany, nie pozwól na pomniejszanie/powiększanie
    if (isPlayerDockedToChat) {
        alert('Aby zmienić rozmiar, najpierw odeślij TTV z czatu.'); // Wyświetl alert
        toggleOptionsMenu();
        return;
    }
    updateTwitchPlayer(twitchPlayer.offsetWidth - 42, twitchPlayer.offsetHeight, currentTwitchPosition);
});
expandTwitchPlayerBtn.addEventListener('click', () => {
    if (isGlobalAnimating) return;
     // Jeżeli jest zadokowany, nie pozwól na pomniejszanie/powiększanie
    if (isPlayerDockedToChat) {
        alert('Aby zmienić rozmiar, najpierw odeślij TTV z czatu.'); // Wyświetl alert
        toggleOptionsMenu();
        return;
    }
    updateTwitchPlayer(twitchPlayer.offsetWidth + 42, twitchPlayer.offsetHeight, currentTwitchPosition);
});

positionTopLeftBtn.addEventListener('click', () => {
    if (isGlobalAnimating) return;
    if (isPlayerDockedToChat) { // Odeślij jeśli zadokowany
        updateTwitchPlayer(defaultTwitchWidth, defaultTwitchHeight, 'topLeft'); 
    } else {
        updateTwitchPlayer(twitchPlayer.offsetWidth, twitchPlayer.offsetHeight, 'topLeft');
    }
});
positionTopRightBtn.addEventListener('click', () => {
    if (isGlobalAnimating) return;
    if (isPlayerDockedToChat) {
        updateTwitchPlayer(defaultTwitchWidth, defaultTwitchHeight, 'topRight'); 
    } else {
        updateTwitchPlayer(twitchPlayer.offsetWidth, twitchPlayer.offsetHeight, 'topRight');
    }
});
positionBottomLeftBtn.addEventListener('click', () => {
    if (isGlobalAnimating) return;
    if (isPlayerDockedToChat) {
        updateTwitchPlayer(defaultTwitchWidth, defaultTwitchHeight, 'bottomLeft'); 
    } else {
        updateTwitchPlayer(twitchPlayer.offsetWidth, twitchPlayer.offsetHeight, 'bottomLeft');
    }
});
positionBottomRightBtn.addEventListener('click', () => {
    if (isGlobalAnimating) return;
    if (isPlayerDockedToChat) {
        updateTwitchPlayer(defaultTwitchWidth, defaultTwitchHeight, 'bottomRight'); 
    } else {
        updateTwitchPlayer(twitchPlayer.offsetWidth, twitchPlayer.offsetHeight, 'bottomRight');
    }
});

// --- Funkcjonalność DOKOWANIA ---
toggleChatDockBtn.addEventListener('click', () => {
    if (isGlobalAnimating) return;

    if (isPlayerDockedToChat) {
        // Jeśli jest zadokowany, odeślij na ostatnią zapamiętaną pozycję lub topLeft
        updateTwitchPlayer(defaultTwitchWidth, defaultTwitchHeight, currentTwitchPosition === 'docked' ? 'topLeft' : currentTwitchPosition); 
    } else {
        if (isChatHidden) {
            toggleChatVisibility(true); 
            setTimeout(() => {
                if (!isGlobalAnimating && !isChatHidden) { 
                    updateTwitchPlayer(CHAT_VISIBLE_WIDTH, CHAT_VISIBLE_WIDTH * 9 / 16, 'docked');
                }
            }, ANIMATION_DURATION + 50); 
        } else {
            updateTwitchPlayer(CHAT_VISIBLE_WIDTH, CHAT_VISIBLE_WIDTH * 9 / 16, 'docked');
        }
    }
});

// --- Funkcja do przełączania widoczności Twitch Playera ---
function toggleTwitchPlayerVisibility() {
    if (isGlobalAnimating) return;
    setGlobalAnimationState(true);

    isTwitchPlayerHidden = !isTwitchPlayerHidden; 

    if (isTwitchPlayerHidden) {
        twitchPlayer.style.opacity = '0';
        toggleTwitchPlayerVisibilityBtn.textContent = '👁️ Pokaż TTV'; 
    } else {
        twitchPlayer.style.opacity = '1';
        toggleTwitchPlayerVisibilityBtn.textContent = '👁️ Ukryj/Pokaż TTV'; 
    }

    setTimeout(() => {
        setGlobalAnimationState(false);
    }, ANIMATION_DURATION);
    toggleOptionsMenu();
}

toggleTwitchPlayerVisibilityBtn.addEventListener('click', toggleTwitchPlayerVisibility);


// --- Funkcjonalność UKRYWANIA/POKAZYWANIA CZATU ---
function toggleChatVisibility(fromButton = true) {
    if (isGlobalAnimating && fromButton) return;
    setGlobalAnimationState(true);

    if (isChatHidden) { 
        chatSidebar.classList.remove('hidden');
        isChatHidden = false;
    } else { 
        chatSidebar.classList.add('hidden');
        isChatHidden = true;
        // Jeśli player był zadokowany, po ukryciu czatu powinien wrócić na domyślną pozycję
        if (isPlayerDockedToChat) {
            updateTwitchPlayer(defaultTwitchWidth, defaultTwitchHeight, 'topLeft'); 
        }
    }
    
    // Re-pozycja Twitch Playera po zakończeniu animacji czatu
    setTimeout(() => {
        adjustKickPlayerSize(); 
        // Jeżeli Twitch Player nie jest zadokowany, przelicz jego pozycję
        if (!isPlayerDockedToChat) {
            // Wywołaj updateTwitchPlayer z jego obecnym rozmiarem i zapamiętaną pozycją
            updateTwitchPlayer(twitchPlayer.offsetWidth, twitchPlayer.offsetHeight, currentTwitchPosition);
        }
        setGlobalAnimationState(false);
    }, ANIMATION_DURATION); 

    if (fromButton) toggleOptionsMenu(); 
}

toggleChatVisibilityBtn.addEventListener('click', () => toggleChatVisibility(true));

// --- Funkcjonalność PEŁNEGO EKRANU PRZEGLĄDARKI ---
function toggleBrowserFullscreen() {
    if (isGlobalAnimating) return;
    setGlobalAnimationState(true);

    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Błąd wejścia w tryb pełnoekranowy: ${err.message} (${err.name})`);
            setGlobalAnimationState(false); 
        });
    } else {
        document.exitFullscreen();
    }
    
    toggleOptionsMenu(); 
}

toggleBrowserFullscreenBtn.addEventListener('click', toggleBrowserFullscreen);

document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
        toggleBrowserFullscreenBtn.textContent = 'Wyjdź z Pełnego Ekranu'; 
    } else {
        toggleBrowserFullscreenBtn.textContent = 'Pełny Ekran Strony'; 
    }
    
    setTimeout(() => {
        adjustKickPlayerSize(); 
        // Po wyjściu z pełnego ekranu, przelicz pozycję Twitcha
        if (!isPlayerDockedToChat) {
            updateTwitchPlayer(twitchPlayer.offsetWidth, twitchPlayer.offsetHeight, currentTwitchPosition);
        }
        setGlobalAnimationState(false); 
    }, ANIMATION_DURATION); 
});

// Inicjalizacja przy ładowaniu strony
window.addEventListener('load', () => {
    setTimeout(() => {
        adjustKickPlayerSize();
        updateTwitchPlayer(defaultTwitchWidth, defaultTwitchHeight, 'topLeft'); 
    }, 200); 
});

window.addEventListener('resize', adjustKickPlayerSize);
