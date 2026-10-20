// js/main.js - 메인 애플리케이션, 회원/어드민 시스템, 계정찾기 및 테이블 참여 컨트롤러

// 🔥 브라우저 기본 URL 헤더 팝업(https://wisekks-arch.github.io의 메시지) 100% 원천 봉쇄
window.alert = function(msg) {
    if (window.app && typeof window.app.showModalAlert === 'function') {
        window.app.showModalAlert(String(msg));
    } else if (typeof window.__showCustomAlert === 'function') {
        window.__showCustomAlert(String(msg));
    } else {
        console.warn('[Alert Blocked]:', msg);
    }
};
window.confirm = function(msg) {
    console.warn('[Confirm Blocked]:', msg);
    return true;
};

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
        return null; // 비로그인 / 로그아웃 상태
    }

    saveUser(user) {
        this.user = user;
        if (user && window.authManager) {
            window.authManager.updateMoney(user.id, user.money);
        }
        this.updateUserUI();
    }

    updateUserUI() {
        if (!this.dom) return;
        if (this.user) {
            // 로그인 상태
            if (this.dom.userMoneyDisplay) {
                this.dom.userMoneyDisplay.textContent = this.user.money.toLocaleString() + '원';
            }
            if (this.dom.headerUserNickname) {
                this.dom.headerUserNickname.textContent = this.user.name;
            }
            if (this.dom.btnOpenProfile) {
                this.dom.btnOpenProfile.style.display = 'inline-flex';
            }
            if (this.dom.btnAuthAction) {
                this.dom.btnAuthAction.textContent = '로그아웃';
            }
            if (this.dom.btnOpenAdmin) {
                this.dom.btnOpenAdmin.style.display = (this.user.role === 'admin') ? 'inline-block' : 'none';
            }
        } else {
            // 비로그인 / 로그아웃 상태
            if (this.dom.userMoneyDisplay) {
                this.dom.userMoneyDisplay.textContent = '0원';
            }
            if (this.dom.headerUserNickname) {
                this.dom.headerUserNickname.textContent = '로그인 필요';
            }
            if (this.dom.btnOpenProfile) {
                this.dom.btnOpenProfile.style.display = 'none';
            }
            if (this.dom.btnAuthAction) {
                this.dom.btnAuthAction.textContent = '로그인 / 회원가입';
            }
            if (this.dom.btnOpenAdmin) {
                this.dom.btnOpenAdmin.style.display = 'none';
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
            btnStandUp: document.getElementById('btnStandUp'),
            btnJoinGame: document.getElementById('btnJoinGame'),

            // 테이블 펠트 & 좌석
            seatsContainer: document.getElementById('seatsContainer'),
            tablePotValue: document.getElementById('tablePotValue'),
            tableStreetText: document.getElementById('tableStreetText'),
            winnerOverlay: document.getElementById('winnerOverlay'),
            winnerNameText: document.getElementById('winnerNameText'),
            winnerHandText: document.getElementById('winnerHandText'),
            winnerPrizeText: document.getElementById('winnerPrizeText'),

            // 참여 대기 전용 버튼 (중앙 & 하단)
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
            linkGoLogin: document.getElementById('linkGoLogin'),

            // 계정 찾기 모달
            findAccountModal: document.getElementById('findAccountModal'),
            btnCloseFindAccount: document.getElementById('btnCloseFindAccount'),
            linkGoFindAccount: document.getElementById('linkGoFindAccount'),
            linkBackToLoginFromFind: document.getElementById('linkBackToLoginFromFind'),
            tabFindId: document.getElementById('tabFindId'),
            tabFindPw: document.getElementById('tabFindPw'),
            formFindId: document.getElementById('formFindId'),
            findIdNickname: document.getElementById('findIdNickname'),
            findIdPhone: document.getElementById('findIdPhone'),
            formFindPw: document.getElementById('formFindPw'),
            findPwUsername: document.getElementById('findPwUsername'),

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
            btnAdminResetAllRooms: document.getElementById('btnAdminResetAllRooms'),

            loginErrorNotice: document.getElementById('loginErrorNotice'),
            registerErrorNotice: document.getElementById('registerErrorNotice'),
            findIdErrorNotice: document.getElementById('findIdErrorNotice'),
            findPwErrorNotice: document.getElementById('findPwErrorNotice'),

            // 커스텀 다이얼로그 모달 (URL 주소 없는 팝업)
            customAlertModal: document.getElementById('customAlertModal'),
            customAlertIcon: document.getElementById('customAlertIcon'),
            customAlertTitle: document.getElementById('customAlertTitle'),
            customAlertMessage: document.getElementById('customAlertMessage'),
            btnCustomAlertConfirm: document.getElementById('btnCustomAlertConfirm'),
            customConfirmModal: document.getElementById('customConfirmModal'),
            customConfirmTitle: document.getElementById('customConfirmTitle'),
            customConfirmMessage: document.getElementById('customConfirmMessage'),
            btnCustomConfirmCancel: document.getElementById('btnCustomConfirmCancel'),
            btnCustomConfirmOk: document.getElementById('btnCustomConfirmOk')
        };

        if (this.dom.btnCustomAlertConfirm) {
            this.dom.btnCustomAlertConfirm.addEventListener('click', () => {
                if (this.dom.customAlertModal) this.dom.customAlertModal.classList.remove('active');
            });
        }
    }

    // 커스텀 알림 모달 (브라우저 도메인 URL 메시지 일체 없음)
    showModalAlert(message, title = '알 림', icon = '👑') {
        const modal = this.dom && this.dom.customAlertModal ? this.dom.customAlertModal : document.getElementById('customAlertModal');
        const alertIcon = this.dom && this.dom.customAlertIcon ? this.dom.customAlertIcon : document.getElementById('customAlertIcon');
        const alertTitle = this.dom && this.dom.customAlertTitle ? this.dom.customAlertTitle : document.getElementById('customAlertTitle');
        const alertMsg = this.dom && this.dom.customAlertMessage ? this.dom.customAlertMessage : document.getElementById('customAlertMessage');

        if (modal) {
            if (alertIcon) alertIcon.textContent = icon;
            if (alertTitle) alertTitle.textContent = title;
            if (alertMsg) alertMsg.textContent = message;
            modal.classList.add('active');
        } else if (typeof window.__showCustomAlert === 'function') {
            window.__showCustomAlert(message, title, icon);
        } else {
            console.warn('[Alert Blocked]:', message);
        }
    }

    // 커스텀 확인 모달
    showModalConfirm(message, onConfirm, title = '확 인') {
        if (!this.dom || !this.dom.customConfirmModal) {
            if (onConfirm) onConfirm();
            return;
        }
        if (this.dom.customConfirmTitle) this.dom.customConfirmTitle.textContent = title;
        if (this.dom.customConfirmMessage) this.dom.customConfirmMessage.textContent = message;
        this.dom.customConfirmModal.classList.add('active');

        const onOk = () => {
            this.dom.customConfirmModal.classList.remove('active');
            cleanup();
            if (onConfirm) onConfirm();
        };
        const onCancel = () => {
            this.dom.customConfirmModal.classList.remove('active');
            cleanup();
        };
        const cleanup = () => {
            this.dom.btnCustomConfirmOk.removeEventListener('click', onOk);
            this.dom.btnCustomConfirmCancel.removeEventListener('click', onCancel);
        };
        this.dom.btnCustomConfirmOk.addEventListener('click', onOk);
        this.dom.btnCustomConfirmCancel.addEventListener('click', onCancel);
    }

    bindEvents() {
        // 로고 클릭 -> 로비로 이동
        this.dom.btnLogo.addEventListener('click', () => {
            if (this.currentEngine) this.leaveTable();
        });

        // 1,000만원 무료 리필
        this.dom.btnRefillMoney.addEventListener('click', () => {
            if (!this.user) {
                this.showModalAlert('로그인 후 무료 충전 혜택을 이용하실 수 있습니다.', '로그인 필요', '🔒');
                this.dom.loginModal.classList.add('active');
                return;
            }
            this.user.money += 10000000;
            this.saveUser(this.user);
            if (window.soundManager) window.soundManager.playWin();
            this.showModalAlert('🎉 회원 감사 10,000,000원의 게임머니가 무료 충전되었습니다!', '충전 완료', '💰');
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
            if (!this.user) {
                this.showModalAlert('게임방 개설은 로그인 후 이용 가능합니다.', '로그인 필요', '🔒');
                this.dom.loginModal.classList.add('active');
                return;
            }
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
            if (!this.user) {
                this.showModalAlert('게임에 참여하려면 먼저 로그인이 필요합니다.', '로그인 필요', '🔒');
                this.dom.loginModal.classList.add('active');
                return;
            }
            const res = this.currentEngine.reserveUserSeat(this.user);
            if (res.success) {
                if (window.soundManager) window.soundManager.playChip();
                this.renderTableState();
                this.showModalAlert('✅ 참석 대기가 완료되었습니다!\n진행 중인 판이 끝나면 다음 판에 즉시 착석되어 카드가 지급됩니다.', '참석 대기 접수', '⚡');
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
            if (!this.user) return;
            const newNick = this.dom.profNickname.value.trim();
            const newPass = this.dom.profNewPassword.value.trim();
            const res = window.authManager.updateProfile(this.user.id, newNick, newPass);
            if (res.success) {
                this.user = this.loadUser();
                this.updateUserUI();
                this.dom.profileModal.classList.remove('active');
                this.showModalAlert(res.message, '프로필 수정 완료', '✅');
            } else {
                this.showModalAlert(res.message, '수정 실패', '⚠️');
            }
        });

        // 로그인 / 로그아웃 버튼 (로그아웃 즉시 로그인 모달 표시)
        this.dom.btnAuthAction.addEventListener('click', () => {
            const current = window.authManager.getCurrentUser();
            if (current) {
                window.authManager.logout();
                this.user = null;
                this.updateUserUI();
                if (this.currentEngine) {
                    this.leaveTable();
                }
                this.dom.loginModal.classList.add('active');
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
        if (this.dom.linkGoLogin) {
            this.dom.linkGoLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.dom.registerModal.classList.remove('active');
                this.dom.loginModal.classList.add('active');
            });
        }

        // 아이디 / 비밀번호 찾기 모달 열기
        if (this.dom.linkGoFindAccount) {
            this.dom.linkGoFindAccount.addEventListener('click', (e) => {
                e.preventDefault();
                this.dom.loginModal.classList.remove('active');
                this.dom.findAccountModal.classList.add('active');
            });
        }
        if (this.dom.btnCloseFindAccount) {
            this.dom.btnCloseFindAccount.addEventListener('click', () => {
                this.dom.findAccountModal.classList.remove('active');
            });
        }
        if (this.dom.linkBackToLoginFromFind) {
            this.dom.linkBackToLoginFromFind.addEventListener('click', (e) => {
                e.preventDefault();
                this.dom.findAccountModal.classList.remove('active');
                this.dom.loginModal.classList.add('active');
            });
        }

        // 아이디/비밀번호 찾기 모달 내 탭 전환
        if (this.dom.tabFindId && this.dom.tabFindPw) {
            this.dom.tabFindId.addEventListener('click', () => {
                this.dom.tabFindId.style.background = 'var(--gold-gradient)';
                this.dom.tabFindId.style.color = '#000';
                this.dom.tabFindId.style.fontWeight = '800';
                this.dom.tabFindPw.style.background = 'rgba(255,255,255,0.08)';
                this.dom.tabFindPw.style.color = '#fff';
                this.dom.tabFindPw.style.fontWeight = 'normal';
                this.dom.formFindId.style.display = 'block';
                this.dom.formFindPw.style.display = 'none';
            });
            this.dom.tabFindPw.addEventListener('click', () => {
                this.dom.tabFindPw.style.background = 'var(--gold-gradient)';
                this.dom.tabFindPw.style.color = '#000';
                this.dom.tabFindPw.style.fontWeight = '800';
                this.dom.tabFindId.style.background = 'rgba(255,255,255,0.08)';
                this.dom.tabFindId.style.color = '#fff';
                this.dom.tabFindId.style.fontWeight = 'normal';
                this.dom.formFindId.style.display = 'none';
                this.dom.formFindPw.style.display = 'block';
            });
        }

        // 1. 아이디 찾기 폼 제출
        if (this.dom.formFindId) {
            this.dom.formFindId.addEventListener('submit', (e) => {
                e.preventDefault();
                if (this.dom.findIdErrorNotice) this.dom.findIdErrorNotice.style.display = 'none';
                const nick = this.dom.findIdNickname.value.trim();
                const phone = this.dom.findIdPhone ? this.dom.findIdPhone.value.trim() : '';
                const res = window.authManager.findUsername(nick, phone);
                if (res.success) {
                    this.showModalAlert(`조회 결과 회원님의 아이디(이메일)는 다음과 같습니다:\n\n👉 [ ${res.maskedUsername} ]`, '아이디 찾기 결과', '🔍');
                } else {
                    if (this.dom.findIdErrorNotice) {
                        this.dom.findIdErrorNotice.textContent = res.message;
                        this.dom.findIdErrorNotice.style.display = 'block';
                    }
                    this.showModalAlert(res.message, '조회 실패', '⚠️');
                }
            });
        }

        // 2. 비밀번호 찾기 (이메일 발송 시뮬레이션) 폼 제출
        if (this.dom.formFindPw) {
            this.dom.formFindPw.addEventListener('submit', (e) => {
                e.preventDefault();
                if (this.dom.findPwErrorNotice) this.dom.findPwErrorNotice.style.display = 'none';
                const u = this.dom.findPwUsername.value.trim();
                const res = window.authManager.issueTemporaryPassword(u);
                if (res.success) {
                    this.showModalAlert(`📧 입력하신 아이디(이메일) [${res.username}]로 임시 비밀번호가 안전하게 발송되었습니다!\n\n임시 비밀번호: [ ${res.tempPassword} ]\n로그인 후 프로필 관리에서 새 비밀번호로 변경해 주세요.`, '이메일 발송 완료', '✉️');
                    this.dom.findAccountModal.classList.remove('active');
                    this.dom.loginModal.classList.add('active');
                } else {
                    if (this.dom.findPwErrorNotice) {
                        this.dom.findPwErrorNotice.textContent = res.message;
                        this.dom.findPwErrorNotice.style.display = 'block';
                    }
                    this.showModalAlert(res.message, '발급 실패', '⚠️');
                }
            });
        }

        // 회원가입 폼 제출
        this.dom.formRegister.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.dom.registerErrorNotice) this.dom.registerErrorNotice.style.display = 'none';
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
                this.showModalAlert(`🎉 ${res.message}\n환영합니다, [${nick}]님! (1,000만 원 지급 완료)`, '회원가입 완료', '👑');
            } else {
                if (this.dom.registerErrorNotice) {
                    this.dom.registerErrorNotice.textContent = res.message;
                    this.dom.registerErrorNotice.style.display = 'block';
                }
                this.showModalAlert(res.message, '가입 실패', '⚠️');
            }
        });

        // 로그인 모달 닫기
        this.dom.btnCloseLogin.addEventListener('click', () => {
            this.dom.loginModal.classList.remove('active');
        });

        // 로그인 폼 제출
        this.dom.formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.dom.loginErrorNotice) this.dom.loginErrorNotice.style.display = 'none';
            const u = this.dom.loginUsername.value.trim();
            const p = this.dom.loginPassword.value;

            const res = window.authManager.login(u, p);
            if (res.success) {
                this.user = this.loadUser();
                this.updateUserUI();
                this.dom.loginModal.classList.remove('active');
                this.showModalAlert(`반갑습니다, [${res.user.nickname}]님!\n즐거운 7포커 게임 되십시오.`, '로그인 성공', '👋');
            } else {
                if (this.dom.loginErrorNotice) {
                    this.dom.loginErrorNotice.textContent = res.message;
                    this.dom.loginErrorNotice.style.display = 'block';
                }
                this.showModalAlert(res.message, '로그인 실패', '⚠️');
            }
        });

        // 어드민 대시보드 열기
        this.dom.btnOpenAdmin.addEventListener('click', () => {
            if (!window.authManager.isAdmin()) {
                this.showModalAlert('관리자 권한이 없습니다.', '접근 제한', '🚫');
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
            this.showModalConfirm('모든 기본 게임방을 초기화하고 재시작하시겠습니까?', () => {
                window.roomManager.initDefaultRooms();
                this.renderAdminRooms();
                this.showModalAlert('10개 게임방이 성공적으로 리셋되었습니다.', '리셋 완료', '🔄');
            }, '방 초기화 확인');
        });
    }

    // 어드민: 회원 관리 렌더링
    renderAdminUsers() {
        const users = window.authManager.getUsers();
        this.dom.adminUserTableBody.innerHTML = '';

        users.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${u.username}</td>
                <td><strong>${u.nickname}</strong></td>
                <td><span class="${u.role === 'admin' ? 'badge-admin' : 'badge-user'}">${u.role === 'admin' ? '관리자' : '일반회원'}</span></td>
                <td style="color: var(--gold-bright); font-weight: 800;">${u.money.toLocaleString()}원</td>
                <td>${u.isBlocked ? '<span style="color:#ff4757; font-weight:800;">이용정지</span>' : '<span style="color:#2ed573;">정상</span>'}</td>
                <td>
                    <button class="btn-admin-action btn-admin-add" data-id="${u.id}" data-act="add1000">+1천만</button>
                    <button class="btn-admin-action btn-admin-add" data-id="${u.id}" data-act="add1억">+1억</button>
                    <button class="btn-admin-action btn-admin-sub" data-id="${u.id}" data-act="sub1000">-1천만</button>
                    <button class="btn-admin-action btn-admin-block" data-id="${u.id}" data-act="toggleBlock">${u.isBlocked ? '해제' : '정지'}</button>
                    ${u.role !== 'admin' ? `<button class="btn-admin-action btn-admin-block" data-id="${u.id}" data-act="delete" style="background:#333;">탈퇴</button>` : ''}
                </td>
            `;

            tr.querySelectorAll('.btn-admin-action').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    const act = btn.getAttribute('data-act');

                    if (act === 'add1000') window.authManager.adminAdjustMoney(id, 10000000);
                    else if (act === 'add1억') window.authManager.adminAdjustMoney(id, 100000000);
                    else if (act === 'sub1000') window.authManager.adminAdjustMoney(id, -10000000);
                    else if (act === 'toggleBlock') window.authManager.adminToggleBlock(id);
                    else if (act === 'delete') {
                        this.showModalConfirm(`회원 [${u.nickname}]을 정말 강제 탈퇴시키겠습니까?`, () => {
                            window.authManager.adminDeleteUser(id);
                            this.user = this.loadUser();
                            this.updateUserUI();
                            this.renderAdminUsers();
                            this.showModalAlert(`회원 [${u.nickname}]이 탈퇴 처리되었습니다.`, '탈퇴 완료', '🗑️');
                        }, '강제 탈퇴 확인');
                        return;
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
            const card = document.createElement('div');
            card.style.background = 'rgba(255,255,255,0.04)';
            card.style.border = '1px solid rgba(255,255,255,0.08)';
            card.style.padding = '12px 16px';
            card.style.borderRadius = '12px';
            card.style.display = 'flex';
            card.style.justifyContent = 'space-between';
            card.style.alignItems = 'center';

            card.innerHTML = `
                <div>
                    <span style="color: #fff; font-weight: 800;">${r.name}</span>
                    <span style="font-size: 12px; color: var(--gold-bright); margin-left: 8px;">(시드: ${r.seedMoney.toLocaleString()}원)</span>
                    <div style="font-size: 12px; color: var(--text-dim); margin-top: 4px;">
                        참여인원: ${r.playerCount}/${r.maxPlayers}명 | 스트리트: ${r.street === 0 ? '대기' : r.street + '구'} | 누적 팟: ${r.pot.toLocaleString()}원
                    </div>
                </div>
                <button class="btn-enter-room" data-room="${r.id}" style="padding: 5px 12px; font-size: 12px;">입장 모니터링</button>
            `;

            card.querySelector('.btn-enter-room').addEventListener('click', () => {
                this.dom.adminModal.classList.remove('active');
                this.enterTable(r.id);
            });

            this.dom.adminRoomsListContainer.appendChild(card);
        });
    }

    // 로비 방 목록 렌더링
    renderLobby() {
        const rooms = window.roomManager.getRoomList();
        this.dom.roomListGrid.innerHTML = '';

        rooms.forEach(room => {
            const card = document.createElement('div');
            card.className = 'room-card';

            let streetLabel = '게임 대기 중';
            if (room.street === 3) streetLabel = '3구 초이스';
            else if (room.street > 3) streetLabel = `${room.street}구 배팅`;

            card.innerHTML = `
                <div>
                    <div class="room-card-header">
                        <div class="room-title">${room.name}</div>
                        <span class="room-players-badge">${room.playerCount}/${room.maxPlayers}명</span>
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
                    <span class="street-badge">${streetLabel}</span>
                    <button class="btn-enter-room" data-room="${room.id}">입장하기 →</button>
                </div>
            `;

            card.querySelector('.btn-enter-room').addEventListener('click', () => {
                this.enterTable(room.id);
            });

            this.dom.roomListGrid.appendChild(card);
        });
    }

    // 테이블 뷰로 진입
    enterTable(roomId) {
        const engine = window.roomManager.getRoom(roomId);
        if (!engine) return;

        this.currentEngine = engine;
        engine.setBackground(false);

        this.dom.lobbyView.style.display = 'none';
        this.dom.tableView.style.display = 'block';

        this.dom.tableRoomTitle.textContent = engine.roomName;
        this.dom.tableRoomSeed.textContent = engine.seedMoney.toLocaleString() + '원';
        this.dom.tableRoomMax.textContent = engine.maxPlayers + '인 룸';

        engine.onUpdate = (state) => {
            this.renderTableState(state);
        };

        this.renderTableState(engine.getState());
    }

    // 로비로 퇴장
    leaveTable() {
        if (this.currentEngine) {
            this.currentEngine.setBackground(true);
            this.currentEngine.onUpdate = null;
            this.currentEngine = null;
        }

        this.dom.tableView.style.display = 'none';
        this.dom.lobbyView.style.display = 'block';
        this.renderLobby();
    }

    getUserPlayer() {
        if (!this.currentEngine || !this.user) return null;
        return this.currentEngine.players.find(p => p && p.id === this.user.id) || null;
    }

    // 테이블 실시간 UI 업데이트
    renderTableState(state = null) {
        if (!this.currentEngine) return;
        if (!state) state = this.currentEngine.getState();

        this.dom.tablePotValue.textContent = state.pot.toLocaleString() + '원';

        let streetText = '판 시작 준비';
        if (state.phase === 'CHOICE_OPEN') streetText = '3구 오픈 선택 중...';
        else if (state.street >= 3) streetText = `${state.street}구 스트리트 배팅`;
        if (state.phase === 'SHOWDOWN') streetText = '쇼다운 (결과 발표)';
        this.dom.tableStreetText.textContent = streetText;

        const userPlayer = this.getUserPlayer();
        this.updateJoinButtons(userPlayer);
        this.renderSeats(state, userPlayer);
        this.updateBettingControls(state, userPlayer);

        if (state.phase === 'SHOWDOWN' && state.winnerInfo) {
            this.showWinnerOverlay(state.winnerInfo);
        } else {
            this.dom.winnerOverlay.style.display = 'none';
        }

        if (userPlayer) {
            this.user.money = userPlayer.money;
            this.saveUser(this.user);
        }
    }

    // 참여 대기 버튼 토글 (플레이어 상태에 따라)
    updateJoinButtons(userPlayer) {
        if (userPlayer) {
            if (this.dom.btnJoinGame) this.dom.btnJoinGame.style.display = 'none';
            if (this.dom.tableCenterJoinContainer) this.dom.tableCenterJoinContainer.style.display = 'none';
            if (this.dom.bottomJoinBanner) this.dom.bottomJoinBanner.style.display = 'none';
            if (this.dom.actionButtonsGroup) this.dom.actionButtonsGroup.style.display = 'grid';
            if (this.dom.btnStandUp) this.dom.btnStandUp.style.display = 'inline-flex';
        } else {
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

        const centerX = 50;
        const centerY = 50;
        const radiusX = 41;
        const radiusY = 32;

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

                if (isChoiceMode) {
                    const cardElements = seatSpot.querySelectorAll('.poker-card');
                    cardElements.forEach((el, cardIndex) => {
                        el.addEventListener('click', () => {
                            if (window.soundManager) window.soundManager.playCardFlip();
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

        // 🔥 모든 카드가 한꺼번에 깜빡이지 않고 순서대로 1장씩 착-착 오픈되도록 스태거 딜레이 부여
        const animDelay = (cardIndex * 0.14).toFixed(2);
        const styleAttr = `style="transform: rotate(${rotateDeg}deg) translateY(${translateYPx}px); z-index: ${cardIndex + 1}; animation-delay: ${animDelay}s;"`;

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
        if (!this.user) {
            this.showModalAlert('착석하여 플레이하려면 로그인이 필요합니다.', '로그인 필요', '🔒');
            this.dom.loginModal.classList.add('active');
            return;
        }
        if (this.getUserPlayer()) {
            this.showModalAlert('이미 테이블에 참여하고 계십니다.', '안내', '🪑');
            return;
        }
        if (this.user.money < this.currentEngine.seedMoney) {
            this.showModalAlert('보유 머니가 부족합니다! 상단에서 1,000만원 무료 충전을 받아주세요.', '잔액 부족', '💰');
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
        const isMyTurn = isMySeat && (state.activePlayerIndex === userPlayer.seatIndex) && !userPlayer.isFolded && !userPlayer.isAllIn && (state.phase === 'STREET_BET');

        if (!isMySeat) {
            this.dom.userHandEvalText.textContent = '내 패: 관전 모드';
            this.dom.userSeatNotice.textContent = '👉 [참석 대기]를 누르면 다음 판부터 즉시 참여할 수 있습니다.';
            this.disableAllBetButtons();
            return;
        }

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

        const myBet = userPlayer.currentRoundBet || 0;
        const callNeed = state.currentBet - myBet;
        const pot = state.pot;
        const minBet = state.seedMoney;

        this.dom.btnFold.disabled = false;
        this.dom.btnAllIn.disabled = false;

        this.dom.btnCheckCall.disabled = false;
        if (callNeed === 0) {
            this.dom.txtCheckCall.textContent = userPlayer.isBoss ? '삥 (체크)' : '체크';
            this.dom.subCheckCall.textContent = '0원';
        } else {
            this.dom.txtCheckCall.textContent = '콜';
            this.dom.subCheckCall.textContent = `${Math.min(userPlayer.money, callNeed).toLocaleString()}원`;
        }

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

        // 🔥 내 턴(차례) 및 배팅 스트리트 상태(STREET_BET) 여부 완벽 검증 -> 내 턴이 아니면 클릭 절대 차단!
        const state = this.currentEngine;
        const isMyTurn = (state.activePlayerIndex === userPlayer.seatIndex) && !userPlayer.isFolded && !userPlayer.isAllIn && (state.phase === 'STREET_BET');
        if (!isMyTurn) {
            return;
        }

        // 유저 배팅 버튼 클릭 시 전용 보이스 및 사운드 즉시 재생
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

    // 쇼다운 승자 안내 오버레이
    showWinnerOverlay(info) {
        this.dom.winnerNameText.textContent = info.winner.name;
        this.dom.winnerHandText.textContent = `${info.handResult.name} 승리!`;
        this.dom.winnerPrizeText.textContent = `+${info.prize.toLocaleString()}원 획득`;
        this.dom.winnerOverlay.style.display = 'block';

        if (window.soundManager && this.user && info.winner.id === this.user.id) {
            window.soundManager.playWin();
        }
    }
}

// 애플리케이션 시작
window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
