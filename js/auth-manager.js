// js/auth-manager.js - 회원가입, 닉네임, 개인정보관리, 어드민 권한 및 회원 DB 관리 엔진

class AuthManager {
    constructor() {
        this.DB_KEY = 'royal_poker_users_db_v1';
        this.SESSION_KEY = 'royal_poker_auth_session_v1';
        this.initDatabase();
    }

    // 초기 회원 DB 설정 (관리자 계정 기본 포함)
    initDatabase() {
        let users = this.getUsers();
        if (!users || users.length === 0) {
            users = [
                {
                    id: 'admin',
                    username: 'admin',
                    password: 'admin777!',
                    nickname: '총괄관리자',
                    phone: '010-0000-0000',
                    money: 1000000000, // 10억
                    role: 'admin',
                    isBlocked: false,
                    gamesPlayed: 0,
                    gamesWon: 0,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 'user_default',
                    username: 'vip_player',
                    password: '1234',
                    nickname: '골드포커왕',
                    phone: '010-1234-5678',
                    money: 10000000, // 기본 1천만원
                    role: 'user',
                    isBlocked: false,
                    gamesPlayed: 0,
                    gamesWon: 0,
                    createdAt: new Date().toISOString()
                }
            ];
            this.saveUsers(users);
        }

        // 세션이 없으면 기본 회원으로 로그인 세션 생성
        if (!this.getCurrentUser()) {
            const defaultUser = users.find(u => u.username === 'vip_player') || users[0];
            this.setSession(defaultUser);
        }
    }

    getUsers() {
        try {
            const data = localStorage.getItem(this.DB_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    saveUsers(users) {
        localStorage.setItem(this.DB_KEY, JSON.stringify(users));
    }

    getCurrentUser() {
        try {
            const data = localStorage.getItem(this.SESSION_KEY);
            if (!data) return null;
            const session = JSON.parse(data);
            // 최신 DB 정보 동기화
            const users = this.getUsers();
            const latest = users.find(u => u.id === session.id);
            return latest || session;
        } catch (e) {
            return null;
        }
    }

    setSession(user) {
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
    }

    logout() {
        localStorage.removeItem(this.SESSION_KEY);
    }

    // 회원가입 (1,000만원 기본 지급)
    register(username, password, nickname, phone = '') {
        const users = this.getUsers();

        if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
            return { success: false, message: '이미 존재하는 아이디입니다.' };
        }
        if (users.some(u => u.nickname.toLowerCase() === nickname.toLowerCase())) {
            return { success: false, message: '이미 사용 중인 닉네임입니다.' };
        }

        const newUser = {
            id: 'user_' + Date.now(),
            username: username.trim(),
            password: password,
            nickname: nickname.trim(),
            phone: phone.trim() || '미등록',
            money: 10000000, // 기본 머니 1,000만원 즉시 지급
            role: 'user',
            isBlocked: false,
            gamesPlayed: 0,
            gamesWon: 0,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        this.saveUsers(users);
        this.setSession(newUser);

        return { success: true, user: newUser, message: '회원가입이 완료되었습니다! 10,000,000원이 지급되었습니다.' };
    }

    // 로그인
    login(username, password) {
        const users = this.getUsers();
        const user = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());

        if (!user) {
            return { success: false, message: '등록되지 않은 아이디입니다.' };
        }
        if (user.password !== password) {
            return { success: false, message: '비밀번호가 일치하지 않습니다.' };
        }
        if (user.isBlocked) {
            return { success: false, message: '관리자에 의해 이용이 정지된 계정입니다.' };
        }

        this.setSession(user);
        return { success: true, user: user };
    }

    // 개인정보 수정 (내 닉네임 / 비밀번호 변경)
    updateProfile(userId, newNickname, newPassword = null) {
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) return { success: false, message: '사용자를 찾을 수 없습니다.' };

        // 닉네임 중복 체크 (본인 제외)
        if (newNickname && newNickname.trim() !== users[userIndex].nickname) {
            if (users.some(u => u.id !== userId && u.nickname.toLowerCase() === newNickname.trim().toLowerCase())) {
                return { success: false, message: '이미 존재하는 닉네임입니다.' };
            }
            users[userIndex].nickname = newNickname.trim();
        }

        if (newPassword && newPassword.trim().length >= 4) {
            users[userIndex].password = newPassword.trim();
        }

        this.saveUsers(users);
        this.setSession(users[userIndex]);
        return { success: true, user: users[userIndex], message: '개인정보가 성공적으로 수정되었습니다.' };
    }

    // 유저 보유 머니 업데이트 (게임 진행 후 동기화)
    updateMoney(userId, newMoney) {
        const users = this.getUsers();
        const user = users.find(u => u.id === userId);
        if (user) {
            user.money = Math.max(0, newMoney);
            this.saveUsers(users);
            if (this.getCurrentUser() && this.getCurrentUser().id === userId) {
                this.setSession(user);
            }
        }
    }

    // ==========================================================
    // 전체관리자(Admin) 권한 기능
    // ==========================================================
    isAdmin() {
        const current = this.getCurrentUser();
        return current && current.role === 'admin';
    }

    // 관리자: 회원 머니 직접 지급/차감
    adminAdjustMoney(userId, adjustAmount) {
        if (!this.isAdmin()) return { success: false, message: '관리자 권한이 없습니다.' };

        const users = this.getUsers();
        const user = users.find(u => u.id === userId);
        if (!user) return { success: false, message: '회원을 찾을 수 없습니다.' };

        user.money = Math.max(0, user.money + adjustAmount);
        this.saveUsers(users);

        if (this.getCurrentUser().id === userId) {
            this.setSession(user);
        }

        return { success: true, user: user, message: `회원 [${user.nickname}]의 머니가 조정되었습니다.` };
    }

    // 관리자: 회원 차단/해제 토글
    adminToggleBlock(userId) {
        if (!this.isAdmin()) return { success: false, message: '관리자 권한이 없습니다.' };

        const users = this.getUsers();
        const user = users.find(u => u.id === userId);
        if (!user) return { success: false, message: '회원을 찾을 수 없습니다.' };
        if (user.role === 'admin') return { success: false, message: '관리자 계정은 차단할 수 없습니다.' };

        user.isBlocked = !user.isBlocked;
        this.saveUsers(users);
        return { success: true, isBlocked: user.isBlocked };
    }

    // 관리자: 회원 강제 탈퇴
    adminDeleteUser(userId) {
        if (!this.isAdmin()) return { success: false, message: '관리자 권한이 없습니다.' };

        let users = this.getUsers();
        const user = users.find(u => u.id === userId);
        if (!user) return { success: false, message: '회원을 찾을 수 없습니다.' };
        if (user.role === 'admin') return { success: false, message: '관리자 계정은 삭제할 수 없습니다.' };

        users = users.filter(u => u.id !== userId);
        this.saveUsers(users);
        return { success: true, message: '회원이 삭제되었습니다.' };
    }

    // 로그아웃
    logout() {
        try {
            localStorage.removeItem(this.SESSION_KEY);
        } catch (e) { }
        return true;
    }

    // 1. 아이디(이메일) 찾기 (닉네임 + 연락처로 검색)
    findUsername(nickname, phone) {
        const users = this.getUsers();
        const user = users.find(u =>
            u.nickname.toLowerCase() === (nickname || '').trim().toLowerCase() &&
            (!phone || phone.trim() === '' || u.phone.replace(/[^0-9]/g, '') === phone.replace(/[^0-9]/g, ''))
        );

        if (!user) {
            return { success: false, message: '입력하신 정보와 일치하는 회원 아이디를 찾을 수 없습니다.' };
        }

        // 아이디 앞 3글자 외 마스킹 처리 (보안)
        const u = user.username;
        let masked = u;
        if (u.includes('@')) {
            const [local, domain] = u.split('@');
            masked = local.slice(0, 3) + '***@' + domain;
        } else if (u.length > 4) {
            masked = u.slice(0, 3) + '***' + u.slice(-1);
        }

        return { success: true, username: user.username, maskedUsername: masked };
    }

    // 2. 비밀번호 찾기 (아이디/이메일로 임시 비밀번호 발급 및 이메일 발송 시뮬레이션)
    issueTemporaryPassword(username) {
        const users = this.getUsers();
        const user = users.find(u => u.username.toLowerCase() === (username || '').trim().toLowerCase());

        if (!user) {
            return { success: false, message: '등록되지 않은 아이디(이메일)입니다. 확인 후 다시 입력해 주세요.' };
        }

        // 영문 대소문자 + 숫자 조합의 6자리 임시 비밀번호 생성
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
        let tempPassword = '';
        for (let i = 0; i < 6; i++) {
            tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // 유저 비밀번호를 임시 비밀번호로 갱신
        user.password = tempPassword;
        this.saveUsers(users);

        return {
            success: true,
            username: user.username,
            tempPassword: tempPassword,
            message: `등록하신 아이디(이메일) [${user.username}]로 임시 비밀번호가 안전하게 발송되었습니다.`
        };
    }
}

window.authManager = new AuthManager();
