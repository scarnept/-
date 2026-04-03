// ==================== Инициализация Telegram WebApp ====================
const tg = window.Telegram?.WebApp;

if (tg) {
    tg.ready();
    tg.expand();
    tg.enableClosingConfirmation();
    
    // Настройка темы (поддержка темной/светлой)
    if (tg.colorScheme === 'dark') {
        document.body.style.background = 'linear-gradient(145deg, #0a0f1e 0%, #0c1222 100%)';
    } else {
        document.body.style.background = 'linear-gradient(145deg, #eef2f7 0%, #d9e0ec 100%)';
        document.body.style.color = '#111';
    }
}

// ==================== Данные игр ====================
const games = {
    pixelworld: {
        id: 'pixelworld',
        storageKey: 'game_pixel_clicks',
        scoreElementId: 'pixel-score',
        previewElementId: 'pixel-preview-count',
        clickZoneId: 'pixel-click-zone',
        refLink: 'https://t.me/pixelworld/play?startapp=r6823288584',
        refLinkInputId: 'pixel-ref-link',
        refBtnId: 'pixel-ref-btn'
    },
    hamster: {
        id: 'hamster',
        storageKey: 'game_hamster_clicks',
        scoreElementId: 'hamster-score',
        previewElementId: 'hamster-preview-count',
        clickZoneId: 'hamster-click-zone',
        refLink: 'https://t.me/Hamster_GAme_Dev_bot/start?startapp=kentId6823288584',
        refLinkInputId: 'hamster-ref-link',
        refBtnId: 'hamster-ref-btn'
    }
};

// Счетчики в памяти
let scores = {
    pixelworld: 0,
    hamster: 0
};

// ==================== Загрузка сохраненных очков ====================
function loadScores() {
    for (const [key, game] of Object.entries(games)) {
        const saved = localStorage.getItem(game.storageKey);
        if (saved !== null && !isNaN(parseInt(saved))) {
            scores[key] = parseInt(saved);
        } else {
            scores[key] = 0;
        }
        updateScoreUI(key);
        updatePreviewCount(key);
    }
}

function saveScore(gameKey) {
    localStorage.setItem(games[gameKey].storageKey, scores[gameKey]);
}

function updateScoreUI(gameKey) {
    const scoreElem = document.getElementById(games[gameKey].scoreElementId);
    if (scoreElem) scoreElem.innerText = scores[gameKey];
}

function updatePreviewCount(gameKey) {
    const previewElem = document.getElementById(games[gameKey].previewElementId);
    if (previewElem) previewElem.innerText = scores[gameKey];
}

// ==================== Анимация "+1" ====================
function showPlusOne(x, y) {
    const div = document.createElement('div');
    div.className = 'plus-one';
    div.innerText = '+1';
    div.style.left = `${x - 20}px`;
    div.style.top = `${y - 30}px`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 600);
}

// ==================== Обработчик клика по зоне ====================
function setupClickHandler(gameKey) {
    const zone = document.getElementById(games[gameKey].clickZoneId);
    if (!zone) return;
    
    const handler = (e) => {
        // Увеличиваем счет
        scores[gameKey]++;
        updateScoreUI(gameKey);
        updatePreviewCount(gameKey);
        saveScore(gameKey);
        
        // Анимация в месте клика
        let clientX, clientY;
        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        showPlusOne(clientX, clientY);
        
        // Вибрация (если поддерживается и в Telegram)
        if (tg && tg.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('light');
        } else if (navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        e.preventDefault();
    };
    
    zone.addEventListener('click', handler);
    zone.addEventListener('touchstart', handler, { passive: false });
}

// ==================== Реферальные ссылки (поделиться / скопировать) ====================
function setupReferral(gameKey) {
    const game = games[gameKey];
    const refBtn = document.getElementById(game.refBtnId);
    const copyBtn = document.querySelector(`[data-copy="${game.refLinkInputId}"]`);
    const linkInput = document.getElementById(game.refLinkInputId);
    
    if (!refBtn) return;
    
    // Кнопка "Пригласить друга" — открываем ссылку через Telegram или в браузере
    refBtn.addEventListener('click', () => {
        if (tg && tg.openTelegramLink) {
            tg.openTelegramLink(game.refLink);
        } else {
            window.open(game.refLink, '_blank');
        }
    });
    
    // Кнопка копирования ссылки
    if (copyBtn && linkInput) {
        copyBtn.addEventListener('click', () => {
            linkInput.select();
            linkInput.setSelectionRange(0, 99999);
            document.execCommand('copy');
            
            // Визуальный фидбек
            const originalText = copyBtn.innerText;
            copyBtn.innerText = '✅';
            setTimeout(() => {
                copyBtn.innerText = originalText;
            }, 1200);
            
            if (tg && tg.showPopup) {
                tg.showPopup({ message: 'Ссылка скопирована!', buttons: [{ type: 'ok' }] });
            }
        });
    }
}

// ==================== Навигация между экранами ====================
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) targetScreen.classList.add('active');
    
    // При переключении обновляем превью счетчиков на главной
    updatePreviewCount('pixelworld');
    updatePreviewCount('hamster');
}

// ==================== Инициализация главного меню ====================
function initHomeScreen() {
    const gameCards = document.querySelectorAll('.game-card');
    gameCards.forEach(card => {
        card.addEventListener('click', (e) => {
            const game = card.getAttribute('data-game');
            if (game === 'pixelworld') {
                switchScreen('pixelworld-screen');
            } else if (game === 'hamster') {
                switchScreen('hamster-screen');
            }
        });
    });
    
    // Кнопки "Назад" на экранах игр
    document.querySelectorAll('[data-back]').forEach(btn => {
        btn.addEventListener('click', () => {
            switchScreen('home-screen');
        });
    });
}

// ==================== Запуск приложения ====================
function init() {
    loadScores();
    
    // Настройка игр
    setupClickHandler('pixelworld');
    setupClickHandler('hamster');
    setupReferral('pixelworld');
    setupReferral('hamster');
    
    initHomeScreen();
    
    // Показываем главный экран
    switchScreen('home-screen');
    
    // Дополнительно: если в Telegram, показываем кнопку закрытия не нужна, но делаем красивый заголовок
    if (tg) {
        tg.setHeaderColor ? tg.setHeaderColor('bg_color') : null;
        tg.setBackgroundColor ? tg.setBackgroundColor('bg_color') : null;
    }
}

// Запуск после полной загрузки DOM
document.addEventListener('DOMContentLoaded', init);
