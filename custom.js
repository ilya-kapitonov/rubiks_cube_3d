class SimpleCubeUI {
    constructor() {
        this.unityInstance = null;
        this.currentSpeed = 1.0;
        
        console.log("SimpleCubeUI создан");
        
        // Подписываемся на готовность Unity
        window.onUnityReady = (instance) => {
            console.log("Unity готов! Instance получен:", instance);
            this.unityInstance = instance;
            this.updateDebugStatus("Unity подключен ✓");
            
            // Пробуем сразу отправить тестовое сообщение
            this.testConnection();
        };
        
        this.init();
    }
    
    init() {
        console.log("Инициализация UI...");
        
        // Просто красим кнопки режимов
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                console.log('Выбран режим:', e.currentTarget.dataset.mode);
            });
        });
        
        // Кнопки отладки
        document.getElementById('testSpeed1')?.addEventListener('click', () => {
            this.setSpeed(1);
        });
        
        document.getElementById('testSpeed4')?.addEventListener('click', () => {
            this.setSpeed(4);
        });
        
        document.getElementById('testShuffle')?.addEventListener('click', () => {
            this.shuffleCube();
        });
        
        document.getElementById('testColors')?.addEventListener('click', () => {
            this.testColors();
        });
        
        // Кнопки управления (пока только логирование)
        document.getElementById('resetBtn')?.addEventListener('click', () => {
            console.log("Кнопка сброса нажата");
        });
        
        document.getElementById('hintBtn')?.addEventListener('click', () => {
            console.log("Кнопка подсказки нажата");
        });
        
        document.getElementById('undoBtn')?.addEventListener('click', () => {
            console.log("Кнопка отмены нажата");
        });
        
        this.updateDebugStatus("UI инициализирован, ждем Unity...");
    }
    
    updateDebugStatus(message) {
        const status = document.getElementById('debugStatus');
        if (status) {
            status.textContent = message;
            console.log("Статус:", message);
        }
    }
    
    testConnection() {
        console.log("Тестирование подключения к Unity...");
        
        if (!this.unityInstance) {
            console.error("Unity instance не найден!");
            this.updateDebugStatus("Ошибка: Unity instance не найден");
            return;
        }
        
        // Пробуем простейший вызов
        try {
            console.log("Пробуем SendMessage...");
            
            // ВАЖНО: В текущей версии WebCommunicator.cs ожидает string
            this.unityInstance.SendMessage('WebCommunicator', 'SetCubeSpeed', '1.0');
            
            console.log("SendMessage успешно вызван");
            this.updateDebugStatus("Сообщение отправлено в Unity ✓");
            
            // Добавляем задержку и второй тест
            setTimeout(() => {
                this.updateDebugStatus("Проверяем коммуникацию...");
                this.unityInstance.SendMessage('WebCommunicator', 'ShuffleCube');
                console.log("Команда перемешивания отправлена");
            }, 1000);
            
        } catch (error) {
            console.error("Ошибка SendMessage:", error);
            this.updateDebugStatus("Ошибка SendMessage: " + error.message);
        }
    }
    
    setSpeed(speed) {
        console.log("Установка скорости:", speed);
        this.currentSpeed = speed;
        
        if (!this.unityInstance) {
            console.error("Unity не готов для установки скорости");
            this.updateDebugStatus("Ошибка: Unity не готов");
            return;
        }
        
        try {
            this.unityInstance.SendMessage('WebCommunicator', 'SetCubeSpeed', speed);
            this.updateDebugStatus(`Скорость ${speed} отправлена в Unity`);
            
        } catch (error) {
            console.error("Ошибка отправки скорости:", error);
            this.updateDebugStatus("Ошибка отправки скорости");
        }
    }
    
    shuffleCube() {
        console.log("Запуск перемешивания...");
        
        if (!this.unityInstance) {
            console.error("Unity не готов для перемешивания");
            return;
        }
        
        try {
            this.unityInstance.SendMessage('WebCommunicator', 'ShuffleCube');
            console.log("Команда перемешивания отправлена");
            this.updateDebugStatus("Кубик перемешивается...");
            
        } catch (error) {
            console.error("Ошибка перемешивания:", error);
            this.updateDebugStatus("Ошибка перемешивания");
        }
    }
    
    testColors() {
        console.log("Тестирование цветов...");
        
        if (!this.unityInstance) {
            console.error("Unity не готов для теста цветов");
            return;
        }
        
        try {
            // Тест применения пресета
            this.unityInstance.SendMessage('WebCommunicator', 'ApplyColorPreset', 'neon');
            console.log("Цветовая схема 'neon' отправлена");
            this.updateDebugStatus("Применена неоновая схема");
            
            // Через 2 секунды возвращаем классическую
            setTimeout(() => {
                this.unityInstance.SendMessage('WebCommunicator', 'ApplyColorPreset', 'classic');
                console.log("Возвращена классическая схема");
                this.updateDebugStatus("Возвращена классическая схема");
            }, 2000);
            
        } catch (error) {
            console.error("Ошибка теста цветов:", error);
            this.updateDebugStatus("Ошибка теста цветов");
        }
    }
}

// Глобальная функция для вызова из Unity
function receiveFromUnity(message) {
    console.log("Получено от Unity:", message);
    
    // Обновляем статус
    const status = document.getElementById('debugStatus');
    if (status && message) {
        status.textContent = "Unity: " + message;
    }
}

// Инициализация при загрузке страницы
let cubeUI;
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM загружен, создаем UI...");
    cubeUI = new SimpleCubeUI();
    window.cubeUI = cubeUI; // Для отладки в консоли
});