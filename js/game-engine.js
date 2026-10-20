// js/game-engine.js - 세븐포커(7 Card Stud) 실시간 게임 엔진

class PokerGameEngine {
    constructor(config) {
        this.roomId = config.roomId || 'room_1';
        this.roomName = config.roomName || '골드 룸';
        this.maxPlayers = config.maxPlayers || 7; // 6~9명
        this.seedMoney = config.seedMoney || 50000; // 기본 참가비(앤티)
        this.isBackground = config.isBackground || false; // 백그라운드 시뮬레이션 여부

        this.deck = new Deck();
        this.players = []; // 최대 maxPlayers 시트
        this.pot = 0;
        this.currentBet = 0;
        this.minBet = this.seedMoney;
        this.street = 0; // 0: 대기, 3: 3구(초이스), 4: 4구, 5: 5구, 6: 6구, 7: 7구, 8: 쇼다운
        this.phase = 'WAITING';
        this.activePlayerIndex = -1;
        this.bossPlayerIndex = -1;
        this.communityCard = null; // 9인 테이블 덱 부족 시 7구 공용 카드
        this.lastAction = null;
        this.winnerInfo = null;

        this.turnTimeout = null;
        this.loopRunning = false;
        this.eventListeners = [];

        this.initSeats();
    }

    onUpdate(fn) {
        this.eventListeners.push(fn);
    }

    notify() {
        for (const fn of this.eventListeners) {
            try { fn(this.getState()); } catch (e) { }
        }
    }

    initSeats() {
        // 자리 초기화
        this.players = [];
        for (let i = 0; i < this.maxPlayers; i++) {
            this.players.push(null); // 빈 자리
        }
    }

    // 봇 플레이어들로 빈 자리 채우기
    fillWithBots() {
        for (let i = 0; i < this.maxPlayers; i++) {
            if (!this.players[i]) {
                const profile = BotPlayer.getRandomProfile(i + Math.floor(Math.random() * 20));
                this.players[i] = {
                    id: `bot_${this.roomId}_${i}`,
                    name: profile.name,
                    avatar: profile.avatar,
                    style: profile.style,
                    isBot: true,
                    money: Math.floor(Math.random() * 5000000) + 5000000, // 500만~1000만
                    seatIndex: i,
                    hand: [],
                    isFolded: false,
                    isAllIn: false,
                    currentRoundBet: 0,
                    totalBet: 0,
                    isBoss: false,
                    lastActionText: ''
                };
            }
        }
    }

    // 실제 유저 착석
    sitUser(user, seatIndex) {
        if (seatIndex < 0 || seatIndex >= this.maxPlayers) return false;

        this.players[seatIndex] = {
            id: user.id || 'user_me',
            name: user.name || '나(플레이어)',
            avatar: '👑',
            style: 'user',
            isBot: false,
            money: user.money,
            seatIndex: seatIndex,
            hand: [],
            isFolded: (this.phase !== 'WAITING'),
            isAllIn: false,
            currentRoundBet: 0,
            totalBet: 0,
            isBoss: false,
            lastActionText: (this.phase !== 'WAITING') ? '다음 판 참석 대기' : ''
        };
        this.notify();
        return true;
    }

    // [참석 대기] 버튼 클릭 시 호출: 빈자리 찾거나 봇 1명 교체하여 즉시 예약 착석
    reserveUserSeat(user) {
        const existing = this.players.find(p => p && !p.isBot);
        if (existing) return { success: true, seatIndex: existing.seatIndex, isAlreadySeated: true };

        // 1. 빈자리가 있는지 검색
        let targetSeat = this.players.findIndex(p => p === null);

        // 2. 빈자리가 없으면 봇 1명 자리 양보 (마지막 봇 자리)
        if (targetSeat === -1) {
            for (let i = this.maxPlayers - 1; i >= 0; i--) {
                if (this.players[i] && this.players[i].isBot) {
                    targetSeat = i;
                    break;
                }
            }
        }

        if (targetSeat === -1) targetSeat = 0;

        const ok = this.sitUser(user, targetSeat);
        return { success: ok, seatIndex: targetSeat, isAlreadySeated: false };
    }

    // 유저 퇴장
    standUser(seatIndex) {
        if (this.players[seatIndex] && !this.players[seatIndex].isBot) {
            const botProfile = BotPlayer.getRandomProfile(seatIndex);
            this.players[seatIndex] = {
                id: `bot_${this.roomId}_${seatIndex}`,
                name: botProfile.name,
                avatar: botProfile.avatar,
                style: botProfile.style,
                isBot: true,
                money: 8000000,
                seatIndex: seatIndex,
                hand: [],
                isFolded: false,
                isAllIn: false,
                currentRoundBet: 0,
                totalBet: 0,
                isBoss: false,
                lastActionText: ''
            };
            this.notify();
        }
    }

    startLoop() {
        if (this.loopRunning) return;
        this.loopRunning = true;
        this.runNextRound();
    }

    stopLoop() {
        this.loopRunning = false;
        if (this.turnTimeout) clearTimeout(this.turnTimeout);
    }

    // 새 라운드 시작
    runNextRound() {
        if (!this.loopRunning) return;

        // 파산한 봇 재충전
        for (const p of this.players) {
            if (p && p.isBot && p.money < this.seedMoney * 3) {
                p.money = Math.floor(Math.random() * 4000000) + 6000000;
            }
        }

        // 참가 가능 인원 확인
        const activeSeats = this.players.filter(p => p && p.money >= this.seedMoney);
        if (activeSeats.length < 2) {
            this.turnTimeout = setTimeout(() => this.runNextRound(), 2000);
            return;
        }

        this.deck.reset();
        this.pot = 0;
        this.currentBet = 0;
        this.street = 0;
        this.communityCard = null;
        this.winnerInfo = null;

        // 플레이어 초기화 및 앤티(참가비) 징수
        for (const p of this.players) {
            if (!p) continue;
            p.hand = [];
            p.isFolded = false;
            p.isAllIn = false;
            p.currentRoundBet = 0;
            p.totalBet = 0;
            p.isBoss = false;
            p.lastActionText = '';

            // 앤티
            const ante = Math.min(p.money, this.seedMoney);
            p.money -= ante;
            p.totalBet += ante;
            this.pot += ante;
        }

        if (!this.isBackground && window.soundManager) {
            window.soundManager.playChipToss();
            window.soundManager.playRoundAmbientBgm();
        }

        this.phase = 'DEAL_INITIAL';
        this.street = 3;
        this.notify();

        // 3장씩 지급 (초기 2장 히든, 1장 오픈 대기)
        const delay = this.isBackground ? 100 : 800;
        this.turnTimeout = setTimeout(() => {
            this.dealInitialCards();
        }, delay);
    }

    dealInitialCards() {
        for (const p of this.players) {
            if (!p || p.isFolded) continue;
            for (let i = 0; i < 3; i++) {
                const c = this.deck.draw();
                c.isHidden = true; // 일단 3장 모두 비공개로 받음
                p.hand.push(c);
            }
        }

        if (!this.isBackground && window.soundManager) {
            window.soundManager.playCardSlide();
        }

        this.phase = 'CHOICE_OPEN';
        this.notify();

        // 봇들은 3장 중 1장 자동 오픈 선택
        for (const p of this.players) {
            if (p && p.isBot) {
                const openIdx = BotPlayer.chooseOpenCard(p.hand, p.style);
                p.hand[openIdx].isHidden = false;
            }
        }

        // 유저가 있는 방인지 확인
        const userPlayer = this.players.find(p => p && !p.isBot);
        if (userPlayer && !userPlayer.isFolded && !this.isBackground) {
            // 유저의 오픈 카드 선택 대기 (UI에서 카드 클릭 시 handleUserOpenChoice 호출)
            // 8초 타임아웃 주어 미선택 시 3번째 카드 자동 오픈
            this.turnTimeout = setTimeout(() => {
                if (userPlayer.hand.every(c => c.isHidden)) {
                    userPlayer.hand[2].isHidden = false;
                    this.startStreet(4);
                }
            }, 8000);
        } else {
            // 전부 봇이거나 백그라운드면 즉시 진행
            if (userPlayer) userPlayer.hand[2].isHidden = false;
            const delay = this.isBackground ? 150 : 1000;
            this.turnTimeout = setTimeout(() => {
                this.startStreet(4);
            }, delay);
        }
    }

    // 실제 유저가 3장 중 오픈할 카드 선택
    handleUserOpenChoice(cardIndex) {
        const userPlayer = this.players.find(p => p && !p.isBot);
        if (!userPlayer || this.phase !== 'CHOICE_OPEN') return;
        if (cardIndex < 0 || cardIndex >= userPlayer.hand.length) return;

        if (this.turnTimeout) clearTimeout(this.turnTimeout);

        userPlayer.hand.forEach((c, idx) => {
            c.isHidden = (idx !== cardIndex);
        });

        if (!this.isBackground && window.soundManager) {
            window.soundManager.playCardFlip();
        }

        this.notify();
        this.turnTimeout = setTimeout(() => {
            this.startStreet(4);
        }, 800);
    }

    // 스트리트 시작 (4구, 5구, 6구, 7구)
    startStreet(streetNum) {
        this.street = streetNum;
        this.currentBet = 0;
        this.activeBetPlayerCount = 0;

        // 라운드별 배팅 초기화
        for (const p of this.players) {
            if (p) {
                p.currentRoundBet = 0;
                p.hasActed = false;
            }
        }

        // 카드 추가 지급
        if (streetNum >= 4 && streetNum <= 6) {
            // 4구, 5구, 6구는 오픈 카드 1장 지급
            for (const p of this.players) {
                if (!p || p.isFolded) continue;
                const c = this.deck.draw();
                c.isHidden = false;
                p.hand.push(c);
            }
            if (!this.isBackground && window.soundManager) window.soundManager.playCardSlide();
        } else if (streetNum === 7) {
            // 7구 (리버, 히든)
            const aliveCount = this.players.filter(p => p && !p.isFolded).length;
            if (this.deck.remaining() < aliveCount) {
                // 9인 테이블 덱 부족 시 공식 룰: 중앙 공용 카드 1장 오픈
                this.communityCard = this.deck.draw();
                if (this.communityCard) this.communityCard.isHidden = false;
                for (const p of this.players) {
                    if (p && !p.isFolded && this.communityCard) {
                        p.hand.push(this.communityCard);
                    }
                }
            } else {
                for (const p of this.players) {
                    if (!p || p.isFolded) continue;
                    const c = this.deck.draw();
                    c.isHidden = true; // 마지막 장은 히든
                    p.hand.push(c);
                }
            }
            if (!this.isBackground && window.soundManager) window.soundManager.playCardSlide();
        }

        // 보스(Boss) 선 판정 (오픈된 카드 기준 최강 패)
        const boss = PokerEvaluator.evaluateBoss(this.players.filter(p => p && !p.isFolded));
        for (const p of this.players) {
            if (p) p.isBoss = (boss && p.id === boss.id);
        }

        this.bossPlayerIndex = boss ? boss.seatIndex : this.findNextActiveSeat(-1);
        this.activePlayerIndex = this.bossPlayerIndex;
        this.phase = `BETTING_${streetNum}`;
        this.notify();

        const delay = this.isBackground ? 100 : 700;
        this.turnTimeout = setTimeout(() => {
            this.processNextTurn();
        }, delay);
    }

    // 턴 진행 처리
    processNextTurn() {
        if (!this.loopRunning) return;

        // 생존 플레이어 체크 (1명 빼고 다 다이했으면 즉시 종료)
        const alivePlayers = this.players.filter(p => p && !p.isFolded);
        if (alivePlayers.length === 1) {
            this.endRoundWinner(alivePlayers[0], '상대방 전원 다이로 승리!');
            return;
        }

        // 이번 배팅 라운드가 완료되었는지 검사
        if (this.isBettingRoundComplete()) {
            this.advanceToNextStreet();
            return;
        }

        // 현재 턴 플레이어 확인
        const currentPlayer = this.players[this.activePlayerIndex];
        if (!currentPlayer || currentPlayer.isFolded || currentPlayer.isAllIn) {
            this.activePlayerIndex = this.findNextActiveSeat(this.activePlayerIndex);
            this.processNextTurn();
            return;
        }

        // 턴 시작 알림
        if (!this.isBackground && !currentPlayer.isBot && window.soundManager) {
            window.soundManager.playTurnNotice();
        }
        this.notify();

        if (currentPlayer.isBot) {
            // 봇 행동 결정
            const delay = this.isBackground ? (50 + Math.random() * 80) : (600 + Math.random() * 700);
            this.turnTimeout = setTimeout(() => {
                const decision = BotPlayer.decideAction(currentPlayer, {
                    currentBet: this.currentBet,
                    minBet: this.minBet,
                    pot: this.pot,
                    street: this.street
                });
                this.executeAction(currentPlayer, decision.action, decision.amount);
            }, delay);
        } else {
            // 유저 턴 (UI에서 버튼 클릭 대기, 15초 초과 시 자동 다이/체크)
            this.turnTimeout = setTimeout(() => {
                const callAmount = this.currentBet - (currentPlayer.currentRoundBet || 0);
                if (callAmount === 0) {
                    this.executeAction(currentPlayer, 'check', 0);
                } else {
                    this.executeAction(currentPlayer, 'fold', 0);
                }
            }, 15000);
        }
    }

    // 유저/봇 공통 액션 수행
    executeAction(player, action, amount = 0) {
        if (this.turnTimeout) clearTimeout(this.turnTimeout);

        const callNeed = this.currentBet - (player.currentRoundBet || 0);

        switch (action) {
            case 'fold': // 다이
                player.isFolded = true;
                player.lastActionText = '다이 (Fold)';
                if (!this.isBackground && window.soundManager) window.soundManager.playFold();
                break;

            case 'check': // 삥 / 체크
                player.lastActionText = callNeed === 0 && player.isBoss ? '삥 (Check)' : '체크 (Check)';
                if (!this.isBackground && window.soundManager) window.soundManager.playCheck();
                break;

            case 'call': // 콜
                const actualCall = Math.min(player.money, callNeed);
                player.money -= actualCall;
                player.currentRoundBet = (player.currentRoundBet || 0) + actualCall;
                player.totalBet += actualCall;
                this.pot += actualCall;
                if (player.money === 0) player.isAllIn = true;
                player.lastActionText = `콜 (${actualCall.toLocaleString()}원)`;
                if (!this.isBackground && player.isBot && window.soundManager) window.soundManager.playChipToss();
                break;

            case 'bet': // 따당 또는 베팅
            case 'quarter': // 쿼터
            case 'half': // 하프
            case 'raise': // 레이즈
            case 'allin': // 올인
                const betAmount = Math.min(player.money, Math.max(callNeed + this.minBet, amount));
                player.money -= betAmount;
                player.currentRoundBet = (player.currentRoundBet || 0) + betAmount;
                player.totalBet += betAmount;
                this.pot += betAmount;
                this.currentBet = player.currentRoundBet;

                if (player.money === 0) player.isAllIn = true;

                let label = '베팅';
                if (action === 'half') label = '하프';
                else if (action === 'quarter') label = '쿼터';
                else if (action === 'raise') label = '따당(레이즈)';
                else if (action === 'allin') label = '올인!';
                player.lastActionText = `${label} (${betAmount.toLocaleString()}원)`;

                if (!this.isBackground && player.isBot && window.soundManager) window.soundManager.playChipToss();
                break;
        }

        player.hasActed = true;
        this.notify();

        // 다음 플레이어 턴으로 진행
        this.activePlayerIndex = this.findNextActiveSeat(this.activePlayerIndex);
        const delay = this.isBackground ? 80 : 400;
        this.turnTimeout = setTimeout(() => {
            this.processNextTurn();
        }, delay);
    }

    // 다음 스트리트 또는 쇼다운으로 전진
    advanceToNextStreet() {
        // 모든 플레이어 액션 상태 초기화
        for (const p of this.players) {
            if (p) p.hasActed = false;
        }

        if (this.street < 7) {
            this.startStreet(this.street + 1);
        } else {
            this.startShowdown();
        }
    }

    // 쇼다운 (패 오픈 및 족보 비교)
    startShowdown() {
        this.phase = 'SHOWDOWN';
        this.street = 8;

        const survivors = this.players.filter(p => p && !p.isFolded);
        let bestScore = -1;
        let winners = [];

        for (const p of survivors) {
            // 히든 카드 모두 공개
            for (const c of p.hand) c.isHidden = false;
            const evalResult = PokerEvaluator.evaluateBestHand(p.hand);
            p.bestHand = evalResult;

            if (evalResult.score > bestScore) {
                bestScore = evalResult.score;
                winners = [p];
            } else if (evalResult.score === bestScore) {
                winners.push(p);
            }
        }

        // 상금 분배
        const share = Math.floor(this.pot / winners.length);
        for (const w of winners) {
            w.money += share;
        }

        this.winnerInfo = {
            winners: winners.map(w => ({
                id: w.id,
                name: w.name,
                handName: w.bestHand.name,
                moneyWon: share
            })),
            pot: this.pot
        };

        if (!this.isBackground && window.soundManager) {
            window.soundManager.playWin();
        }

        this.notify();

        // 5초 후 다음 판 자동 시작
        const nextRoundDelay = this.isBackground ? 800 : 5000;
        this.turnTimeout = setTimeout(() => {
            this.runNextRound();
        }, nextRoundDelay);
    }

    // 상대방 전원 기권 승리
    endRoundWinner(winner, reason) {
        winner.money += this.pot;
        this.winnerInfo = {
            winners: [{ id: winner.id, name: winner.name, handName: reason, moneyWon: this.pot }],
            pot: this.pot
        };
        this.phase = 'ROUND_END';

        if (!this.isBackground && window.soundManager) window.soundManager.playWin();
        this.notify();

        const delay = this.isBackground ? 600 : 4000;
        this.turnTimeout = setTimeout(() => {
            this.runNextRound();
        }, delay);
    }

    // 배팅 라운드 종료 검사
    isBettingRoundComplete() {
        const canActPlayers = this.players.filter(p => p && !p.isFolded && !p.isAllIn);
        if (canActPlayers.length <= 1) return true;

        // 모든 활동 플레이어가 액션을 1번 이상 수행했고, 배팅액이 일치하는지
        return canActPlayers.every(p => p.hasActed && (p.currentRoundBet || 0) === this.currentBet);
    }

    // 다음 순서 플레이어 찾기
    findNextActiveSeat(currentIndex) {
        for (let i = 1; i <= this.maxPlayers; i++) {
            const nextIdx = (currentIndex + i) % this.maxPlayers;
            const p = this.players[nextIdx];
            if (p && !p.isFolded && !p.isAllIn) {
                return nextIdx;
            }
        }
        return currentIndex;
    }

    // 현재 방의 상태 스냅샷
    getState() {
        return {
            roomId: this.roomId,
            roomName: this.roomName,
            maxPlayers: this.maxPlayers,
            seedMoney: this.seedMoney,
            pot: this.pot,
            currentBet: this.currentBet,
            street: this.street,
            phase: this.phase,
            activePlayerIndex: this.activePlayerIndex,
            bossPlayerIndex: this.bossPlayerIndex,
            communityCard: this.communityCard,
            winnerInfo: this.winnerInfo,
            players: this.players.map(p => {
                if (!p) return null;
                return {
                    id: p.id,
                    name: p.name,
                    avatar: p.avatar,
                    isBot: p.isBot,
                    money: p.money,
                    seatIndex: p.seatIndex,
                    isFolded: p.isFolded,
                    isAllIn: p.isAllIn,
                    isBoss: p.isBoss,
                    currentRoundBet: p.currentRoundBet || 0,
                    totalBet: p.totalBet || 0,
                    lastActionText: p.lastActionText || '',
                    hand: p.hand.map(c => ({
                        suit: c.suit,
                        rank: c.rank,
                        isHidden: c.isHidden
                    }))
                };
            })
        };
    }
}

window.PokerGameEngine = PokerGameEngine;
