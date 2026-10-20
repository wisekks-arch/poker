// js/ai-bot.js - 세븐포커 AI 봇 지능형 배팅 & 플레이 로직

const BOT_NAMES = [
    '강남타짜', '로얄에이스', '베가스잭', '포커신사', '홀덤마스터',
    '승부사최씨', '다이아퀸', '황금손길', '블러핑달인', '상어이선생',
    '마카오박', '제주돌고래', '카지노왕', '텍사스카우보이', '스페이드에이'
];

const BOT_AVATARS = ['👨‍💼', '👩‍💼', '🤠', '🕵️‍♂️', '🦹‍♂️', '🤵', '👸', '🧔', '🧑‍🚀', '💂‍♂️'];

class BotPlayer {
    static getRandomProfile(index) {
        const name = BOT_NAMES[(index || 0) % BOT_NAMES.length] + (index >= BOT_NAMES.length ? `_${index}` : '');
        const avatar = BOT_AVATARS[(index || 0) % BOT_AVATARS.length];
        const personalities = ['aggressive', 'cautious', 'balanced', 'bluffer'];
        const style = personalities[Math.floor(Math.random() * personalities.length)];
        return { name, avatar, style };
    }

    // 3구 처음 받았을 때 3장 중 어떤 카드를 오픈할지 선택 (전략)
    static chooseOpenCard(cards, style = 'balanced') {
        if (!cards || cards.length < 3) return 0;

        // 원페어가 있는 경우 페어 중 하나를 오픈하여 위협하거나, 페어를 숨기기 위해 다른 카드를 오픈
        const ranks = cards.map(c => c.rank.value);
        let pairVal = null;
        for (let i = 0; i < 3; i++) {
            for (let j = i + 1; j < 3; j++) {
                if (ranks[i] === ranks[j]) pairVal = ranks[i];
            }
        }

        if (pairVal !== null) {
            if (style === 'aggressive' || style === 'bluffer') {
                // 페어 중 1장을 당당하게 오픈
                const pairIndex = cards.findIndex(c => c.rank.value === pairVal);
                return pairIndex >= 0 ? pairIndex : 0;
            } else {
                // 페어를 감추고 엉뚱한 카드를 오픈 (히든 트랩)
                const singleIndex = cards.findIndex(c => c.rank.value !== pairVal);
                return singleIndex >= 0 ? singleIndex : 0;
            }
        }

        // 노페어인 경우: 공격형은 높은 카드(A, K 등) 오픈, 신중형은 중간 카드 오픈
        if (style === 'aggressive') {
            let maxIdx = 0;
            for (let i = 1; i < 3; i++) {
                if (cards[i].rank.value > cards[maxIdx].rank.value) maxIdx = i;
            }
            return maxIdx;
        } else {
            // 중간 카드 오픈
            const sortedIdx = [0, 1, 2].sort((a, b) => cards[a].rank.value - cards[b].rank.value);
            return sortedIdx[1];
        }
    }

    // 배팅 차례에서 행동 결정 (삥, 체크, 따당, 쿼터, 하프, 풀, 콜, 다이)
    static decideAction(player, gameState) {
        const { currentBet, minBet, pot, street } = gameState;
        const myBet = player.currentRoundBet || 0;
        const callAmount = currentBet - myBet;
        const handEval = PokerEvaluator.evaluateBestHand(player.hand);
        const rankValue = (handEval.rankInfo && handEval.rankInfo.rank) || 0;
        const highCardVal = (handEval.highCard && handEval.highCard.rank && handEval.highCard.rank.value) || 0;

        // 칩이 콜 금액보다 적으면 올인 또는 다이
        if (player.money <= callAmount) {
            if (rankValue >= 2 || (street >= 6 && rankValue >= 1)) {
                return { action: 'allin', amount: player.money };
            }
            if (callAmount === 0) return { action: 'check', amount: 0 };
            return Math.random() < 0.4 ? { action: 'allin', amount: player.money } : { action: 'fold', amount: 0 };
        }

        // 아무도 배팅을 안 한 상태 (callAmount === 0: 선/보스 또는 앞사람 체크)
        if (callAmount === 0) {
            // 패가 좋은 경우 (투페어 이상이거나 높은 원페어)
            if (rankValue >= 2 || (rankValue === 1 && highCardVal >= 10)) {
                const betTypeRoll = Math.random();
                if (betTypeRoll < 0.4) {
                    // 하프 배팅
                    const halfAmount = Math.max(minBet, Math.floor(pot * 0.5));
                    return { action: 'half', amount: Math.min(player.money, halfAmount) };
                } else if (betTypeRoll < 0.7) {
                    // 쿼터 배팅
                    const quarterAmount = Math.max(minBet, Math.floor(pot * 0.25));
                    return { action: 'quarter', amount: Math.min(player.money, quarterAmount) };
                } else {
                    // 따당/삥
                    return { action: 'bet', amount: Math.min(player.money, minBet) };
                }
            }

            // 블러핑 확률 (15%)
            if (player.style === 'bluffer' && Math.random() < 0.3) {
                return { action: 'half', amount: Math.min(player.money, Math.floor(pot * 0.5)) };
            }

            // 기본은 삥/체크
            return { action: 'check', amount: 0 };
        }

        // 앞사람이 배팅/레이즈를 한 상태 (callAmount > 0)
        // 1. 강한 패 (트리플, 풀하우스, 플러시, 스트레이트 이상)
        if (rankValue >= 3) {
            const r = Math.random();
            if (r < 0.5 && player.money >= callAmount * 2) {
                // 레이즈 (하프)
                const raiseAmount = Math.min(player.money, callAmount + Math.floor(pot * 0.5));
                return { action: 'raise', amount: raiseAmount };
            }
            return { action: 'call', amount: callAmount };
        }

        // 2. 중간 패 (투페어 또는 높은 원페어)
        if (rankValue === 2 || (rankValue === 1 && highCardVal >= 11)) {
            // 콜 비용이 판돈 대비 너무 크지 않으면 콜
            if (callAmount <= pot * 0.6 || street <= 5) {
                return { action: 'call', amount: callAmount };
            }
            return Math.random() < 0.65 ? { action: 'call', amount: callAmount } : { action: 'fold', amount: 0 };
        }

        // 3. 약한 패 (낮은 원페어)
        if (rankValue === 1) {
            // 초반 스트리트(4구, 5구)는 저렴하면 붙어봄
            if (street <= 5 && callAmount <= minBet * 2) {
                return { action: 'call', amount: callAmount };
            }
            if (callAmount <= minBet && Math.random() < 0.5) {
                return { action: 'call', amount: callAmount };
            }
            return { action: 'fold', amount: 0 };
        }

        // 4. 노페어 (탑)
        // 마지막 리버(7구)인데 노페어면 무조건 다이
        if (street >= 7) {
            return { action: 'fold', amount: 0 };
        }
        // 초반에 배팅액이 아주 작을 때 20% 확률로 콜(드로우 희망), 아니면 폴드
        if (callAmount <= minBet && Math.random() < 0.25) {
            return { action: 'call', amount: callAmount };
        }

        return { action: 'fold', amount: 0 };
    }
}

window.BotPlayer = BotPlayer;
