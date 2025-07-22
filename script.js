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

// Nowe stałe dla rozmiaru dokowanego TTV
const DOCKED_TTV_WIDTH = 350;
const DOCKED_TTV_HEIGHT = 200;

let isPlayerDockedToChat = false; // Na desktopie oznacza "zadokowany nad czatem"
let isChatHidden = false;
let isTwitchPlayerHidden = false; // Będzie głównym stanem widoczności Twitcha (również na mobile)
let currentTwitchPosition = 'topLeft'; // Używane tylko na desktopie
let lastUndockedTwitchWidth = defaultTwitchWidth; // Używane tylko na desktopie
let lastUndockedTwitchHeight = defaultTwitchHeight; // Używane tylko na desktopie

// Funkcja sprawdzająca, czy ekran jest mały (poniżej breakpointu dla telefonów)
function isMobileView() {
    return window.innerWidth <= 768; // Ten sam breakpoint co w CSS
}

function adjustKickPlayerSize() {
    // Resetuj style TTV, aby uniknąć konfliktów przed ponownym obliczeniem
    twitchPlayer.style.removeProperty('width');
    twitchPlayer.style.removeProperty('height');
    twitchPlayer.style.removeProperty('top');
    twitchPlayer.style.removeProperty('left');
    twitchPlayer.style.removeProperty('right');
    twitchPlayer.style.removeProperty('position');
    twitchPlayer.style.removeProperty('margin-bottom');
    twitchPlayer.style.removeProperty('order'); // Usunięcie order ustawionego przez JS (jeśli był)
    twitchPlayer.classList.remove('mobile-visible');

    if (isMobileView() && window.innerHeight < window.innerWidth) { // Mobile w trybie poziomym
        const mainContentRect = mainContent.getBoundingClientRect();
        const aspectRatio = 16 / 9;

        // Kick Player - maksymalizacja przestrzeni, ale z zachowaniem proporcji
        let calculatedKickWidth = mainContentRect.width;
        let calculatedKickHeight = calculatedKickWidth / aspectRatio;

        const totalAvailableHeight = window.innerHeight - (mainContent.offsetTop * 2);

        if (calculatedKickHeight > totalAvailableHeight) {
            calculatedKickHeight = totalAvailableHeight;
            calculatedKickWidth = calculatedKickHeight * aspectRatio;
        }

        kickPlayer.style.width = `${calculatedKickWidth}px`;
        kickPlayer.style.height = `${calculatedKickHeight}px`;
        kickPlayer.style.maxWidth = '100%';
        kickPlayer.style.maxHeight = '100%';
        kickPlayer.style.objectFit = 'contain';
        kickPlayer.style.margin = 'auto'; // Centruj w pionie i poziomie
        kickPlayer.style.order = '0'; // Zapewnij kolejność w flex-container

        // Twitch Player w prawym górnym rogu Kick Playera, 10% rozmiaru
        if (!isTwitchPlayerHidden) {
            const kickRect = kickPlayer.getBoundingClientRect();
            const smallTwitchWidth = defaultTwitchWidth * 0.1; // 42.7px
            const smallTwitchHeight = defaultTwitchHeight * 0.1; // 24px

            twitchPlayer.style.width = `${smallTwitchWidth}px`;
            twitchPlayer.style.height = `${smallTwitchHeight}px`;
            twitchPlayer.style.position = 'absolute'; // Absolutne pozycjonowanie względem mainContent
            // Pozycjonowanie w prawym górnym rogu Kick Playera
            twitchPlayer.style.right = `${mainContentRect.right - kickRect.right + 10}px`; // 10px padding od krawędzi kicka
            twitchPlayer.style.top = `${kickRect.top - mainContentRect.top + 10}px`; // 10px padding od góry kicka
            twitchPlayer.style.left = 'auto'; // Upewnij się, że left nie koliduje z right
            twitchPlayer.style.display = 'block';
            twitchPlayer.classList.add('mobile-visible');
            twitchPlayer.classList.remove('hidden-interaction');
            twitchPlayer.style.order = '-1'; // Na wszelki wypadek, chociaż absolute nie bierze udziału w flow
        } else {
            twitchPlayer.style.display = 'none';
            twitchPlayer.classList.add('hidden-interaction');
        }

    } else if (isMobileView()) { // Mobile w trybie pionowym
        kickPlayer.style.width = '100%';
        kickPlayer.style.height = `${kickPlayer.offsetWidth * 9 / 16}px`;
        kickPlayer.style.margin = '0';
        kickPlayer.style.maxWidth = 'none';
        kickPlayer.style.maxHeight = 'none';
        kickPlayer.style.objectFit = 'fill';
        kickPlayer.style.order = '-1'; // Kick Player będzie drugi, pod TTV

        // TTV w trybie pionowym, jeśli widoczny, na pełną szerokość
        if (!isTwitchPlayerHidden) {
            twitchPlayer.style.width = '100%';
            twitchPlayer.style.height = `${twitchPlayer.offsetWidth * 9 / 16}px`;
            twitchPlayer.style.display = 'block';
            twitchPlayer.classList.add('mobile-visible');
            twitchPlayer.classList.remove('hidden-interaction');
            twitchPlayer.style.position = 'static'; // Ważne: statyczny w trybie pionowym
            twitchPlayer.style.marginBottom = '10px'; // Odstęp od Kicka
            twitchPlayer.style.order = '-2'; // TTV będzie pierwszy w mainContent
        } else {
            twitchPlayer.style.display = 'none';
            twitchPlayer.classList.add('hidden-interaction');
        }
        // Czat ma order 0 z CSS

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
        kickPlayer.style.order = 'unset'; // Reset order dla desktopu

        // TTV na desktopie
        if (!isTwitchPlayerHidden) {
             twitchPlayer.style.display = 'block';
             twitchPlayer.classList.remove('hidden-interaction');
             twitchPlayer.style.order = 'unset'; // Reset order dla desktopu
        } else {
             twitchPlayer.style.display = 'none';
             twitchPlayer.classList.add('hidden-interaction');
        }

        // Dodatkowa logika dla dokowania TTV na desktopie, jeśli jest zadokowany
        if (isPlayerDockedToChat) {
            twitchPlayer.style.width = `${DOCKED_TTV_WIDTH}px`;
            twitchPlayer.style.height = `${DOCKED_TTV_HEIGHT}px`;
            twitchPlayer.style.position = 'static';
            twitchPlayer.style.marginBottom = '0px';
            if (!chatIframeContainer.contains(twitchPlayer)) {
                chatIframeContainer.prepend(twitchPlayer);
            }
            twitchChatIframe.style.height = `calc(100% - ${DOCKED_TTV_HEIGHT}px)`;
            twitchChatIframe.style.top = `${DOCKED_TTV_HEIGHT}px`;
            twitchChatIframe.style.position = 'absolute';
            twitchPlayer.classList.remove('hidden-interaction');
        } else {
            if (mainContent.contains(twitchPlayer)) {
                // Nic nie rób, jest już w dobrym miejscu
            } else { // Przenieś z powrotem, jeśli był zadokowany
                mainContent.appendChild(twitchPlayer);
                twitchPlayer.style.position = 'absolute';
            }
            // Resetuj style czatu tylko jeśli nie jest zadokowany
            twitchChatIframe.style.height = `100%`;
            twitchChatIframe.style.top = `0px`;
            twitchChatIframe.style.position = 'static'; // Czat wraca do statycznego w swoim kontenerze
            // Przywróć poprzednią pozycję i rozmiar, jeśli nie jest zadokowany
            twitchPlayer.style.width = `${lastUndockedTwitchWidth}px`;
            twitchPlayer.style.height = `${lastUndockedTwitchHeight}px`;
            // Upewnij się, że TTV jest w ostatniej znanej pozycji
            const kickPlayerRect = document.getElementById('kickPlayer').getBoundingClientRect();
            const padding = 10;
            const mainContentRect = mainContent.getBoundingClientRect();
            let targetLeft, targetTop;

            switch (currentTwitchPosition) {
                case 'topLeft':
                    targetLeft = kickPlayerRect.left + padding;
                    targetTop = kickPlayerRect.top + padding;
                    break;
                case 'topRight':
                    targetLeft = kickPlayerRect.right - lastUndockedTwitchWidth - padding;
                    targetTop = kickPlayerRect.top + padding;
                    break;
                case 'bottomLeft':
                    targetLeft = kickPlayerRect.left + padding;
                    targetTop = kickPlayerRect.bottom - lastUndockedTwitchHeight - padding;
                    break;
                case 'bottomRight':
                    targetLeft = kickPlayerRect.right - lastUndockedTwitchWidth - padding;
                    targetTop = kickPlayerRect.bottom - lastUndockedTwitchHeight - padding;
                    break;
                default: // Domyślnie topLeft, jeśli brak zapisanego
                    targetLeft = kickPlayerRect.left + padding;
                    targetTop = kickPlayerRect.top + padding;
                    currentTwitchPosition = 'topLeft';
                    break;
            }
            twitchPlayer.style.left = `${targetLeft - mainContentRect.left}px`;
            twitchPlayer.style.top = `${targetTop - mainContentRect.top}px`;
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
    if (isGlobalAnimating) return;

    // Ta funkcja jest przeznaczona GŁÓWNIE dla desktopu.
    // Na mobile widoczność i pozycjonowanie TTV są zarządzane przez adjustKickPlayerSize
    // w zależności od isTwitchPlayerHidden i orientacji.
    if (isMobileView()) {
        console.warn("updateTwitchPlayer called on mobile. Use toggleTwitchPlayerVisibility instead for main control.");
        // Jeśli jednak wywołano na mobile, a TTV ma być widoczny
        if (!isTwitchPlayerHidden) {
            twitchPlayer.classList.add('mobile-visible');
            twitchPlayer.classList.remove('hidden-interaction');
            twitchPlayer.style.display = 'block';
        } else {
            twitchPlayer.classList.remove('mobile-visible');
            twitchPlayer.classList.add('hidden-interaction');
            twitchPlayer.style.display = 'none';
        }
        adjustKickPlayerSize(); // Pozycja na mobile zostanie dostosowana tutaj
        setGlobalAnimationState(false);
        return;
    }

    // Logika dla desktopu
    setGlobalAnimationState(true);

    let finalWidth = newWidth;
    let finalHeight = newHeight;

    if (newPosition === 'docked') {
        finalWidth = DOCKED_TTV_WIDTH;
        finalHeight = DOCKED_TTV_HEIGHT;
        twitchPlayer.style.position = 'static';
        twitchPlayer.style.marginBottom = '0px';
        if (!chatIframeContainer.contains(twitchPlayer)) {
            chatIframeContainer.prepend(twitchPlayer);
        }
        isPlayerDockedToChat = true;

        twitchChatIframe.style.height = `calc(100% - ${finalHeight}px)`;
        twitchChatIframe.style.top = `${finalHeight}px`;
        twitchChatIframe.style.position = 'absolute'; // Upewnij się, że czat jest absolutny
        twitchPlayer.classList.remove('hidden-interaction');

    } else { // Oddokuj lub zmień rozmiar/pozycję na desktopie
        if (isPlayerDockedToChat) {
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

        if (newPosition) { // Tylko jeśli podano nową pozycję
            const kickPlayerRect = document.getElementById('kickPlayer').getBoundingClientRect();
            const padding = 10;
            const mainContentRect = mainContent.getBoundingClientRect();

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
            }
            twitchPlayer.style.left = `${targetLeft - mainContentRect.left}px`;
            twitchPlayer.style.top = `${targetTop - mainContentRect.top}px`;
        }
        twitchPlayer.style.width = `${finalWidth}px`;
        twitchPlayer.style.height = `${finalHeight}px`;
        twitchPlayer.style.display = 'block';
        twitchPlayer.classList.remove('mobile-visible');
        twitchPlayer.classList.remove('hidden-interaction');
    }

    // Obsługa opacity (widoczności) Twitcha na desktopie
    if (!isTwitchPlayerHidden) {
        twitchPlayer.style.opacity = '1';
        twitchPlayer.style.display = 'block';
        twitchPlayer.classList.remove('hidden-interaction');
    } else {
        twitchPlayer.style.opacity = '0';
        twitchPlayer.style.display = 'none';
        twitchPlayer.classList.add('hidden-interaction');
    }

    adjustKickPlayerSize(); // Wywołaj na koniec, aby upewnić się, że Kick Player jest poprawnie dostosowany

    setTimeout(() => {
        setGlobalAnimationState(false);
    }, ANIMATION_DURATION);

    toggleOptionsMenu();
}


// Listenery dla przycisków rozmiaru i pozycji na desktopie
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

// Zmieniona funkcjonalność przycisku dokowania (tylko desktop)
toggleChatDockBtn.addEventListener('click', () => {
    if (isGlobalAnimating || isMobileView()) return;

    if (isPlayerDockedToChat) {
        updateTwitchPlayer(lastUndockedTwitchWidth, lastUndockedTwitchHeight, currentTwitchPosition === 'docked' ? 'topLeft' : currentTwitchPosition);
    } else {
        if (isChatHidden) {
            toggleChatVisibility(true);
            setTimeout(() => {
                if (!isGlobalAnimating && !isChatHidden) {
                    updateTwitchPlayer(DOCKED_TTV_WIDTH, DOCKED_TTV_HEIGHT, 'docked');
                }
            }, ANIMATION_DURATION + 50);
        } else {
            updateTwitchPlayer(DOCKED_TTV_WIDTH, DOCKED_TTV_HEIGHT, 'docked');
        }
    }
    updateButtonStates();
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
        // Jeśli na desktopie TTV był zadokowany, oddokuj go przy ukryciu
        if (isPlayerDockedToChat && !isMobileView()) {
             // W tym przypadku wywołaj updateTwitchPlayer aby oddokować
             updateTwitchPlayer(lastUndockedTwitchWidth, lastUndockedTwitchHeight, currentTwitchPosition);
        }
        isPlayerDockedToChat = false; // Zawsze resetuj stan dokowania, gdy ukrywasz TTV
    } else {
        twitchPlayer.style.opacity = '1';
        twitchPlayer.style.display = 'block';
        twitchPlayer.classList.remove('hidden-interaction');
        // Na desktopie, jeśli TTV ma być pokazany i był zadokowany (np. po pokazaniu czatu)
        if (!isMobileView() && isPlayerDockedToChat) {
            updateTwitchPlayer(DOCKED_TTV_WIDTH, DOCKED_TTV_HEIGHT, 'docked');
        } else if (!isMobileView()) { // Pokaż w ostatniej znanej pozycji na desktopie, jeśli nie był dokowany
            updateTwitchPlayer(lastUndockedTwitchWidth, lastUndockedTwitchHeight, currentTwitchPosition);
        }
        // Na mobile sama funkcja adjustKickPlayerSize zajmie się prawidłowym rozmieszczeniem
    }

    // Zapewnij, że adjustKickPlayerSize jest wywołane po każdej zmianie widoczności TTV
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
        // Na desktopie, jeśli TTV był zadokowany, oddokuj go, jeśli czat jest ukrywany
        if (isPlayerDockedToChat && !isMobileView()) {
            updateTwitchPlayer(lastUndockedTwitchWidth, lastUndockedTwitchHeight, currentTwitchPosition);
        }
    }

    setTimeout(() => {
        adjustKickPlayerSize();
        // Na desktopie, po zmianie widoczności czatu, upewnij się, że TTV ma prawidłowy rozmiar i pozycję
        if (!isPlayerDockedToChat && !isMobileView() && !isTwitchPlayerHidden) {
            updateTwitchPlayer(lastUndockedTwitchWidth, lastUndockedTwitchHeight, currentTwitchPosition);
        }
        setGlobalAnimationState(false);
        updateButtonStates();
    }, ANIMATION_DURATION);

    if (fromButton) toggleOptionsMenu();
}

toggleChatVisibilityBtn.addEventListener('click', () => toggleChatVisibility(true));

// --- Funkcjonalność PEŁNEGO EKRANU PRZEGLĄDARKOWEGO ---
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
}

toggleBrowserFullscreenBtn.addEventListener('click', toggleBrowserFullscreen);

document.addEventListener('fullscreenchange', () => {
    setTimeout(() => {
        adjustKickPlayerSize();
        // Na desktopie, jeśli TTV nie jest zadokowany i nie jest ukryty, przywróć jego pozycję
        if (!isPlayerDockedToChat && !isMobileView() && !isTwitchPlayerHidden) {
            updateTwitchPlayer(lastUndockedTwitchWidth, lastUndockedTwitchHeight, currentTwitchPosition);
        }
        setGlobalAnimationState(false);
        updateButtonStates(); // Aktualizuj tekst przycisku
        toggleOptionsMenu(); // Zamknij menu
    }, ANIMATION_DURATION);
});

// Inicjalizacja przy ładowaniu strony
window.addEventListener('load', () => {
    // Upewnij się, że mainContent ma position:relative
    mainContent.style.position = 'relative';

    if (isMobileView()) {
        twitchPlayer.style.display = 'none';
        twitchPlayer.classList.add('hidden-interaction');
        isTwitchPlayerHidden = true;
        isPlayerDockedToChat = false; // Na mobile, flaga dokowania jest zawsze false
    } else { // Desktop
        isTwitchPlayerHidden = false; // Domyślnie TTV widoczny na desktopie
        isPlayerDockedToChat = false; // Domyślnie nie zadokowany
        // Upewnij się, że TTV jest w mainContent przed wywołaniem updateTwitchPlayer
        if (!mainContent.contains(twitchPlayer)) {
            mainContent.appendChild(twitchPlayer);
        }
        // Ustaw domyślny rozmiar i pozycję TTV
        updateTwitchPlayer(defaultTwitchWidth, defaultTwitchHeight, 'topLeft');
    }
    adjustKickPlayerSize(); // Po inicjalizacji, dostosuj rozmiary graczy
    updateButtonStates();
});

window.addEventListener('resize', () => {
    // Usuń wszystkie inline style, które mogły być ustawione przez poprzednie stany/orientacje
    twitchPlayer.style.removeProperty('width');
    twitchPlayer.style.removeProperty('height');
    twitchPlayer.style.removeProperty('top');
    twitchPlayer.style.removeProperty('left');
    twitchPlayer.style.removeProperty('right');
    twitchPlayer.style.removeProperty('position');
    twitchPlayer.style.removeProperty('margin-bottom');
    twitchPlayer.style.removeProperty('order');
    twitchPlayer.classList.remove('mobile-visible');

    // Resetuj też style iframe czatu, aby pozbyć się top/height z dokowania
    twitchChatIframe.style.removeProperty('height');
    twitchChatIframe.style.removeProperty('top');
    twitchChatIframe.style.removeProperty('position');


    if (isMobileView()) {
        // Na mobile, flaga dokowania jest zawsze false
        isPlayerDockedToChat = false;
        // Upewnij się, że TTV jest w mainContent dla prawidłowego pozycjonowania mobilnego
        if (!mainContent.contains(twitchPlayer)) {
            mainContent.appendChild(twitchPlayer);
        }
        if (!isTwitchPlayerHidden) {
            twitchPlayer.style.display = 'block';
            twitchPlayer.classList.remove('hidden-interaction');
        } else {
            twitchPlayer.style.display = 'none';
            twitchPlayer.classList.add('hidden-interaction');
        }
    } else { // Powrót do desktopu
        // Upewnij się, że TTV jest w mainContent, zanim zaczniemy go pozycjonować absolutnie
        if (!mainContent.contains(twitchPlayer)) {
            mainContent.appendChild(twitchPlayer);
        }
        if (!isTwitchPlayerHidden) {
            twitchPlayer.style.display = 'block';
            twitchPlayer.classList.remove('hidden-interaction');
            if (isPlayerDockedToChat) { // Jeśli był dokowany na desktopie, przywróć ten stan
                 updateTwitchPlayer(DOCKED_TTV_WIDTH, DOCKED_TTV_HEIGHT, 'docked');
            } else { // Jeśli nie był dokowany, wróć do ostatniej znanej pozycji
                twitchPlayer.style.position = 'absolute';
                updateTwitchPlayer(lastUndockedTwitchWidth, lastUndockedTwitchHeight, currentTwitchPosition);
            }
        } else {
            twitchPlayer.style.display = 'none';
            twitchPlayer.classList.add('hidden-interaction');
        }
    }
    adjustKickPlayerSize();
    updateButtonStates();
});

// Funkcja do aktualizacji stanu przycisków w menu
function updateButtonStates() {
    const isMobile = isMobileView();

    // Ukryj/pokaż przyciski rozmiaru i pozycji TTV
    const desktopOnlyButtons = [
        shrinkTwitchPlayerBtn, expandTwitchPlayerBtn,
        positionTopLeftBtn, positionTopRightBtn,
        positionBottomLeftBtn, positionBottomRightBtn
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

    // Zaktualizuj tekst dla głównych przycisków
    toggleTwitchPlayerVisibilityBtn.textContent = isTwitchPlayerHidden ? '👁️ Pokaż Player TTV' : '👁️ Ukryj Player TTV';
    toggleChatVisibilityBtn.textContent = isChatHidden ? '💬 Pokaż Czat' : '💬 Ukryj Czat';
    // Tekst przycisku pełnego ekranu, zgodnie z obrazkiem
    toggleBrowserFullscreenBtn.textContent = 'Pełny Ekran Strony';

    // Logika przycisku dokowania TTV - tylko na desktopie
    if (!isMobile) {
        toggleChatDockBtn.classList.remove('hide-on-mobile-menu'); // Upewnij się, że jest widoczny na desktopie
        toggleChatDockBtn.removeAttribute('disabled');

        if (isPlayerDockedToChat) {
            toggleChatDockBtn.textContent = 'Odeślij TTV z czatu';
            // Gdy zadokowany, przyciski rozmiaru i pozycji są nieaktywne
            desktopOnlyButtons.forEach(btn => {
                btn.classList.add('disabled-button');
                btn.setAttribute('disabled', 'true');
            });
        } else {
            toggleChatDockBtn.textContent = 'Dokuj TTV nad czat';
            // Gdy oddokowany, przyciski rozmiaru i pozycji są aktywne
            desktopOnlyButtons.forEach(btn => {
                btn.classList.remove('disabled-button');
                btn.removeAttribute('disabled');
            });
        }
    } else {
        // Na mobile ukryj przycisk dokowania
        toggleChatDockBtn.classList.add('hide-on-mobile-menu');
        toggleChatDockBtn.setAttribute('disabled', 'true');
    }
}
