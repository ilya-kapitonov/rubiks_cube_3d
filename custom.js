class CustomUI {
    constructor() {
        this.unityInstance = null;
        this.isReady = false;
        this.moveHistory = [];
        this.currentMoveIndex = -1;
        
        console.log("CustomUI создан");
        
        // Ждем Unity
        window.onUnityReady = (instance) => {
            console.log("✓ Unity instance получен");
            this.unityInstance = instance;
            
            // Ждем 1 секунду перед любыми вызовами
            setTimeout(() => {
                this.isReady = true;
                console.log("=== СИСТЕМА ГОТОВА ===");
                console.log("Можно использовать кнопки управления");
                
                // Устанавливаем начальную скорость
                this.sendToUnity('SetCubeSpeed', 1);
            }, 1000);
        };
        
        this.init();

         this.gameStats = {
            totalSolves: 0,
            totalPlayTime: 0,
            bestRecords: []
        };
        
        this.loadStats();
    }
    
    init() {
        console.log("Инициализация UI...");
        
        // Инициализация переключателя режимов
        this.setupModeSelector();
        
        // Инициализация кнопок управления
        this.setupControlButtons();
        
        console.log("UI инициализирован ✓");
    }
    
    setupModeSelector() {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-btn').forEach(b => {
                    b.classList.remove('active');
                });
                e.currentTarget.classList.add('active');
                
                const mode = e.currentTarget.dataset.mode;
                console.log(`Выбран режим: ${mode}`);
                
                // Здесь можно добавить логику для разных режимов
                if (mode === 'auto') {
                    console.log("Режим автоматической сборки");
                } else if (mode === 'manual') {
                    console.log("Режим ручной сборки");
                }
            });
        });
    }
    
    setupControlButtons() {
        // Кнопка перемешивания
        document.getElementById('shuffleBtn')?.addEventListener('click', () => {
            this.shuffleCube();
        });
        
        // Кнопка отмены (шаг назад)
        document.getElementById('undoBtn')?.addEventListener('click', () => {
            this.undoMove();
        });
        
        // Кнопка подсказки
        document.getElementById('hintBtn')?.addEventListener('click', () => {
            this.showHint();
        });
        
        // Кнопка меню (пока только логирование)
        document.getElementById('menuToggle')?.addEventListener('click', () => {
            console.log("Меню открыто");
            // TODO: Реализовать открытие меню
        });

         document.getElementById('saveBtn')?.addEventListener('click', () => {
            this.saveCurrentState();
        });
        
        // Новая кнопка загрузки
        document.getElementById('loadBtn')?.addEventListener('click', () => {
            this.loadSavedState();
        });
    }
    
    // ===== ОСНОВНЫЕ МЕТОДЫ =====
    
    shuffleCube() {
        if (!this.isReady) {
            console.warn("Система ещё не готова");
            return;
        }
        
        if (confirm('Перемешать кубик? Текущий прогресс будет сброшен.')) {
            console.log("Начинаем перемешивание...");
            this.sendToUnity('ShuffleCube');
            
            // Очищаем историю ходов после перемешивания
            this.moveHistory = [];
            this.currentMoveIndex = -1;
            console.log("История ходов очищена");
        }
    }
    
    undoMove() {
        if (!this.isReady) {
            console.warn("Система ещё не готова");
            return;
        }
        
        console.log("Отмена последнего хода...");
        this.sendToUnity('UndoMove');
        
        // Обновляем интерфейс
        this.updateStatsDisplay();
    }
    
    showHint() {
        if (!this.isReady) {
            console.warn("Система ещё не готова");
            return;
        }
        
        console.log("Показать подсказку");
        
        // TODO: Реализовать подсказку
        // Временное сообщение
        alert("Функция подсказки будет реализована в следующей версии");
    }
    
    // Метод для добавления хода в историю (будет вызываться из Unity)
    addMoveToHistory(moveData) {
        this.moveHistory.push(moveData);
        this.currentMoveIndex = this.moveHistory.length - 1;
        console.log(`Ход добавлен в историю. Всего ходов: ${this.moveHistory.length}`);
    }
    
    // ===== УТИЛИТЫ =====
    
    sendToUnity(method, parameter = '') {
        if (!this.isReady) {
            console.error(`⚠ Не готово! Ждем инициализации Unity. Метод: ${method}`);
            return;
        }
        
        if (!this.unityInstance) {
            console.error("✗ Unity instance не найден!");
            return;
        }
        
        console.log(`➡ Отправка в Unity: ${method}(${parameter})`);
        
        try {
            if (parameter === '' || parameter === null || parameter === undefined) {
                this.unityInstance.SendMessage('WebCommunicator', method);
            } else {
                this.unityInstance.SendMessage('WebCommunicator', method, parameter);
            }
            console.log(`✓ Сообщение отправлено`);
        } catch (error) {
            console.error(`✗ Ошибка SendMessage:`, error);
        }
    }
    
    // Метод для тестирования из консоли
    testSpeed(speed) {
        this.sendToUnity('SetCubeSpeed', speed);
    }
    
    testColors(preset) {
        this.sendToUnity('ApplyColorPreset', preset);
    }

    saveCubeState(state) {
        try {
            localStorage.setItem('rubiks_cube_last_state', state);
            console.log("Состояние сохранено в localStorage");
        } catch (e) {
            console.error("Ошибка сохранения:", e);
        }
    }
    
    loadCubeState() {
        try {
            const state = localStorage.getItem('rubiks_cube_last_state');
            if (state) {
                console.log("Загружено сохраненное состояние");
                // TODO: Отправить в Unity для восстановления
                return state;
            }
        } catch (e) {
            console.error("Ошибка загрузки:", e);
        }
        return null;
    }
    
    saveStats() {
        try {
            localStorage.setItem('rubiks_cube_stats', JSON.stringify(this.gameStats));
            console.log("Статистика сохранена");
        } catch (e) {
            console.error("Ошибка сохранения статистики:", e);
        }
    }
    
    loadStats() {
        try {
            const stats = localStorage.getItem('rubiks_cube_stats');
            if (stats) {
                this.gameStats = JSON.parse(stats);
                console.log("Статистика загружена:", this.gameStats);
            }
        } catch (e) {
            console.error("Ошибка загрузки статистики:", e);
        }
    }
    
    saveSettings(settings) {
        try {
            localStorage.setItem('rubiks_cube_settings', JSON.stringify(settings));
            console.log("Настройки сохранены");
        } catch (e) {
            console.error("Ошибка сохранения настроек:", e);
        }
    }
    
    loadSettings() {
        try {
            const settings = localStorage.getItem('rubiks_cube_settings');
            if (settings) {
                return JSON.parse(settings);
            }
        } catch (e) {
            console.error("Ошибка загрузки настроек:", e);
        }
        return null;
    }

    saveCurrentState() {
        if (!this.isReady) return;
        
        if (confirm('Сохранить текущее состояние кубика?')) {
            // Сохраняем в Unity, затем в localStorage через callback
            this.sendToUnity('SaveCubeState');
            console.log("Сохранение инициировано");
        }
    }
    
    loadSavedState() {
        if (!this.isReady) return;
        
        if (confirm('Загрузить сохраненное состояние? Текущий прогресс будет потерян.')) {
            const savedState = this.loadCubeState();
            if (savedState) {
                // TODO: Отправить в Unity для восстановления
                console.log("Загрузка состояния:", savedState);
                this.sendToUnity('LoadCubeState', savedState);
            } else {
                alert("Нет сохраненных состояний");
            }
        }
    }
    updateStatsDisplay() {
        // Обновляем отображение статистики в интерфейсе
        // TODO: Добавить элементы для отображения
    }
}

// Глобальные функции для консоли
window.testUnity = function() {
    console.log("=== ТЕСТ ПОДКЛЮЧЕНИЯ ===");
    
    if (!window.customUI) {
        console.error("CustomUI не создан!");
        return;
    }
    
    if (!window.customUI.unityInstance) {
        console.error("Unity instance не найден!");
        return;
    }
    
    if (!window.customUI.isReady) {
        console.warn("Система ещё не готова, ждём...");
        return;
    }
    
    console.log("✓ Система готова к работе");
};

// Глобальные утилиты для отладки
window.saveCurrentCube = function() {
    if (window.customUI) {
        window.customUI.saveCurrentState();
    }
};

window.loadSavedCube = function() {
    if (window.customUI) {
        window.customUI.loadSavedState();
    }
};

window.clearAllData = function() {
    if (confirm("Удалить ВСЕ сохраненные данные (состояния, статистику, настройки)?")) {
        localStorage.removeItem('rubiks_cube_last_state');
        localStorage.removeItem('rubiks_cube_stats');
        localStorage.removeItem('rubiks_cube_settings');
        console.log("Все данные очищены");
    }
};

window.showStats = function() {
    if (window.customUI) {
        console.log("Текущая статистика:", window.customUI.gameStats);
        const saved = localStorage.getItem('rubiks_cube_stats');
        console.log("В localStorage:", saved ? JSON.parse(saved) : "нет данных");
    }
};

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM загружен");
    window.customUI = new CustomUI();
});