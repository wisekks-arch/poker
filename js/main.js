// js/main.js - 메인 애플리케이션 및 UI 인터랙션 컨트롤러

class App {
    constructor() {
        this.currentEngine = null;
        this.lobbyInterval = null;
        this.tableRenderInterval = null;

        this.initDOMElements();
        this.user = this.loadUser();
        this.bindEvents();
        this.updateUserMoneyDisplay();
        this.renderLobby();

        // 로비 실시간 갱신 루프 (1.2초마다 방 상태 동기화)
        this.lobbyInterval = setInterval(() => {
            if (this.currentEngine === null) {
                this.renderLobby();
            }
        }, 1200);
    }

    // 1,000만원 기본 지급 회원 계정 로드
    loadUser() {
        const saved = localStorage.getItem('royal_poker_user');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) { }
        }
        // 신규 회원 가입: 기본 머니 1,000만원 즉시 지급
        const newUser = {
            id: 'user_' + Date.now(),
            name: '골드포커왕',
            money: 10000000, // 10,000,000원
            createdAt: new Date().toISOString()
        };
        this.saveUser(newUser);
        return newUser;
    }

    saveUser(user) {
        this.user = user;
        localStorage.setItem('royal_poker_user', JSON.stringify(this.user));
        this.updateUserMoneyDisplay();
    }

    updateUserMoneyDisplay() {
        if (this.dom && this.dom.userMoneyDisplay && this.user) {
            this.dom.userMoneyDisplay.textContent = this.user.money.toLocaleString() + '원';
        }
    }

    initDOMElements() {
        this.dom = {
            userMoneyDisplay: document.getElementById('userMoneyDisplay'),
            btnRefillMoney: document.getElementById('btnRefillMoney'),
            btnSoundToggle: document.getElementById('btnSoundToggle'),
            btnLogo: document.getElementById('btnLogo'),
            btnOpenGuide: document.getElementById('btnOpenGuide'),
            btnCloseGuide: document.getElementById('btnCloseGuide'),
            guideModal: document.getElementById('guideModal'),

            // 로비
            lobbyView: document.getElementById('lobbyView'),
            roomListGrid: document.getElementById('roomListGrid'),
            btnOpenCreateRoom: document.getElementById('btnOpenCreateRoom'),
            btnCloseCreateRoom: document.getElementById('btnCloseCreateRoom'),
            createRoomModal: document.getElementById('createRoomModal'),
            formCreateRoom: document.getElementById('formCreateRoom'),
            roomNameInput: document.getElementById('roomNameInput'),
            roomMaxPlayers: document.getElementById('roomMaxPlayers'),
            roomSeedMoney: document.getElementById('roomSeedMoney'),
            btnQuickJoin: document.getElementById('btnQuickJoin'),

            // 테이블 뷰
            tableView: document.getElementById('tableView'),
            tableRoomTitle: document.getElementById('tableRoomTitle'),
            tableRoomSeed: document.getElementById('tableRoomSeed'),
            tableRoomMax: document.getElementById('tableRoomMax'),
            btnLeaveRoom: document.getElementById('btnLeaveRoom'),
            btnJoinGame: document.getElementById('btnJoinGame'),
            btnStandUp: document.getElementById('btnStandUp'),
            seatsContainer: document.getElementById('seatsContainer'),
            tablePotDisplay: document.getElementById('tablePotDisplay'),
            tableStreetStatus: document.getElementById('tableStreetStatus'),
            communityCardBox: document.getElementById('communityCardBox'),
            communityCardSlot: document.getElementById('communityCardSlot'),
            winnerBanner: document.getElementById('winnerBanner'),
            winnerNameText: document.getElementById('winnerNameText'),
            winnerHandText: document.getElementById('winnerHandText'),
            winnerPrizeText: document.getElementById('winnerPrizeText'),

            // 배팅 패널
            userHandEvalText: document.getElementById('userHandEvalText'),
            userSeatNotice: document.getElementById('userSeatNotice'),
            btnFold: document.getElementById('btnFold'),
            btnCheckCall: document.getElementById('btnCheckCall'),
            txtCheckCall: document.getElementById('txtCheckCall'),
            subCheckCall: document.getElementById('subCheckCall'),
            btnQuarter: document.getElementById('btnQuarter'),
            subQuarter: document.getElementById('subQuarter'),
            btnHalf: document.getElementById('btnHalf'),
            subHalf: document.getElementById('subHalf'),
            btnRaise: document.getElementById('btnRaise'),
            subRaise: document.getElementById('subRaise'),
            btnAllIn: document.getElementById('btnAllIn')
        };
    }

    bindEvents() {
        // 로고 클릭 -> 로비로 이동
        this.dom.btnLogo.addEventListener('click', () => {
            if (this.currentEngine) this.leaveTable();
        });

        // 1,000만원 무료 리필
        this.dom.btnRefillMoney.addEventListener('click', () => {
            this.user.money += 10000000;
            this.saveUser(this.user);
            if (window.soundManager) window.soundManager.playWin();
            alert('🎉 회원 감사 10,000,000원의 게임머니가 무료 충전되었습니다!');
        });

        // 사운드 토글
        this.dom.btnSoundToggle.addEventListener('click', () => {
            if (window.soundManager) {
                const muted = window.soundManager.toggleMute();
                this.dom.btnSoundToggle.textContent = muted ? '🔇' : '🔊';
            }
        });

        // 족보 가이드 모달
        this.dom.btnOpenGuide.addEventListener('click', () => {
            this.dom.guideModal.classList.add('active');
        });
        this.dom.btnCloseGuide.addEventListener('click', () => {
            this.dom.guideModal.classList.remove('active');
        });

        // 방 만들기 모달
        this.dom.btnOpenCreateRoom.addEventListener('click', () => {
            this.dom.createRoomModal.classList.add('active');
        });
        this.dom.btnCloseCreateRoom.addEventListener('click', () => {
            this.dom.createRoomModal.classList.remove('active');
        });

        // 방 만들기 제출
        this.dom.formCreateRoom.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = this.dom.roomNameInput.value.trim();
            const maxPlayers = parseInt(this.dom.roomMaxPlayers.value);
            const seedMoney = parseInt(this.dom.roomSeedMoney.value);

            const engine = window.roomManager.createRoom(name, maxPlayers, seedMoney);
            this.dom.createRoomModal.classList.remove('active');
            this.enterTable(engine.roomId);
        });

        // 빠른 자동 착석
        this.dom.btnQuickJoin.addEventListener('click', () => {
            const list = window.roomManager.getRoomList();
            const openRoom = list.find(r => !r.isFull) || list[0];
            if (openRoom) {
                this.enterTable(openRoom.id);
            }
        });

        // 로비로 나가기
        this.dom.btnLeaveRoom.addEventListener('click', () => {
            this.leaveTable();
        });

        // [⚡ 즉시 참석 대기 (게임 참가)]
        if (this.dom.btnJoinGame) {
            this.dom.btnJoinGame.addEventListener('click', () => {
                if (!this.currentEngine) return;
                const res = this.currentEngine.reserveUserSeat(this.user);
                if (res.success) {
                    if (window.soundManager) window.soundManager.playChip();
                    this.renderTableState();
                }
            });
        }

        // 관전 모드 / 일어서기
        this.dom.btnStandUp.addEventListener('click', () => {
            if (!this.currentEngine) return;
            const seatIdx = this.currentEngine.players.findIndex(p => p && !p.isBot);
            if (seatIdx >= 0) {
                this.currentEngine.standUser(seatIdx);
                this.dom.btnStandUp.style.display = 'none';
            }
        });

        // 배팅 버튼 이벤트
        this.dom.btnFold.addEventListener('click', () => this.handleBetAction('fold'));
        this.dom.btnCheckCall.addEventListener('click', () => {
            const userPlayer = this.getUserPlayer();
            if (!userPlayer) return;
            const callNeed = this.currentEngine.currentBet - (userPlayer.currentRoundBet || 0);
            if (callNeed === 0) {
                this.handleBetAction('check');
            } else {
                this.handleBetAction('call');
            }
        });
        this.dom.btnQuarter.addEventListener('click', () => this.handleBetAction('quarter'));
        this.dom.btnHalf.addEventListener('click', () => this.handleBetAction('half'));
        this.dom.btnRaise.addEventListener('click', () => this.handleBetAction('raise'));
        this.dom.btnAllIn.addEventListener('click', () => this.handleBetAction('allin'));
    }

    // ==========================================================
    // 로비 화면 렌더링
    // ==========================================================
    renderLobby() {
        const rooms = window.roomManager.getRoomList();
        this.dom.roomListGrid.innerHTML = '';

        rooms.forEach(room => {
            const card = document.createElement('div');
            card.className = 'room-card';
            card.innerHTML = `
                <div>
                    <div class="room-card-header">
                        <div class="room-title">${room.name}</div>
                        <span class="room-players-badge">${room.currentPlayers}/${room.maxPlayers}명</span>
                    </div>
                    <div class="room-meta-info">
                        <div class="meta-row">
                            <span>기본 판돈(시드)</span>
                            <span class="val">${room.seedMoney.toLocaleString()}원</span>
                        </div>
                        <div class="meta-row">
                            <span>현재 총 팟(POT)</span>
                            <span class="val pot">${room.pot.toLocaleString()}원</span>
                        </div>
                    </div>
                </div>
                <div class="room-card-footer">
                    <span class="street-badge">${room.streetText}</span>
                    <button class="btn-enter-room">입장하기 →</button>
                </div>
            `;
            card.addEventListener('click', () => {
                this.enterTable(room.id);
            });
            this.dom.roomListGrid.appendChild(card);
        });
    }

    // ==========================================================
    // 테이블 화면 진입 & 렌더링
    // ==========================================================
    enterTable(roomId) {
        const engine = window.roomManager.enterRoom(roomId, this.user);
        if (!engine) return;

        this.currentEngine = engine;
        this.dom.lobbyView.style.display = 'none';
        this.dom.tableView.style.display = 'block';

        this.dom.tableRoomTitle.textContent = engine.roomName;
        this.dom.tableRoomSeed.textContent = `시드: ${engine.seedMoney.toLocaleString()}원`;
        this.dom.tableRoomMax.textContent = `최대 ${engine.maxPlayers}인 테이블`;

        // 테이블 상태 변경 시 UI 동기화
        engine.onUpdate(() => this.renderTableState());
        this.renderTableState();
    }

    leaveTable() {
        if (!this.currentEngine) return;
        window.roomManager.leaveRoom();
        this.currentEngine = null;
        this.dom.tableView.style.display = 'none';
        this.dom.lobbyView.style.display = 'block';
        this.renderLobby();
    }

    getUserPlayer() {
        if (!this.currentEngine) return null;
        return this.currentEngine.players.find(p => p && !p.isBot);
    }

    // 세븐포커 6~9인 테이블 렌더링
    renderTableState() {
        if (!this.currentEngine) return;
        const state = this.currentEngine.getState();
        const userPlayer = this.getUserPlayer();

        // 1. 중앙 팟 & 스트리트 갱신
        this.dom.tablePotDisplay.textContent = `${state.pot.toLocaleString()}원`;

        let streetDesc = '대기 중';
        if (state.street === 3) streetDesc = '3구 초이스 (1장 오픈 선택)';
        else if (state.street === 4) streetDesc = '4구 배팅 라운드';
        else if (state.street === 5) streetDesc = '5구 배팅 라운드';
        else if (state.street === 6) streetDesc = '6구 배팅 라운드';
        else if (state.street === 7) streetDesc = '7구 히든(리버) 최종 배팅';
        else if (state.street === 8) streetDesc = '쇼다운! 승자 판정';
        this.dom.tableStreetStatus.textContent = streetDesc;

        // 7구 공용 카드 표시 (9인 테이블 등 카드 부족 시)
        if (state.communityCard) {
            this.dom.communityCardBox.classList.add('show');
            this.dom.communityCardSlot.innerHTML = this.createCardHTML(state.communityCard, false);
        } else {
            this.dom.communityCardBox.classList.remove('show');
            this.dom.communityCardSlot.innerHTML = '';
        }

        // 2. 쇼다운 승자 배너
        if (state.winnerInfo && state.street === 8) {
            const w = state.winnerInfo.winners[0];
            this.dom.winnerNameText.textContent = w.name;
            this.dom.winnerHandText.textContent = w.handName;
            this.dom.winnerPrizeText.textContent = `+${w.moneyWon.toLocaleString()}원 획득!`;
            this.dom.winnerBanner.classList.add('show');
        } else {
            this.dom.winnerBanner.classList.remove('show');
        }

        // 3. 6~9인 좌석 타원형 배치 렌더링
        this.renderSeats(state, userPlayer);

        // 4. 배팅 컨트롤 패널 업데이트
        this.updateBettingControls(state, userPlayer);

        // 5. 유저 머니 및 참석/관전 버튼 상태 동기화
        if (userPlayer) {
            this.user.money = userPlayer.money;
            this.saveUser(this.user);
            if (this.dom.btnJoinGame) this.dom.btnJoinGame.style.display = 'none';
            if (this.dom.btnStandUp) {
                this.dom.btnStandUp.style.display = 'inline-block';
                this.dom.btnStandUp.textContent = (userPlayer.isFolded && state.phase !== 'WAITING')
                    ? '참석 대기 취소' : '일어서기(관전)';
            }
        } else {
            if (this.dom.btnJoinGame) {
                this.dom.btnJoinGame.style.display = 'inline-flex';
                this.dom.btnJoinGame.textContent = '⚡ 즉시 참석 대기 (게임 참가)';
            }
            if (this.dom.btnStandUp) this.dom.btnStandUp.style.display = 'none';
        }
    }

    // 6인 타원형 좌표 계산 및 좌석 렌더링
    renderSeats(state, userPlayer) {
        this.dom.seatsContainer.innerHTML = '';
        const count = state.maxPlayers;
        
        // 타원 중심 및 반지름 (6인 전용 쾌적한 비율)
        const centerX = 50; // 퍼센트
        const centerY = 50;
        const radiusX = 41; // 퍼센트 가로 반지름
        const radiusY = 32; // 퍼센트 세로 반지름

        for (let i = 0; i < count; i++) {
            const player = state.players[i];
            // 유저가 착석해 있다면 유저를 항상 화면 하단 정중앙(angle = 90도)에 오도록 회전 오프셋 적용
            let offset = 0;
            if (userPlayer) {
                offset = (Math.PI / 2) - ((2 * Math.PI / count) * userPlayer.seatIndex);
            }
            const angle = (2 * Math.PI / count) * i + offset;

            const posX = centerX + radiusX * Math.cos(angle);
            const posY = centerY + radiusY * Math.sin(angle);

            const seatSpot = document.createElement('div');
            seatSpot.className = 'seat-spot';
            seatSpot.style.left = `${posX}%`;
            seatSpot.style.top = `${posY}%`;

            if (!player) {
                // 빈 자리 -> 착석 버튼
                seatSpot.innerHTML = `
                    <div class="btn-sit-here" data-seat="${i}">
                        <span>🪑</span>
                        <span>착석하기</span>
                    </div>
                `;
                seatSpot.querySelector('.btn-sit-here').addEventListener('click', () => {
                    this.handleSitUser(i);
                });
            } else {
                // 플레이어 박스
                const isMyTurn = (state.activePlayerIndex === i);
                const isUserMe = Boolean(userPlayer && player.id === userPlayer.id);
                const isChoiceMode = (isUserMe && state.phase === 'CHOICE_OPEN');
                const isFolded = player.isFolded;

                let cardHTML = '';
                player.hand.forEach((card, cIdx) => {
                    // 실제 유저 본인의 카드는 히든이어도 볼 수 있음 (세븐포커 본인 히든 확인 가능)
                    const showFace = !card.isHidden || isUserMe || (state.phase === 'SHOWDOWN' && !player.isFolded);
                    cardHTML += this.createCardHTML(card, showFace, isChoiceMode, cIdx);
                });

                seatSpot.innerHTML = `
                    <div class="player-card-box ${isMyTurn ? 'active-turn' : ''} ${isFolded ? 'folded' : ''} ${isUserMe ? 'user-box' : ''}">
                        ${player.isBoss ? '<span class="boss-badge">👑 BOSS</span>' : ''}
                        <div class="player-header">
                            <span class="player-name">${player.name}</span>
                            <span class="player-avatar">${player.avatar}</span>
                        </div>
                        <div class="player-chips">${player.money.toLocaleString()}원</div>
                        <div class="hand-container ${isChoiceMode ? 'choice-mode' : ''}">
                            ${cardHTML}
                        </div>
                        <div class="player-action-bubble">${player.lastActionText || (isMyTurn ? '턴 진행 중...' : '')}</div>
                    </div>
                `;

                // 3구 초이스 클릭 이벤트 연결
                if (isChoiceMode) {
                    const cardElements = seatSpot.querySelectorAll('.poker-card');
                    cardElements.forEach((el, cardIndex) => {
                        el.addEventListener('click', () => {
                            this.currentEngine.handleUserOpenChoice(cardIndex);
                        });
                    });
                }
            }

            this.dom.seatsContainer.appendChild(seatSpot);
        }
    }

    createCardHTML(card, showFace, isChoiceMode = false, cardIndex = 0) {
        if (!showFace) {
            return `<div class="poker-card hidden-card" data-idx="${cardIndex}"></div>`;
        }
        const colorClass = card.suit.color === 'red' ? 'red' : 'black';
        const isFace = ['K', 'Q', 'J', 'A'].includes(card.rank.name);
        return `
            <div class="poker-card ${colorClass} ${isFace ? 'face-card' : ''}" data-idx="${cardIndex}" title="${card.rank.name}${card.suit.symbol}">
                <div class="card-corner top">
                    <span class="card-rank">${card.rank.display}</span>
                    <span class="card-suit">${card.suit.symbol}</span>
                </div>
                <div class="card-center-suit">${card.suit.symbol}</div>
                <div class="card-corner bottom">
                    <span class="card-rank">${card.rank.display}</span>
                    <span class="card-suit">${card.suit.symbol}</span>
                </div>
            </div>
        `;
    }

    // 유저 착석 처리
    handleSitUser(seatIndex) {
        if (!this.currentEngine) return;
        if (this.getUserPlayer()) {
            alert('이미 테이블에 참여하고 계십니다.');
            return;
        }
        if (this.user.money < this.currentEngine.seedMoney) {
            alert('보유 머니가 부족합니다! 상단에서 1,000만원 무료 충전을 받아주세요.');
            return;
        }

        const success = this.currentEngine.sitUser(this.user, seatIndex);
        if (success) {
            this.renderTableState();
            if (window.soundManager) window.soundManager.playChip();
        }
    }

    // 하단 배팅 컨트롤 패널 업데이트
    updateBettingControls(state, userPlayer) {
        const isMySeat = userPlayer !== null;
        const isMyTurn = isMySeat && (state.activePlayerIndex === userPlayer.seatIndex) && !userPlayer.isFolded && !userPlayer.isAllIn;

        if (!isMySeat) {
            this.dom.userHandEvalText.textContent = '내 패: 관전 모드';
            this.dom.userSeatNotice.textContent = '빈 자리에 [착석하기]를 누르면 게임에 참여할 수 있습니다.';
            this.disableAllBetButtons();
            return;
        }

        // 유저 족보 계산 및 표시
        if (userPlayer.hand.length > 0) {
            const evalResult = PokerEvaluator.evaluateBestHand(userPlayer.hand);
            this.dom.userHandEvalText.textContent = `내 패: ${evalResult.name}`;
            this.dom.userSeatNotice.textContent = isMyTurn ? '👉 당신의 턴입니다! 배팅을 선택하세요.' : '상대방의 배팅을 기다리는 중...';
        } else {
            this.dom.userHandEvalText.textContent = '내 패: 다음 판 대기 중';
            this.dom.userSeatNotice.textContent = '다음 라운드가 시작되면 자동으로 카드가 지급됩니다.';
        }

        if (!isMyTurn) {
            this.disableAllBetButtons();
            return;
        }

        // 배팅 계산
        const myBet = userPlayer.currentRoundBet || 0;
        const callNeed = state.currentBet - myBet;
        const pot = state.pot;
        const minBet = state.seedMoney;

        // 버튼 활성화
        this.dom.btnFold.disabled = false;
        this.dom.btnAllIn.disabled = false;

        // 체크 / 콜
        this.dom.btnCheckCall.disabled = false;
        if (callNeed === 0) {
            this.dom.txtCheckCall.textContent = userPlayer.isBoss ? '삥 (체크)' : '체크';
            this.dom.subCheckCall.textContent = '0원';
        } else {
            this.dom.txtCheckCall.textContent = '콜';
            this.dom.subCheckCall.textContent = `${Math.min(userPlayer.money, callNeed).toLocaleString()}원`;
        }

        // 쿼터 (25%), 하프 (50%), 따당 (2배)
        const quarterAmt = Math.max(minBet, Math.floor(pot * 0.25));
        const halfAmt = Math.max(minBet, Math.floor(pot * 0.5));
        const raiseAmt = callNeed > 0 ? (callNeed * 2) : minBet * 2;

        this.dom.btnQuarter.disabled = (userPlayer.money <= callNeed);
        this.dom.subQuarter.textContent = `${quarterAmt.toLocaleString()}원`;

        this.dom.btnHalf.disabled = (userPlayer.money <= callNeed);
        this.dom.subHalf.textContent = `${halfAmt.toLocaleString()}원`;

        this.dom.btnRaise.disabled = (userPlayer.money <= callNeed);
        this.dom.subRaise.textContent = `${raiseAmt.toLocaleString()}원`;
    }

    disableAllBetButtons() {
        ['btnFold', 'btnCheckCall', 'btnQuarter', 'btnHalf', 'btnRaise', 'btnAllIn'].forEach(id => {
            if (this.dom[id]) this.dom[id].disabled = true;
        });
        if (this.dom.txtCheckCall) this.dom.txtCheckCall.textContent = '삥 / 체크';
        if (this.dom.subCheckCall) this.dom.subCheckCall.textContent = '0원';
    }

    // 유저 배팅 액션 전송
    handleBetAction(action) {
        const userPlayer = this.getUserPlayer();
        if (!userPlayer || !this.currentEngine) return;

        const myBet = userPlayer.currentRoundBet || 0;
        const callNeed = this.currentEngine.currentBet - myBet;
        const pot = this.currentEngine.pot;
        let amount = 0;

        if (action === 'call') amount = callNeed;
        else if (action === 'quarter') amount = Math.floor(pot * 0.25);
        else if (action === 'half') amount = Math.floor(pot * 0.5);
        else if (action === 'raise') amount = callNeed > 0 ? callNeed * 2 : this.currentEngine.seedMoney * 2;
        else if (action === 'allin') amount = userPlayer.money;

        this.currentEngine.executeAction(userPlayer, action, amount);
    }
}

// 애플리케이션 시작
window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
