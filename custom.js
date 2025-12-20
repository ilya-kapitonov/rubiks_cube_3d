class CustomUI {
    constructor() {
        this.unityInstance = null;
        this.currentSpeed = 1;
        this.selectedPreset = 'classic';
        this.customizingFace = null;
        this.selectedColor = '#FF0000';
        this.isMenuOpen = false;
        
        window.onUnityReady = (instance) => {
            console.log('Unity готов');
            this.unityInstance = instance;
            this.sendSpeedToUnity(this.currentSpeed);
            this.updateSliderPosition();
        };
        
        this.init();
    }
    
    init() {
        this.setupControls();
        this.setupSlider();
        this.setupColorPicker();
    }
    
    setupControls() {
        // Гамбургер меню
        const menuToggle = document.getElementById('menuToggle');
        const sideMenu = document.getElementById('sideMenu');
        const closeMenu = document.getElementById('closeMenu');
        
        // Переключатель меню по клику на гамбургер
        menuToggle.addEventListener('click', () => {
            this.isMenuOpen = !this.isMenuOpen;
            sideMenu.classList.toggle('active', this.isMenuOpen);
        });
        
        closeMenu.addEventListener('click', () => {
            this.isMenuOpen = false;
            sideMenu.classList.remove('active');
        });
        
        // Кастомизация
        const openCustomization = document.getElementById('openCustomization');
        const customizationModal = document.getElementById('customizationModal');
        const closeCustomization = document.getElementById('closeCustomization');
        const toggleCustomScheme = document.getElementById('toggleCustomScheme');
        const cubeNet = document.getElementById('cubeNet');
        
        openCustomization.addEventListener('click', () => {
            customizationModal.classList.add('active');
            this.isMenuOpen = false;
            sideMenu.classList.remove('active');
        });
        
        closeCustomization.addEventListener('click', () => {
            customizationModal.classList.remove('active');
        });
        
        // Переключатель своей схемы
        toggleCustomScheme.addEventListener('click', () => {
            cubeNet.classList.toggle('active');
        });
        
        // Выбор пресета
        document.querySelectorAll('.color-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.color-preset-btn').forEach(b => {
                    b.classList.remove('active');
                });
                e.target.classList.add('active');
                this.selectedPreset = e.target.dataset.preset;
                this.applyPreset();
            });
        });
        
        // Выбор стороны кубика
        document.querySelectorAll('.net-face').forEach(face => {
            face.addEventListener('click', (e) => {
                this.customizingFace = e.target.dataset.face;
                this.openColorPicker();
            });
        });
        
        // Закрытие окон по клику вне
        document.addEventListener('click', (e) => {
            if (customizationModal.classList.contains('active') && 
                !customizationModal.contains(e.target) && 
                e.target !== openCustomization) {
                customizationModal.classList.remove('active');
            }
            
            const colorPickerModal = document.getElementById('colorPickerModal');
            if (colorPickerModal.classList.contains('active') && 
                !colorPickerModal.contains(e.target)) {
                colorPickerModal.classList.remove('active');
            }
        });
    }
    
    setupSlider() {
        const sliderTrack = document.querySelector('.speed-slider-track');
        const thumb = document.querySelector('.speed-thumb');
        const markers = document.querySelectorAll('.speed-marker');
        const speeds = [1, 4, 8, 12];
        
        // Функция для обновления позиции ползунка
        const updateSlider = (clientX) => {
            const rect = sliderTrack.getBoundingClientRect();
            let position = (clientX - rect.left) / rect.width;
            position = Math.max(0, Math.min(1, position));
            
            // Привязка к ближайшему маркеру
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
            
            // Устанавливаем выбранную скорость
            this.setSpeed(speeds[nearestIndex]);
            
            // Обновляем визуальное состояние
            markers.forEach((marker, index) => {
                if (index === nearestIndex) {
                    marker.classList.add('active');
                } else {
                    marker.classList.remove('active');
                }
            });
            
            // Двигаем ползунок
            const markerPos = parseFloat(markers[nearestIndex].style.left);
            thumb.style.left = `${markerPos}%`;
        };
        
        // Перетаскивание ползунка
        thumb.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const onMouseMove = (moveEvent) => {
                updateSlider(moveEvent.clientX);
            };
            
            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
        
        // Клик по маркерам
        markers.forEach((marker, index) => {
            marker.addEventListener('click', () => {
                this.setSpeed(speeds[index]);
                this.updateSliderPosition();
            });
        });
        
        // Клик по треку
        sliderTrack.addEventListener('click', (e) => {
            updateSlider(e.clientX);
        });
    }
    
    updateSliderPosition() {
        const speeds = [1, 4, 8, 12];
        const index = speeds.indexOf(this.currentSpeed);
        if (index !== -1) {
            const thumb = document.querySelector('.speed-thumb');
            const markers = document.querySelectorAll('.speed-marker');
            
            // Сбрасываем все активные маркеры
            markers.forEach(marker => marker.classList.remove('active'));
            
            // Активируем нужный маркер
            if (markers[index]) {
                markers[index].classList.add('active');
                const markerPos = parseFloat(markers[index].style.left);
                thumb.style.left = `${markerPos}%`;
            }
        }
    }
    
    setupColorPicker() {
        const colorPickerModal = document.getElementById('colorPickerModal');
        const closeColorPicker = document.getElementById('closeColorPicker');
        const cancelColorPicker = document.getElementById('cancelColorPicker');
        const applyColor = document.getElementById('applyColor');
        const colorWheel = document.getElementById('colorWheel');
        const colorPreview = document.getElementById('colorPreview');
        
        // Простой цветовой круг (можно заменить на более продвинутый)
        colorWheel.addEventListener('click', (e) => {
            const rect = colorWheel.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const angle = Math.atan2(y - centerY, x - centerX);
            const hue = (angle * 180 / Math.PI + 180) % 360;
            
            // Генерация цвета по HSL
            this.selectedColor = `hsl(${hue}, 100%, 50%)`;
            colorPreview.style.backgroundColor = this.selectedColor;
        });
        
        closeColorPicker.addEventListener('click', () => {
            colorPickerModal.classList.remove('active');
        });
        
        cancelColorPicker.addEventListener('click', () => {
            colorPickerModal.classList.remove('active');
        });
        
        applyColor.addEventListener('click', () => {
            if (this.customizingFace && this.unityInstance) {
                this.unityInstance.SendMessage(
                    'WebCommunicator',
                    'SetFaceColor',
                    JSON.stringify({
                        face: this.customizingFace,
                        color: this.selectedColor
                    })
                );
            }
            colorPickerModal.classList.remove('active');
        });
    }
    
    openColorPicker() {
        const colorPickerModal = document.getElementById('colorPickerModal');
        const colorPreview = document.getElementById('colorPreview');
        
        colorPreview.style.backgroundColor = this.selectedColor;
        colorPickerModal.classList.add('active');
    }
    
    setSpeed(speed) {
        this.currentSpeed = speed;
        console.log('Установлена скорость:', speed);
        
        if (this.unityInstance) {
            this.sendSpeedToUnity(speed);
        } else {
            localStorage.setItem('pendingSpeed', speed);
        }
        
        this.updateSliderPosition();
    }
    
    sendSpeedToUnity(speed) {
        try {
            this.unityInstance.SendMessage(
                'WebCommunicator',
                'SetCubeSpeed',
                speed
            );
            console.log('Скорость отправлена в Unity:', speed);
        } catch (e) {
            console.error('SendMessage error', e);
        }
    }
    
    applyPreset() {
        if (this.unityInstance) {
            this.unityInstance.SendMessage(
                'WebCommunicator',
                'ApplyColorPreset',
                this.selectedPreset
            );
            console.log('Применен пресет:', this.selectedPreset);
        }
    }

    applyColorPreset(presetName) {
        if (this.unityInstance) {
            this.unityInstance.SendMessage(
                'WebCommunicator',
                'ApplyColorPreset',
                presetName
            );
            console.log('Применен пресет:', presetName);
        }
    }

    setFaceColor(faceName, colorHex) {
        if (this.unityInstance) {
            const data = JSON.stringify({
                face: faceName,
                color: colorHex
            });
            this.unityInstance.SendMessage(
                'WebCommunicator',
                'SetFaceColor',
                data
            );
            console.log('Установлен цвет грани:', faceName, colorHex);
        }
    }
}

// Инициализация
let customUI;
document.addEventListener('DOMContentLoaded', () => {
    customUI = new CustomUI();
});

// Для отладки
window.customUI = customUI;