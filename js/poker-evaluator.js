// js/poker-evaluator.js - 세븐포커(7 Card Stud) 족보 판정 및 덱 관리 엔진

const SUITS = [
    { name: 'spade', symbol: '♠', priority: 4, color: 'black' },
    { name: 'diamond', symbol: '♦', priority: 3, color: 'red' },
    { name: 'heart', symbol: '♥', priority: 2, color: 'red' },
    { name: 'clover', symbol: '♣', priority: 1, color: 'black' }
];

const RANKS = [
    { value: 14, name: 'A', display: 'A' },
    { value: 13, name: 'K', display: 'K' },
    { value: 12, name: 'Q', display: 'Q' },
    { value: 11, name: 'J', display: 'J' },
    { value: 10, name: '10', display: '10' },
    { value: 9, name: '9', display: '9' },
    { value: 8, name: '8', display: '8' },
    { value: 7, name: '7', display: '7' },
    { value: 6, name: '6', display: '6' },
    { value: 5, name: '5', display: '5' },
    { value: 4, name: '4', display: '4' },
    { value: 3, name: '3', display: '3' },
    { value: 2, name: '2', display: '2' }
];

const HAND_RANKINGS = {
    ROYAL_FLUSH: { rank: 12, name: '로얄 스트레이트 플러시 (로티플)' },
    BACK_STRAIGHT_FLUSH: { rank: 11, name: '백 스트레이트 플러시 (백스티플)' },
    STRAIGHT_FLUSH: { rank: 10, name: '스트레이트 플러시 (스티플)' },
    FOUR_OF_A_KIND: { rank: 9, name: '포카드' },
    FULL_HOUSE: { rank: 8, name: '풀하우스' },
    FLUSH: { rank: 7, name: '플러시' },
    MOUNTAIN: { rank: 6, name: '마운틴' },
    BACK_STRAIGHT: { rank: 5, name: '백스트레이트' },
    STRAIGHT: { rank: 4, name: '스트레이트' },
    THREE_OF_A_KIND: { rank: 3, name: '트리플' },
    TWO_PAIR: { rank: 2, name: '투페어' },
    ONE_PAIR: { rank: 1, name: '원페어' },
    HIGH_CARD: { rank: 0, name: '탑 (노페어)' }
};

class Card {
    constructor(suit, rank) {
        this.suit = suit; // { name, symbol, priority, color }
        this.rank = rank; // { value, name, display }
        this.isHidden = false; // 히든 카드 여부
    }

    getId() {
        return `${this.suit.name}_${this.rank.name}`;
    }

    toString() {
        return `${this.suit.symbol}${this.rank.display}`;
    }
}

class Deck {
    constructor() {
        this.cards = [];
        this.reset();
    }

    reset() {
        this.cards = [];
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                this.cards.push(new Card(suit, rank));
            }
        }
        this.shuffle();
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    draw() {
        if (this.cards.length === 0) return null;
        return this.cards.pop();
    }

    remaining() {
        return this.cards.length;
    }
}

class PokerEvaluator {
    // 5장의 카드 평가
    static evaluate5(cards) {
        if (cards.length !== 5) {
            return { rank: HAND_RANKINGS.HIGH_CARD, score: 0, desc: '카드 부족', mainCard: cards[0] };
        }

        // 숫자 내림차순 정렬
        const sorted = [...cards].sort((a, b) => {
            if (b.rank.value !== a.rank.value) return b.rank.value - a.rank.value;
            return b.suit.priority - a.suit.priority;
        });

        const values = sorted.map(c => c.rank.value);
        const suits = sorted.map(c => c.suit.name);

        const isFlush = suits.every(s => s === suits[0]);

        // 카운트 계산
        const valueCounts = {};
        for (const v of values) {
            valueCounts[v] = (valueCounts[v] || 0) + 1;
        }

        const countsArray = Object.entries(valueCounts)
            .map(([val, cnt]) => ({ value: parseInt(val), count: cnt }))
            .sort((a, b) => b.count !== a.count ? b.count - a.count : b.value - a.value);

        // 스트레이트 검사
        let isStraight = false;
        let isMountain = false;
        let isBackStraight = false;

        // 마운틴: 14, 13, 12, 11, 10
        if (values[0] === 14 && values[1] === 13 && values[2] === 12 && values[3] === 11 && values[4] === 10) {
            isStraight = true;
            isMountain = true;
        }
        // 백스트레이트: A, 5, 4, 3, 2 -> 14, 5, 4, 3, 2
        else if (values[0] === 14 && values[1] === 5 && values[2] === 4 && values[3] === 3 && values[4] === 2) {
            isStraight = true;
            isBackStraight = true;
        }
        // 일반 스트레이트
        else if (
            values[0] - values[1] === 1 &&
            values[1] - values[2] === 1 &&
            values[2] - values[3] === 1 &&
            values[3] - values[4] === 1
        ) {
            isStraight = true;
        }

        // 1. 로얄 스트레이트 플러시 (로티플)
        if (isFlush && isMountain) {
            return {
                type: 'ROYAL_FLUSH',
                rankInfo: HAND_RANKINGS.ROYAL_FLUSH,
                cards: sorted,
                highCard: sorted[0],
                score: 1200000000 + sorted[0].suit.priority,
                name: `${sorted[0].suit.symbol} 로얄 스트레이트 플러시`
            };
        }

        // 2. 백 스트레이트 플러시 (백스티플)
        if (isFlush && isBackStraight) {
            // 백스티플 탑은 5의 문양 기준
            const fiveCard = sorted.find(c => c.rank.value === 5);
            return {
                type: 'BACK_STRAIGHT_FLUSH',
                rankInfo: HAND_RANKINGS.BACK_STRAIGHT_FLUSH,
                cards: sorted,
                highCard: fiveCard,
                score: 1100000000 + fiveCard.suit.priority,
                name: `${fiveCard.suit.symbol} 백 스트레이트 플러시`
            };
        }

        // 3. 스트레이트 플러시 (스티플)
        if (isFlush && isStraight) {
            return {
                type: 'STRAIGHT_FLUSH',
                rankInfo: HAND_RANKINGS.STRAIGHT_FLUSH,
                cards: sorted,
                highCard: sorted[0],
                score: 1000000000 + (sorted[0].rank.value * 10) + sorted[0].suit.priority,
                name: `${sorted[0].suit.symbol} ${sorted[0].rank.display}탑 스티플`
            };
        }

        // 4. 포카드
        if (countsArray[0].count === 4) {
            const quadCards = sorted.filter(c => c.rank.value === countsArray[0].value);
            const highSuit = [...quadCards].sort((a, b) => b.suit.priority - a.suit.priority)[0];
            return {
                type: 'FOUR_OF_A_KIND',
                rankInfo: HAND_RANKINGS.FOUR_OF_A_KIND,
                cards: sorted,
                highCard: highSuit,
                score: 900000000 + (countsArray[0].value * 10) + highSuit.suit.priority,
                name: `${highSuit.rank.display} 포카드`
            };
        }

        // 5. 풀하우스
        if (countsArray[0].count === 3 && countsArray[1].count === 2) {
            const tripleCards = sorted.filter(c => c.rank.value === countsArray[0].value);
            const highSuit = [...tripleCards].sort((a, b) => b.suit.priority - a.suit.priority)[0];
            return {
                type: 'FULL_HOUSE',
                rankInfo: HAND_RANKINGS.FULL_HOUSE,
                cards: sorted,
                highCard: highSuit,
                score: 800000000 + (countsArray[0].value * 100) + (countsArray[1].value * 5) + highSuit.suit.priority,
                name: `${highSuit.rank.display} 풀하우스`
            };
        }

        // 6. 플러시
        if (isFlush) {
            const topCard = sorted[0];
            return {
                type: 'FLUSH',
                rankInfo: HAND_RANKINGS.FLUSH,
                cards: sorted,
                highCard: topCard,
                score: 700000000 + (topCard.rank.value * 10) + topCard.suit.priority,
                name: `${topCard.suit.symbol} ${topCard.rank.display}탑 플러시`
            };
        }

        // 7. 마운틴 (A-K-Q-J-10)
        if (isMountain) {
            const topA = sorted.find(c => c.rank.value === 14);
            return {
                type: 'MOUNTAIN',
                rankInfo: HAND_RANKINGS.MOUNTAIN,
                cards: sorted,
                highCard: topA,
                score: 600000000 + topA.suit.priority,
                name: `${topA.suit.symbol} 마운틴`
            };
        }

        // 8. 백스트레이트 (A-2-3-4-5)
        if (isBackStraight) {
            const fiveCard = sorted.find(c => c.rank.value === 5);
            return {
                type: 'BACK_STRAIGHT',
                rankInfo: HAND_RANKINGS.BACK_STRAIGHT,
                cards: sorted,
                highCard: fiveCard,
                score: 500000000 + fiveCard.suit.priority,
                name: `${fiveCard.suit.symbol} 5탑 백스트레이트`
            };
        }

        // 9. 일반 스트레이트
        if (isStraight) {
            const topCard = sorted[0];
            return {
                type: 'STRAIGHT',
                rankInfo: HAND_RANKINGS.STRAIGHT,
                cards: sorted,
                highCard: topCard,
                score: 400000000 + (topCard.rank.value * 10) + topCard.suit.priority,
                name: `${topCard.suit.symbol} ${topCard.rank.display}탑 스트레이트`
            };
        }

        // 10. 트리플 (삼봉)
        if (countsArray[0].count === 3) {
            const tripleCards = sorted.filter(c => c.rank.value === countsArray[0].value);
            const highSuit = [...tripleCards].sort((a, b) => b.suit.priority - a.suit.priority)[0];
            return {
                type: 'THREE_OF_A_KIND',
                rankInfo: HAND_RANKINGS.THREE_OF_A_KIND,
                cards: sorted,
                highCard: highSuit,
                score: 300000000 + (countsArray[0].value * 10) + highSuit.suit.priority,
                name: `${highSuit.rank.display} 트리플`
            };
        }

        // 11. 투페어
        if (countsArray[0].count === 2 && countsArray[1].count === 2) {
            const topPairVal = Math.max(countsArray[0].value, countsArray[1].value);
            const lowPairVal = Math.min(countsArray[0].value, countsArray[1].value);
            const topPairCards = sorted.filter(c => c.rank.value === topPairVal);
            const highSuit = [...topPairCards].sort((a, b) => b.suit.priority - a.suit.priority)[0];
            return {
                type: 'TWO_PAIR',
                rankInfo: HAND_RANKINGS.TWO_PAIR,
                cards: sorted,
                highCard: highSuit,
                score: 200000000 + (topPairVal * 100) + (lowPairVal * 5) + highSuit.suit.priority,
                name: `${highSuit.rank.display}&${lowPairVal} 투페어`
            };
        }

        // 12. 원페어
        if (countsArray[0].count === 2) {
            const pairCards = sorted.filter(c => c.rank.value === countsArray[0].value);
            const highSuit = [...pairCards].sort((a, b) => b.suit.priority - a.suit.priority)[0];
            return {
                type: 'ONE_PAIR',
                rankInfo: HAND_RANKINGS.ONE_PAIR,
                cards: sorted,
                highCard: highSuit,
                score: 100000000 + (countsArray[0].value * 10) + highSuit.suit.priority,
                name: `${highSuit.rank.display} 원페어`
            };
        }

        // 13. 탑 (High Card)
        const topCard = sorted[0];
        return {
            type: 'HIGH_CARD',
            rankInfo: HAND_RANKINGS.HIGH_CARD,
            cards: sorted,
            highCard: topCard,
            score: (topCard.rank.value * 10) + topCard.suit.priority,
            name: `${topCard.suit.symbol} ${topCard.rank.display} 탑`
        };
    }

    // N장(최대 7장) 카드 중 최적의 5장 조합 추출
    static evaluateBestHand(cards) {
        if (!cards || cards.length < 5) {
            return this.evaluatePartial(cards || []);
        }

        // 5장 선택 조합 (7장의 경우 21가지 조합)
        const combinations = this.getCombinations(cards, 5);
        let bestResult = null;

        for (const comb of combinations) {
            const evalResult = this.evaluate5(comb);
            if (!bestResult || evalResult.score > bestResult.score) {
                bestResult = evalResult;
            }
        }

        return bestResult;
    }

    // 1~4장일 때 (진행 중 간이 판정: 페어, 트리플, 탑 등)
    static evaluatePartial(cards) {
        if (!cards || cards.length === 0) {
            return { type: 'NONE', rankInfo: HAND_RANKINGS.HIGH_CARD, score: 0, name: '-' };
        }

        const sorted = [...cards].sort((a, b) => {
            if (b.rank.value !== a.rank.value) return b.rank.value - a.rank.value;
            return b.suit.priority - a.suit.priority;
        });

        const valueCounts = {};
        for (const c of sorted) {
            valueCounts[c.rank.value] = (valueCounts[c.rank.value] || 0) + 1;
        }

        const countsArray = Object.entries(valueCounts)
            .map(([val, cnt]) => ({ value: parseInt(val), count: cnt }))
            .sort((a, b) => b.count !== a.count ? b.count - a.count : b.value - a.value);

        if (countsArray[0].count === 4) {
            const highCard = sorted.find(c => c.rank.value === countsArray[0].value);
            return { type: 'FOUR_OF_A_KIND', rankInfo: HAND_RANKINGS.FOUR_OF_A_KIND, score: 900000000, name: `${highCard.rank.display} 포카드` };
        }
        if (countsArray[0].count === 3) {
            const highCard = sorted.find(c => c.rank.value === countsArray[0].value);
            return { type: 'THREE_OF_A_KIND', rankInfo: HAND_RANKINGS.THREE_OF_A_KIND, score: 300000000, name: `${highCard.rank.display} 트리플` };
        }
        if (countsArray[0].count === 2 && countsArray[1] && countsArray[1].count === 2) {
            const highCard = sorted.find(c => c.rank.value === Math.max(countsArray[0].value, countsArray[1].value));
            return { type: 'TWO_PAIR', rankInfo: HAND_RANKINGS.TWO_PAIR, score: 200000000, name: `${highCard.rank.display} 투페어` };
        }
        if (countsArray[0].count === 2) {
            const highCard = sorted.find(c => c.rank.value === countsArray[0].value);
            return { type: 'ONE_PAIR', rankInfo: HAND_RANKINGS.ONE_PAIR, score: 100000000, name: `${highCard.rank.display} 원페어` };
        }

        const topCard = sorted[0];
        return {
            type: 'HIGH_CARD',
            rankInfo: HAND_RANKINGS.HIGH_CARD,
            score: (topCard.rank.value * 10) + topCard.suit.priority,
            name: `${topCard.suit.symbol} ${topCard.rank.display} 탑`
        };
    }

    // 보스(Boss: 오픈된 카드 중 가장 높은 사람) 선 판정
    static evaluateBoss(players) {
        let bestPlayer = null;
        let bestScore = -1;

        for (const player of players) {
            if (player.isFolded) continue;
            // 오픈된 카드만 필터링
            const openCards = player.hand.filter(c => !c.isHidden);
            if (openCards.length === 0) continue;

            const res = openCards.length >= 5 
                ? this.evaluateBestHand(openCards) 
                : this.evaluatePartial(openCards);

            if (res.score > bestScore) {
                bestScore = res.score;
                bestPlayer = player;
            }
        }

        return bestPlayer;
    }

    // 조합 생성 유틸리티
    static getCombinations(arr, k) {
        if (k === 1) return arr.map(e => [e]);
        const result = [];
        for (let i = 0; i <= arr.length - k; i++) {
            const head = arr[i];
            const tailCombs = this.getCombinations(arr.slice(i + 1), k - 1);
            for (const tail of tailCombs) {
                result.push([head, ...tail]);
            }
        }
        return result;
    }
}

window.Card = Card;
window.Deck = Deck;
window.PokerEvaluator = PokerEvaluator;
window.HAND_RANKINGS = HAND_RANKINGS;
