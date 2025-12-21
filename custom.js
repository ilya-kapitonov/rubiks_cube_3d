class CustomUI {
    constructor() {
        this.unityInstance = null;
        this.isReady = false;
        
        console.log("CustomUI создан");
        
        // Настройки по умолчанию
        this.currentAlgorithm = 0; // 0 = Быстрый, 1 = Простой
        this.currentSpeed = 1; // x1 по умолчанию
        this.currentColorScheme = 'classic';
        this.isAutoSolving = false;
        this.menuOpen = false;
        
        // Статистика
        this.gameStats = {
            totalSolves: 12,
            bestTime: 145, // 2:25 в секундах
            totalMoves: 583,
            bestRecords: [
                { time: 145, moves: 42, date: '2024-01-15' },
                { time: 162, moves: 45, date: '2024-01-14' },
                { time: 178, moves: 48, date: '2024-01-13' },
                { time: 195, moves: 52, date: '2024-01-12' },
                { time: 210, moves: 55, date: '2024-01-11' }
            ]
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
        this.setupSpeedSlider();
        this.setupCustomColors();
        this.setupWindows();
        this.updateStatsDisplay();
        
        console.log("UI инициализирован");
    }
    
     // ===== ПОЛЗУНОК СКОРОСТИ =====
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

    // ===== РЕЖИМЫ (A/P) =====
    setupModeSelector() {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const oldMode = this.getCurrentMode();
                const newMode = e.currentTarget.dataset.mode;
                
                // Снимаем активный класс со всех
                document.querySelectorAll('.mode-btn').forEach(b => {
                    b.classList.remove('active');
                });
                // Добавляем активный класс выбранному
                e.currentTarget.classList.add('active');
                
                console.log(`Режим изменен: ${oldMode} → ${newMode}`);
                
                // Обработка смены режима
                this.handleModeChange(oldMode, newMode);
            });
        });
    }
    
    getCurrentMode() {
        const activeBtn = document.querySelector('.mode-btn.active');
        return activeBtn ? activeBtn.dataset.mode : 'manual';
    }
    
    handleModeChange(oldMode, newMode) {
        // Если переключаемся из авторежима в ручной - останавливаем автосборку
        if (oldMode === 'auto' && newMode === 'manual') {
            this.stopAutoSolve();
        }
        // Если переключаемся из ручного в авторежим - запускаем автосборку
        else if (oldMode === 'manual' && newMode === 'auto') {
            this.startAutoSolve();
        }
    }
    
    // ===== КНОПКИ УПРАВЛЕНИЯ =====
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
    
    // ===== МЕНЮ =====
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
    
    // ===== НАСТРОЙКИ =====
    setColorScheme(scheme) {
        this.currentColorScheme = scheme;
        
        // Обновляем UI
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`.color-option[data-scheme="${scheme}"]`)?.classList.add('active');
        
        // Отправляем в Unity
        if (this.isReady) {
            this.sendToUnity('ApplyColorPreset', scheme);
        }
        
        // Сохраняем настройки
        this.saveSettings();
        
        console.log(`Установлена цветовая схема: ${scheme}`);
    }
    
    setAlgorithm(algorithm) {
        this.currentAlgorithm = algorithm;
        
        // Обновляем UI
        document.querySelectorAll('.algorithm-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`.algorithm-option[data-algorithm="${algorithm}"]`)?.classList.add('active');
        
        // Если в авторежиме и идет сборка - перезапускаем с новым алгоритмом
        if (this.getCurrentMode() === 'auto' && this.isAutoSolving) {
            this.stopAutoSolve();
            setTimeout(() => this.startAutoSolve(), 500);
        }
        
        // Сохраняем настройки
        this.saveSettings();
        
        console.log(`Установлен алгоритм: ${algorithm === 0 ? 'Быстрый' : 'Простой'}`);
    }
    
    setSpeed(speed) {
        if (this.speedSlider) {
            this.speedSlider.setSpeed(speed);
        }
    }
    
    // ===== АВТОСБОРКА =====
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
    
    // ===== ОСНОВНЫЕ МЕТОДЫ =====
    shuffleCube() {
        if (!this.isReady) {
            console.warn("Система ещё не готова");
            return;
        }
        
        if (confirm('Перемешать кубик? Текущий прогресс будет сброшен.')) {
            console.log("Начинаем перемешивание...");
            this.sendToUnity('ShuffleCube');
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
        
        // Обновляем ползунок скорости (если он инициализирован)
        if (this.speedSlider) {
            this.speedSlider.setSpeed(this.currentSpeed);
        }
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
        
        // Обновляем UI точек
        document.querySelectorAll('.speed-dot').forEach(dot => {
            dot.classList.remove('active');
        });
        document.querySelector(`.speed-dot[data-speed="${speed}"]`)?.classList.add('active');
        
        // Отправляем в Unity
        if (this.isReady) {
            this.sendToUnity('SetCubeSpeed', speed);
        }
        
        // Сохраняем настройки
        this.saveSettings();
        
        console.log(`Установлена скорость: x${speed}`);
    }

    setupCustomColors() {
    // Кнопка открытия окна
    document.getElementById('customizeColorsBtn')?.addEventListener('click', () => {
        this.showColorsWindow();
        this.closeMenu();
    });
    
    // Закрытие окна
    document.getElementById('closeColorsBtn')?.addEventListener('click', () => {
        this.hideColorsWindow();
    });
    
    document.getElementById('colorsOverlay')?.addEventListener('click', () => {
        this.hideColorsWindow();
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
    
    // Быстрые цвета
    document.querySelectorAll('.quick-color').forEach(colorBtn => {
        colorBtn.addEventListener('click', (e) => {
            const color = e.currentTarget.dataset.color;
            this.setColorFromQuickPick(color);
        });
    });
    
    // Кнопки
    document.getElementById('applyColorBtn')?.addEventListener('click', () => {
        this.applyColorToFace();
    });
    
    document.getElementById('resetColorsBtn')?.addEventListener('click', () => {
        this.resetCustomColors();
    });
    
    // Загружаем сохраненные цвета
    this.loadCustomColors();
}

    selectFace(face) {
        this.selectedFace = face;
        
        // Убираем выделение со всех
        document.querySelectorAll('.net-cell').forEach(cell => {
            cell.classList.remove('selected');
        });
        
        // Выделяем выбранную
        const selectedCell = document.querySelector(`.net-cell[data-face="${face}"]`);
        if (selectedCell) {
            selectedCell.classList.add('selected');
            
            // Устанавливаем текущий цвет грани в RGB слайдеры
            const color = this.customColors[face] || '#FFFFFF';
            this.setColorToSliders(color);
        }
    }

    setColorToSliders(colorHex) {
        // Конвертируем HEX в RGB
        const r = parseInt(colorHex.slice(1, 3), 16);
        const g = parseInt(colorHex.slice(3, 5), 16);
        const b = parseInt(colorHex.slice(5, 7), 16);
        
        // Устанавливаем слайдеры
        document.getElementById('redSlider').value = r;
        document.getElementById('greenSlider').value = g;
        document.getElementById('blueSlider').value = b;
        
        // Обновляем значения
        document.getElementById('redValue').textContent = r;
        document.getElementById('greenValue').textContent = g;
        document.getElementById('blueValue').textContent = b;
        
        // Обновляем предпросмотр
        this.updateColorPreview(r, g, b);
    }

    updateColorFromSliders() {
        const r = parseInt(document.getElementById('redSlider').value);
        const g = parseInt(document.getElementById('greenSlider').value);
        const b = parseInt(document.getElementById('blueSlider').value);
        
        // Обновляем значения
        document.getElementById('redValue').textContent = r;
        document.getElementById('greenValue').textContent = g;
        document.getElementById('blueValue').textContent = b;
        
        // Обновляем предпросмотр
        this.updateColorPreview(r, g, b);
    }

    updateColorPreview(r, g, b) {
        const hex = this.rgbToHex(r, g, b);
        const rgbText = `rgb(${r}, ${g}, ${b})`;
        
        document.getElementById('colorPreviewBox').style.background = hex;
        document.getElementById('colorHex').textContent = hex;
        document.getElementById('colorRgb').textContent = rgbText;
        
        // Проверяем схожесть с другими цветами
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
        
        // Получаем цвет из предпросмотра
        const hexColor = document.getElementById('colorHex').textContent;
        
        // Проверяем, не слишком ли похож цвет на другие
        if (!this.isColorValid(hexColor)) {
            alert('Цвет слишком похож на уже существующий! Выберите другой оттенок.');
            return;
        }
        
        // Сохраняем цвет
        this.customColors[this.selectedFace] = hexColor;
        
        // Обновляем отображение
        const selectedCell = document.querySelector(`.net-cell[data-face="${this.selectedFace}"]`);
        if (selectedCell) {
            selectedCell.style.background = hexColor;
        }
        
        // Сохраняем в localStorage
        this.saveCustomColors();
        
        // Показываем подтверждение
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

    // Проверка схожести цветов
    checkColorSimilarity(colorHex) {
        const rgb1 = this.hexToRgb(colorHex);
        const warningElement = document.getElementById('colorWarning');
        
        let minDiff = 100; // Максимальная разница в процентах
        
        // Сравниваем со всеми остальными цветами
        for (const [face, savedColor] of Object.entries(this.customColors)) {
            if (face === this.selectedFace) continue;
            
            const rgb2 = this.hexToRgb(savedColor);
            const diff = this.calculateColorDifference(rgb1, rgb2);
            
            if (diff < minDiff) {
                minDiff = diff;
            }
        }
        
        // Показываем/скрываем предупреждение
        if (minDiff < 20) { // Порог 20%
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
            
            if (diff < 15) { // Порог 15% для применения
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

    // Формула для расчета разницы цветов (упрощенная версия)
    calculateColorDifference(rgb1, rgb2) {
        // Используем формулу расстояния в RGB пространстве
        const rDiff = Math.abs(rgb1.r - rgb2.r);
        const gDiff = Math.abs(rgb1.g - rgb2.g);
        const bDiff = Math.abs(rgb1.b - rgb2.b);
        
        // Максимальное расстояние по каждому каналу - 255
        const maxDiff = Math.sqrt(255*255 + 255*255 + 255*255); // ~441
        
        // Текущее расстояние
        const currentDiff = Math.sqrt(rDiff*rDiff + gDiff*gDiff + bDiff*bDiff);
        
        // Процент различия
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
        
        // Обновляем отображение
        Object.entries(this.customColors).forEach(([face, color]) => {
            const cell = document.querySelector(`.net-cell[data-face="${face}"]`);
            if (cell) {
                cell.style.background = color;
            }
        });
        
        // Обновляем текущий выбор
        if (this.selectedFace) {
            this.setColorToSliders(this.customColors[this.selectedFace]);
        }
        
        // Сохраняем
        this.saveCustomColors();
    }

    saveCustomColors() {
        try {
            localStorage.setItem('rubiks_cube_custom_colors', JSON.stringify(this.customColors));
            console.log("Пользовательские цвета сохранены");
        } catch (e) {
            console.error("Ошибка сохранения цветов:", e);
        }
    }

    loadCustomColors() {
        try {
            const saved = localStorage.getItem('rubiks_cube_custom_colors');
            if (saved) {
                this.customColors = JSON.parse(saved);
                
                // Обновляем отображение
                Object.entries(this.customColors).forEach(([face, color]) => {
                    const cell = document.querySelector(`.net-cell[data-face="${face}"]`);
                    if (cell) {
                        cell.style.background = color;
                    }
                });
                
                console.log("Пользовательские цвета загружены");
            }
        } catch (e) {
            console.error("Ошибка загрузки цветов:", e);
        }
    }

    showColorsWindow() {
        document.getElementById('colorsWindow').classList.add('active');
        document.getElementById('colorsOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Выбираем первую грань по умолчанию
        this.selectFace('up');
    }

    hideColorsWindow() {
        document.getElementById('colorsWindow').classList.remove('active');
        document.getElementById('colorsOverlay').classList.remove('active');
        document.body.style.overflow = 'auto';
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
        // Перетаскивание ползунка
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
        
        // Клик по треку
        this.slider.addEventListener('click', (e) => {
            this.setSpeedFromPosition(e.clientX);
        });
        
        // Клик по маркерам
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
        
        // Увеличиваем зону захвата для каждой точки (вместо 25%)
        const zoneSize = 0.15; // 15% от длины трека в каждую сторону от точки
        
        // Проверяем, попадает ли клик в зону какой-либо точки
        for (let i = 0; i < this.speeds.length; i++) {
            const markerPos = i / (this.speeds.length - 1); // 0, 0.33, 0.66, 1
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
            const markerPos = index / (this.markers.length - 1); // 0, 0.33, 0.66, 1
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
        
        // Вызываем callback, если он установлен
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
        // Будет переопределен в CustomUI
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