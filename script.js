const twitchPlayer = document.getElementById('twitchPlayer');
const kickPlayer = document.getElementById('kickPlayer');
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

let isPlayerDockedToChat = false; // Na desktopie oznacza "zadokowany nad czatem", na mobile "widoczny pod Kickiem"
let isChatHidden = false; 
let isTwitchPlayerHidden = false; 
let currentTwitchPosition = 'topLeft';
let lastUndockedTwitchWidth = defaultTwitchWidth;
let lastUndockedTwitchHeight = defaultTwitchHeight;

// Funkcja sprawdzająca, czy ekran jest mały (poniżej breakpointu dla telefonów)
function isMobileView() {
    return window.innerWidth <= 768; // Ten sam breakpoint co w CSS
}

function adjustKickPlayerSize() {
    if (isMobileView() && window.innerHeight < window.innerWidth) { // Mobile w trybie poziomym
        const mainContentRect = mainContent.getBoundingClientRect();
        const availableHeight = mainContentRect.height;
        const aspectRatio = 16 / 9;

        // Spróbuj dopasować do wysokości, ale nie przekrocz szerokości
        let calculatedWidth = availableHeight * aspectRatio;
        let calculatedHeight = availableHeight;

        if (calculatedWidth > mainContentRect.width) { // Jeśli jest za szeroki na dostępną szerokość
            calculatedWidth = mainContentRect.width;
            calculatedHeight = calculatedWidth / aspectRatio;
        }

        kickPlayer.style.width = `${calculatedWidth}px`;
        kickPlayer.style.height = `${calculatedHeight}px`;
        kickPlayer.style.maxWidth = '100%'; // Ensure it doesn't overflow
        kickPlayer.style.maxHeight = '100%';
        kickPlayer.style.objectFit = 'contain'; // Prevent distortion
        kickPlayer.style.margin = 'auto'; // Centruj w pionie i poziomie
    } else if (isMobileView()) { // Mobile w trybie pionowym
        kickPlayer.style.width = '100%';
        kickPlayer.style.height = `${kickPlayer.offsetWidth * 9 / 16}px`;
        kickPlayer.style.margin = '0';
        kickPlayer.style.maxWidth = 'none';
        kickPlayer.style.maxHeight = 'none';
        kickPlayer.style.objectFit = 'fill';
    } else { // Desktop
        const mainContentRect = mainContent.getBoundingClientRect();
        const aspectRatio = 16 / 9; 

        let kickWidth = mainContentRect.width;
        let kickHeight = kickWidth / aspectRatio;

        kickPlayer.style.width = '100%';
        kickPlayer.style.height = `${kickHeight}px`;
        kickPlayer.style.margin = '0';
        kickPlayer.style.maxWidth = 'none';
        kickPlayer.style.maxHeight = 'none';
        kickPlayer.style.objectFit = 'fill';
    }
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
function updateTwitchPlayer(newWidth, newHeight, newPosition = null) {
    if (isGlobalAnimating && newPosition !== 'docked') return;

    setGlobalAnimationState(true); 

    let finalWidth = newWidth;
    let finalHeight = newHeight;

    // Logika dla telefonów (niezależnie od tego, czy jest "zadokowany" czy nie, na mobile to po prostu widoczność)
    if (isMobileView()) {
        if (newPosition === 'docked') { // "Dokowanie" na mobile oznacza po prostu pokazanie pod Kickiem
            twitchPlayer.style.display = 'block';
            twitchPlayer.classList.add('mobile-visible');
            twitchPlayer.style.position = 'static'; // Ważne, aby był w normalnym przepływie
            twitchPlayer.style.marginTop = '10px';
            mainContent.appendChild(twitchPlayer); // Upewnij się, że jest w mainContent
            isPlayerDockedToChat = true; // Zmienna stanu dla mobilnego "zadokowania"
        } else { // Ukryj, jeśli oddokowujemy lub zmieniamy pozycję na "niedokującą"
            twitchPlayer.style.display = 'none';
            twitchPlayer.classList.remove('mobile-visible');
            isPlayerDockedToChat = false;
            // Na mobile rozmiar i pozycja są kontrolowane przez CSS, nie przez JS dla Twitcha
            twitchPlayer.style.width = ''; // Usuń inline style, aby CSS mógł przejąć kontrolę
            twitchPlayer.style.height = '';
            twitchPlayer.style.marginTop = '';
        }
        // Upewnij się, że czat nie jest zmieniany przez "dokowanie" na mobile
        twitchChatIframe.style.height = `100%`;
        twitchChatIframe.style.top = `0px`;
        twitchChatIframe.style.position = 'static'; 

    } else { // Logika dla desktopu
        if (newPosition === 'docked') {
            finalWidth = CHAT_VISIBLE_WIDTH;
            finalHeight = (finalWidth * 9) / 16;
            twitchPlayer.style.position = 'static';
            twitchPlayer.style.marginBottom = '0px';
            chatIframeContainer.prepend(twitchPlayer);
            isPlayerDockedToChat = true;
            twitchChatIframe.style.height = `calc(100% - ${finalHeight}px)`;
            twitchChatIframe.style.top = `${finalHeight}px`; 
            twitchChatIframe.style.position = 'relative'; 
        } else {
            if (isPlayerDockedToChat) { // Oddokuj na desktopie
                mainContent.appendChild(twitchPlayer);
                twitchPlayer.style.position = 'absolute';
                isPlayerDockedToChat = false;
                twitchChatIframe.style.height = `100%`;
                twitchChatIframe.style.top = `0px`;
                twitchChatIframe.style.position = 'static'; 
                finalWidth = lastUndockedTwitchWidth;
                finalHeight = lastUndockedTwitchHeight;
            } else {
                finalWidth = Math.min(Math.max(newWidth, minTwitchWidth), maxTwitchWidth);
                finalHeight = (finalWidth * 9) / 16;
                finalHeight = Math.min(Math.max(finalHeight, minTwitchHeight), maxTwitchHeight);
                lastUndockedTwitchWidth = finalWidth;
                lastUndockedTwitchHeight = finalHeight;
            }

            // Obliczanie nowej pozycji dla niedokowanego playera (tylko na desktopie)
            if (newPosition) {
                const kickPlayerRect = document.getElementById('kickPlayer').getBoundingClientRect();
                const padding = 10; 

                let targetLeft, targetTop;

                switch (newPosition) {
                    case 'topLeft':
                        targetLeft = kickPlayerRect.left + padding;
                        targetTop = kickPlayerRect.top + padding;
                        currentTwitchPosition = 'topLeft';
                        break;
                    case 'topRight':
                        targetLeft = kickPlayerRect.right - finalWidth - padding;
                        targetTop = kickPlayerRect.top + padding;
                        currentTwitchPosition = 'topRight';
                        break;
                    case 'bottomLeft':
                        targetLeft = kickPlayerRect.left + padding;
                        targetTop = kickPlayerRect.bottom - finalHeight - padding;
                        currentTwitchPosition = 'bottomLeft';
                        break;
                    case 'bottomRight':
                        targetLeft = kickPlayerRect.right - finalWidth - padding;
                        targetTop = kickPlayerRect.bottom - finalHeight - padding;
                        currentTwitchPosition = 'bottomRight';
                        break;
                    default:
                        const currentRect = twitchPlayer.getBoundingClientRect();
                        targetLeft = currentRect.left;
                        targetTop = currentRect.top;
                        break;
                }
                const mainContentRect = mainContent.getBoundingClientRect();
                twitchPlayer.style.left = `${targetLeft - mainContentRect.left}px`;
                twitchPlayer.style.top = `${targetTop - mainContentRect.top}px`;
            }
            twitchPlayer.style.display = 'block'; // Upewnij się, że player jest widoczny na desktopie
            twitchPlayer.classList.remove('mobile-visible');
        }

        // Zastosuj nowy rozmiar (dla desktopu)
        twitchPlayer.style.width = `${finalWidth}px`;
        twitchPlayer.style.height = `${finalHeight}px`;
    }

    // Obsługa opacity (widoczności) Twitcha
    if (isTwitchPlayerHidden) { // Ukryj na obu trybach, ale na mobile 'display: none' ma priorytet
        twitchPlayer.style.opacity = '0';
    } else {
        twitchPlayer.style.opacity = '1';
    }


    setTimeout(() => {
        adjustKickPlayerSize(); 
        setGlobalAnimationState(false); 
    }, ANIMATION_DURATION); 

    toggleOptionsMenu(); 
}

// Zmodyfikowane listenery dla przycisków rozmiaru i pozycji
shrinkTwitchPlayerBtn.addEventListener('click', () => {
    if (isGlobalAnimating || isMobileView()) return;
    if (isPlayerDockedToChat) {
        alert('Aby zmienić rozmiar, najpierw odeślij TTV z czatu.');
        toggleOptionsMenu();
        return;
    }
    updateTwitchPlayer(twitchPlayer.offsetWidth - 42, twitchPlayer.offsetHeight, currentTwitchPosition);
});
expandTwitchPlayerBtn.addEventListener('click', () => {
    if (isGlobalAnimating || isMobileView()) return;
    if (isPlayerDockedToChat) {
        alert('Aby zmienić rozmiar, najpierw odeślij TTV z czatu.');
        toggleOptionsMenu();
        return;
    }
    updateTwitchPlayer(twitchPlayer.offsetWidth + 42, twitchPlayer.offsetHeight, currentTwitchPosition);
});

positionTopLeftBtn.addEventListener('click', () => {
    if (isGlobalAnimating || isMobileView()) return;
    updateTwitchPlayer(defaultTwitchWidth, defaultTwitchHeight, 'topLeft'); 
});
positionTopRightBtn.addEventListener('click', () => {
    if (isGlobalAnimating || isMobileView()) return;
    updateTwitchPlayer(defaultTwitchWidth, defaultTwitchHeight, 'topRight'); 
});
positionBottomLeftBtn.addEventListener('click', () => {
    if (isGlobalAnimating || isMobileView()) return;
    updateTwitchPlayer(defaultTwitchWidth, defaultTwitchHeight, 'bottomLeft'); 
});
positionBottomRightBtn.addEventListener('click', () => {
    if (isGlobalAnimating || isMobileView()) return;
    updateTwitchPlayer(defaultTwitchWidth, defaultTwitchHeight, 'bottomRight'); 
});

// --- Funkcjonalność DOKOWANIA / Pokazywania TTV na mobile ---
toggleChatDockBtn.addEventListener('click', () => {
    if (isGlobalAnimating && !isPlayerDockedToChat) return;

    if (isPlayerDockedToChat) { // Player jest "zadokowany" (na desktopie nad czatem, na mobile pod Kickiem)
        if (isMobileView()) {
            // Na mobile po prostu ukryj Twitcha
            updateTwitchPlayer(0, 0, 'undocked'); // Użyj 'undocked' by logika zadziałała
        } else {
            // Desktop: oddokuj do poprzedniej pozycji
            updateTwitchPlayer(lastUndockedTwitchWidth, lastUndockedTwitchHeight, currentTwitchPosition === 'docked' ? 'topLeft' : currentTwitchPosition); 
        }
    } else { // Player nie jest "zadokowany"
        if (isMobileView()) {
            // Na mobile: pokaż Twitcha pod Kickiem
            updateTwitchPlayer(0, 0, 'docked'); // Parametry rozmiaru są ignorowane na mobile dla 'docked'
        } else {
            // Desktop: dokuj nad czat
            if (isChatHidden) { // Jeśli czat jest ukryty, pokaż go najpierw
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
    }
    toggleOptionsMenu();
});

// --- Funkcja do przełączania widoczności Twitch Playera ---
function toggleTwitchPlayerVisibility() {
    if (isGlobalAnimating) return;
    setGlobalAnimationState(true);

    isTwitchPlayerHidden = !isTwitchPlayerHidden; 

    if (isTwitchPlayerHidden) {
        twitchPlayer.style.opacity = '0';
        twitchPlayer.style.display = 'none'; // Na obu trybach po prostu ukryj
        toggleTwitchPlayerVisibilityBtn.textContent = '👁️ Pokaż TTV'; 
    } else {
        twitchPlayer.style.opacity = '1';
        twitchPlayer.style.display = 'block'; // Na obu trybach po prostu pokaż
        toggleTwitchPlayerVisibilityBtn.textContent = '👁️ Ukryj/Pokaż TTV'; 
    }
    // Po zmianie widoczności, jeśli jesteśmy na mobile i TTV jest pokazywany, może wymagać korekty rozmiaru
    if (isMobileView() && !isTwitchPlayerHidden) {
        twitchPlayer.style.width = '100%';
        twitchPlayer.style.height = `${twitchPlayer.offsetWidth * 9 / 16}px`;
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
        toggleChatVisibilityBtn.textContent = '💬 Ukryj/Pokaż Czat'; 
    } else { 
        chatSidebar.classList.add('hidden');
        isChatHidden = true;
        // Jeśli player był "zadokowany" (widoczny pod Kickiem na mobile, nad czatem na desktopie)
        // po ukryciu czatu, TTV powinien wrócić na domyślną pozycję (desktop) lub się ukryć (mobile)
        if (isPlayerDockedToChat) {
            if (isMobileView()) {
                updateTwitchPlayer(0, 0, 'undocked'); // Ukryj TTV na mobile
            } else {
                updateTwitchPlayer(lastUndockedTwitchWidth, lastUndockedTwitchHeight, currentTwitchPosition === 'docked' ? 'topLeft' : currentTwitchPosition); 
            }
        }
        toggleChatVisibilityBtn.textContent = '💬 Pokaż Czat'; 
    }
    
    setTimeout(() => {
        adjustKickPlayerSize(); 
        // Po oddokowaniu lub ukryciu czatu, zaktualizuj pozycję Twitcha na desktopie
        if (!isPlayerDockedToChat && !isMobileView()) {
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
        if (!isPlayerDockedToChat && !isMobileView()) {
            updateTwitchPlayer(twitchPlayer.offsetWidth, twitchPlayer.offsetHeight, currentTwitchPosition); 
        }
        setGlobalAnimationState(false); 
    }, ANIMATION_DURATION); 
});

// Inicjalizacja przy ładowaniu strony
window.addEventListener('load', () => {
    updateButtonStates(); // Aktualizuj stan przycisków od razu
    if (isMobileView()) {
        twitchPlayer.style.display = 'none'; // Domyślnie ukryj Twitch playera na mobile
        kickPlayer.style.width = '100%';
        kickPlayer.style.height = `${kickPlayer.offsetWidth * 9 / 16}px`; // Początkowy rozmiar Kicka na mobile
    } else {
        setTimeout(() => {
            adjustKickPlayerSize();
            updateTwitchPlayer(defaultTwitchWidth, defaultTwitchHeight, 'topLeft'); 
        }, 200); 
    }
});

window.addEventListener('resize', () => {
    adjustKickPlayerSize();
    updateButtonStates(); // Aktualizuj stan przycisków przy zmianie rozmiaru/orientacji

    // Jeśli zmiana rozmiaru spowodowała przejście między trybami mobile/desktop
    // musimy zresetować stan playera Twitcha, aby CSS mógł poprawnie przejąć kontrolę
    if (isMobileView()) {
        if (!isPlayerDockedToChat) { // Jeśli TTV nie jest "pokazany" na mobile
            twitchPlayer.style.display = 'none';
        } else { // Jeśli TTV jest "pokazany" na mobile
            twitchPlayer.style.display = 'block';
            twitchPlayer.style.position = 'static'; // Upewnij się, że jest statyczny
            twitchPlayer.style.width = '100%';
            twitchPlayer.style.height = `${twitchPlayer.offsetWidth * 9 / 16}px`;
        }
        twitchPlayer.style.left = ''; // Usuń style inline pozycji
        twitchPlayer.style.top = '';
    } else { // Powrót do desktopu
        if (!isPlayerDockedToChat) { // Jeśli nie był zadokowany na mobile, wróć do poprzedniej pozycji
            twitchPlayer.style.display = 'block';
            twitchPlayer.style.position = 'absolute';
            updateTwitchPlayer(lastUndockedTwitchWidth, lastUndockedTwitchHeight, currentTwitchPosition);
        } else { // Jeśli był "zadokowany" na mobile, na desktopie powinien być zadokowany nad czatem
            updateTwitchPlayer(CHAT_VISIBLE_WIDTH, CHAT_VISIBLE_WIDTH * 9 / 16, 'docked');
        }
    }
});

// Funkcja do aktualizacji stanu przycisków w menu
function updateButtonStates() {
    if (isMobileView()) {
        // Przyciski rozmiaru i pozycji Twitcha są zablokowane na mobile
        shrinkTwitchPlayerBtn.classList.add('disabled-button');
        shrinkTwitchPlayerBtn.setAttribute('disabled', 'true');
        expandTwitchPlayerBtn.classList.add('disabled-button');
        expandTwitchPlayerBtn.setAttribute('disabled', 'true');
        positionTopLeftBtn.classList.add('disabled-button');
        positionTopLeftBtn.setAttribute('disabled', 'true');
        positionTopRightBtn.classList.add('disabled-button');
        positionTopRightBtn.setAttribute('disabled', 'true');
        positionBottomLeftBtn.classList.add('disabled-button');
        positionBottomLeftBtn.setAttribute('disabled', 'true');
        positionBottomRightBtn.classList.add('disabled-button');
        positionBottomRightBtn.setAttribute('disabled', 'true');
        
        // Zmieniony tekst przycisku dla mobilnego "dokowania"
        toggleChatDockBtn.textContent = isPlayerDockedToChat ? 'Ukryj TTV' : 'Pokaż TTV pod Kickiem';
        
        // Ukrywamy przycisk "Ukryj/Pokaż TTV" na mobile, ponieważ jego funkcję przejmuje "Pokaż TTV pod Kickiem"
        toggleTwitchPlayerVisibilityBtn.style.display = 'none'; 
        toggleTwitchPlayerVisibilityBtn.setAttribute('disabled', 'true'); // Wyłącz, gdy ukryty
        
    } else {
        // Przywróć przyciski na desktopie
        shrinkTwitchPlayerBtn.classList.remove('disabled-button');
        shrinkTwitchPlayerBtn.removeAttribute('disabled');
        expandTwitchPlayerBtn.classList.remove('disabled-button');
        expandTwitchPlayerBtn.removeAttribute('disabled');
        positionTopLeftBtn.classList.remove('disabled-button');
        positionTopLeftBtn.removeAttribute('disabled');
        positionTopRightBtn.classList.remove('disabled-button');
        positionTopRightBtn.removeAttribute('disabled');
        positionBottomLeftBtn.classList.remove('disabled-button');
        positionBottomLeftBtn.removeAttribute('disabled');
        positionBottomRightBtn.classList.remove('disabled-button');
        positionBottomRightBtn.removeAttribute('disabled');

        toggleChatDockBtn.textContent = isPlayerDockedToChat ? 'Odeślij TTV z czatu' : 'Dokuj TTV nad czat';
        toggleTwitchPlayerVisibilityBtn.style.display = 'flex'; // Pokaż na desktopie
        toggleTwitchPlayerVisibilityBtn.removeAttribute('disabled');

        toggleTwitchPlayerVisibilityBtn.textContent = isTwitchPlayerHidden ? '👁️ Pokaż TTV' : '👁️ Ukryj/Pokaż TTV';
    }
    toggleChatVisibilityBtn.textContent = isChatHidden ? '💬 Pokaż Czat' : '💬 Ukryj/Pokaż Czat';
}
