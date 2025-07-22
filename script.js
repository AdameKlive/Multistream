const twitchPlayer = document.getElementById('twitchPlayer');
const kickPlayer = document.getElementById('kickPlayer');
const chatSidebar = document.getElementById('chatSidebar'); 
const twitchChatIframe = document.getElementById('twitchChatIframe');
const mainContent = document.getElementById('mainContent'); 
const chatIframeContainer = document.getElementById('chatIframeContainer');

const optionsToggleBtn = document.getElementById('optionsToggleBtn');
const optionsMenu = document.getElementById('optionsMenu');

// Zidentyfikuj wszystkie przyciski, które mogą być ukrywane
const shrinkTwitchPlayerBtn = document.getElementById('shrinkTwitchPlayer');
const expandTwitchPlayerBtn = document.getElementById('expandTwitchPlayer');
const positionTopLeftBtn = document.getElementById('positionTopLeft');
const positionTopRightBtn = document.getElementById('positionTopRight');
const positionBottomLeftBtn = document.getElementById('positionBottomLeft');
const positionBottomRightBtn = document.getElementById('positionBottomRight');
const toggleChatDockBtn = document.getElementById('toggleChatDock'); // Ten będzie ukryty na mobile

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

let isPlayerDockedToChat = false; // Na desktopie oznacza "zadokowany nad czatem", na mobile "widoczny pod Kickiem" (ale zmieniamy logikę)
let isChatHidden = false; 
let isTwitchPlayerHidden = false; // Będzie głównym stanem widoczności Twitcha na mobile
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
        const aspectRatio = 16 / 9;

        // Kick Player powinien zająć maksymalną dostępną przestrzeń
        let calculatedWidth = mainContentRect.width;
        let calculatedHeight = calculatedWidth / aspectRatio;

        // Jeśli Kick Player ma być powyżej TTV (nie w rogu)
        if (twitchPlayer.classList.contains('mobile-visible') && window.innerHeight < window.innerWidth) {
            // W trybie poziomym TTV będzie w rogu, więc Kick Player zajmuje większość
            // Wysokość Kicka powinna być dostosowana, aby mieściła się w dostępnej przestrzeni
            const totalAvailableHeight = window.innerHeight - (mainContent.offsetTop * 2); // Odjęcie paddingów/marginesów mainContent

            if (calculatedHeight > totalAvailableHeight) {
                calculatedHeight = totalAvailableHeight;
                calculatedWidth = calculatedHeight * aspectRatio;
            }
        }
        
        kickPlayer.style.width = `${calculatedWidth}px`;
        kickPlayer.style.height = `${calculatedHeight}px`;
        kickPlayer.style.maxWidth = '100%'; 
        kickPlayer.style.maxHeight = '100%';
        kickPlayer.style.objectFit = 'contain'; 
        kickPlayer.style.margin = 'auto'; // Centruj w pionie i poziomie

        // Ustawienie małego TTV w rogu Kick Playera
        if (isMobileView() && !isTwitchPlayerHidden && window.innerHeight < window.innerWidth) {
            const kickRect = kickPlayer.getBoundingClientRect();
            const smallTwitchWidth = defaultTwitchWidth * 0.1; // 10% oryginalnej szerokości
            const smallTwitchHeight = defaultTwitchHeight * 0.1; // 10% oryginalnej wysokości

            twitchPlayer.style.width = `${smallTwitchWidth}px`;
            twitchPlayer.style.height = `${smallTwitchHeight}px`;
            twitchPlayer.style.position = 'absolute'; // Upewnij się, że jest absolutny
            // Pozycjonowanie względem kickPlayer (potrzebujemy mainContent jako rodzica z position:relative)
            // Zakładamy, że mainContent jest rodzicem obu
            twitchPlayer.style.left = `${kickRect.right - mainContent.getBoundingClientRect().left - smallTwitchWidth - 10}px`; // 10px padding
            twitchPlayer.style.top = `${kickRect.top - mainContent.getBoundingClientRect().top + 10}px`; // 10px padding
            twitchPlayer.style.display = 'block';
            twitchPlayer.classList.add('mobile-visible');
            twitchPlayer.classList.remove('hidden-interaction');

        } else if (isMobileView() && isTwitchPlayerHidden && window.innerHeight < window.innerWidth) {
            twitchPlayer.style.display = 'none';
            twitchPlayer.classList.add('hidden-interaction');
        }

    } else if (isMobileView()) { // Mobile w trybie pionowym
        // Kick Player będzie pod TTV
        kickPlayer.style.width = '100%';
        kickPlayer.style.height = `${kickPlayer.offsetWidth * 9 / 16}px`;
        kickPlayer.style.margin = '0';
        kickPlayer.style.maxWidth = 'none';
        kickPlayer.style.maxHeight = 'none';
        kickPlayer.style.objectFit = 'fill';

        // TTV w trybie pionowym, jeśli widoczny, na pełną szerokość
        if (!isTwitchPlayerHidden) {
            twitchPlayer.style.width = '100%';
            twitchPlayer.style.height = `${twitchPlayer.offsetWidth * 9 / 16}px`;
            twitchPlayer.style.display = 'block';
            twitchPlayer.classList.add('mobile-visible');
            twitchPlayer.classList.remove('hidden-interaction');
            twitchPlayer.style.position = 'static'; // Ważne: statyczny w trybie pionowym
            twitchPlayer.style.marginBottom = '10px'; // Odstęp od Kicka
        } else {
            twitchPlayer.style.display = 'none';
            twitchPlayer.classList.add('hidden-interaction');
            twitchPlayer.style.width = ''; // Resetuj inline style
            twitchPlayer.style.height = '';
            twitchPlayer.style.marginBottom = '';
        }

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

        // TTV na desktopie wraca do standardowego układu
        if (!isTwitchPlayerHidden) { // Tylko jeśli nie jest "ukryj"
             twitchPlayer.style.display = 'block';
             twitchPlayer.classList.remove('hidden-interaction');
        } else {
             twitchPlayer.style.display = 'none';
             twitchPlayer.classList.add('hidden-interaction');
        }
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
    updateButtonStates(); // Zawsze aktualizuj stan przycisków po otwarciu/zamknięciu menu
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
    // Ta funkcja jest teraz głównie dla desktopu lub początkowego ustawienia
    // Na mobile TTV jest głównie kontrolowany przez isTwitchPlayerHidden i CSS
    if (isGlobalAnimating && newPosition !== 'docked') return; // 'docked' jest specjalnym przypadkiem na desktopie

    setGlobalAnimationState(true); 

    if (isMobileView()) {
        // Na mobile, 'updateTwitchPlayer' używamy głównie do przełączania 'isTwitchPlayerHidden'
        // i do wywołania adjustKickPlayerSize, która ustawi CSS
        // Zrezygnujemy z 'newPosition' jako 'docked' na mobile na rzecz isTwitchPlayerHidden
        // Ta funkcja nie będzie już używana do "dokowania" na mobile, tylko do przełączania widoczności
        // Logika "dokowania" na mobile jest teraz częścią toggleTwitchPlayerVisibility
        
        // Zapewnienie, że TTV jest w prawidłowym miejscu w DOM dla mobile
        if (!mainContent.contains(twitchPlayer)) {
            mainContent.prepend(twitchPlayer); // Na mobile TTV zawsze na górze mainContent (CSS order załatwi kolejność)
        }

    } else { // Logika dla desktopu
        let finalWidth = newWidth;
        let finalHeight = newHeight;

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
            twitchPlayer.classList.remove('hidden-interaction'); 
        } else {
            if (isPlayerDockedToChat) { // Oddokuj na desktopie
                mainContent.appendChild(twitchPlayer); // Dodaj z powrotem do mainContent
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

            if (newPosition) {
                const kickPlayerRect = document.getElementById('kickPlayer').getBoundingClientRect();
                const padding = 10; 

                let targetLeft, targetTop;
                const mainContentRect = mainContent.getBoundingClientRect();

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
                        // Zachowaj obecną pozycję, jeśli nowa nie jest określona
                        const currentRect = twitchPlayer.getBoundingClientRect();
                        targetLeft = currentRect.left;
                        targetTop = currentRect.top;
                        break;
                }
                twitchPlayer.style.left = `${targetLeft - mainContentRect.left}px`;
                twitchPlayer.style.top = `${targetTop - mainContentRect.top}px`;
            }
            // Zastosuj nowy rozmiar (dla desktopu)
            twitchPlayer.style.width = `${finalWidth}px`;
            twitchPlayer.style.height = `${finalHeight}px`;
            twitchPlayer.style.display = 'block'; 
            twitchPlayer.classList.remove('mobile-visible');
            twitchPlayer.classList.remove('hidden-interaction'); 
        }
    }
    
    // Zawsze wywołaj adjustKickPlayerSize po zmianie stanu Twitcha
    adjustKickPlayerSize(); 

    // Obsługa opacity (widoczności) Twitcha na desktopie - na mobile załatwi to toggleTwitchPlayerVisibility
    if (!isMobileView()) {
        if (isTwitchPlayerHidden) { 
            twitchPlayer.style.opacity = '0';
            twitchPlayer.style.display = 'none'; 
            twitchPlayer.classList.add('hidden-interaction'); 
        } else {
            twitchPlayer.style.opacity = '1';
            twitchPlayer.style.display = 'block';
            twitchPlayer.classList.remove('hidden-interaction');
        }
    }


    setTimeout(() => {
        setGlobalAnimationState(false); 
    }, ANIMATION_DURATION); 

    toggleOptionsMenu(); // Zamknij menu po akcji
}


// Usunięte listenery dla przycisków rozmiaru i pozycji na mobile (są ukrywane)
// Nie usuwamy listenerów całkowicie, tylko zapewniamy, że nie będą aktywne na mobile
shrinkTwitchPlayerBtn.addEventListener('click', () => {
    if (isGlobalAnimating || isMobileView() || isPlayerDockedToChat) return;
    updateTwitchPlayer(twitchPlayer.offsetWidth - 42, twitchPlayer.offsetHeight, currentTwitchPosition);
});
expandTwitchPlayerBtn.addEventListener('click', () => {
    if (isGlobalAnimating || isMobileView() || isPlayerDockedToChat) return;
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

// Zmieniona funkcjonalność tego przycisku (tylko desktop)
toggleChatDockBtn.addEventListener('click', () => {
    if (isGlobalAnimating || isMobileView()) return; // Zablokuj na mobile

    if (isPlayerDockedToChat) { 
        updateTwitchPlayer(lastUndockedTwitchWidth, lastUndockedTwitchHeight, currentTwitchPosition === 'docked' ? 'topLeft' : currentTwitchPosition); 
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
    updateButtonStates(); 
    toggleOptionsMenu();
});

// --- Funkcja do przełączania widoczności Twitch Playera (główna dla mobile TTV) ---
function toggleTwitchPlayerVisibility() {
    if (isGlobalAnimating) return;
    setGlobalAnimationState(true);

    isTwitchPlayerHidden = !isTwitchPlayerHidden; 

    if (isTwitchPlayerHidden) {
        twitchPlayer.style.opacity = '0';
        twitchPlayer.style.display = 'none'; 
        twitchPlayer.classList.add('hidden-interaction'); 
        isPlayerDockedToChat = false; // Resetuj stan "zadokowania" na mobile, jeśli TTV jest ukryty
    } else {
        twitchPlayer.style.opacity = '1';
        twitchPlayer.style.display = 'block'; 
        twitchPlayer.classList.remove('hidden-interaction'); 
        isPlayerDockedToChat = true; // Na mobile, jeśli TTV jest widoczny, traktujemy to jako "zadokowany"
    }

    // Ponowne wywołanie adjustKickPlayerSize dla poprawnego ułożenia i rozmiaru TTV
    // (zwłaszcza dla trybu poziomego, aby ustawiło 10% rozmiaru)
    adjustKickPlayerSize(); 

    setTimeout(() => {
        setGlobalAnimationState(false);
    }, ANIMATION_DURATION);
    updateButtonStates(); 
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
        // Na desktopie, jeśli TTV był zadokowany, oddokuj go. Na mobile, TTV nie jest "dokowany" w ten sposób
        if (isPlayerDockedToChat && !isMobileView()) { 
            updateTwitchPlayer(lastUndockedTwitchWidth, lastUndockedTwitchHeight, currentTwitchPosition === 'docked' ? 'topLeft' : currentTwitchPosition); 
        }
    }
    
    setTimeout(() => {
        adjustKickPlayerSize(); 
        if (!isPlayerDockedToChat && !isMobileView()) {
            updateTwitchPlayer(twitchPlayer.offsetWidth, twitchPlayer.offsetHeight, currentTwitchPosition); 
        }
        setGlobalAnimationState(false);
        updateButtonStates(); 
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
    if (isMobileView()) {
        // Domyślnie na mobile TTV jest ukryty
        twitchPlayer.style.display = 'none';
        twitchPlayer.classList.add('hidden-interaction');
        isTwitchPlayerHidden = true;
        isPlayerDockedToChat = false; // Upewnij się, że ten stan jest spójny z ukrytym TTV
        adjustKickPlayerSize(); // Ustaw rozmiar Kicka
    } else { // Desktop
        setTimeout(() => {
            adjustKickPlayerSize();
            updateTwitchPlayer(defaultTwitchWidth, defaultTwitchHeight, 'topLeft'); 
            isTwitchPlayerHidden = false; // Domyślnie TTV widoczny na desktopie
        }, 200); 
    }
    updateButtonStates(); 
});

window.addEventListener('resize', () => {
    // Na resize zawsze wywołujemy adjustKickPlayerSize dla poprawnego skalowania
    adjustKickPlayerSize();
    
    // Logika resetowania stanu po zmianie orientacji/rozmiaru
    if (isMobileView()) {
        if (!isTwitchPlayerHidden) { // Jeśli TTV ma być widoczny
            twitchPlayer.style.display = 'block';
            twitchPlayer.classList.remove('hidden-interaction');
            twitchPlayer.style.position = (window.innerHeight < window.innerWidth) ? 'absolute' : 'static';
            // Reszta stylów zostanie ustawiona przez adjustKickPlayerSize
        } else { // Jeśli TTV ma być ukryty
            twitchPlayer.style.display = 'none';
            twitchPlayer.classList.add('hidden-interaction');
            twitchPlayer.style.position = ''; // Usuń style inline pozycji
        }
        twitchPlayer.style.left = ''; 
        twitchPlayer.style.top = '';
        twitchPlayer.style.right = ''; // Usuń right, jeśli nie jest w landscape
        twitchPlayer.style.width = ''; // Usuń inline width/height dla mobile, aby CSS mógł przejąć
        twitchPlayer.style.height = '';
        twitchPlayer.style.marginBottom = ''; // Usun dla mobile
    } else { // Powrót do desktopu
        if (!isTwitchPlayerHidden) { 
            twitchPlayer.style.display = 'block';
            twitchPlayer.classList.remove('hidden-interaction');
            if (!isPlayerDockedToChat) { // Jeśli nie był zadokowany, wróć do poprzedniej pozycji
                twitchPlayer.style.position = 'absolute';
                updateTwitchPlayer(lastUndockedTwitchWidth, lastUndockedTwitchHeight, currentTwitchPosition);
            } else { // Jeśli był "zadokowany" na mobile, na desktopie powinien być zadokowany nad czatem
                updateTwitchPlayer(CHAT_VISIBLE_WIDTH, CHAT_VISIBLE_WIDTH * 9 / 16, 'docked');
            }
        } else { // Jeśli TTV był ukryty
            twitchPlayer.style.display = 'none';
            twitchPlayer.classList.add('hidden-interaction');
        }
    }
    updateButtonStates(); 
});

// Funkcja do aktualizacji stanu przycisków w menu
function updateButtonStates() {
    const isMobile = isMobileView();
    const isLandscape = window.innerHeight < window.innerWidth;

    // Ukryj/pokaż przyciski rozmiaru i pozycji TTV oraz "Dokuj TTV"
    const desktopOnlyButtons = [
        shrinkTwitchPlayerBtn, expandTwitchPlayerBtn,
        positionTopLeftBtn, positionTopRightBtn,
        positionBottomLeftBtn, positionBottomRightBtn,
        toggleChatDockBtn // Ten przycisk jest tylko dla desktopu
    ];

    desktopOnlyButtons.forEach(btn => {
        if (isMobile) {
            btn.classList.add('hide-on-mobile-menu');
            btn.setAttribute('disabled', 'true');
        } else {
            btn.classList.remove('hide-on-mobile-menu');
            btn.removeAttribute('disabled');
        }
    });

    // Zaktualizuj tekst dla głównych przycisków, które zostają
    toggleTwitchPlayerVisibilityBtn.textContent = isTwitchPlayerHidden ? '👁️ Pokaż TTV' : '👁️ Ukryj TTV';
    toggleChatVisibilityBtn.textContent = isChatHidden ? '💬 Pokaż Czat' : '💬 Ukryj Czat';
    toggleBrowserFullscreenBtn.textContent = document.fullscreenElement ? 'Wyjdź z Pełnego Ekranu' : 'Pełny Ekran Strony';

    // Jeśli TTV jest ukryty na mobile, przycisk "Pokaż TTV" powinien go pokazać, a nie dokować
    // Logika dokowania na mobile została usunięta, teraz "Pokaż TTV" robi to samo co "Pokaż TTV pod Kickiem"
    // isPlayerDockedToChat jest teraz używane na mobile tylko do oznaczenia, czy TTV jest widoczny
    
    // Obsługa włączania/wyłączania przycisków na desktopie (dokowanie, rozmiar itp.)
    if (!isMobile) {
        // Logika dla desktopu pozostaje jak wcześniej
        if (isPlayerDockedToChat) {
            shrinkTwitchPlayerBtn.classList.add('disabled-button');
            expandTwitchPlayerBtn.classList.add('disabled-button');
            positionTopLeftBtn.classList.add('disabled-button');
            positionTopRightBtn.classList.add('disabled-button');
            positionBottomLeftBtn.classList.add('disabled-button');
            positionBottomRightBtn.classList.add('disabled-button');
        } else {
            shrinkTwitchPlayerBtn.classList.remove('disabled-button');
            expandTwitchPlayerBtn.classList.remove('disabled-button');
            positionTopLeftBtn.classList.remove('disabled-button');
            positionTopRightBtn.classList.remove('disabled-button');
            positionBottomLeftBtn.classList.remove('disabled-button');
            positionBottomRightBtn.classList.remove('disabled-button');
        }
    }
}
