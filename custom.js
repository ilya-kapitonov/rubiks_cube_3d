console.log("=== СТАРТ ЗАГРУЗКИ ===");

class CustomUI {
    constructor() {
        this.unityInstance = null;
        this.isReady = false;
        
        console.log("CustomUI создан");
        
        // Ждем Unity
        window.onUnityReady = (instance) => {
            console.log("✓ Unity instance получен:", instance);
            this.unityInstance = instance;
            
            // Ждем 3 секунды перед любыми вызовами
            setTimeout(() => {
                this.isReady = true;
                console.log("=== СИСТЕМА ГОТОВА ===");
                console.log("Используйте в консоли:");
                console.log("  testUnity() - проверить подключение");
                console.log("  sendCmd('SetCubeSpeed', 4) - установить скорость");
                console.log("  sendCmd('ApplyColorPreset', 'neon') - изменить цвета");
                console.log("  sendCmd('ShuffleCube') - перемешать");
                
                // Тестовый вызов
                this.sendToUnity('TestConnection', 'Привет из JavaScript!');
            }, 3000);
        };
        
        this.init();
    }
    
    init() {
        console.log("Инициализация UI...");
        
        // Кнопка перемешивания
        document.getElementById('shuffleBtn')?.addEventListener('click', () => {
            console.log("Кнопка перемешивания");
            this.sendToUnity('ShuffleCube');
        });
        
        console.log("UI инициализирован ✓");
    }
    
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
            if (parameter === '' || parameter === null) {
                this.unityInstance.SendMessage('WebCommunicator', method);
            } else {
                this.unityInstance.SendMessage('WebCommunicator', method, parameter);
            }
            console.log(`✓ Сообщение отправлено`);
        } catch (error) {
            console.error(`✗ Ошибка SendMessage:`, error);
            console.error("Стек вызова:", error.stack);
        }
    }
}

// === ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ КОНСОЛИ ===
function testUnity() {
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
    
    console.log("✓ CustomUI доступен");
    console.log("✓ Unity instance доступен");
    console.log("✓ Система готова");
    
    // Тестовый вызов
    console.log("Отправляем тестовое сообщение...");
    window.customUI.sendToUnity('TestConnection', 'Тест из консоли браузера');
}

function sendCmd(method, parameter) {
    if (window.customUI) {
        window.customUI.sendToUnity(method, parameter);
    } else {
        console.error("CustomUI не доступен!");
    }
}

// === ИНИЦИАЛИЗАЦИЯ ===
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded");
    window.customUI = new CustomUI();
    
    // Для отладки
    console.log("Для тестирования используйте: testUnity()");
});

// Экспортируем для консоли
window.testUnity = testUnity;
window.sendCmd = sendCmd;