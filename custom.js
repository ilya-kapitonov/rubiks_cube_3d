class CustomUI {
    constructor() {
        this.unityInstance = null;
        this.currentSpeed = 1;
        
        console.log("CustomUI конструктор вызван");
        
        // Подписываемся на готовность Unity
        window.onUnityReady = (instance) => {
            console.log("✓ Unity готов! Instance:", instance);
            this.unityInstance = instance;
            
            // Загружаем сохраненную скорость
            const savedSpeed = localStorage.getItem('cubeSpeed');
            if (savedSpeed) {
                this.setSpeed(parseFloat(savedSpeed));
            }
        };
        
        this.init();
    }
    
    init() {
        console.log("Инициализация элементов управления...");
        
        // Меню
        const menuToggle = document.getElementById('menuToggle');
        const sideMenu = document.getElementById('sideMenu');
        const closeMenu = document.getElementById('closeMenu');
        
        menuToggle?.addEventListener('click', () => {
            this.isMenuOpen = !this.isMenuOpen;
            sideMenu?.classList.toggle('active', this.isMenuOpen);
        });
        
        closeMenu?.addEventListener('click', () => {
            this.isMenuOpen = false;
            sideMenu?.classList.remove('active');
        });
        
        // Переключатель режимов
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-btn').forEach(b => {
                    b.classList.remove('active');
                });
                e.currentTarget.classList.add('active');
                console.log('Выбран режим:', e.currentTarget.dataset.mode);
            });
        });
        
        // Ползунок скорости
        this.setupSpeedSlider();
        
        // Цветовая кастомизация (базовая инициализация)
        this.setupColorPalette();
        
        // Кнопки управления (только логирование)
        document.getElementById('shuffleBtn')?.addEventListener('click', () => {
            console.log("Кнопка перемешивания нажата");
            this.shuffleCube();
        });
        
        document.getElementById('undoBtn')?.addEventListener('click', () => {
            console.log("Кнопка отмены нажата");
        });
        
        document.getElementById('hintBtn')?.addEventListener('click', () => {
            console.log("Кнопка подсказки нажата");
        });
        
        console.log("✓ CustomUI инициализирован");
    }
    
    setupSpeedSlider() {
        const slider = document.getElementById('speedSlider');
        const thumb = document.getElementById('speedThumb');
        const markers = document.querySelectorAll('.speed-marker');
        const speedValue = document.getElementById('speedValue');
        const speeds = [1, 4, 8, 12];
        
        if (!slider || !thumb) {
            console.warn("Элементы слайдера скорости не найдены");
            return;
        }
        
        // Функция для установки скорости
        const setSpeedFromPosition = (clientX) => {
            const rect = slider.getBoundingClientRect();
            let position = (clientX - rect.left) / rect.width;
            position = Math.max(0, Math.min(1, position));
            
            // Находим ближайший маркер
            let nearestIndex = 0;
            let minDistance = 1;
            
            markers.forEach((marker, index) => {
                const markerPos = parseFloat(marker.style.left) / 100;
                const distance = Math.abs(position - markerPos);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestIndex = index;
                }
            });
            
            // Устанавливаем скорость
            const speed = speeds[nearestIndex];
            this.setSpeed(speed);
            
            // Обновляем UI
            markers.forEach((marker, index) => {
                marker.style.background = index === nearestIndex ? '#4cc9f0' : 'rgba(255, 255, 255, 0.4)';
            });
            
            // Двигаем ползунок
            const markerPos = parseFloat(markers[nearestIndex].style.left);
            thumb.style.left = `${markerPos}%`;
            
            // Обновляем цифровое значение
            speedValue.textContent = `x${speed}`;
            
            // Сохраняем в localStorage
            localStorage.setItem('cubeSpeed', speed);
        };
        
        // Перетаскивание ползунка
        thumb.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const onMouseMove = (moveEvent) => {
                setSpeedFromPosition(moveEvent.clientX);
            };
            
            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
        
        // Клик по треку
        slider.addEventListener('click', (e) => {
            setSpeedFromPosition(e.clientX);
        });
        
        // Клик по маркерам
        markers.forEach((marker, index) => {
            marker.addEventListener('click', (e) => {
                e.stopPropagation();
                const speed = speeds[index];
                this.setSpeed(speed);
                this.updateSliderPosition(speed);
                speedValue.textContent = `x${speed}`;
                localStorage.setItem('cubeSpeed', speed);
            });
        });
        
        // Инициализация
        this.updateSliderPosition(this.currentSpeed);
        speedValue.textContent = `x${this.currentSpeed}`;
    }
    
    updateSliderPosition(speed) {
        const speeds = [1, 4, 8, 12];
        const index = speeds.indexOf(speed);
        const thumb = document.getElementById('speedThumb');
        const markers = document.querySelectorAll('.speed-marker');
        const speedValue = document.getElementById('speedValue');
        
        if (index !== -1 && thumb && markers.length > 0) {
            const positions = ['0%', '33.33%', '66.66%', '100%'];
            thumb.style.left = positions[index];
            
            markers.forEach((marker, i) => {
                marker.style.background = i === index ? '#4cc9f0' : 'rgba(255, 255, 255, 0.4)';
            });
            
            speedValue.textContent = `x${speed}`;
        }
    }
    
    setSpeed(speed) {
        this.currentSpeed = speed;
        console.log('Установка скорости:', speed);
        
        if (!this.unityInstance) {
            console.warn('Unity не готов, сохраняем скорость для отправки позже');
            return;
        }
        
        try {
            // ВАЖНО: WebCommunicator ожидает string параметр
            const speedStr = speed.toString();
            console.log('Отправка в Unity:', speedStr);
            
            this.unityInstance.SendMessage('WebCommunicator', 'SetCubeSpeed', speedStr);
        } catch (e) {
            console.error('Ошибка отправки скорости:', e);
        }
    }
    
    shuffleCube() {
        if (!this.unityInstance) {
            console.warn('Unity не готов для перемешивания');
            return;
        }
        
        if (confirm('Перемешать кубик? Текущий прогресс будет сброшен.')) {
            try {
                this.unityInstance.SendMessage('WebCommunicator', 'ShuffleCube');
                console.log('Команда перемешивания отправлена');
            } catch (e) {
                console.error('Ошибка перемешивания:', e);
            }
        }
    }
    
    setupColorPalette() {
        const palette = document.getElementById('colorPalette');
        if (!palette) return;
        
        const colors = [
            '#FFFFFF', '#FFD500', '#009B48', '#0046AD', '#B71234', '#FF5800',
            '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
            '#800000', '#008000', '#000080', '#808000', '#800080', '#008080',
            '#FFA500', '#FFC0CB', '#FFD700', '#90EE90', '#ADD8E6', '#D8BFD8'
        ];
        
        colors.forEach(color => {
            const colorOption = document.createElement('div');
            colorOption.className = 'color-option';
            colorOption.style.background = color;
            colorOption.title = color;
            
            colorOption.addEventListener('click', () => {
                document.querySelectorAll('.color-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                colorOption.classList.add('selected');
                document.getElementById('colorPreview').style.background = color;
                document.getElementById('colorInput').value = color;
            });
            
            palette.appendChild(colorOption);
        });
        
        // Выбираем первый цвет по умолчанию
        if (palette.firstChild) {
            palette.firstChild.click();
        }
    }
}

// Глобальная функция для вызова из Unity (если нужно)
function receiveFromUnity(message) {
    console.log('Сообщение от Unity:', message);
}

// Инициализация
let customUI;
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM загружен, инициализируем CustomUI...");
    customUI = new CustomUI();
    window.customUI = customUI; // Для отладки в консоли
    
    // Для тестирования в консоли
    window.sendToUnity = function(method, parameter) {
        if (!customUI || !customUI.unityInstance) {
            console.error("Unity не готов!");
            return;
        }
        console.log(`Вызов: ${method}(${parameter})`);
        customUI.unityInstance.SendMessage('WebCommunicator', method, parameter);
    };
});