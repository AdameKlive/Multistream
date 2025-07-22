const twitchPlayer = document.getElementById('twitchPlayer');
const kickPlayer = document.getElementById('kickPlayer'); // Dodano referencję do kickPlayer
const chatSidebar = document.getElementById('chatSidebar'); 
const twitchChatIframe = document.getElementById('twitchChatIframe');
const mainContent = document.getElementById('mainContent'); 
const chatIframeContainer = document.getElementById('chatIframeContainer');

const optionsToggleBtn = document.getElementById('optionsToggleBtn');
const optionsMenu = document.getElementById('optionsMenu');

const shrinkTwitchPlayerBtn = document.getElementById('shrinkTwitchPlayer');
const expandTwitchPlayerBtn = document = document.getElementById('expandTwitchPlayer');
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
let currentTwitchPosition = 'topLeft';
let lastUndockedTwitchWidth = defaultTwitchWidth;
let lastUndockedTwitchHeight = defaultTwitchHeight;

// Funkcja sprawdzająca, czy ekran jest mały (poniżej breakpointu dla telefonów)
function isMobileView() {
    return window.innerWidth <= 768; // Ten sam breakpoint co w CSS
}

function adjustKickPlayerSize() {
    // Ta funkcja będzie teraz prostsza, bo Kick Player zawsze zajmuje 100% szerokości mainContent
    // Jego wysokość będzie proporcjonalna.
    // Na telefonach Kick Player może być jedynym widocznym playerem, jeśli Twitch jest ukryty.
    if (isMobileView()) {
        kickPlayer.style.width = '100%';
        kickPlayer.style.height = `${kickPlayer.offsetWidth * 9 / 16}px`; // Wysokość proporcjonalna do szerokości
    } else {
        const mainContentRect = mainContent.getBoundingClientRect();
        const aspectRatio = 16 / 9; 

        let kickWidth = mainContentRect.width;
        let kickHeight = kickWidth / aspectRatio;

        kickPlayer.style.width = '100%';
        kickPlayer.style.height = `${kickHeight}px`;
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

    // Obsługa dokowania
    if (newPosition === 'docked') {
        if (isMobileView()) {
            // Na telefonie, dokowanie oznacza po prostu wyświetlenie poniżej Kicka i zajęcie 100% szerokości
            twitchPlayer.style.display = 'block'; // Upewnij się, że jest widoczny
            twitchPlayer.classList.add('mobile-visible'); // Dodaj klasę do stylizacji CSS na mobile
            twitchPlayer.style.width = '100%';
            twitchPlayer.style.height = `${twitchPlayer.offsetWidth * 9 / 16}px`; // Wysokość proporcjonalna
            twitchPlayer.style.position = 'static'; // Statyczny, aby płynął za Kickiem
            twitchPlayer.style.marginTop = '10px'; // Odstęp
            mainContent.appendChild(twitchPlayer); // Przenieś do mainContent, jeśli nie był
            
            isPlayerDockedToChat = true; // Nadal traktujemy to jako "zadokowany" tryb wyświetlania
            toggleChatDockBtn.textContent = 'Odeślij TTV z czatu';
            // Na telefonie czat będzie pod oboma playerami, więc nie zmieniamy jego wysokości
            twitchChatIframe.style.height = `100%`; // Czat zawsze 100% wysokości kontenera na mobile
            twitchChatIframe.style.position = 'static'; 

        } else {
            // Logika dokowania dla dużych ekranów
            finalWidth = CHAT_VISIBLE_WIDTH;
            finalHeight = (finalWidth * 9) / 16;
            twitchPlayer.style.position = 'static';
            twitchPlayer.style.marginBottom = '0px';
            chatIframeContainer.prepend(twitchPlayer);
            isPlayerDockedToChat = true;
            toggleChatDockBtn.textContent = 'Odeślij TTV z czatu';
            twitchChatIframe.style.height = `calc(100% - ${finalHeight}px)`;
            twitchChatIframe.style.top = `${finalHeight}px`; 
            twitchChatIframe.style.position = 'relative'; 
        }
    } else {
        // Jeśli nie jest dokowany lub oddokowujemy
        if (isPlayerDockedToChat) {
            mainContent.appendChild(twitchPlayer); // Przenieś player z powrotem do mainContent
            twitchPlayer.style.position = 'absolute'; // Przywróć pozycję absolutną dla desktop
            twitchPlayer.classList.remove('mobile-visible'); // Usuń klasę mobile
            isPlayerDockedToChat = false;
            toggleChatDockBtn.textContent = 'Dokuj TTV nad czat';
            twitchChatIframe.style.height = `100%`;
            twitchChatIframe.style.top = `0px`;
            twitchChatIframe.style.position = 'static'; 

            // Przywróć ostatni niezadokowany rozmiar
            finalWidth = lastUndockedTwitchWidth;
            finalHeight = lastUndockedTwitchHeight;
        } else if (isMobileView()) {
            // Na telefonie, poza trybem "zadokowanym" (czyli po prostu widocznym pod Kickiem), ukrywamy Twitcha domyślnie
            twitchPlayer.style.display = 'none';
            twitchPlayer.classList.remove('mobile-visible');
        } else {
            // Normalne skalowanie i ograniczenia, gdy nie jest zadokowany i na dużym ekranie
            finalWidth = Math.min(Math.max(newWidth, minTwitchWidth), maxTwitchWidth);
            finalHeight = (finalWidth * 9) / 16;
            finalHeight = Math.min(Math.max(finalHeight, minTwitchHeight), maxTwitchHeight);

            // Zapisz rozmiar przed dokowaniem
            lastUndockedTwitchWidth = finalWidth;
            lastUndockedTwitchHeight = finalHeight;

            // Upewnij się, że player jest widoczny i pozycja absolutna
            twitchPlayer.style.display = 'block';
            twitchPlayer.style.position = 'absolute';
            twitchPlayer.style.marginTop = '0'; // Usuń margines, jeśli był
        }

        // Obliczanie nowej pozycji dla niedokowanego playera (tylko na dużych ekranach)
        if (!isMobileView() && newPosition) {
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
    }

    // Zastosuj nowy rozmiar (dla obu przypadków: dokowany i niedokowany na desktopie)
    // Na mobile rozmiar jest ustawiany w if (isMobileView())
    if (!isMobileView() || newPosition === 'docked') { // Apply size if not mobile or if explicitly docked on mobile
        twitchPlayer.style.width = `${finalWidth}px`;
        twitchPlayer.style.height = `${finalHeight}px`;
    }


    // Obsługa opacity (widoczności) Twitcha
    if (isTwitchPlayerHidden && (!isMobileView() || newPosition !== 'docked')) { // Ukryj tylko jeśli nie jesteśmy na mobile i nie jest zadokowany
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
    if (isGlobalAnimating || isMobileView()) return; // Zablokuj na mobile
    if (isPlayerDockedToChat) {
        alert('Aby zmienić rozmiar, najpierw odeślij TTV z czatu.');
        toggleOptionsMenu();
        return;
    }
    updateTwitchPlayer(twitchPlayer.offsetWidth - 42, twitchPlayer.offsetHeight, currentTwitchPosition);
});
expandTwitchPlayerBtn.addEventListener('click', () => {
    if (isGlobalAnimating || isMobileView()) return; // Zablokuj na mobile
    if (isPlayerDockedToChat) {
        alert('Aby zmienić rozmiar, najpierw odeślij TTV z czatu.');
        toggleOptionsMenu();
        return;
    }
    updateTwitchPlayer(twitchPlayer.offsetWidth + 42, twitchPlayer.offsetHeight, currentTwitchPosition);
});

positionTopLeftBtn.addEventListener('click', () => {
    if (isGlobalAnimating || isMobileView()) return; // Zablokuj na mobile
    updateTwitchPlayer(defaultTwitchWidth, defaultTwitchHeight, 'topLeft'); 
});
positionTopRightBtn.addEventListener('click', () => {
    if (isGlobalAnimating || isMobileView()) return; // Zablokuj na mobile
    updateTwitchPlayer(defaultTwitchWidth, defaultTwitchHeight, 'topRight'); 
});
positionBottomLeftBtn.addEventListener('click', () => {
    if (isGlobalAnimating || isMobileView()) return; // Zablokuj na mobile
    updateTwitchPlayer(defaultTwitchWidth, defaultTwitchHeight, 'bottomLeft'); 
});
positionBottomRightBtn.addEventListener('click', () => {
    if (isGlobalAnimating || isMobileView()) return; // Zablokuj na mobile
    updateTwitchPlayer(defaultTwitchWidth, defaultTwitchHeight, 'bottomRight'); 
});

// --- Funkcjonalność DOKOWANIA ---
toggleChatDockBtn.addEventListener('click', () => {
    if (isGlobalAnimating && !isPlayerDockedToChat) return;

    if (isPlayerDockedToChat) {
        // Oddokuj
        if (isMobileView()) {
            // Na mobile po prostu ukryj
            twitchPlayer.style.display = 'none';
            twitchPlayer.classList.remove('mobile-visible');
            isPlayerDockedToChat = false;
            toggleChatDockBtn.textContent = 'Pokaż TTV pod Kickiem'; // Zmieniony tekst na mobile
        } else {
            // Desktop: oddokuj do poprzedniej pozycji
            updateTwitchPlayer(lastUndockedTwitchWidth, lastUndockedTwitchHeight, currentTwitchPosition === 'docked' ? 'topLeft' : currentTwitchPosition); 
        }
    } else {
        // Dokuj
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
    toggleOptionsMenu(); // Zamknij menu po kliknięciu
});

// --- Funkcja do przełączania widoczności Twitch Playera ---
function toggleTwitchPlayerVisibility() {
    if (isGlobalAnimating) return;
    setGlobalAnimationState(true);

    isTwitchPlayerHidden = !isTwitchPlayerHidden; 

    if (isTwitchPlayerHidden) {
        twitchPlayer.style.opacity = '0';
        // Na desktopie ukrywamy, na mobile przestawiamy display
        if (!isMobileView()) {
             twitchPlayer.style.display = 'none';
        }
        toggleTwitchPlayerVisibilityBtn.textContent = '👁️ Pokaż TTV'; 
    } else {
        twitchPlayer.style.opacity = '1';
        if (!isMobileView()) {
            twitchPlayer.style.display = 'block';
        }
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
        toggleChatVisibilityBtn.textContent = '💬 Ukryj/Pokaż Czat'; // Resetuj tekst
    } else { 
        chatSidebar.classList.add('hidden');
        isChatHidden = true;
        // Jeśli player był zadokowany, po ukryciu czatu powinien wrócić na domyślną pozycję lub się ukryć na mobile
        if (isPlayerDockedToChat) {
            if (isMobileView()) {
                twitchPlayer.style.display = 'none';
                twitchPlayer.classList.remove('mobile-visible');
                isPlayerDockedToChat = false;
            } else {
                updateTwitchPlayer(lastUndockedTwitchWidth, lastUndockedTwitchHeight, currentTwitchPosition === 'docked' ? 'topLeft' : currentTwitchPosition); 
            }
        }
        toggleChatVisibilityBtn.textContent = '💬 Pokaż Czat'; // Zmień tekst
    }
    
    setTimeout(() => {
        adjustKickPlayerSize(); 
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
    // Ustawia początkowe wyświetlanie Twitch playera na mobile
    if (isMobileView()) {
        twitchPlayer.style.display = 'none'; // Domyślnie ukryj Twitch playera na mobile
        // Na mobile, Kick Player powinien być zawsze widoczny i zajmować całą szerokość
        kickPlayer.style.width = '100%';
        kickPlayer.style.height = `${kickPlayer.offsetWidth * 9 / 16}px`;
    } else {
        setTimeout(() => {
            adjustKickPlayerSize();
            updateTwitchPlayer(defaultTwitchWidth, defaultTwitchHeight, 'topLeft'); 
        }, 200); 
    }
    // Zaktualizuj stan przycisków i pozycji na starcie
    updateButtonStates();
});

window.addEventListener('resize', () => {
    adjustKickPlayerSize();
    // Ponownie oceniaj, czy jesteśmy na mobile i dostosuj playery
    if (isMobileView()) {
        if (!isPlayerDockedToChat) { // Jeśli nie jest "zadokowany" na mobile, czyli pokazany pod Kickiem
            twitchPlayer.style.display = 'none';
        } else {
            // Jeśli był zadokowany/pokazany na mobile, upewnij się, że jest nadal widoczny i ma 100% szerokości
            twitchPlayer.style.display = 'block';
            twitchPlayer.style.width = '100%';
            twitchPlayer.style.height = `${twitchPlayer.offsetWidth * 9 / 16}px`;
            twitchPlayer.style.position = 'static';
        }
        // Na mobile, przyciski rozmiaru i pozycji nie powinny działać
        shrinkTwitchPlayerBtn.classList.add('disabled-button');
        expandTwitchPlayerBtn.classList.add('disabled-button');
        positionTopLeftBtn.classList.add('disabled-button');
        positionTopRightBtn.classList.add('disabled-button');
        positionBottomLeftBtn.classList.add('disabled-button');
        positionBottomRightBtn.classList.add('disabled-button');
        toggleChatDockBtn.textContent = 'Pokaż TTV pod Kickiem';
    } else {
        // Na desktopie przywróć normalne zachowanie
        if (!isPlayerDockedToChat) {
            twitchPlayer.style.display = 'block';
            twitchPlayer.style.position = 'absolute';
            updateTwitchPlayer(twitchPlayer.offsetWidth, twitchPlayer.offsetHeight, currentTwitchPosition); 
        } else {
            // Jeśli był zadokowany, upewnij się, że jest poprawnie zadokowany na desktopie
            updateTwitchPlayer(CHAT_VISIBLE_WIDTH, CHAT_VISIBLE_WIDTH * 9 / 16, 'docked');
        }

        shrinkTwitchPlayerBtn.classList.remove('disabled-button');
        expandTwitchPlayerBtn.classList.remove('disabled-button');
        positionTopLeftBtn.classList.remove('disabled-button');
        positionTopRightBtn.classList.remove('disabled-button');
        positionBottomLeftBtn.classList.remove('disabled-button');
        positionBottomRightBtn.classList.remove('disabled-button');
        toggleChatDockBtn.textContent = 'Dokuj TTV nad czat'; // Przywróć tekst
    }
    updateButtonStates();
});

// Nowa funkcja do aktualizacji stanu przycisków w menu
function updateButtonStates() {
    if (isMobileView()) {
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
        
        toggleChatDockBtn.textContent = isPlayerDockedToChat ? 'Ukryj TTV' : 'Pokaż TTV pod Kickiem';
        toggleTwitchPlayerVisibilityBtn.style.display = 'none'; // Ukryj na mobile, bo i tak sterujemy displayem
        
    } else {
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

        toggleTwitchPlayerVisibilityBtn.textContent = isTwitchPlayerHidden ? '👁️ Pokaż TTV' : '👁️ Ukryj/Pokaż TTV';
    }
    toggleChatVisibilityBtn.textContent = isChatHidden ? '💬 Pokaż Czat' : '💬 Ukryj/Pokaż Czat';
}
