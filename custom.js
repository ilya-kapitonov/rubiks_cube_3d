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

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM загружен");
    window.customUI = new CustomUI();
});