class CustomUI {
    constructor() {
        this.unityInstance = null;
        this.currentSpeed = 1;
        this.steps = 0;
        this.isMenuOpen = false;
        this.timer = {
            running: false,
            startTime: 0,
            elapsed: 0,
            interval: null
        };
        this.selectedFace = null;
        
        this.init();
    }
    
    init() {
        this.setupControls();
        this.setupSpeedSlider();
        this.setupColorPalette();
        this.setupTimer();
        
        // Подписываемся на события от Unity
        window.onUnityReady = (instance) => this.onUnityReady(instance);
    }
    
    onUnityReady(unityInstance) {
        console.log('Unity готов!');
        this.unityInstance = unityInstance;
        
        // Загружаем сохраненную скорость
        const savedSpeed = localStorage.getItem('cubeSpeed');
        if (savedSpeed) {
            this.setSpeed(parseFloat(savedSpeed));
            this.updateSliderPosition(parseFloat(savedSpeed));
        }
    }
    
    /* ===== ТАЙМЕР ===== */
    setupTimer() {
        this.timerElement = document.getElementById('timer');
        this.timerControlBtn = document.getElementById('timerControl');
        
        this.timerControlBtn.addEventListener('click', () => {
            if (this.timer.running) {
                this.pauseTimer();
            } else {
                this.startTimer();
            }
        });
        
        // Обновляем таймер каждые 10мс для точности
        setInterval(() => this.updateTimerDisplay(), 10);
    }
    
    startTimer() {
        if (!this.timer.running) {
            this.timer.running = true;
            this.timer.startTime = Date.now() - this.timer.elapsed;
            this.timerControlBtn.innerHTML = '<i class="fas fa-pause"></i>';
            this.timerControlBtn.title = 'Пауза';
            this.timerControlBtn.classList.remove('paused');
            this.timerControlBtn.classList.add('running');
        }
    }
    
    pauseTimer() {
        if (this.timer.running) {
            this.timer.running = false;
            this.timer.elapsed = Date.now() - this.timer.startTime;
            this.timerControlBtn.innerHTML = '<i class="fas fa-play"></i>';
            this.timerControlBtn.title = 'Продолжить';
            this.timerControlBtn.classList.remove('running');
            this.timerControlBtn.classList.add('paused');
        }
    }
    
    resetTimer() {
        this.timer.running = false;
        this.timer.elapsed = 0;
        this.timer.startTime = 0;
        this.timerControlBtn.innerHTML = '<i class="fas fa-play"></i>';
        this.timerControlBtn.title = 'Старт';
        this.updateTimerDisplay();
    }
    
    updateTimerDisplay() {
        let displayTime;
        
        if (this.timer.running) {
            const currentElapsed = Date.now() - this.timer.startTime;
            displayTime = currentElapsed;
        } else {
            displayTime = this.timer.elapsed;
        }
        
        const totalSeconds = displayTime / 1000;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        const milliseconds = Math.floor((totalSeconds % 1) * 100);
        
        this.timerElement.textContent = 
            `${minutes.toString().padStart(2, '0')}:` +
            `${seconds.toString().padStart(2, '0')}.` +
            `${milliseconds.toString().padStart(2, '0')}`;
    }
    
    /* ===== ПОЛЗУНОК СКОРОСТИ ===== */
    setupSpeedSlider() {
        const slider = document.getElementById('speedSlider');
        const thumb = document.getElementById('speedThumb');
        const markers = document.querySelectorAll('.speed-marker');
        const speedValue = document.getElementById('speedValue');
        const speeds = [1, 4, 8, 12];
        
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
        
        if (index !== -1) {
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
        console.log('Установлена скорость:', speed);
        
        if (this.unityInstance) {
            try {
                this.unityInstance.SendMessage('WebCommunicator', 'SetCubeSpeed', speed);
                console.log('Скорость отправлена в Unity');
            } catch (e) {
                console.error('Ошибка отправки скорости:', e);
            }
        }
    }
    
    /* ===== УПРАВЛЕНИЕ ===== */
    setupControls() {
        // Меню
        const menuToggle = document.getElementById('menuToggle');
        const sideMenu = document.getElementById('sideMenu');
        const closeMenu = document.getElementById('closeMenu');
        
        menuToggle.addEventListener('click', () => {
            this.isMenuOpen = !this.isMenuOpen;
            sideMenu.classList.toggle('active', this.isMenuOpen);
        });
        
        closeMenu.addEventListener('click', () => {
            this.isMenuOpen = false;
            sideMenu.classList.remove('active');
        });
        
        // Кнопки управления
        document.getElementById('shuffleBtn').addEventListener('click', () => {
            if (confirm('Перемешать кубик? Текущий прогресс будет сброшен.')) {
                if (this.unityInstance) {
                    this.unityInstance.SendMessage('WebCommunicator', 'ShuffleCube');
                    this.resetTimer();
                    this.steps = 0;
                    this.updateStepsCounter();
                }
            }
        });
        
        document.getElementById('undoBtn').addEventListener('click', () => {
            // TODO: Реализовать шаг назад
            console.log('Шаг назад');
        });
        
        document.getElementById('hintBtn').addEventListener('click', () => {
            // TODO: Реализовать подсказку
            console.log('Подсказка');
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
        
        // Кастомизация кубика
        const toggleCustomization = document.getElementById('toggleCustomization');
        const colorCustomization = document.getElementById('colorCustomization');
        
        toggleCustomization.addEventListener('click', () => {
            colorCustomization.style.display = 
                colorCustomization.style.display === 'none' ? 'block' : 'none';
        });
        
        // Выбор цветовой схемы
        document.querySelectorAll('.color-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.color-preset-btn').forEach(b => {
                    b.classList.remove('active');
                });
                e.currentTarget.classList.add('active');
                
                const preset = e.currentTarget.dataset.preset;
                this.applyColorPreset(preset);
            });
        });
        
        // Выбор грани для пользовательской схемы
        document.querySelectorAll('.net-cell').forEach(cell => {
            cell.addEventListener('click', (e) => {
                const face = e.currentTarget.dataset.face;
                this.selectedFace = face;
                this.openColorPicker(face);
            });
        });
        
        // Модальное окно выбора цвета
        const colorModal = document.getElementById('colorModal');
        const closeColorModal = document.getElementById('closeColorModal');
        const cancelColor = document.getElementById('cancelColor');
        const applyColor = document.getElementById('applyColor');
        
        closeColorModal.addEventListener('click', () => {
            colorModal.classList.remove('active');
        });
        
        cancelColor.addEventListener('click', () => {
            colorModal.classList.remove('active');
        });
        
        applyColor.addEventListener('click', () => {
            if (this.selectedFace) {
                const color = document.getElementById('colorInput').value;
                this.setFaceColor(this.selectedFace, color);
                // Обновляем цвет в сетке
                const faceCell = document.querySelector(`.net-cell[data-face="${this.selectedFace}"]`);
                if (faceCell) {
                    faceCell.style.background = color;
                }
            }
            colorModal.classList.remove('active');
        });
        
        // Закрытие модального окна по клику вне
        colorModal.addEventListener('click', (e) => {
            if (e.target === colorModal) {
                colorModal.classList.remove('active');
            }
        });
    }
    
    /* ===== ВЫБОР ЦВЕТА ===== */
    setupColorPalette() {
        const palette = document.getElementById('colorPalette');
        const colors = [
            '#FFFFFF', '#FFD500', '#009B48', '#0046AD', '#B71234', '#FF5800',
            '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
            '#800000', '#008000', '#000080', '#808000', '#800080', '#008080',
            '#FFA500', '#FFC0CB', '#FFD700', '#90EE90', '#ADD8E6', '#D8BFD8',
            '#F0E68C', '#E6E6FA', '#FFE4E1', '#98FB98', '#AFEEEE', '#DDA0DD'
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
    
    openColorPicker(face) {
        this.selectedFace = face;
        const colorModal = document.getElementById('colorModal');
        const preview = document.getElementById('colorPreview');
        const input = document.getElementById('colorInput');
        
        // Устанавливаем текущий цвет грани (если есть)
        const faceCell = document.querySelector(`.net-cell[data-face="${face}"]`);
        if (faceCell && faceCell.style.background) {
            const currentColor = faceCell.style.background;
            preview.style.background = currentColor;
            input.value = this.rgbToHex(currentColor);
        }
        
        colorModal.classList.add('active');
    }
    
    rgbToHex(rgb) {
        if (rgb.startsWith('#')) return rgb;
        
        const result = rgb.match(/\d+/g);
        if (result) {
            return '#' + result.map(x => {
                const hex = parseInt(x).toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            }).join('');
        }
        return '#FF0000';
    }
    
    /* ===== РАБОТА С ЦВЕТАМИ ===== */
    applyColorPreset(presetName) {
        if (this.unityInstance) {
            this.unityInstance.SendMessage('WebCommunicator', 'ApplyColorPreset', presetName);
            console.log('Применен пресет:', presetName);
        }
    }
    
    setFaceColor(faceName, colorHex) {
        if (this.unityInstance) {
            const data = JSON.stringify({ face: faceName, color: colorHex });
            this.unityInstance.SendMessage('WebCommunicator', 'SetFaceColor', data);
            console.log('Установлен цвет грани:', faceName, colorHex);
        }
    }
    
    /* ===== СЧЕТЧИК ШАГОВ ===== */
    updateStepsCounter() {
        document.getElementById('stepsCounter').textContent = this.steps;
        localStorage.setItem('cubeSteps', this.steps);
    }
    
    incrementSteps() {
        this.steps++;
        this.updateStepsCounter();
        
        // Автозапуск таймера при первом шаге
        if (this.steps === 1 && !this.timer.running) {
            this.startTimer();
        }
    }
}

// Инициализация при загрузке страницы
let customUI;
document.addEventListener('DOMContentLoaded', () => {
    customUI = new CustomUI();
    window.customUI = customUI; // Для отладки
});

// Глобальная функция для вызова из Unity
function receiveFromUnity(message) {
    console.log('Получено от Unity:', message);
    
    if (window.customUI) {
        // Если сообщение о повороте - увеличиваем счетчик шагов
        if (message.includes('rotate') || message.includes('move')) {
            window.customUI.incrementSteps();
        }
        
        // Если кубик собран - останавливаем таймер
        if (message.includes('complete')) {
            window.customUI.pauseTimer();
        }
    }
}