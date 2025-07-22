const twitchPlayer = document.getElementById('twitchPlayer');
const kickPlayer = document.getElementById('kickPlayer');
const chatSidebar = document.getElementById('chatSidebar');
const twitchChatIframe = document.getElementById('twitchChatIframe');
const mainContent = document.getElementById('mainContent');
const chatIframeContainer = document.getElementById('chatIframeContainer'); // Upewnij się, że masz ten element

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

let isPlayerDockedToChat = false; // Na desktopie oznacza "zadokowany nad czatem", na mobile używane do określenia widoczności
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

        let calculatedWidth = mainContentRect.width;
        let calculatedHeight = calculatedWidth / aspectRatio;

        // Jeśli Kick Player ma być powyżej TTV (nie w rogu)
        // W trybie poziomym TTV będzie w rogu, więc Kick Player zajmuje większość
        const totalAvailableHeight = window.innerHeight - (mainContent.offsetTop * 2);

        if (calculatedHeight > totalAvailableHeight) {
            calculatedHeight = totalAvailableHeight;
            calculatedWidth = calculatedHeight * aspectRatio;
        }

        kickPlayer.style.width = `${calculatedWidth}px`;
        kickPlayer.style.height = `${calculatedHeight}px`;
        kickPlayer.style.maxWidth = '100%';
        kickPlayer.style.maxHeight = '100%';
        kickPlayer.style.objectFit = 'contain';
        kickPlayer.style.margin = 'auto'; // Centruj w pionie i poziomie

        // Ustawienie małego TTV w rogu Kick Playera
        if (!isTwitchPlayerHidden && !isPlayerDockedToChat) { // Sprawdzamy, czy TTV jest widoczny i nie jest zadokowany (na desktopie)
            const kickRect = kickPlayer.getBoundingClientRect();
            const smallTwitchWidth = defaultTwitchWidth * 0.1; // 10% oryginalnej szerokości
            const smallTwitchHeight = defaultTwitchHeight * 0.1; // 10% oryginalnej wysokości

            twitchPlayer.style.width = `${smallTwitchWidth}px`;
            twitchPlayer.style.height = `${smallTwitchHeight}px`;
            twitchPlayer.style.position = 'absolute';
            // Pozycjonowanie względem mainContent
            twitchPlayer.style.left = `${kickRect.right - mainContent.getBoundingClientRect().left - smallTwitchWidth - 10}px`; // 10px padding
            twitchPlayer.style.top = `${kickRect.top - mainContent.getBoundingClientRect().top + 10}px`; // 10px padding
            twitchPlayer.style.display = 'block';
            twitchPlayer.classList.add('mobile-visible');
            twitchPlayer.classList.remove('hidden-interaction');
        } else if (isTwitchPlayerHidden || isPlayerDockedToChat) { // Jeśli ukryty LUB zadokowany (na desktopie)
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

        // TTV w trybie pionowym, jeśli widoczny, na pełną szerokość
        if (!isTwitchPlayerHidden) {
            twitchPlayer.style.width = '100%';
            twitchPlayer.style.height = `${twitchPlayer.offsetWidth * 9 / 16}px`;
            twitchPlayer.style.display = 'block';
            twitchPlayer.classList.add('mobile-visible');
            twitchPlayer.classList.remove('hidden-interaction');
            twitchPlayer.style.position = 'static';
            twitchPlayer.style.marginBottom = '10px';
        } else {
            twitchPlayer.style.display = 'none';
            twitchPlayer.classList.add('hidden-interaction');
            twitchPlayer.style.width = '';
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
        if (!isTwitchPlayerHidden) {
             twitchPlayer.style.display = 'block';
             twitchPlayer.classList.remove('hidden-interaction');
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
                chatIframeContainer.prepend(twitchPlayer); // Przenieś do kontenera czatu
            }
            twitchChatIframe.style.height = `calc(100% - ${DOCKED_TTV_HEIGHT}px)`;
            twitchChatIframe.style.top = `${DOCKED_TTV_HEIGHT}px`;
            twitchChatIframe.style.position = 'absolute'; // Czat jest absolutny pod TTV
            twitchPlayer.classList.remove('hidden-interaction');
        } else { // Jeśli nie jest zadokowany, upewnij się, że jest w mainContent i ma domyślne style
            if (mainContent.contains(twitchPlayer)) {
                // Nic nie rób, jest już w dobrym miejscu
            } else { // Przenieś z powrotem, jeśli był zadokowany
                mainContent.appendChild(twitchPlayer);
                twitchPlayer.style.position = 'absolute';
                twitchChatIframe.style.height = `100%`;
                twitchChatIframe.style.top = `0px`;
                twitchChatIframe.style.position = 'static';
            }
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

    setGlobalAnimationState(true);

    if (isMobileView()) {
        // Na mobile ta funkcja jest używana tylko do przełączania isTwitchPlayerHidden
        // i do wywołania adjustKickPlayerSize, która ustawi CSS.
        // Pozycjonowanie i rozmiar TTV na mobile są kontrolowane przez adjustKickPlayerSize i CSS.
        // Jeśli chcemy przełączyć widoczność TTV na mobile, użyjemy `toggleTwitchPlayerVisibility`
        // To jest tylko dla desktopu
        console.warn("updateTwitchPlayer called on mobile. Use toggleTwitchPlayerVisibility instead.");
        setGlobalAnimationState(false);
        return;
    }

    // Logika dla desktopu
    let finalWidth = newWidth;
    let finalHeight = newHeight;

    if (newPosition === 'docked') {
        finalWidth = DOCKED_TTV_WIDTH;
        finalHeight = DOCKED_TTV_HEIGHT;
        twitchPlayer.style.position = 'static'; // Będzie statyczny w flexboxie czatu
        twitchPlayer.style.marginBottom = '0px'; // Usuń margines
        if (!chatIframeContainer.contains(twitchPlayer)) { // Tylko jeśli nie jest już tam
            chatIframeContainer.prepend(twitchPlayer); // Dodaj TTV na początku kontenera czatu
        }
        isPlayerDockedToChat = true;

        // Ustawienie wysokości czatu, aby zaczynał się po TTV
        twitchChatIframe.style.height = `calc(100% - ${finalHeight}px)`;
        twitchChatIframe.style.top = `${finalHeight}px`;
        twitchChatIframe.style.position = 'absolute'; // Upewnij się, że czat jest absolutny w chatIframeContainer
        twitchPlayer.classList.remove('hidden-interaction');

    } else { // Oddokuj lub zmień rozmiar/pozycję na desktopie
        if (isPlayerDockedToChat) { // Jeśli był zadokowany, oddokuj go
            mainContent.appendChild(twitchPlayer); // Dodaj z powrotem do mainContent
            twitchPlayer.style.position = 'absolute'; // Przywróć absolutne pozycjonowanie
            isPlayerDockedToChat = false;
            // Resetuj style czatu
            twitchChatIframe.style.height = `100%`;
            twitchChatIframe.style.top = `0px`;
            twitchChatIframe.style.position = 'static'; // Czat wraca do statycznego w swoim kontenerze
            finalWidth = lastUndockedTwitchWidth;
            finalHeight = lastUndockedTwitchHeight;
        } else {
            // Zachowaj rozmiar, jeśli nie był zmieniony, lub zastosuj nowy
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

    // Zawsze wywołaj adjustKickPlayerSize po zmianie stanu Twitcha
    adjustKickPlayerSize();

    // Obsługa opacity (widoczności) Twitcha na desktopie
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
    if (isGlobalAnimating || isMobileView()) return; // Zablokuj na mobile

    if (isPlayerDockedToChat) {
        updateTwitchPlayer(lastUndockedTwitchWidth, lastUndockedTwitchHeight, currentTwitchPosition === 'docked' ? 'topLeft' : currentTwitchPosition);
    } else {
        // Jeśli czat jest ukryty, najpierw go pokaż, a potem zadokuj
        if (isChatHidden) {
            toggleChatVisibility(true); // Pokaż czat
            setTimeout(() => { // Poczekaj na animację pokazywania czatu
                if (!isGlobalAnimating && !isChatHidden) {
                    updateTwitchPlayer(DOCKED_TTV_WIDTH, DOCKED_TTV_HEIGHT, 'docked');
                }
            }, ANIMATION_DURATION + 50);
        } else {
            updateTwitchPlayer(DOCKED_TTV_WIDTH, DOCKED_TTV_HEIGHT, 'docked');
        }
    }
    updateButtonStates();
    // Nie zamykamy menu automatycznie, to zamykanie jest w updateTwitchPlayer
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
        // Na desktopie, jeśli TTV był zadokowany, oddokuj go przy ukryciu
        if (isPlayerDockedToChat && !isMobileView()) {
             updateTwitchPlayer(lastUndockedTwitchWidth, lastUndockedTwitchHeight, currentTwitchPosition);
        }
        isPlayerDockedToChat = false; // Resetuj stan dokowania
    } else {
        twitchPlayer.style.opacity = '1';
        twitchPlayer.style.display = 'block';
        twitchPlayer.classList.remove('hidden-interaction');
        // Na desktopie, jeśli player był dokowany, przywróć ten stan
        // Na mobile, to jest po prostu "pokazanie" TTV, nie "dokowanie"
        if (!isMobileView() && !isPlayerDockedToChat && toggleChatDockBtn.textContent === 'Odeślij TTV z czatu') {
             // Jeśli przycisk sugeruje, że jest zadokowany, ale flaga nie, napraw to (tylko na desktopie)
             // Ta linia może wymagać dalszej weryfikacji, jeśli stan się rozjeżdża
             // Alternatywnie, po prostu pokaż go w domyślnej pozycji, jeśli nie był dokowany.
             updateTwitchPlayer(lastUndockedTwitchWidth, lastUndockedTwitchHeight, currentTwitchPosition);
        }
    }

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
            // Ponieważ czat znika, TTV nie może być zadokowany
            updateTwitchPlayer(lastUndockedTwitchWidth, lastUndockedTwitchHeight, currentTwitchPosition);
        }
    }

    setTimeout(() => {
        adjustKickPlayerSize();
        // Na desktopie, po zmianie widoczności czatu, upewnij się, że TTV ma prawidłowy rozmiar i pozycję
        if (!isPlayerDockedToChat && !isMobileView()) { // Jeśli nie jest zadokowany i jest desktop
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

    // Nie zamykamy menu automatycznie, to zamykanie jest w listenerze 'fullscreenchange'
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
    toggleOptionsMenu(); // Zamknij menu po zmianie trybu pełnoekranowego
});

// Inicjalizacja przy ładowaniu strony
window.addEventListener('load', () => {
    if (isMobileView()) {
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
    adjustKickPlayerSize();

    if (isMobileView()) {
        if (!isTwitchPlayerHidden) {
            twitchPlayer.style.display = 'block';
            twitchPlayer.classList.remove('hidden-interaction');
            twitchPlayer.style.position = (window.innerHeight < window.innerWidth) ? 'absolute' : 'static';
        } else {
            twitchPlayer.style.display = 'none';
            twitchPlayer.classList.add('hidden-interaction');
            twitchPlayer.style.position = '';
        }
        twitchPlayer.style.left = '';
        twitchPlayer.style.top = '';
        twitchPlayer.style.right = '';
        twitchPlayer.style.width = '';
        twitchPlayer.style.height = '';
        twitchPlayer.style.marginBottom = '';
        isPlayerDockedToChat = false; // Wychodząc z desktopu, resetujemy stan dokowania
    } else { // Powrót do desktopu
        if (!isTwitchPlayerHidden) {
            twitchPlayer.style.display = 'block';
            twitchPlayer.classList.remove('hidden-interaction');
            if (isPlayerDockedToChat) { // Jeśli był zadokowany, przywróć ten stan
                 updateTwitchPlayer(DOCKED_TTV_WIDTH, DOCKED_TTV_HEIGHT, 'docked');
            } else { // Jeśli nie był zadokowany, wróć do poprzedniej pozycji
                twitchPlayer.style.position = 'absolute';
                updateTwitchPlayer(lastUndockedTwitchWidth, lastUndockedTwitchHeight, currentTwitchPosition);
            }
        } else {
            twitchPlayer.style.display = 'none';
            twitchPlayer.classList.add('hidden-interaction');
        }
    }
    updateButtonStates();
});

// Funkcja do aktualizacji stanu przycisków w menu
function updateButtonStates() {
    const isMobile = isMobileView();

    // Ukryj/pokaż przyciski rozmiaru i pozycji TTV oraz "Dokuj TTV" na mobile
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
    toggleBrowserFullscreenBtn.textContent = document.fullscreenElement ? 'Pełny Ekran Strony' : 'Pełny Ekran Strony'; // Zmieniony tekst na "Pełny Ekran Strony" dla obu stanów

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
