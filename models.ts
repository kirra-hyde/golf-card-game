class Card {
  suit: string;
  rank: string;
  flipped: boolean;

  constructor(suit: string, rank: string) {
    this.suit = suit;
    this.rank = rank;
    this.flipped = false;
  }
}

class Hand {
  cards: Card[];

  constructor (cards: Card[]) {
    this.cards = cards;
  }
}

class Player {
  hand: Hand;
  constructor (hand: Hand) {
    this.hand = hand;
  }
}