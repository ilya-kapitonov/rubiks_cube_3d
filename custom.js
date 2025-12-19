class CustomUI {
    constructor() {
        this.unityInstance = null;
        this.currentSpeed = 1.0;

        // Unity сама вызовет это, когда загрузится
        window.onUnityReady = (instance) => {
            console.log('Unity готов');
            this.unityInstance = instance;

            const saved = localStorage.getItem('pendingSpeed');
            if (saved) {
                this.sendSpeedToUnity(parseFloat(saved));
                localStorage.removeItem('pendingSpeed');
            }
        };

        this.setupControls();
    }

    setSpeed(speed) {
        this.currentSpeed = speed;
        console.log('Установлена скорость:', speed);

        if (this.unityInstance) {
            this.sendSpeedToUnity(speed);
        } else {
            localStorage.setItem('pendingSpeed', speed);
        }
    }

    sendSpeedToUnity(speed) {
        try {
            this.unityInstance.SendMessage(
                'WebCommunicator',
                'SetCubeSpeed',
                speed
            );
            console.log('SendMessage OK');
        } catch (e) {
            console.error('SendMessage error', e);
        }
    }

    setupControls() {
        document.querySelectorAll('.speed-btn, .speed-btn-menu')
            .forEach(btn => {
                btn.addEventListener('click', e => {
                    const speed = parseFloat(e.target.dataset.speed);
                    this.setSpeed(speed);
                });
            });
    }
}

window.addEventListener('load', () => {
    window.customUI = new CustomUI();
});
