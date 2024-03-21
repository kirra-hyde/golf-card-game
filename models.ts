import axios from "axios";
import { randPlayer, changePlayer } from "./utilties.js";

const BASE_URL = "https://deckofcardsapi.com/api/deck";
let currGame: Game;
const CARDS_PER_HAND = 6;

type tCardData = {
  code: string,
  image: string,
  images: { svg: string, png: string; },
  value: string,
  suit: string;
};


class Card {
  readonly code: string;
  readonly value: string;
  flipped: boolean;
  readonly image: string;

  constructor(value: string, image: string, code: string) {
    this.code = code;
    this.value = value;
    this.image = image;
    this.flipped = false;
  }
}

class Game {
  readonly deckID: string;
  players: Player[];  //Object.freeze???
  currPlayer: Player;
  topDiscard: Card | null;

  constructor(deckID: string, players: Player[]) {
    this.deckID = deckID;
    this.players = players;
    this.currPlayer = randPlayer(players);
    this.topDiscard = null;
  }

  static async startGame(): Promise<void> {
    const resp = await axios.get(`${BASE_URL}/new/shuffle`);
    const deckID = resp.data.deckID as string;

    const mainName = "You";  // Will eventually get value from form. Which means, dictate that it is a string?  Validation check for not billy, etc.
    const names = [mainName, "Billy", "Bobby", "Buddy"];
    const players = names.map(name => new Player(name));

    currGame = new Game(deckID, players);
  }

  async dealGame(): Promise<void> {
    for (let player of this.players) {
      const resp = await axios.get(
        `${BASE_URL}/${this.deckID}/draw`,
        { params: { count: CARDS_PER_HAND } }
      );

      const cardData = resp.data.cards as tCardData[];
      player.cards =
        cardData.map(({ value, image, code }) => new Card(value, image, code));
    }
    const resp = await axios.get(`${BASE_URL}/${this.deckID}/draw`);

    const cardData = resp.data.cards[0] as tCardData;
    const { value, image, code } = cardData;
    this.topDiscard = new Card(value, image, code);
  }

  switchTurn(): void {
    this.currPlayer = changePlayer(this.currPlayer, this.players);
  }

  async reshuffle(): Promise<void> {
    if (this.topDiscard instanceof Card) {
      await axios.get(
        `${BASE_URL}/${this.deckID}/pile/discard/add`,
        { params: { cards: this.topDiscard.code } }
      );
    }
    await axios.get(`${BASE_URL}/${this.deckID}/pile/discard/return`);
    await axios.get(
      `${BASE_URL}/${this.deckID}/shuffle`,
      { params: { remaining: true } }
    );
  }
}

class Player {
  cards: Card[];
  readonly name: string;
  drawnCard: Card | null;

  constructor(name: string) {
    this.cards = [];
    this.name = name;
    this.drawnCard = null;
  }

  flipCard(cardInd: number): void {
    this.cards[cardInd].flipped = true;
  }

  async drawFromDeck(): Promise<void> {

    const resp = await axios.get(`${BASE_URL}/${currGame.deckID}/draw`);

    const success = resp.data.success as boolean;
    if (!success) {
      await currGame.reshuffle();
      this.drawFromDeck();
    }

    const cardData = resp.data.cards[0] as tCardData;
    const { value, image, code } = cardData;
    this.drawnCard = new Card(value, image, code);
  }

  drawFromDiscards(): void {
    this.drawnCard = currGame.topDiscard as Card;
    currGame.topDiscard = null;
  }

  async discardDrawnCard(): Promise<void> {
    if (currGame.topDiscard instanceof Card) {
      await axios.get(
        `${BASE_URL}/${currGame.deckID}/pile/discard/add`,
        { params: { cards: currGame.topDiscard.code } }
      );
    }

    currGame.topDiscard = this.drawnCard as Card;
    this.drawnCard = null;
  }

  async takeDrawnCard(cardInd: number): Promise<void> {
    if (currGame.topDiscard instanceof Card) {
      await axios.get(
        `${BASE_URL}/${currGame.deckID}/pile/discard/add`,
        { params: { cards: currGame.topDiscard.code } }
      );
    }
    currGame.topDiscard = this.cards[cardInd];
    this.cards[cardInd] = this.drawnCard as Card;
    this.cards[cardInd].flipped = true;
    this.drawnCard = null;
  }
}

export { Game, Player, Card, currGame };