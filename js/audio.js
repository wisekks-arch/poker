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

    // 🔥 칩을 팟 중앙으로 촤르르 던지는 리얼 세라믹 칩 스택 투척 소리
    playChipToss() {
        if (this.isMuted || !this.ctx) return;
        try {
            const baseTime = this.ctx.currentTime;
            // 4개의 칩이 순차적으로 부딪히는 촤르르 사운드
            const chipDelays = [0, 0.025, 0.055, 0.085, 0.12];
            const freqs = [2600, 3100, 2200, 2800, 3400];

            chipDelays.forEach((delay, idx) => {
                const t = baseTime + delay;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const filter = this.ctx.createBiquadFilter();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freqs[idx % freqs.length], t);
                osc.frequency.exponentialRampToValueAtTime(450, t + 0.045);

                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(freqs[idx % freqs.length], t);
                filter.Q.setValueAtTime(4, t);

                gain.gain.setValueAtTime(0.22, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(t);
                osc.stop(t + 0.06);
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

    // 🔥 배팅별 전용 타격 신디사이저 효과음
    playActionImpact(action) {
        if (this.isMuted || !this.ctx) return;
        try {
            const t = this.ctx.currentTime;
            if (action === 'raise') {
                // 따당: 2연타 더블 비트 (팡-팡!)
                [0, 0.08].forEach(d => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(520, t + d);
                    osc.frequency.exponentialRampToValueAtTime(140, t + d + 0.07);
                    gain.gain.setValueAtTime(0.3, t + d);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + d + 0.07);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t + d);
                    osc.stop(t + d + 0.08);
                });
            } else if (action === 'half') {
                // 하프: 묵직한 베이스 펀치
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(180, t);
                osc.frequency.exponentialRampToValueAtTime(45, t + 0.18);
                gain.gain.setValueAtTime(0.35, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(t);
                osc.stop(t + 0.2);
            } else if (action === 'quarter') {
                // 쿼터: 맑고 경쾌한 칩 팅 소리
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, t);
                osc.frequency.exponentialRampToValueAtTime(440, t + 0.12);
                gain.gain.setValueAtTime(0.25, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(t);
                osc.stop(t + 0.13);
            } else if (action === 'allin') {
                // 올인: 웅장하고 극적인 임팩트 브라스 드랍
                [110, 220, 440].forEach((freq, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(freq, t);
                    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.35);
                    gain.gain.setValueAtTime(0.2, t);
                    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.38);
                });
            }
        } catch (e) { }
    }

    // 🔥 브라우저 고품질 한국어 보이스 발화 (다이, 콜, 체크, 쿼터, 하프, 따당, 올인)
    speak(text) {
        if (this.isMuted) return;
        if (!('speechSynthesis' in window)) return;
        try {
            window.speechSynthesis.cancel(); // 이전 음성 취소하여 즉각 발음
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ko-KR';
            utterance.rate = 1.25; // 카지노 딜러의 시원하고 빠른 발음
            utterance.pitch = 1.05;
            utterance.volume = 0.95;
            window.speechSynthesis.speak(utterance);
        } catch (e) { }
    }

    // 배팅별 보이스 및 효과음 통합 트리거
    playBetVoice(action) {
        if (this.isMuted) return;

        let voiceText = '';
        if (action === 'fold') voiceText = '다이!';
        else if (action === 'check') voiceText = '체크!';
        else if (action === 'call') voiceText = '콜!';
        else if (action === 'quarter') voiceText = '쿼터!';
        else if (action === 'half') voiceText = '하프!';
        else if (action === 'raise') voiceText = '따당!';
        else if (action === 'allin') voiceText = '올인!';

        if (voiceText) {
            this.speak(voiceText);
        }

        // 전용 임팩트 사운드 및 칩 투척음 동시 재생
        if (action === 'fold') {
            this.playFold();
        } else if (action === 'check') {
            this.playCheck();
        } else {
            this.playActionImpact(action);
            this.playChipToss();
        }
    }

    // 🔥 새 라운드 시작 시: 잔잔하고 고급스러운 카지노 라운지 앰비언트 BGM
    playRoundAmbientBgm() {
        if (this.isMuted || !this.ctx) return;
        try {
            const t = this.ctx.currentTime;
            // Fmaj7 -> G7 -> Em7 -> Am7 분위기의 감미로운 칠아웃 톤 아르페지오 (C4, E4, G4, B4, D5)
            const chords = [
                { note: 261.63, delay: 0 },      // C4
                { note: 329.63, delay: 0.16 },   // E4
                { note: 392.00, delay: 0.32 },   // G4
                { note: 493.88, delay: 0.50 },   // B4
                { note: 587.33, delay: 0.72 },   // D5
                { note: 523.25, delay: 1.10 }    // C5 (마무리 은은한 울림)
            ];

            chords.forEach(({ note, delay }) => {
                const noteTime = t + delay;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const filter = this.ctx.createBiquadFilter();

                // 부드러운 일렉트릭 피아노/마림바 벨 톤
                osc.type = 'sine';
                osc.frequency.setValueAtTime(note, noteTime);

                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(1200, noteTime);

                gain.gain.setValueAtTime(0.001, noteTime);
                gain.gain.linearRampToValueAtTime(0.12, noteTime + 0.04);
                gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.9);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(noteTime);
                osc.stop(noteTime + 0.95);
            });
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
