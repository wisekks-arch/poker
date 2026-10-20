// js/main.js - 메인 애플리케이션, 회원/어드민 시스템 및 테이블 참여 컨트롤러

class App {
    constructor() {
        this.currentEngine = null;
        this.lobbyInterval = null;

        this.initDOMElements();
        this.user = this.loadUser();
        this.bindEvents();
        this.bindAuthEvents();
        this.updateUserUI();
        this.renderLobby();

        // 로비 실시간 갱신 루프 (1.2초마다 방 상태 동기화)
        this.lobbyInterval = setInterval(() => {
            if (this.currentEngine === null) {
                this.renderLobby();
            }
        }, 1200);
    }

    // 유저 로드 (authManager 연동)
    loadUser() {
        if (window.authManager) {
            const current = window.authManager.getCurrentUser();
            if (current) {
                return {
                    id: current.id,
                    name: current.nickname,
                    username: current.username,
                    money: current.money,
                    role: current.role
                };
            }
        }
        return {
            id: 'user_default',
            name: '골드포커왕',
            username: 'vip_player',
            money: 10000000,
            role: 'user'
        };
    }

    saveUser(user) {
        this.user = user;
        if (window.authManager) {
            window.authManager.updateMoney(user.id, user.money);
        }
        this.updateUserUI();
    }

    updateUserUI() {
        if (this.dom && this.user) {
            if (this.dom.userMoneyDisplay) {
                this.dom.userMoneyDisplay.textContent = this.user.money.toLocaleString() + '원';
            }
            if (this.dom.headerUserNickname) {
                this.dom.headerUserNickname.textContent = this.user.name;
            }
            if (this.dom.btnOpenAdmin) {
                this.dom.btnOpenAdmin.style.display = (this.user.role === 'admin') ? 'inline-block' : 'none';
            }
        }
    }

    initDOMElements() {
        this.dom = {
            // 헤더 & 유저
            userMoneyDisplay: document.getElementById('userMoneyDisplay'),
            headerUserNickname: document.getElementById('headerUserNickname'),
            btnRefillMoney: document.getElementById('btnRefillMoney'),
            btnSoundToggle: document.getElementById('btnSoundToggle'),
            btnLogo: document.getElementById('btnLogo'),
            btnOpenGuide: document.getElementById('btnOpenGuide'),
            btnCloseGuide: document.getElementById('btnCloseGuide'),
            guideModal: document.getElementById('guideModal'),
            btnOpenProfile: document.getElementById('btnOpenProfile'),
            btnOpenAdmin: document.getElementById('btnOpenAdmin'),
            btnAuthAction: document.getElementById('btnAuthAction'),

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

            // 🔥 참여 대기 전용 버튼 (중앙 & 하단)
            tableCenterJoinContainer: document.getElementById('tableCenterJoinContainer'),
            btnTableCenterJoin: document.getElementById('btnTableCenterJoin'),
            bottomJoinBanner: document.getElementById('bottomJoinBanner'),
            btnBottomBigJoin: document.getElementById('btnBottomBigJoin'),

            // 배팅 패널
            userHandEvalText: document.getElementById('userHandEvalText'),
            userSeatNotice: document.getElementById('userSeatNotice'),
            actionButtonsGroup: document.getElementById('actionButtonsGroup'),
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
            btnAllIn: document.getElementById('btnAllIn'),

            // 모달들 (회원가입, 로그인, 프로필, 어드민)
            registerModal: document.getElementById('registerModal'),
            btnCloseRegister: document.getElementById('btnCloseRegister'),
            formRegister: document.getElementById('formRegister'),
            regUsername: document.getElementById('regUsername'),
            regPassword: document.getElementById('regPassword'),
            regNickname: document.getElementById('regNickname'),
            regPhone: document.getElementById('regPhone'),

            loginModal: document.getElementById('loginModal'),
            btnCloseLogin: document.getElementById('btnCloseLogin'),
            formLogin: document.getElementById('formLogin'),
            loginUsername: document.getElementById('loginUsername'),
            loginPassword: document.getElementById('loginPassword'),
            linkGoRegister: document.getElementById('linkGoRegister'),

            profileModal: document.getElementById('profileModal'),
            btnCloseProfile: document.getElementById('btnCloseProfile'),
            profUsername: document.getElementById('profUsername'),
            profMoney: document.getElementById('profMoney'),
            profRole: document.getElementById('profRole'),
            profNickname: document.getElementById('profNickname'),
            profNewPassword: document.getElementById('profNewPassword'),
            formUpdateProfile: document.getElementById('formUpdateProfile'),

            adminModal: document.getElementById('adminModal'),
            btnCloseAdmin: document.getElementById('btnCloseAdmin'),
            tabAdminUsers: document.getElementById('tabAdminUsers'),
            tabAdminRooms: document.getElementById('tabAdminRooms'),
            adminUsersPanel: document.getElementById('adminUsersPanel'),
            adminRoomsPanel: document.getElementById('adminRoomsPanel'),
            adminUserTableBody: document.getElementById('adminUserTableBody'),
            adminRoomsListContainer: document.getElementById('adminRoomsListContainer'),
            btnAdminRefreshUsers: document.getElementById('btnAdminRefreshUsers'),
            btnAdminResetAllRooms: document.getElementById('btnAdminResetAllRooms')
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

        // 방 만들기 제출 (최대 6인)
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

        // 🔥 참여 대기 액션 핸들러 (상단, 중앙, 하단 공통)
        const triggerJoinWait = () => {
            if (!this.currentEngine) return;
            const res = this.currentEngine.reserveUserSeat(this.user);
            if (res.success) {
                if (window.soundManager) window.soundManager.playChip();
                this.renderTableState();
                alert('✅ 참석 대기가 완료되었습니다! 진행 중인 판이 끝나면 다음 판에 즉시 착석되어 카드가 지급됩니다.');
            }
        };

        if (this.dom.btnJoinGame) this.dom.btnJoinGame.addEventListener('click', triggerJoinWait);
        if (this.dom.btnTableCenterJoin) this.dom.btnTableCenterJoin.addEventListener('click', triggerJoinWait);
        if (this.dom.btnBottomBigJoin) this.dom.btnBottomBigJoin.addEventListener('click', triggerJoinWait);

        // 관전 모드 / 일어서기
        this.dom.btnStandUp.addEventListener('click', () => {
            if (!this.currentEngine) return;
            const seatIdx = this.currentEngine.players.findIndex(p => p && !p.isBot);
            if (seatIdx >= 0) {
                this.currentEngine.standUser(seatIdx);
                this.renderTableState();
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
    // 회원가입, 로그인, 개인정보관리 & 어드민 이벤트 바인딩
    // ==========================================================
    bindAuthEvents() {
        // 프로필 열기
        this.dom.btnOpenProfile.addEventListener('click', () => {
            const current = window.authManager.getCurrentUser();
            if (current) {
                this.dom.profUsername.textContent = current.username;
                this.dom.profMoney.textContent = current.money.toLocaleString() + '원';
                this.dom.profRole.textContent = current.role === 'admin' ? '🛡️ 총괄 관리자' : '👑 VIP 정회원';
                this.dom.profNickname.value = current.nickname;
                this.dom.profNewPassword.value = '';
                this.dom.profileModal.classList.add('active');
            } else {
                this.dom.loginModal.classList.add('active');
            }
        });
        this.dom.btnCloseProfile.addEventListener('click', () => {
            this.dom.profileModal.classList.remove('active');
        });

        // 프로필(닉네임/비번) 수정 제출
        this.dom.formUpdateProfile.addEventListener('submit', (e) => {
            e.preventDefault();
            const newNick = this.dom.profNickname.value.trim();
            const newPass = this.dom.profNewPassword.value.trim();
            const res = window.authManager.updateProfile(this.user.id, newNick, newPass);
            if (res.success) {
                this.user = this.loadUser();
                this.updateUserUI();
                this.dom.profileModal.classList.remove('active');
                alert(res.message);
            } else {
                alert(res.message);
            }
        });

        // 로그인 / 로그아웃 버튼
        this.dom.btnAuthAction.addEventListener('click', () => {
            const current = window.authManager.getCurrentUser();
            if (current) {
                if (confirm('로그아웃 하시겠습니까?')) {
                    window.authManager.logout();
                    location.reload();
                }
            } else {
                this.dom.loginModal.classList.add('active');
            }
        });

        // 회원가입 모달 닫기 / 열기
        this.dom.btnCloseRegister.addEventListener('click', () => {
            this.dom.registerModal.classList.remove('active');
        });
        this.dom.linkGoRegister.addEventListener('click', (e) => {
            e.preventDefault();
            this.dom.loginModal.classList.remove('active');
            this.dom.registerModal.classList.add('active');
        });

        // 회원가입 폼 제출
        this.dom.formRegister.addEventListener('submit', (e) => {
            e.preventDefault();
            const u = this.dom.regUsername.value.trim();
            const p = this.dom.regPassword.value;
            const nick = this.dom.regNickname.value.trim();
            const phone = this.dom.regPhone.value.trim();

            const res = window.authManager.register(u, p, nick, phone);
            if (res.success) {
                this.user = this.loadUser();
                this.updateUserUI();
                this.dom.registerModal.classList.remove('active');
                if (window.soundManager) window.soundManager.playWin();
                alert(`🎉 ${res.message}\n환영합니다, [${nick}]님!`);
            } else {
                alert(res.message);
            }
        });

        // 로그인 모달 닫기
        this.dom.btnCloseLogin.addEventListener('click', () => {
            this.dom.loginModal.classList.remove('active');
        });

        // 로그인 폼 제출
        this.dom.formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            const u = this.dom.loginUsername.value.trim();
            const p = this.dom.loginPassword.value;

            const res = window.authManager.login(u, p);
            if (res.success) {
                this.user = this.loadUser();
                this.updateUserUI();
                this.dom.loginModal.classList.remove('active');
                alert(`반갑습니다, [${res.user.nickname}]님!`);
            } else {
                alert(res.message);
            }
        });

        // 어드민 대시보드 열기
        this.dom.btnOpenAdmin.addEventListener('click', () => {
            if (!window.authManager.isAdmin()) {
                alert('관리자 권한이 없습니다.');
                return;
            }
            this.renderAdminUsers();
            this.dom.adminModal.classList.add('active');
        });
        this.dom.btnCloseAdmin.addEventListener('click', () => {
            this.dom.adminModal.classList.remove('active');
        });

        // 어드민 탭 전환
        this.dom.tabAdminUsers.addEventListener('click', () => {
            this.dom.adminUsersPanel.style.display = 'block';
            this.dom.adminRoomsPanel.style.display = 'none';
            this.dom.tabAdminUsers.style.background = 'var(--gold-gradient)';
            this.dom.tabAdminUsers.style.color = '#000';
            this.dom.tabAdminRooms.style.background = 'rgba(255,255,255,0.08)';
            this.dom.tabAdminRooms.style.color = '#fff';
            this.renderAdminUsers();
        });
        this.dom.tabAdminRooms.addEventListener('click', () => {
            this.dom.adminUsersPanel.style.display = 'none';
            this.dom.adminRoomsPanel.style.display = 'block';
            this.dom.tabAdminRooms.style.background = 'var(--gold-gradient)';
            this.dom.tabAdminRooms.style.color = '#000';
            this.dom.tabAdminUsers.style.background = 'rgba(255,255,255,0.08)';
            this.dom.tabAdminUsers.style.color = '#fff';
            this.renderAdminRooms();
        });

        this.dom.btnAdminRefreshUsers.addEventListener('click', () => {
            this.renderAdminUsers();
        });

        // 전체 게임방 강제 리셋
        this.dom.btnAdminResetAllRooms.addEventListener('click', () => {
            if (confirm('모든 기본 게임방을 초기화하고 재시작하시겠습니까?')) {
                window.roomManager.initDefaultRooms();
                this.renderAdminRooms();
                alert('10개 게임방이 성공적으로 리셋되었습니다.');
            }
        });
    }

    // 어드민: 회원 관리 렌더링
    renderAdminUsers() {
        const users = window.authManager.getUsers();
        this.dom.adminUserTableBody.innerHTML = '';

        users.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${u.username}</strong></td>
                <td>${u.nickname}</td>
                <td style="color: var(--gold-bright); font-weight: 800;">${u.money.toLocaleString()}원</td>
                <td><span class="${u.role === 'admin' ? 'badge-admin' : 'badge-user'}">${u.role}</span></td>
                <td><span style="color: ${u.isBlocked ? '#ff4757' : '#2ed573'}; font-weight: 700;">${u.isBlocked ? '이용정지' : '정상'}</span></td>
                <td>
                    <button class="btn-admin-action btn-admin-add" data-id="${u.id}" data-act="add1000">+1천만</button>
                    <button class="btn-admin-action btn-admin-add" data-id="${u.id}" data-act="add1억">+1억</button>
                    <button class="btn-admin-action btn-admin-sub" data-id="${u.id}" data-act="sub1000">-1천만</button>
                </td>
                <td>
                    <button class="btn-admin-action btn-admin-block" data-id="${u.id}" data-act="toggleBlock">${u.isBlocked ? '해제' : '차단'}</button>
                    <button class="btn-admin-action" style="background: #576574; color:#fff;" data-id="${u.id}" data-act="delete">탈퇴</button>
                </td>
            `;

            // 머니 조정 및 제재 이벤트
            tr.querySelectorAll('.btn-admin-action').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    const act = btn.getAttribute('data-act');

                    if (act === 'add1000') window.authManager.adminAdjustMoney(id, 10000000);
                    else if (act === 'add1억') window.authManager.adminAdjustMoney(id, 100000000);
                    else if (act === 'sub1000') window.authManager.adminAdjustMoney(id, -10000000);
                    else if (act === 'toggleBlock') window.authManager.adminToggleBlock(id);
                    else if (act === 'delete') {
                        if (confirm(`회원 [${u.nickname}]을 강제 탈퇴시키겠습니까?`)) {
                            window.authManager.adminDeleteUser(id);
                        }
                    }

                    this.user = this.loadUser();
                    this.updateUserUI();
                    this.renderAdminUsers();
                });
            });

            this.dom.adminUserTableBody.appendChild(tr);
        });
    }

    // 어드민: 게임방 모니터링 렌더링
    renderAdminRooms() {
        const rooms = window.roomManager.getRoomList();
        this.dom.adminRoomsListContainer.innerHTML = '';

        rooms.forEach(r => {
            const div = document.createElement('div');
            div.style.cssText = 'background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px 18px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;';
            div.innerHTML = `
                <div>
                    <strong>${r.name}</strong> (${r.currentPlayers}/${r.maxPlayers}명)
                    <div style="font-size: 12px; color: var(--text-dim); margin-top: 2px;">
                        시드머니: ${r.seedMoney.toLocaleString()}원 | 상태: ${r.streetText}
                    </div>
                </div>
                <div style="text-align: right;">
                    <span style="color: var(--gold-bright); font-weight: 800; font-size: 15px;">POT: ${r.pot.toLocaleString()}원</span>
                </div>
            `;
            this.dom.adminRoomsListContainer.appendChild(div);
        });
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

    // 세븐포커 6인 테이블 렌더링
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

        // 3. 6인 좌석 타원형 배치 렌더링
        this.renderSeats(state, userPlayer);

        // 4. 배팅 컨트롤 패널 & 참여 대기 버튼 가시성 업데이트
        this.updateBettingControls(state, userPlayer);

        // 5. 유저 머니 및 참석/관전 버튼 상태 동기화
        if (userPlayer) {
            this.user.money = userPlayer.money;
            this.saveUser(this.user);

            // 이미 앉아있는 경우
            if (this.dom.btnJoinGame) this.dom.btnJoinGame.style.display = 'none';
            if (this.dom.tableCenterJoinContainer) this.dom.tableCenterJoinContainer.style.display = 'none';
            if (this.dom.bottomJoinBanner) this.dom.bottomJoinBanner.style.display = 'none';
            if (this.dom.actionButtonsGroup) this.dom.actionButtonsGroup.style.display = 'flex';

            if (this.dom.btnStandUp) {
                this.dom.btnStandUp.style.display = 'inline-block';
                this.dom.btnStandUp.textContent = (userPlayer.isFolded && state.phase !== 'WAITING')
                    ? '참석 대기 취소' : '일어서기(관전)';
            }
        } else {
            // 관전 모드인 경우 -> 참여 대기 버튼을 모든 곳에 눈에 띄게 노출!
            if (this.dom.btnJoinGame) {
                this.dom.btnJoinGame.style.display = 'inline-flex';
                this.dom.btnJoinGame.textContent = '⚡ 즉시 참석 대기 (게임 참가)';
            }
            if (this.dom.tableCenterJoinContainer) this.dom.tableCenterJoinContainer.style.display = 'block';
            if (this.dom.bottomJoinBanner) this.dom.bottomJoinBanner.style.display = 'block';
            if (this.dom.actionButtonsGroup) this.dom.actionButtonsGroup.style.display = 'none';
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
                const totalCards = player.hand.length;
                player.hand.forEach((card, cIdx) => {
                    const showFace = !card.isHidden || isUserMe || (state.phase === 'SHOWDOWN' && !player.isFolded);
                    cardHTML += this.createCardHTML(card, showFace, isChoiceMode, cIdx, totalCards);
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
                            if (window.pokerAudio) window.pokerAudio.playCardFlip();
                            this.currentEngine.handleUserOpenChoice(cardIndex);
                        });
                    });
                }
            }

            this.dom.seatsContainer.appendChild(seatSpot);
        }
    }

    createCardHTML(card, showFace, isChoiceMode = false, cardIndex = 0, totalCards = 1) {
        // 부채꼴 아치형 회전 및 자연스러운 곡선 계산
        let rotateDeg = 0;
        let translateYPx = 0;
        if (totalCards > 1) {
            const mid = (totalCards - 1) / 2;
            const diff = cardIndex - mid;
            rotateDeg = (diff * 3.5).toFixed(1);
            translateYPx = (Math.abs(diff) * 2.2).toFixed(1);
        }
        const styleAttr = `style="transform: rotate(${rotateDeg}deg) translateY(${translateYPx}px); z-index: ${cardIndex + 1};"`;

        if (!showFace) {
            return `<div class="poker-card hidden-card" data-idx="${cardIndex}" ${styleAttr} title="히든 카드"></div>`;
        }

        const colorClass = card.suit.color === 'red' ? 'red' : 'black';
        const isFace = ['K', 'Q', 'J', 'A'].includes(card.rank.name);
        const isAce = card.rank.name === 'A';

        return `
            <div class="poker-card ${colorClass} ${isFace ? 'face-card' : ''} ${isAce ? 'ace-card' : ''} anim-flip" data-idx="${cardIndex}" ${styleAttr} title="${card.rank.name}${card.suit.symbol}">
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
            this.dom.userSeatNotice.textContent = '👉 [참석 대기]를 누르면 다음 판부터 즉시 참여할 수 있습니다.';
            this.disableAllBetButtons();
            return;
        }

        // 유저 족보 계산 및 표시
        if (userPlayer.hand.length > 0) {
            const evalResult = PokerEvaluator.evaluateBestHand(userPlayer.hand);
            this.dom.userHandEvalText.textContent = `내 패: ${evalResult.name}`;
            this.dom.userSeatNotice.textContent = isMyTurn ? '👉 당신의 턴입니다! 배팅을 선택하세요.' : '상대방의 배팅을 기다리는 중...';
        } else {
            this.dom.userHandEvalText.textContent = '내 패: 다음 판 참석 대기중';
            this.dom.userSeatNotice.textContent = '다음 판이 시작되면 3장의 카드가 자동으로 지급됩니다.';
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

        // 🔥 유저 배팅 버튼 클릭 시 전용 보이스 및 사운드 즉시 재생
        if (window.soundManager) {
            window.soundManager.playBetVoice(action);
        }

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
