class CustomUI {
    constructor() {
        this.unityInstance = null;
        this.currentSpeed = 1.0;
        
        // Ждем загрузки DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    init() {
        this.injectUI();
        this.setupControls();
        this.waitForUnity();
    }
    
    // Вставляем UI в страницу
    injectUI() {
        // Создаем контейнер для UI
        const uiContainer = document.createElement('div');
        uiContainer.id = 'custom-ui-container';
        document.body.appendChild(uiContainer);
        
        // Загружаем UI (можно через fetch или сразу вставить)
        uiContainer.innerHTML = `
            <div id="custom-ui">
                <!-- Гамбургер-меню -->
                <button class="hamburger-btn" id="menuToggle">
                    <i class="fas fa-bars"></i>
                </button>
                
                <div class="side-menu" id="sideMenu">
                    <button class="close-btn" id="closeMenu">
                        <i class="fas fa-times"></i>
                    </button>
                    <h3>Управление</h3>
                    <ul>
                        <li>ЛКМ + перетаскивание: вращение куба</li>
                        <li>ЛКМ по грани: вращение грани</li>
                        <li>W/S/A/D/F/B: вращение граней</li>
                        <li>R: перемешать</li>
                        <li>E: сбросить</li>
                    </ul>
                    <div class="speed-control-menu">
                        <h4>Скорость</h4>
                        <button class="speed-btn-menu" data-speed="0.5">x0.5</button>
                        <button class="speed-btn-menu active" data-speed="1">x1</button>
                        <button class="speed-btn-menu" data-speed="1.5">x1.5</button>
                        <button class="speed-btn-menu" data-speed="2">x2</button>
                    </div>
                </div>
                
                <!-- Панель скорости -->
                <div class="speed-panel" id="speedPanel">
                    <span class="speed-label">Скорость:</span>
                    <div class="speed-options">
                        <button class="speed-btn" data-speed="0.5">Очень медленно</button>
                        <button class="speed-btn active" data-speed="1.0">Нормально</button>
                        <button class="speed-btn" data-speed="1.5">Быстро</button>
                        <button class="speed-btn" data-speed="2.0">Очень быстро</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    setupControls() {
        // Меню
        const menuToggle = document.getElementById('menuToggle');
        const sideMenu = document.getElementById('sideMenu');
        const closeMenu = document.getElementById('closeMenu');
        
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                sideMenu.classList.add('active');
            });
        }
        
        if (closeMenu) {
            closeMenu.addEventListener('click', () => {
                sideMenu.classList.remove('active');
            });
        }
        
        // Кнопки скорости в панели
        const speedButtons = document.querySelectorAll('.speed-btn');
        speedButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                speedButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const speed = parseFloat(e.target.dataset.speed);
                this.setSpeed(speed);
            });
        });
        
        // Кнопки скорости в меню
        const menuSpeedButtons = document.querySelectorAll('.speed-btn-menu');
        menuSpeedButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                menuSpeedButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                const speed = parseFloat(e.target.dataset.speed);
                this.setSpeed(speed);
                
                // Обновляем кнопки в панели
                speedButtons.forEach(b => {
                    if (parseFloat(b.dataset.speed) === speed) {
                        b.classList.add('active');
                    } else {
                        b.classList.remove('active');
                    }
                });
            });
        });
    }
    
    waitForUnity() {
    console.log('Ожидание загрузки Unity...');
    
    if (typeof createUnityInstance !== 'undefined') {
        const originalCreate = window.createUnityInstance;
        window.createUnityInstance = function(...args) {
            console.log('Перехвачено создание Unity instance!');
            return originalCreate(...args).then(instance => {
                console.log('Unity instance успешно создан!');
                window.unityInstance = instance;
                this.unityInstance = instance;
                this.sendPendingSpeed();
                return instance;
            },bind(this));
        }.bind(this);
    }

    // Также проверяем, не был ли instance уже создан (на случай перезагрузки)
    const checkInterval = setInterval(() => {
        if (window.unityInstance && !this.unityInstance) {
            console.log('Найден существующий unityInstance');
            this.unityInstance = window.unityInstance;
            this.sendPendingSpeed();
            clearInterval(checkInterval);
        }
    }, 300);
}
    
    onUnityReady() {
        console.log('Unity готов! Текущая скорость:', this.currentSpeed);
        this.sendSpeedToUnity(this.currentSpeed);
    }
    
    setSpeed(speed) {
        this.currentSpeed = speed;
        console.log('Установлена скорость:', speed + 'x');
        this.sendSpeedToUnity(speed);
    }
    
    sendSpeedToUnity(speed) {
    console.log('Пытаемся отправить скорость:', speed);
    
    if (this.unityInstance) {
        try {
            // ВАРИАНТ 1: Отправка в "WebCommunicator"
            this.unityInstance.SendMessage('WebCommunicator', 'SetCubeSpeed', speed);
            console.log('Сообщение отправлено WebCommunicator');
            
            // ВАРИАНТ 2: Отправка в "Cube" (основной объект с CubeManager)
            this.unityInstance.SendMessage('Cube', 'SetRotationSpeed', speed);
            console.log('Сообщение отправлено Cube');
            
        } catch (error) {
            console.error('Ошибка SendMessage:', error);
        }
    } else {
        console.warn('Unity не готов, сохраняем в localStorage:', speed);
        localStorage.setItem('pendingSpeed', speed.toString());
    }
}
}

// Инициализируем при загрузке страницы
window.addEventListener('load', () => {
    window.customUI = new CustomUI();
});