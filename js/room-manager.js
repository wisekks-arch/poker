// js/room-manager.js - 기본 10개 게임방 자동 시뮬레이션 및 유저 방 생성 관리

class RoomManager {
    constructor() {
        this.rooms = new Map();
        this.activeRoomId = null;
        this.currentUser = null;
        this.initDefaultRooms();
    }

    // 기본 10개 게임방 생성 및 자동 게임 시뮬레이션 시작 (전체 6인 제한)
    initDefaultRooms() {
        const defaultConfigs = [
            { id: 'room_1', name: '초보자 환영 6인방', maxPlayers: 6, seedMoney: 10000 },
            { id: 'room_2', name: '실속파 6인 스피드룸', maxPlayers: 6, seedMoney: 30000 },
            { id: 'room_3', name: '정통 6인 챔피언십', maxPlayers: 6, seedMoney: 50000 },
            { id: 'room_4', name: '타짜들의 격전지 6인방', maxPlayers: 6, seedMoney: 50000 },
            { id: 'room_5', name: '골드 하이롤러 6인룸', maxPlayers: 6, seedMoney: 100000 },
            { id: 'room_6', name: 'VIP 로얄 라운지 6인', maxPlayers: 6, seedMoney: 200000 },
            { id: 'room_7', name: '한방 승부 6인 대격돌', maxPlayers: 6, seedMoney: 100000 },
            { id: 'room_8', name: '마카오 특설 6인 테이블', maxPlayers: 6, seedMoney: 300000 },
            { id: 'room_9', name: '라스베가스 프리미엄 6인', maxPlayers: 6, seedMoney: 500000 },
            { id: 'room_10', name: '천하제일 포커왕 6인', maxPlayers: 6, seedMoney: 500000 }
        ];

        for (const cfg of defaultConfigs) {
            const engine = new PokerGameEngine({
                roomId: cfg.id,
                roomName: cfg.name,
                maxPlayers: 6,
                seedMoney: cfg.seedMoney,
                isBackground: true // 기본은 백그라운드 고속 회전
            });
            engine.fillWithBots();
            engine.startLoop();
            this.rooms.set(cfg.id, engine);
        }
    }

    // 새 게임방 생성 (유저 개설 - 최대 6인 제한)
    createRoom(name, maxPlayers, seedMoney) {
        const roomId = 'user_room_' + Date.now();
        const validMax = Math.min(6, Math.max(4, parseInt(maxPlayers) || 6));
        const engine = new PokerGameEngine({
            roomId: roomId,
            roomName: name || '회원 전용 6인방',
            maxPlayers: validMax,
            seedMoney: parseInt(seedMoney) || 50000,
            isBackground: true
        });

        // 빈자리를 봇들로 초기 채움 (플레이어 참여 유도)
        engine.fillWithBots();
        engine.startLoop();
        this.rooms.set(roomId, engine);
        return engine;
    }

    // 모든 방 목록 요약 데이터 반환 (로비 화면 렌더링용)
    getRoomList() {
        const list = [];
        for (const [id, engine] of this.rooms.entries()) {
            const state = engine.getState();
            const activePlayerCount = state.players.filter(p => p !== null).length;
            
            let streetText = '대기 중';
            if (state.street === 3) streetText = '3구(초이스)';
            else if (state.street === 4) streetText = '4구 배팅';
            else if (state.street === 5) streetText = '5구 배팅';
            else if (state.street === 6) streetText = '6구 배팅';
            else if (state.street === 7) streetText = '7구(리버)';
            else if (state.street === 8) streetText = '쇼다운!';

            list.push({
                id: state.roomId,
                name: state.roomName,
                maxPlayers: state.maxPlayers,
                currentPlayers: activePlayerCount,
                playerCount: activePlayerCount,
                seedMoney: state.seedMoney,
                pot: state.pot,
                street: state.street,
                streetText: streetText,
                isFull: activePlayerCount >= state.maxPlayers
            });
        }
        return list;
    }

    // 단일 게임방 엔진 가져오기
    getRoom(roomId) {
        return this.rooms.get(roomId) || null;
    }

    // 방 입장
    enterRoom(roomId, user) {
        const engine = this.rooms.get(roomId);
        if (!engine) return null;

        // 기존 액티브 방이 있으면 백그라운드 모드로 전환
        if (this.activeRoomId && this.activeRoomId !== roomId) {
            const prevEngine = this.rooms.get(this.activeRoomId);
            if (prevEngine) {
                prevEngine.isBackground = true;
            }
        }

        this.activeRoomId = roomId;
        this.currentUser = user;
        engine.isBackground = false; // 현재 보는 방은 정규 딜레이로 감상/플레이

        return engine;
    }

    // 방 퇴장
    leaveRoom() {
        if (!this.activeRoomId) return;
        const engine = this.rooms.get(this.activeRoomId);
        if (engine) {
            // 유저가 앉아있었다면 퇴장 처리
            const userSeat = engine.players.findIndex(p => p && !p.isBot);
            if (userSeat >= 0) {
                engine.standUser(userSeat);
            }
            engine.isBackground = true;
        }
        this.activeRoomId = null;
    }

    getActiveEngine() {
        return this.rooms.get(this.activeRoomId) || null;
    }
}

window.roomManager = new RoomManager();
