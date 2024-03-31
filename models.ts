import axios from "axios";
import { randPlayer, changePlayer } from "./utilties.js";

const BASE_URL = "https://deckofcardsapi.com/api/deck";
const CARDS_PER_HAND = 6;

type tCardData = {
  code: string,
  image: string,
  images: { svg: string, png: string; },
  value: string,
  suit: string;
};


/******************************************************************************
 * Card: A single playing card
 *
 * - code: string that uniquely identifies the card
 * - value: string of the rank of the card  (Ex. "ACE", "KING", "2", "10")
 * - image: string of url with picture of the card
 * - flipped: boolean, false by default, true if player flips card to be face-up
 */

class Card {
  readonly code: string;
  readonly value: string;
  flipped: boolean;
  readonly image: string;

  /** Make instance of a Card from a value, image, and code */

  constructor(value: string, image: string, code: string) {
    this.code = code;
    this.value = value;
    this.image = image;
    this.flipped = false;
  }
}


/******************************************************************************
 * Game: Houses game logic
 *
 * - deckID: string that uniquely identifies the deck used in the game
 * - players: array of Player instances. Ex. [{ cards, name, drawnCard }]
 * - currPlayer: Player whose turn it is to play. Ex. { cards, name, drawnCard }
 * - topDiscard: Card at top of discard pile. Ex. {value, image, code, flipped }
 */

class Game {
  readonly deckID: string;
  readonly players: Player[];
  currPlayer: Player;
  topDiscard: Card | null;

  /** Make instance of a Game from a deckID and an array of Players */

  constructor(deckID: string, players: Player[]) {
    this.deckID = deckID;
    this.players = players;
    this.currPlayer = randPlayer(players);
    this.topDiscard = null;
  }

  /** Static method to begin a new game.
   *
   * - Fetches a deck id from card API
   * - Has 4 Players made, w/ a client chosen name for client controlled Player.
   * - Has a Game instance made from deck id and Players
   *
   * Returns: (promise of) Game instance
   */

  static async startGame(): Promise<Game> {
    console.log("In models: startGame");
    const resp = await axios.get(`${BASE_URL}/new/shuffle`);
    const deckID = resp.data.deck_id as string;

    const mainName = "You";  // Will eventually get value from form. Which means, dictate that it is a string?  Validation check for not billy, etc.
    const names = [mainName, "Billy", "Bobby", "Buddy"];
    const players = names.map(name => new Player(name));

    return new Game(deckID, players);
  }

  /** Handles the initial dealing of cards
   *
   * - Fetches card data from card API for 6 cards per player plus 1 for discard
   * - Has Cards made with card data
   * - Adds all Cards but 1 to Players' cards array
   * - Adds remaining Card to top of discard pile
   */

  async dealGame(): Promise<void> {
    console.log("In models: dealGame");
    // Using card api w/ deckID ensures a card is removed from deck when drawn
    for (let player of this.players) {
      const resp = await axios.get(
        `${BASE_URL}/${this.deckID}/draw`,
        { params: { count: CARDS_PER_HAND } }
      );

      const cardData = resp.data.cards as tCardData[];
      player.cards =
        cardData.map(({ value, image, code }) => new Card(value, image, code));
    }

    // For top of discard pile
    const resp = await axios.get(`${BASE_URL}/${this.deckID}/draw`);

    const cardData = resp.data.cards[0] as tCardData;
    const { value, image, code } = cardData;
    this.topDiscard = new Card(value, image, code);
  }

  /** Switches which Player's turn it is */

  switchTurn(): void {
    this.currPlayer = changePlayer(this.currPlayer, this.players);
  }

  /** Returns cards from discard pile to deck and shuffles deck */

  async reshuffle(): Promise<void> {
    // If there is a topDiscard Card, add it to regular discard pile
    if (this.topDiscard instanceof Card) {
      await axios.get(
        `${BASE_URL}/${this.deckID}/pile/discard/add`,
        { params: { cards: this.topDiscard.code } }
      );
      this.topDiscard = null;
    }

    // Return regular discard pile to main deck
    await axios.get(`${BASE_URL}/${this.deckID}/pile/discard/return`);

    // Shuffle main deck
    await axios.get(
      `${BASE_URL}/${this.deckID}/shuffle`,
      { params: { remaining: true } }
    );
  }
}


/******************************************************************************
 * Player: Logic for player moves
 *
 * - cards: array of Player's cards. Ex. [{ value, image, flipped, code }]
 * - name: string of Player's name
 * - drawnCard: Card Player had drawn but not yet taken.  (Can keep or discard.)
 *      Ex. { value, image, flipped, code }
 */

class Player {
  cards: Card[];
  readonly name: string;
  drawnCard: Card | null;

  /** Make an instance of a Player from a name */

  constructor(name: string) {
    this.cards = [];
    this.name = name;
    this.drawnCard = null;
  }

  /** Makes a Card from Player's card array flipped
   *
   * Takes: cardInd, number representing index of Card to be flipped
   */

  flipCard(cardInd: number): void {
    this.cards[cardInd].flipped = true;
  }

  /** Draw a card from the deck
   *
   * - Fetch data on 1 card
   * - Have Card instance made from data
   * - Make Card Player's drawnCard.
   * - If no cards remain in deck, has discard pile shuffled into deck first
   *
   * Takes: game, a Game instance
   */

  async drawFromDeck(game: Game): Promise<void> {

    const resp = await axios.get(`${BASE_URL}/${game.deckID}/draw`);

    // success will be false if there are no cards left in deck to draw
    // if no cards remain, have discard pile shuffled into deck, and try again.
    const success = resp.data.success as boolean;
    if (!success) {
      await game.reshuffle();
      this.drawFromDeck(game);
    }

    const cardData = resp.data.cards[0] as tCardData;
    const { value, image, code } = cardData;
    this.drawnCard = new Card(value, image, code);
  }

  /** Draw the top card from the discard pile
   *
   * - Make Card at top of discard pile Player's drawnCard
   * - Set Game's topDiscard to null, showing card has been taken.
   *
   * Takes: game, a Game instance
   */

  drawFromDiscards(game: Game): void {
    this.drawnCard = game.topDiscard as Card;
    game.topDiscard = null;
  }

  /** Discard drawn card to top of discard pile
   *
   * - If the Game's topDiscard is a Card, use its code to add the card
   *      to the deck's main discard pile, using card api
   * - Make Game's topDiscard the Player's drawnCard
   * - Set Player's drawnCard to null, showing they've discarded it.
   *
   * Takes: game, a Game instance
   */

  async discardDrawnCard(game: Game): Promise<void> {
    if (game.topDiscard instanceof Card) {
      await axios.get(
        `${BASE_URL}/${game.deckID}/pile/discard/add`,
        { params: { cards: game.topDiscard.code } }
      );
    }

    game.topDiscard = this.drawnCard as Card;
    this.drawnCard = null;
  }

  /** Trade Card in player's cards array with drawnCard
   *  Discard Card that was previously in player's cards array
   *
   * - If the Game's topDiscard is a Card, use its code to add the card
   *      to the deck's main discard pile, using card api
   * - Make Card at the index of Player's cards array the Game's topDiscard
   * - Make drawnCard the Card at the given index in Player's cards array
   * - Set Player's drawnCard to null, showing they've discarded it.
   *
   * Takes:
   * - game: a Game instance
   * - cardInd: number representing index of Card to be swapped with drawnCard
   */

  async takeDrawnCard(cardInd: number, game: Game): Promise<void> {
    if (game.topDiscard instanceof Card) {
      await axios.get(
        `${BASE_URL}/${game.deckID}/pile/discard/add`,
        { params: { cards: game.topDiscard.code } }
      );
    }
    game.topDiscard = this.cards[cardInd];
    this.cards[cardInd] = this.drawnCard as Card;
    this.cards[cardInd].flipped = true;
    this.drawnCard = null;
  }
}

export { Game, Player, Card, BASE_URL };