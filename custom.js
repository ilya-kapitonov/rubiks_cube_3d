class CustomUI {
    constructor() {
        this.unityInstance = null;
        this.isReady = false;
        this.userInteracted = false;
        this.isShuffling = false;
        
        console.log("CustomUI создан");
        
        // Настройки по умолчанию
        this.currentAlgorithm = 0;
        this.currentSpeed = 1;
        this.currentColorScheme = 'classic';
        this.isAutoSolving = false;
        this.menuOpen = false;
        
         // Таймер
        this.timer = {
            startTime: 0,
            elapsedTime: 0,
            isRunning: false,
            isPaused: false
        };
        this.moveCount = 0;
        this.isCubeSolved = false;

        // Статистика
        this.gameStats = {
            totalSolves: 0,
            bestTime: 0,
            totalPlayTime: 0,
            bestRecords: []
        };

        this.selectedFace = 'up';
        this.customColors = {
            up: '#FFFFFF',
            left: '#FFD500', 
            front: '#009B48',
            right: '#0046AD',
            back: '#B71234',
            down: '#FF5800'
        };
        this.initCustomColors();
        // Загрузка сохраненных данных
        this.loadSettings();
        this.loadStats();
        this.loadTimerState();
        
        // Ждем Unity
        window.onUnityReady = (instance) => {
            console.log("Unity instance получен");
            this.unityInstance = instance;
            
            setTimeout(() => {
                this.isReady = true;
                console.log("=== СИСТЕМА ГОТОВА ===");
                
                this.applySavedSettings();
                
                this.sendToUnity('SetCubeSpeed', this.currentSpeed);
                
                if (this.getCurrentMode() === 'auto') {
                    this.startAutoSolve();
                }
                
            }, 1000);
        };
        
        this.init();
    }
    
    init() {
        console.log("Инициализация UI...");
        this.setupModeSelector();
        this.setupControlButtons();
        this.setupMenu();
        this.setupSpeedSlider();
        this.setupCustomColors();
        this.setupWindows();
        this.initTimer();
        this.updateStatsDisplay();
        window.addEventListener('resize', () => this.resizeCanvas());
        setTimeout(() => this.resizeCanvas(), 1000);
        console.log("UI инициализирован");
    }
    initCustomColors() {
        // Загружаем сохраненные пользовательские цвета
        const savedColors = localStorage.getItem('rubiks_cube_custom_colors');
        if (savedColors) {
            try {
                this.customColors = JSON.parse(savedColors);
                console.log("Пользовательские цвета загружены:", this.customColors);
            } catch (e) {
                console.error("Ошибка загрузки пользовательских цветов:", e);
            }
        }
    }

    // ТАЙМЕР 
    initTimer() {
        this.timerDisplay = document.getElementById('timerDisplay');
        this.timerPauseBtn = document.getElementById('timerPauseBtn');
        this.timerResetBtn = document.getElementById('timerResetBtn');
        this.movesCountElement = document.getElementById('movesCount');
        
        // Обработчики кнопок таймера
        this.timerPauseBtn?.addEventListener('click', () => {
            this.toggleTimerPause();
        });
        
        this.timerResetBtn?.addEventListener('click', () => {
            this.resetTimer();
        });
        setInterval(() => this.updateTimer(), 10);
    }

    toggleTimerPause() {
        if (!this.timer.isRunning) return;
        
        this.timer.isPaused = !this.timer.isPaused;
        
        const icon = this.timerPauseBtn.querySelector('i');
        if (this.timer.isPaused) {
            icon.className = 'fas fa-play';
            this.timerPauseBtn.title = 'Продолжить';
        } else {
            icon.className = 'fas fa-pause';
            this.timerPauseBtn.title = 'Пауза';
        }
        
        console.log(`Таймер ${this.timer.isPaused ? 'на паузе' : 'возобновлен'}`);
    }

    resetTimer() {
        this.timer = {
            startTime: Date.now(),
            elapsedTime: 0,
            isRunning: false,
            isPaused: false
        };
        
        this.updateTimerDisplay();
        this.timerPauseBtn.querySelector('i').className = 'fas fa-pause';
        this.timerPauseBtn.title = 'Пауза';
        
        console.log('Таймер сброшен');
    }

    startTimer() {
        if (this.timer.isRunning && !this.timer.isPaused) return;
        
        if (!this.timer.isRunning) {
            this.timer.startTime = Date.now() - this.timer.elapsedTime;
            this.timer.isRunning = true;
        }
        
        this.timer.isPaused = false;
        this.saveTimerState();
    }

    stopTimer() {
        if (!this.timer.isRunning) return;
        
        this.timer.isRunning = false;
        this.timer.isPaused = false;
        this.updateTimerDisplay();
        
        if (this.isCubeSolved) {
            this.saveSolveResult();
        }
        
        console.log('Таймер остановлен');
    }

    updateTimer() {
        if (!this.timer.isRunning || this.timer.isPaused) return;
        
        this.timer.elapsedTime = Date.now() - this.timer.startTime;
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        const totalMs = this.timer.elapsedTime; 
        const minutes = Math.floor(totalMs / 60000);
        const seconds = Math.floor((totalMs % 60000) / 1000);
        const milliseconds = Math.floor((totalMs % 1000) / 10); 
        
        this.timerDisplay.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(2, '0')}`;
    }

    // СЧЕТЧИК ХОДОВ 
    incrementMoveCount() {
        this.moveCount++;
        console.log("Счетчик ходов увеличен:", this.moveCount);
        
        // Сохраняем в localStorage
        this.saveTimerState();
        
        if (this.movesCountElement) {
            this.movesCountElement.textContent = this.moveCount;
        } else {
            this.movesCountElement = document.getElementById('movesCount');
            if (this.movesCountElement) {
                this.movesCountElement.textContent = this.moveCount;
            }
        }
    }

    resetMoveCount() {
        this.moveCount = 0;
        this.movesCountElement.textContent = '0';
    }

    // СОХРАНЕНИЕ РЕЗУЛЬТАТА СБОРКИ 
    saveSolveResult() {
        const solveTime = Math.floor(this.timer.elapsedTime / 1000);
        
        this.gameStats.totalSolves++;
        this.gameStats.totalPlayTime = (this.gameStats.totalPlayTime || 0) + solveTime;
        
        if (this.gameStats.bestTime === 0 || solveTime < this.gameStats.bestTime) {
            this.gameStats.bestTime = solveTime;
        }
        
        const newRecord = {
            time: solveTime,
            moves: this.moveCount,
            date: new Date().toISOString().split('T')[0]
        };
        
        this.gameStats.bestRecords.push(newRecord);
        this.gameStats.bestRecords.sort((a, b) => a.time - b.time);
        
        if (this.gameStats.bestRecords.length > 10) {
            this.gameStats.bestRecords = this.gameStats.bestRecords.slice(0, 10);
        }
        
        this.saveStats();
        this.updateStatsDisplay();
        this.updateStatsWindow();
        
        localStorage.removeItem('rubiks_cube_timer_state');
        this.resetTimer();
        this.resetMoveCount();
    }

     //  ПОЛЗУНОК СКОРОСТИ 
    setupSpeedSlider() {
        this.speedSlider = new SpeedSlider(
            'speedSlider', 
            'speedThumb', 
            'speedValue'
        );
        
        // Устанавливаем обработчик изменения скорости
        this.speedSlider.onSpeedChange = (speed) => {
            this.currentSpeed = speed;
            
            // Отправляем в Unity
            if (this.isReady) {
                this.sendToUnity('SetCubeSpeed', speed);
            }
            
            // Сохраняем настройки
            this.saveSettings();
            
            console.log(`Установлена скорость: x${speed}`);
        };
        
        // Загружаем сохраненную скорость
        const savedSpeed = localStorage.getItem('rubiks_cube_settings');
        if (savedSpeed) {
            try {
                const settings = JSON.parse(savedSpeed);
                if (settings.speed) {
                    this.speedSlider.setSpeed(settings.speed);
                }
            } catch (e) {
                console.error("Ошибка загрузки скорости:", e);
            }
        }
    }

    //РЕЖИМЫ (A/P)
    setupModeSelector() {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const oldMode = this.getCurrentMode();
                const newMode = e.currentTarget.dataset.mode;
                
                // Снимаем активный класс со всех
                document.querySelectorAll('.mode-btn').forEach(b => {
                    b.classList.remove('active');
                });
                e.currentTarget.classList.add('active');
                
                console.log(`Режим изменен: ${oldMode} → ${newMode}`);
                
                this.handleModeChange(oldMode, newMode);
            });
        });
    }
    
    getCurrentMode() {
        const activeBtn = document.querySelector('.mode-btn.active');
        return activeBtn ? activeBtn.dataset.mode : 'manual';
    }
    
    handleModeChange(oldMode, newMode) {
        this.savedMode = newMode;
        this.saveSettings();
        
        console.log(`Режим изменен: ${oldMode} → ${newMode}`);
        
        // Если переключаемся из авторежима в ручной - останавливаем автосборку
        if (oldMode === 'auto' && newMode === 'manual') {
            this.stopAutoSolve();
            
            // При переключении в ручной режим запускаем таймер
            if (!this.timer.isRunning && !this.isCubeSolved) {
                this.startTimer();
            }
        }
        // Если переключаемся из ручного в авторежим - запускаем автосборку
        else if (oldMode === 'manual' && newMode === 'auto') {
            this.resetTimer();
            this.resetMoveCount();
            
            this.startAutoSolve();
            
            console.log("Автосборка запущена");
        }
    }
    
    // КНОПКИ УПРАВЛЕНИЯ 
    setupControlButtons() {
        // Кнопка перемешивания
        document.getElementById('shuffleBtn')?.addEventListener('click', () => {
            this.shuffleCube();
        });
        
        // Кнопка отмены
        document.getElementById('undoBtn')?.addEventListener('click', () => {
            this.undoMove();
        });
        
        // Кнопка подсказки
        document.getElementById('hintBtn')?.addEventListener('click', () => {
            this.showHint();
        });
    }
    
    // МЕНЮ 
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
        document.getElementById('menuSaveBtn')?.addEventListener('click', () => {
            this.saveCurrentState();
            this.closeMenu();
        });
        
        document.getElementById('menuLoadBtn')?.addEventListener('click', () => {
            this.loadSavedState();
            this.closeMenu();
        });

        document.getElementById('statsBtn')?.addEventListener('click', () => {
            this.showStatsWindow();
            this.closeMenu();
        });
        
        document.getElementById('helpBtn')?.addEventListener('click', () => {
            this.showHelpWindow();
            this.closeMenu();
        });
    }
    
    toggleMenu() {
        const sideMenu = document.getElementById('sideMenu');
        const menuOverlay = document.getElementById('menuOverlay');
        
        this.menuOpen = !this.menuOpen;
        
        if (this.menuOpen) {
            sideMenu.classList.add('open');
            menuOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            this.closeMenu();
        }
    }
    
    closeMenu() {
        const sideMenu = document.getElementById('sideMenu');
        const menuOverlay = document.getElementById('menuOverlay');
        
        this.menuOpen = false;
        sideMenu.classList.remove('open');
        menuOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    
    // НАСТРОЙКИ 
    setColorScheme(scheme) {
        this.currentColorScheme = scheme;
        
        // Обновляем UI
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`.color-option[data-scheme="${scheme}"]`)?.classList.add('active');
        
        // Отправляем выбранную схему в Unity
        if (this.isReady) {
            if (scheme === 'custom') {
                // Отправляем пользовательские цвета
                this.sendToUnity('ApplyCustomColors', JSON.stringify(this.customColors));
            } else {
                // Отправляем стандартную схему
                this.sendToUnity('ApplyColorPreset', scheme);
            }
        }
        
        this.saveSettings();
        
        console.log(`Установлена цветовая схема: ${scheme}`);
    }
    
    setAlgorithm(algorithm) {
        this.currentAlgorithm = algorithm;
        
        document.querySelectorAll('.algorithm-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`.algorithm-option[data-algorithm="${algorithm}"]`)?.classList.add('active');
        
        // Если в авторежиме и идет сборка - перезапускаем с новым алгоритмом
        if (this.getCurrentMode() === 'auto' && this.isAutoSolving) {
            this.stopAutoSolve();
            setTimeout(() => this.startAutoSolve(), 500);
        }
        
        this.saveSettings();
        
        console.log(`Установлен алгоритм: ${algorithm === 0 ? 'Быстрый' : 'Простой'}`);
    }
    
    setSpeed(speed) {
        if (this.speedSlider) {
            this.speedSlider.setSpeed(speed);
        }
    }
    
    // АВТОСБОРКА 
    startAutoSolve() {
        if (!this.isReady) {
            console.warn("Система не готова");
            return;
        }
        
        console.log(`Запуск автосборки алгоритмом: ${this.currentAlgorithm === 0 ? 'Быстрый' : 'Простой'}`);
        this.sendToUnity('StartAutoSolve', this.currentAlgorithm);
        this.isAutoSolving = true;
    }
    
    stopAutoSolve() {
        if (!this.isReady || !this.isAutoSolving) {
            return;
        }
        
        console.log("Остановка автосборки");
        this.sendToUnity('StopAutoSolve');
        this.isAutoSolving = false;
    }
    
    // ОСНОВНЫЕ МЕТОДЫ 
shuffleCube() {
    if (!this.isReady) {
        console.warn("Система ещё не готова");
        return;
    }
    
    if (confirm('Перемешать кубик? Текущий прогресс будет сброшен.')) {
        console.log("Начинаем перемешивание...");
        
        // ОСТАНАВЛИВАЕМ таймер перед перемешиванием
        if (this.timer.isRunning) {
            this.stopTimer();
        }
        
        this.resetTimer();
        this.resetMoveCount();
        this.isCubeSolved = false;
        
        this.isShuffling = true;
        
        this.sendToUnity('ShuffleCube');
        this.userInteracted = false;
        
        console.log("Начато перемешивание, таймер остановлен");
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
    
    // СТАТИСТИКА 
    updateStatsDisplay() {
        // Проверяем существование элементов
        const totalSolvesElement = document.getElementById('totalSolves');
        const bestTimeElement = document.getElementById('bestTime');
        const totalPlayTimeElement = document.getElementById('totalPlayTime');
        
        if (totalSolvesElement) {
            totalSolvesElement.textContent = this.gameStats.totalSolves;
        }
        
        if (bestTimeElement) {
            bestTimeElement.textContent = this.formatTime(this.gameStats.bestTime);
        }
        
        if (totalPlayTimeElement) {
            totalPlayTimeElement.textContent = this.formatTime(this.gameStats.totalPlayTime || 0);
        }
    }

    formatTime(seconds) {
        if (seconds === 0 || !seconds) return "00:00:00";
        
        // seconds - это целое число секунд (например 145)
        const totalSeconds = Math.floor(seconds);
        const minutes = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:00`;
    }

    clearStats() {
        if (confirm("Очистить всю статистику и рекорды?")) {
            this.gameStats = {
                totalSolves: 0,
                bestTime: 0,
                totalPlayTime: 0,
                bestRecords: [] 
            };
            this.updateStatsDisplay();
            this.updateStatsWindow();
            this.saveStats();
            console.log("Статистика и рекорды очищены");
        }
    }

    
    showHelp() {
        this.showHelpWindow();
        this.closeMenu(); 
    }
    
    //  СОХРАНЕНИЕ/ЗАГРУЗКА ДАННЫХ 
    saveSettings() {
        const settings = {
            algorithm: this.currentAlgorithm,
            speed: this.currentSpeed,
            colorScheme: this.currentColorScheme,
            customColors: this.customColors 
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
                this.customColors = parsed.customColors || this.customColors; // Загружаем пользовательские цвета
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
                const loadedStats = JSON.parse(stats);
                this.gameStats = {
                    totalSolves: loadedStats.totalSolves || this.gameStats.totalSolves,
                    bestTime: loadedStats.bestTime || this.gameStats.bestTime,
                    totalPlayTime: loadedStats.totalPlayTime || this.gameStats.totalPlayTime,
                    bestRecords: loadedStats.bestRecords || this.gameStats.bestRecords
                };
                console.log("Статистика загружена:", this.gameStats);
            }
        } catch (e) {
            console.error("Ошибка загрузки статистики:", e);
        }
    }
    
    applySavedSettings() {
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`.color-option[data-scheme="${this.currentColorScheme}"]`)?.classList.add('active');
        
        document.querySelectorAll('.algorithm-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`.algorithm-option[data-algorithm="${this.currentAlgorithm}"]`)?.classList.add('active');
        
        if (this.speedSlider) {
            this.speedSlider.setSpeed(this.currentSpeed);
        }
        
        // Обновляем развертку пользовательскими цветами
        Object.entries(this.customColors).forEach(([face, color]) => {
            const cell = document.querySelector(`.net-cell[data-face="${face}"]`);
            if (cell) {
                cell.style.background = color;
            }
        });
        
        setTimeout(() => {
            if (this.isReady) {
                if (this.currentColorScheme === 'custom') {
                    this.sendToUnity('ApplyCustomColors', JSON.stringify(this.customColors));
                } else {
                    this.sendToUnity('ApplyColorPreset', this.currentColorScheme);
                }
            }
        }, 500);
    }
    
    // КОММУНИКАЦИЯ С UNITY 
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
        

        document.getElementById('clearAllStatsBtn')?.addEventListener('click', () => {
            this.clearStats();
        });
        
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
        
        const totalPlayTime = this.gameStats.totalPlayTime || 0;
        document.getElementById('statsTotalPlayTime').textContent = this.formatTime(totalPlayTime);
        
        this.fillRecordsTable();
    }
        
    calculateAverageTime() {
        if (this.gameStats.totalSolves === 0 || this.gameStats.bestRecords.length === 0) {
            return "00:00:00";
        }
        
        let totalTime = 0;
        let count = 0;
        this.gameStats.bestRecords.forEach(record => {
            totalTime += record.time;
            count++;
        });
        
        const avgTime = totalTime / Math.min(count, this.gameStats.bestRecords.length);
        return this.formatTime(avgTime);
    }

    fillRecordsTable() {
        const tableBody = document.getElementById('recordsTableBody');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        // Используем тестовые данные из конструктора
        const records = this.gameStats.bestRecords || [];
        
        if (records.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #4cc9f0;">Нет рекордов</td></tr>';
            return;
        }
        
        records.forEach((record, index) => {
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
    
    setSpeed(speed) {
        if (!this.speedOptions.includes(speed)) {
            console.error(`Недопустимая скорость: ${speed}`);
            return;
        }
        
        this.currentSpeed = speed;
        
        document.querySelectorAll('.speed-dot').forEach(dot => {
            dot.classList.remove('active');
        });
        document.querySelector(`.speed-dot[data-speed="${speed}"]`)?.classList.add('active');
        
        if (this.isReady) {
            this.sendToUnity('SetCubeSpeed', speed);
        }
        
        this.saveSettings();
        
        console.log(`Установлена скорость: x${speed}`);
    }

    setupCustomColors() {
    // Кнопка открытия окна
        document.getElementById('customizeColorsBtn')?.addEventListener('click', () => {
            this.showColorsWindow();
            this.closeMenu();
        });
        
        document.getElementById('closeColorsBtn')?.addEventListener('click', () => {
            this.hideColorsWindow();
        });
        
        document.getElementById('colorsOverlay')?.addEventListener('click', () => {
            this.hideColorsWindow();
        });

        document.getElementById('saveCustomSchemeBtn')?.addEventListener('click', () => {
            this.saveCustomScheme();
        });
        
        // Выбор грани в развертке
        document.querySelectorAll('.net-cell').forEach(cell => {
            cell.addEventListener('click', (e) => {
                const face = e.currentTarget.dataset.face;
                this.selectFace(face);
            });
        });
    
        // RGB слайдеры
        const sliders = ['redSlider', 'greenSlider', 'blueSlider'];
        sliders.forEach(sliderId => {
            document.getElementById(sliderId)?.addEventListener('input', (e) => {
                this.updateColorFromSliders();
            });
    });
    
        document.querySelectorAll('.quick-color').forEach(colorBtn => {
            colorBtn.addEventListener('click', (e) => {
                const color = e.currentTarget.dataset.color;
                this.setColorFromQuickPick(color);
            });
        });
        
        document.getElementById('applyColorBtn')?.addEventListener('click', () => {
            this.applyColorToFace();
        });
        
        document.getElementById('resetColorsBtn')?.addEventListener('click', () => {
            this.resetCustomColors();
        });
    }

    saveCustomScheme() {
        this.setColorScheme('custom');
        
        this.hideColorsWindow();
        
        alert('Своя цветовая схема сохранена!');
        console.log('Своя цветовая схема сохранена:', this.customColors);
    }

    selectFace(face) {
        this.selectedFace = face;
        
        document.querySelectorAll('.net-cell').forEach(cell => {
            cell.classList.remove('selected');
        });
        
        const selectedCell = document.querySelector(`.net-cell[data-face="${face}"]`);
        if (selectedCell) {
            selectedCell.classList.add('selected');
            
            const color = this.customColors[face] || '#FFFFFF';
            this.setColorToSliders(color);
        }
    }

    setColorToSliders(colorHex) {
        const r = parseInt(colorHex.slice(1, 3), 16);
        const g = parseInt(colorHex.slice(3, 5), 16);
        const b = parseInt(colorHex.slice(5, 7), 16);
        
        document.getElementById('redSlider').value = r;
        document.getElementById('greenSlider').value = g;
        document.getElementById('blueSlider').value = b;
        
        document.getElementById('redValue').textContent = r;
        document.getElementById('greenValue').textContent = g;
        document.getElementById('blueValue').textContent = b;
        
        this.updateColorPreview(r, g, b);
    }

    updateColorFromSliders() {
        const r = parseInt(document.getElementById('redSlider').value);
        const g = parseInt(document.getElementById('greenSlider').value);
        const b = parseInt(document.getElementById('blueSlider').value);
        
        document.getElementById('redValue').textContent = r;
        document.getElementById('greenValue').textContent = g;
        document.getElementById('blueValue').textContent = b;
        
        this.updateColorPreview(r, g, b);
    }

    updateColorPreview(r, g, b) {
        const hex = this.rgbToHex(r, g, b);
        const rgbText = `rgb(${r}, ${g}, ${b})`;
        
        document.getElementById('colorPreviewBox').style.background = hex;
        document.getElementById('colorHex').textContent = hex;
        document.getElementById('colorRgb').textContent = rgbText;
        
        this.checkColorSimilarity(hex);
    }

    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    setColorFromQuickPick(colorHex) {
        this.setColorToSliders(colorHex);
    }

    applyColorToFace() {
        if (!this.selectedFace) return;
        
        const hexColor = document.getElementById('colorHex').textContent;
        
        if (!this.isColorValid(hexColor)) {
            alert('Цвет слишком похож на уже существующий! Выберите другой оттенок.');
            return;
        }
        
        this.customColors[this.selectedFace] = hexColor;
        
        this.saveCustomColors();
        
        const selectedCell = document.querySelector(`.net-cell[data-face="${this.selectedFace}"]`);
        if (selectedCell) {
            selectedCell.style.background = hexColor;
        }
        
        if (this.currentColorScheme === 'custom' && this.isReady) {
            this.sendToUnity('ApplyCustomColors', JSON.stringify(this.customColors));
        }
        
        const faceNames = {
            up: 'Верхняя',
            left: 'Левая', 
            front: 'Передняя',
            right: 'Правая',
            back: 'Задняя',
            down: 'Нижняя'
        };
        console.log(`Цвет грани "${faceNames[this.selectedFace]}" изменен на: ${hexColor}`);
    }

    checkColorSimilarity(colorHex) {
        const rgb1 = this.hexToRgb(colorHex);
        const warningElement = document.getElementById('colorWarning');
        
        let minDiff = 100;
        
        for (const [face, savedColor] of Object.entries(this.customColors)) {
            if (face === this.selectedFace) continue;
            
            const rgb2 = this.hexToRgb(savedColor);
            const diff = this.calculateColorDifference(rgb1, rgb2);
            
            if (diff < minDiff) {
                minDiff = diff;
            }
        }
        
        if (minDiff < 20) {
            warningElement.style.display = 'flex';
            document.getElementById('minDiff').textContent = minDiff.toFixed(1);
        } else {
            warningElement.style.display = 'none';
        }
    }

    isColorValid(colorHex) {
        const rgb1 = this.hexToRgb(colorHex);
        
        for (const [face, savedColor] of Object.entries(this.customColors)) {
            if (face === this.selectedFace) continue;
            
            const rgb2 = this.hexToRgb(savedColor);
            const diff = this.calculateColorDifference(rgb1, rgb2);
            
            if (diff < 15) {
                return false;
            }
        }
        
        return true;
    }

    hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
    }

    calculateColorDifference(rgb1, rgb2) {
        const rDiff = Math.abs(rgb1.r - rgb2.r);
        const gDiff = Math.abs(rgb1.g - rgb2.g);
        const bDiff = Math.abs(rgb1.b - rgb2.b);
        
        const maxDiff = Math.sqrt(255*255 + 255*255 + 255*255);
        
        const currentDiff = Math.sqrt(rDiff*rDiff + gDiff*gDiff + bDiff*bDiff);
        
        return (currentDiff / maxDiff) * 100;
    }

    resetCustomColors() {
        // Сбрасываем к классическим
        this.customColors = {
            up: '#FFFFFF',
            left: '#FFD500',
            front: '#009B48',
            right: '#0046AD',
            back: '#B71234',
            down: '#FF5800'
        };
        
        this.saveCustomColors();
        
        Object.entries(this.customColors).forEach(([face, color]) => {
            const cell = document.querySelector(`.net-cell[data-face="${face}"]`);
            if (cell) {
                cell.style.background = color;
            }
        });
        
        if (this.selectedFace) {
            this.setColorToSliders(this.customColors[this.selectedFace]);
        }
        
        if (this.currentColorScheme === 'custom' && this.isReady) {
            this.applyCustomColorsToUnity();
        }
    }

    showColorsWindow() {
        document.getElementById('colorsWindow').classList.add('active');
        document.getElementById('colorsOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
        
        this.selectFace('up');
    }

    hideColorsWindow() {
        document.getElementById('colorsWindow').classList.remove('active');
        document.getElementById('colorsOverlay').classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    switchToManualMode() {
        if (this.getCurrentMode() === 'auto' && !this.userInteracted) {
            this.userInteracted = true;
            
            const manualBtn = document.querySelector('.mode-btn[data-mode="manual"]');
            if (manualBtn) {
                manualBtn.click();
                console.log("Автоматически переключено в ручной режим");
            }
        }
        this.startTimer()
    }
    saveCustomColors() {
        try {
            localStorage.setItem('rubiks_cube_custom_colors', JSON.stringify(this.customColors));
            console.log("Пользовательские цвета сохранены");
        } catch (e) {
            console.error("Ошибка сохранения пользовательских цветов:", e);
        }
    }

    applyCustomColorsToUnity() {
        if (!this.isReady) {
            console.warn("Unity не готов к приему данных");
            return;
        }
        
        this.sendToUnity('ApplyCustomColors', JSON.stringify(this.customColors));
        console.log("Пользовательские цвета отправлены в Unity:", this.customColors);
    }

    onCubeMove(moveData) {
        console.log("Ход выполнен, данные:", moveData);
        
        if (this.isShuffling) {
            console.log("Ход во время перемешивания - игнорируем для таймера");
            return;
        }
        
        this.incrementMoveCount();
        this.saveTimerState(); 
        
        // Автоматически запускаем таймер при первом ходе в ручном режиме
        if (this.getCurrentMode() === 'manual' && !this.timer.isRunning && !this.isCubeSolved) {
            console.log("Автозапуск таймера при первом ходе в ручном режиме");
            this.startTimer();
        }
        
        // Если таймер на паузе - возобновляем
        if (this.timer.isPaused && this.getCurrentMode() === 'manual') {
            this.timer.isPaused = false;
            if (this.timerPauseBtn) {
                this.timerPauseBtn.querySelector('i').className = 'fas fa-pause';
                this.timerPauseBtn.title = 'Пауза';
            }
            console.log("Таймер возобновлен при ходе");
        }
        
        this.saveTimerState();
    }
    saveTimerState() {
        const timerState = {
            startTime: this.timer.startTime,
            elapsedTime: this.timer.elapsedTime,
            isRunning: this.timer.isRunning,
            isPaused: this.timer.isPaused,
            moveCount: this.moveCount
        };
        
        try {
            localStorage.setItem('rubiks_cube_timer_state', JSON.stringify(timerState));
        } catch (e) {
            console.error("Ошибка сохранения таймера:", e);
        }
    }

    loadTimerState() {
        try {
            const saved = localStorage.getItem('rubiks_cube_timer_state');
            if (saved) {
                const state = JSON.parse(saved);
                this.timer = {
                    startTime: state.startTime || 0,
                    elapsedTime: state.elapsedTime || 0,
                    isRunning: false,
                    isPaused: false
                };
                this.moveCount = state.moveCount || 0;
                
                if (this.timerDisplay) {
                    this.updateTimerDisplay();
                }
                
                if (this.movesCountElement) {
                    this.movesCountElement.textContent = this.moveCount;
                }
            }
        } catch (e) {
            console.error("Ошибка загрузки таймера:", e);
        }
    }

    onShuffleComplete() {
        console.log("Перемешивание завершено");
        this.isShuffling = false;
        
        // Если в ручном режиме - не запускаем таймер автоматически
        // Пользователь сам должен начать сборку
        
        // Обнуляем счётчик ходов, который накопился при перемешивании
        this.resetMoveCount();
        console.log("Счётчик ходов сброшен после перемешивания");
    }
}

class SpeedSlider {
    constructor(sliderId, thumbId, valueId) {
        this.slider = document.getElementById(sliderId);
        this.thumb = document.getElementById(thumbId);
        this.valueElement = document.getElementById(valueId);
        this.markers = this.slider.querySelectorAll('.speed-marker');
        this.speeds = [1, 4, 8, 12];
        this.currentSpeed = 1;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateSliderPosition(this.currentSpeed);
        this.updateValueDisplay();
    }
    
    setupEventListeners() {
        this.thumb.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const onMouseMove = (moveEvent) => {
                this.setSpeedFromPosition(moveEvent.clientX);
            };
            
            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
        
        this.slider.addEventListener('click', (e) => {
            this.setSpeedFromPosition(e.clientX);
        });
        
        this.markers.forEach((marker, index) => {
            marker.addEventListener('click', (e) => {
                e.stopPropagation();
                const speed = this.speeds[index];
                this.setSpeed(speed);
            });
        });
    }
    
    setSpeedFromPosition(clientX) {
        const rect = this.slider.getBoundingClientRect();
        let position = (clientX - rect.left) / rect.width;
        position = Math.max(0, Math.min(1, position));
        
        const zoneSize = 0.15;
        
        for (let i = 0; i < this.speeds.length; i++) {
            const markerPos = i / (this.speeds.length - 1);
            const distance = Math.abs(position - markerPos);
            
            if (distance <= zoneSize) {
                this.setSpeed(this.speeds[i]);
                return;
            }
        }
        
        // Если клик не попал в зону ни одной точки, устанавливаем ближайшую
        let nearestIndex = 0;
        let minDistance = 1;
        
        this.markers.forEach((marker, index) => {
            const markerPos = index / (this.markers.length - 1); 
            const distance = Math.abs(position - markerPos);
            if (distance < minDistance) {
                minDistance = distance;
                nearestIndex = index;
            }
        });
        
        this.setSpeed(this.speeds[nearestIndex]);
    }
    
    setSpeed(speed) {
        this.currentSpeed = speed;
        this.updateSliderPosition(speed);
        this.updateValueDisplay();
        
        if (this.onSpeedChange) {
            this.onSpeedChange(speed);
        }
    }
    
    updateSliderPosition(speed) {
        const index = this.speeds.indexOf(speed);
        const positions = ['0%', '33.33%', '66.66%', '100%'];
        
        if (index !== -1) {
            this.thumb.style.left = positions[index];
            
            this.markers.forEach((marker, i) => {
                marker.style.background = i === index ? '#4cc9f0' : 'rgba(255, 255, 255, 0.4)';
            });
        }
    }
    
    updateValueDisplay() {
        this.valueElement.textContent = `x${this.currentSpeed}`;
    }
    
    onSpeedChange(speed) {
    }
}

//  ГЛОБАЛЬНЫЕ ФУНКЦИИ

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

window.onUserInteraction = function() {
    if (window.customUI) {
        window.customUI.switchToManualMode();
    }
}

window.onCubeSolved = function() {
    if (window.customUI) {
        window.customUI.isCubeSolved = true;
        window.customUI.stopTimer();
        console.log("Кубик собран!");
        alert("🎉 Поздравляем! Кубик собран!");
    }
};

// Для отслеживания ходов
window.onCubeMove = function(moveData) {
    console.log("Получен ход из Unity:", moveData);
    if (window.customUI) {
        window.customUI.onCubeMove(moveData);
    }
};

window.testMove = function() {
    if (window.customUI) {
        window.customUI.onCubeMove("test_move");
        console.log("Тестовый ход выполнен. Счетчик:", window.customUI.moveCount);
    }
}

window.startTimerNow = function() {
    if (window.customUI) {
        window.customUI.startTimer();
        console.log("Таймер принудительно запущен");
    }
}
window.onShuffleComplete = function() {
    console.log("Получено уведомление о завершении перемешивания");
    if (window.customUI) {
        window.customUI.onShuffleComplete();
    }
};

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM загружен");
    window.customUI = new CustomUI();
});