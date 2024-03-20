import axios from "axios";
import { randPlayer } from "./utilties.js";

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
  suit: string;
  rank: string;
  flipped: boolean;
  img: string;

  constructor(suit: string, rank: string, img: string) {
    this.suit = suit;
    this.rank = rank;
    this.img = img;
    this.flipped = false;
  }
}

class Game {
  deckID: string;
  numCards: number;
  players: Player[];
  currPlayer: Player;

  constructor(deckID: string, players: Player[]) {
    this.deckID = deckID;
    this.numCards = 52;
    this.players = players;
    this.currPlayer = randPlayer(players);
  }

  static async startGame() {
    const resp = await axios.get(`${BASE_URL}/new/shuffle`);
    const deckID: string = resp.data.deckID;

    const mainName = "You";  // Will eventually get value from form. Which means, dictate that it is a string?  Validation check for not billy, etc.
    const names = [mainName, "Billy", "Bobby", "Buddy"];
    const players = names.map(name => new Player(name));

    currGame = new Game(deckID, players);
  }

  async dealGame() {
    for (let player of this.players) {
      const resp = await axios.get(
        `${BASE_URL}/${this.deckID}/draw`,
        { params: { count: CARDS_PER_HAND } }
      );

      const cardData: tCardData[] = resp.data.cards;
      player.cards =
        cardData.map(({ suit, value, image }) => new Card(suit, value, image));
    }
    this.numCards -= (CARDS_PER_HAND * this.players.length);
  }
}

class Player {
  cards: Card[];
  name: string;
  constructor(name: string) {
    this.cards = [];
    this.name = name;
  }

  firstFlip(cardInd1: number, cardInd2: number) {
    this.cards[cardInd1].flipped = true;
    this.cards[cardInd2].flipped = true;
  }
}

export { Game, Player, Card, currGame };