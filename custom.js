class CustomUI {
    constructor() {
        this.unityInstance = null;
        this.isReady = false;
        
        console.log("CustomUI создан");
        
        // Настройки по умолчанию
        this.currentAlgorithm = 0; // 0 = Быстрый, 1 = Простой
        this.speedOptions = [1, 4, 8, 12];
        this.currentSpeed = 1; // x1 по умолчанию
        this.currentColorScheme = 'classic';
        this.isAutoSolving = false;
        this.menuOpen = false;
        
        // Статистика
        this.gameStats = {
            totalSolves: 12,
            bestTime: 145,
            totalMoves: 583,
            bestRecords: [
                { time: 145, moves: 42, date: '2024-01-15' },
                { time: 162, moves: 45, date: '2024-01-14' },
                { time: 178, moves: 48, date: '2024-01-13' },
                { time: 195, moves: 52, date: '2024-01-12' },
                { time: 210, moves: 55, date: '2024-01-11' }
            ]
        };
        
        // Загрузка сохраненных данных
        this.loadSettings();
        this.loadStats();
        
        // Ждем Unity
        window.onUnityReady = (instance) => {
            console.log("Unity instance получен");
            this.unityInstance = instance;
            
            setTimeout(() => {
                this.isReady = true;
                console.log("=== СИСТЕМА ГОТОВА ===");
                
                // Применяем сохраненные настройки
                this.applySavedSettings();
                
                // Устанавливаем начальную скорость
                this.sendToUnity('SetCubeSpeed', this.currentSpeed);
                
                // Если в авторежиме - запускаем автосборку
                if (this.getCurrentMode() === 'auto') {
                    this.startAutoSolve();
                }
                
            }, 1000);
        };
        
        this.init();
    }
    
    init() {
        console.log("Инициализация UI...");
        
        // Инициализация всех компонентов
        this.setupModeSelector();
        this.setupControlButtons();
        this.setupMenu();
        this.setupSpeedDots(); // НОВОЕ: настройка точек скорости
        this.setupWindows();
        this.updateStatsDisplay();
        
        console.log("UI инициализирован");
    }
    
    // ===== ТОЧКИ СКОРОСТИ =====
    setupSpeedDots() {
        document.querySelectorAll('.speed-dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                const speed = parseInt(e.currentTarget.dataset.speed);
                this.setSpeed(speed);
            });
        });
    }
    
    // Обновленный метод setSpeed для работы с точками
    setSpeed(speed) {
        if (!this.speedOptions.includes(speed)) {
            console.error(`Недопустимая скорость: ${speed}`);
            return;
        }
        
        this.currentSpeed = speed;
        
        // Обновляем UI точек
        document.querySelectorAll('.speed-dot').forEach(dot => {
            dot.classList.remove('active');
        });
        document.querySelector(`.speed-dot[data-speed="${speed}"]`)?.classList.add('active');
        
        // Обновляем UI в меню (если оно еще используется где-то)
        document.querySelectorAll('.speed-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`.speed-option[data-speed="${speed}"]`)?.classList.add('active');
        
        // Отправляем в Unity
        if (this.isReady) {
            this.sendToUnity('SetCubeSpeed', speed);
        }
        
        // Сохраняем настройки
        this.saveSettings();
        
        console.log(`Установлена скорость: x${speed}`);
    }
    
    // Обновленный applySavedSettings для точек скорости
    applySavedSettings() {
        // Применяем цветовую схему
        this.sendToUnity('ApplyColorPreset', this.currentColorScheme);
        
        // Обновляем UI
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`.color-option[data-scheme="${this.currentColorScheme}"]`)?.classList.add('active');
        
        document.querySelectorAll('.algorithm-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`.algorithm-option[data-algorithm="${this.currentAlgorithm}"]`)?.classList.add('active');
        
        // Обновляем точки скорости
        document.querySelectorAll('.speed-dot').forEach(dot => {
            dot.classList.remove('active');
        });
        document.querySelector(`.speed-dot[data-speed="${this.currentSpeed}"]`)?.classList.add('active');
    }
    
    // Остальной код остается таким же, за исключением setupMenu
    setupMenu() {
        const menuToggle = document.getElementById('menuToggle');
        const menuCloseBtn = document.getElementById('menuCloseBtn');
        const menuOverlay = document.getElementById('menuOverlay');
        const sideMenu = document.getElementById('sideMenu');
        
        // Открытие/закрытие меню
        menuToggle?.addEventListener('click', () => {
            this.toggleMenu();
        });
        
        menuCloseBtn?.addEventListener('click', () => {
            this.closeMenu();
        });
        
        menuOverlay?.addEventListener('click', () => {
            this.closeMenu();
        });
        
        // Цветовые схемы
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const scheme = e.currentTarget.dataset.scheme;
                this.setColorScheme(scheme);
            });
        });
        
        // Алгоритмы сборки
        document.querySelectorAll('.algorithm-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const algorithm = parseInt(e.currentTarget.dataset.algorithm);
                this.setAlgorithm(algorithm);
            });
        });
        
        // Кнопки меню
        document.getElementById('statsBtn')?.addEventListener('click', () => {
            this.showStatsWindow();
            this.closeMenu();
        });
        
        document.getElementById('helpBtn')?.addEventListener('click', () => {
            this.showHelpWindow();
            this.closeMenu();
        });
    }
    
    // Обновленный showHint для работы с подсказками в ручном режиме
    showHint() {
        if (!this.isReady) {
            console.warn("Система ещё не готова");
            return;
        }
        
        const currentMode = this.getCurrentMode();
        
        if (currentMode === 'auto') {
            alert("В авторежиме подсказки не нужны - кубик собирается автоматически");
        } else {
            // В ручном режиме запрашиваем подсказку из Unity
            this.sendToUnity('GetNextHint');
            console.log("Запрос подсказки в ручном режиме");
        }
    }
    
    saveCurrentState() {
        if (!this.isReady) return;
        
        if (confirm('Сохранить текущее состояние кубика?')) {
            this.sendToUnity('SaveCubeState');
            console.log("Сохранение инициировано");
        }
    }
    
    loadSavedState() {
        const state = localStorage.getItem("rubiks_cube_last_state");
        if (state) {
            if (confirm('Загрузить сохраненное состояние? Текущий прогресс будет потерян.')) {
                this.sendToUnity("LoadCubeState", state);
            }
        } else {
            alert("Нет сохраненных состояний");
        }
    }
    
    // ===== СТАТИСТИКА =====
    updateStatsDisplay() {
        document.getElementById('totalSolves').textContent = this.gameStats.totalSolves;
        document.getElementById('bestTime').textContent = this.formatTime(this.gameStats.bestTime);
        document.getElementById('totalMoves').textContent = this.gameStats.totalMoves;
    }
    
    formatTime(seconds) {
        if (seconds === 0) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    
    clearStats() {
        if (confirm("Очистить всю статистику и рекорды?")) {
            this.gameStats = {
                totalSolves: 0,
                bestTime: 0,
                totalMoves: 0,
                bestRecords: [] // Очищаем рекорды тоже
            };
            this.updateStatsDisplay();
            this.updateStatsWindow(); // Обновляем окно статистики
            this.saveStats();
            console.log("Статистика и рекорды очищены");
        }
    }
    
    showHelp() {
        this.showHelpWindow();
        this.closeMenu(); // Закрываем меню при открытии справки
    }
    
    // ===== СОХРАНЕНИЕ/ЗАГРУЗКА ДАННЫХ =====
    saveSettings() {
        const settings = {
            algorithm: this.currentAlgorithm,
            speed: this.currentSpeed,
            colorScheme: this.currentColorScheme
        };
        
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
                const parsed = JSON.parse(settings);
                this.currentAlgorithm = parsed.algorithm || 0;
                this.currentSpeed = parsed.speed || 1;
                this.currentColorScheme = parsed.colorScheme || 'classic';
                console.log("Настройки загружены:", parsed);
            }
        } catch (e) {
            console.error("Ошибка загрузки настроек:", e);
        }
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
                console.log("Статистика загружена");
            }
        } catch (e) {
            console.error("Ошибка загрузки статистики:", e);
        }
    }
    
    applySavedSettings() {
        // Применяем цветовую схему
        this.sendToUnity('ApplyColorPreset', this.currentColorScheme);
        
        // Обновляем UI
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`.color-option[data-scheme="${this.currentColorScheme}"]`)?.classList.add('active');
        
        document.querySelectorAll('.algorithm-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`.algorithm-option[data-algorithm="${this.currentAlgorithm}"]`)?.classList.add('active');
        
        document.querySelectorAll('.speed-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`.speed-option[data-speed="${this.currentSpeed}"]`)?.classList.add('active');
    }
    
    // ===== КОММУНИКАЦИЯ С UNITY =====
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

    setupWindows() {
        // Статистика - из меню
        document.getElementById('clearStatsBtn')?.addEventListener('click', () => {
            this.clearStats();
        });
        
        // Справка - из меню
        document.getElementById('helpBtn')?.addEventListener('click', () => {
            this.showHelpWindow();
        });
        
        // Закрытие окон
        document.getElementById('closeStatsBtn')?.addEventListener('click', () => {
            this.hideStatsWindow();
        });
        
        document.getElementById('closeHelpBtn')?.addEventListener('click', () => {
            this.hideHelpWindow();
        });
        
        document.getElementById('statsOverlay')?.addEventListener('click', () => {
            this.hideStatsWindow();
        });
        
        document.getElementById('helpOverlay')?.addEventListener('click', () => {
            this.hideHelpWindow();
        });
        
        // Очистка всей статистики (из окна статистики)
        document.getElementById('clearAllStatsBtn')?.addEventListener('click', () => {
            this.clearStats();
        });
        
        // Добавляем клик на заголовок "Статистика" в меню
        const menuStatsTitle = document.querySelector('.menu-section h4');
        if (menuStatsTitle && menuStatsTitle.textContent.includes('Статистика')) {
            menuStatsTitle.style.cursor = 'pointer';
            menuStatsTitle.addEventListener('click', () => {
                this.showStatsWindow();
                this.closeMenu();
            });
        }
    }
        
    // Управление окнами
    showStatsWindow() {
        document.getElementById('statsWindow').classList.add('active');
        document.getElementById('statsOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
        this.updateStatsWindow();
    }

    hideStatsWindow() {
        document.getElementById('statsWindow').classList.remove('active');
        document.getElementById('statsOverlay').classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    showHelpWindow() {
        document.getElementById('helpWindow').classList.add('active');
        document.getElementById('helpOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    hideHelpWindow() {
        document.getElementById('helpWindow').classList.remove('active');
        document.getElementById('helpOverlay').classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    // Обновление окна статистики
    updateStatsWindow() {
        document.getElementById('statsTotalSolves').textContent = this.gameStats.totalSolves;
        document.getElementById('statsBestTime').textContent = this.formatTime(this.gameStats.bestTime);
        document.getElementById('statsAvgTime').textContent = this.calculateAverageTime();
        document.getElementById('statsTotalMoves').textContent = this.gameStats.totalMoves;
        
        // Заполняем таблицу рекордов
        this.fillRecordsTable();
    }
    
    calculateAverageTime() {
        if (this.gameStats.totalSolves === 0 || this.gameStats.bestRecords.length === 0) {
            return "0:00";
        }
        
        let totalTime = 0;
        this.gameStats.bestRecords.forEach(record => {
            totalTime += record.time;
        });
        
        const avgTime = totalTime / Math.min(this.gameStats.bestRecords.length, 10);
        return this.formatTime(avgTime);
    }

    fillRecordsTable() {
        const tableBody = document.getElementById('recordsTableBody');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (this.gameStats.bestRecords.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #4cc9f0;">Нет рекордов</td></tr>';
            return;
        }
        
        this.gameStats.bestRecords.forEach((record, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${this.formatTime(record.time)}</td>
                <td>${record.moves || '—'}</td>
                <td>${record.date || '—'}</td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    // Обновляем setSpeed для работы с новыми скоростями
    setSpeed(speed) {
        if (!this.speedOptions.includes(speed)) {
            console.error(`Недопустимая скорость: ${speed}`);
            return;
        }
        
        this.currentSpeed = speed;
        
        // Обновляем UI
        document.querySelectorAll('.speed-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`.speed-option[data-speed="${speed}"]`)?.classList.add('active');
        
        // Отправляем в Unity
        if (this.isReady) {
            this.sendToUnity('SetCubeSpeed', speed);
        }
        
        // Сохраняем настройки
        this.saveSettings();
        
        console.log(`Установлена скорость: x${speed}`);
    }
}

// ===== ГЛОБАЛЬНЫЕ ФУНКЦИИ =====

// Для сохранения состояния из Unity
window.saveCubeState = function(json) {
    localStorage.setItem("rubiks_cube_last_state", json);
    console.log("Состояние сохранено в localStorage");
    alert("✅ Состояние сохранено!");
};

// Для подсказок из Unity
window.showHint = function(hintText) {
    console.log(`Подсказка от Unity: ${hintText}`);
    alert(`Следующий ход: ${hintText}`);
};

// Тестовые функции для консоли
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

window.testSpeed = function(speed) {
    if (window.customUI) {
        window.customUI.setSpeed(speed);
    }
};

window.testColors = function(scheme) {
    if (window.customUI) {
        window.customUI.setColorScheme(scheme);
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

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM загружен");
    window.customUI = new CustomUI();
});