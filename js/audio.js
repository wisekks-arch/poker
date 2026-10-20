// js/audio.js - Web Audio API 기반 고품질 카지노 사운드 신디사이저 (외부 파일 없이 동작)
class SoundManager {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.initOnInteraction();
    }

    initOnInteraction() {
        const unlock = () => {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                    this.ctx = new AudioCtx();
                }
            } else if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        };
        ['click', 'touchstart', 'keydown'].forEach(evt => {
            document.addEventListener(evt, unlock, { once: true, passive: true });
        });
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    // 카드 슉 지나가는 소리
    playCardSlide() {
        if (this.isMuted || !this.ctx) return;
        try {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(450, t);
            osc.frequency.exponentialRampToValueAtTime(120, t + 0.08);

            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(800, t);
            filter.Q.setValueAtTime(3, t);

            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.09);
        } catch (e) { }
    }

    // 카드 뒤집기 찰칵 소리
    playCardFlip() {
        if (this.isMuted || !this.ctx) return;
        try {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(320, t);
            osc.frequency.exponentialRampToValueAtTime(80, t + 0.06);

            gain.gain.setValueAtTime(0.25, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.07);
        } catch (e) { }
    }

    // 칩 딸깍 배팅 소리
    playChip() {
        if (this.isMuted || !this.ctx) return;
        try {
            const t = this.ctx.currentTime;
            // 2개의 미세 주파수로 세라믹 칩 충돌음 모사
            [1800, 2400].forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq + (idx * 150), t);
                osc.frequency.exponentialRampToValueAtTime(300, t + 0.05);

                gain.gain.setValueAtTime(0.2, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(t + idx * 0.015);
                osc.stop(t + idx * 0.015 + 0.06);
            });
        } catch (e) { }
    }

    // 체크 (탁탁 2번 노크)
    playCheck() {
        if (this.isMuted || !this.ctx) return;
        try {
            [0, 0.09].forEach(delay => {
                const t = this.ctx.currentTime + delay;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(220, t);
                osc.frequency.exponentialRampToValueAtTime(60, t + 0.04);

                gain.gain.setValueAtTime(0.3, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(t);
                osc.stop(t + 0.05);
            });
        } catch (e) { }
    }

    // 폴드 / 다이 소리
    playFold() {
        if (this.isMuted || !this.ctx) return;
        try {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(280, t);
            osc.frequency.exponentialRampToValueAtTime(90, t + 0.15);

            gain.gain.setValueAtTime(0.18, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.16);
        } catch (e) { }
    }

    // 승리 팡파르 사운드
    playWin() {
        if (this.isMuted || !this.ctx) return;
        try {
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            notes.forEach((freq, idx) => {
                const t = this.ctx.currentTime + (idx * 0.11);
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, t);

                gain.gain.setValueAtTime(0.2, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(t);
                osc.stop(t + 0.4);
            });
        } catch (e) { }
    }

    // 턴 알림 딩동
    playTurnNotice() {
        if (this.isMuted || !this.ctx) return;
        try {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, t);
            osc.frequency.exponentialRampToValueAtTime(1320, t + 0.12);

            gain.gain.setValueAtTime(0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.22);
        } catch (e) { }
    }
}

window.soundManager = new SoundManager();
