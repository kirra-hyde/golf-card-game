import axios from "axios";
import { getNextPlayer, randSelectPlayer, checkAllFlipped } from "./utilities.js";

const BASE_URL = "https://deckofcardsapi.com/api/deck";
const CARDS_PER_HAND = 6;
const POINTS_PER_GAME = 100;

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
 * - locked: boolean, false by default, true if card gets locked into place
 */

class Card {
  readonly code: string;
  readonly value: string;
  flipped: boolean;
  readonly image: string;
  locked: boolean;

  /** Make instance of a Card from a value, image, and code */

  constructor(value: string, image: string, code: string) {
    this.code = code;
    this.value = value;
    this.image = image;
    this.flipped = false;
    this.locked = false;
  }
}


/******************************************************************************
 * Game: Houses game logic
 *
 * - deckID: string that uniquely identifies the card-api deck used in the game
 * - players: array of Player instances. Ex. [{ cards, name, drawnCard }]
 * - currPlayer: Player whose turn it is to play. Ex. { cards, name, drawnCard }
 * - currDealer: Player who deals this round
 * - topDiscard: Card at top of discard pile. Ex. {value, image, code, flipped }
 * - deckIsEmpty: boolean, false if any cards remain in card-api deck, else true
 * - discardPileHasCards: boolean, true if the card-api discard pile (which
 *      includes all discarded cards EXCEPT topDiscard) has cards, else false
 * - gameFinished: boolean, true once game is over, else false
 * - countdown: boolean, true once a countdown to the end of round is initiated
 * - turnsLeft: number, after countdown, tracks how many turns remain in round
 * - scores: array of numbers representing the players' current total scores
 */

class Game {
  readonly deckID: string;
  readonly players: Player[];
  currDealer: Player;
  currPlayer: Player;
  topDiscard: Card | null;
  deckIsEmpty: boolean;
  discardPileHasCards: boolean;
  gameFinished: boolean;
  countdown: boolean;
  turnsLeft: number;
  scores: number[];

  /** Make instance of a Game from a deckID and an array of Players */

  constructor(deckID: string, players: Player[]) {
    this.deckID = deckID;
    this.players = players;
    this.currDealer = randSelectPlayer(players);
    this.currPlayer = getNextPlayer(players, this.currDealer);
    this.topDiscard = null;
    this.deckIsEmpty = false;
    this.discardPileHasCards = false;
    this.gameFinished = false;
    this.countdown = false;
    this.turnsLeft = players.length;
    this.scores = [0, 0, 0, 0];
  }

  /** Static method to begin a new game
   *
   * - Fetch a deck id from card API
   * - Make 4 Players, optionally using 'playerName' for non-computer Player
   * - Makes a Game instance from deck id and Players
   *
   * Takes (optionally): playerName, string representing the main player's name
   * Returns: (promise of) Game instance
   */

  static async startGame(playerName: string = "You"): Promise<Game> {
    console.log("In models: startGame");

    const resp = await axios.get(`${BASE_URL}/new/shuffle`);
    const deckID = resp.data.deck_id as string;

    const names = [playerName, "Billy", "Bobby", "Buddy"];
    const players = names.map(name => new Player(name));

    return new Game(deckID, players);
  }

  /** Handle the initial dealing of cards
   *
   * - Fetch card data from card API for 6 cards per player plus 1 for discard
   * - Make Cards with card data
   * - Add all Cards but 1 to Players' cards array
   * - Add remaining Card to top of discard pile
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

  /** Switch which Player's turn it is
   *
   * - Check if player has all their cards flipped. If so, start round countdown.
   * - If round countdown is in effect, decrement "roundsLeft" by 1
   * - Switch currPlayer to next player
   */

  switchTurn(): void {
    console.log("In models: switchTurn");
    if (checkAllFlipped(this)) {
      this.countdown = true;
    }
    if (this.countdown === true) {
      this.turnsLeft--;
    }
    this.currPlayer = getNextPlayer(this.players, this.currPlayer);
  }

  /** Handle deck reshuffling when the deck is out of cards
   *
   * - Return cards from card-api discard pile to main deck and shuffle deck
   * - Set the Game's discardPileHasCards and deckIsEmpty to false
   */

  async reshuffle(): Promise<void> {
    console.log("In models: reshuffle");

    // If there is a topDiscard Card, add it to card-api discard pile
    if (this.topDiscard instanceof Card) {
      await axios.get(
        `${BASE_URL}/${this.deckID}/pile/discard/add`,
        { params: { cards: this.topDiscard.code } }
      );
      this.topDiscard = null;
    }

    // Return card-api discard pile to main card-api deck
    await axios.get(`${BASE_URL}/${this.deckID}/pile/discard/return`);

    // Shuffle card-api deck
    await axios.get(
      `${BASE_URL}/${this.deckID}/shuffle`,
      { params: { remaining: true } }
    );

    this.discardPileHasCards = false;
    this.deckIsEmpty = false;
  }

  /** Start a new round
   *
   * - Set turnsLeft to 4
   * - Set countdown to false
   * - Set currDealer to the next Player after old currDealer
   * - Set currPlayer to the next Player after new currDealer
   * - Add all cards to main deck and shuffle it
   */

  async switchRound(): Promise<void> {
    console.log("In models: switchRound");
    this.currDealer = getNextPlayer(this.players, this.currDealer);
    this.currPlayer = getNextPlayer(this.players, this.currDealer);
    this.turnsLeft = this.players.length;
    this.countdown = false;

    await axios.get(`${BASE_URL}/${this.deckID}/shuffle`);
  }

  /** Lock Cards if both Cards in a column have been flipped
   *
   * Takes:
   * - cardInd: Number of the index of a Card that was just flipped
   * - (optional) player: A Player instance whose cards we're locking, if needed
   * Returns: array of two indexes of cards that were just locked, if any
   */

  lockCards(cardInd: number, player: Player = this.currPlayer): number[] | void {
    const cards = player.cards;
    if (cardInd < 3 && cards[cardInd + 3].flipped) {
      cards[cardInd].locked = true;
      cards[cardInd + 3].locked = true;
      return [cardInd, cardInd + 3];
    }
    if (cardInd >= 3 && cards[cardInd - 3].flipped) {
      cards[cardInd].locked = true;
      cards[cardInd - 3].locked = true;
      return [cardInd - 3, cardInd];
    }
  }

  /** Return boolean representing whether game is over.
   *  If game is over, make gameFinished property true */

  checkIfOver(): boolean {
    const isitOver = this.scores.some(score => score >= POINTS_PER_GAME);
    if (isitOver) {
      this.gameFinished = true;
    }
    return isitOver;
  }
}


/******************************************************************************
 * Player: Logic for player moves
 *
 * - cards: array of Player's cards. Ex. [{ value, image, flipped, code }]
 * - name: string of Player's name
 * - drawnCard: Card Player had drawn but not yet taken.  (Can keep or discard.)
 *      Ex. { value, image, flipped, code, locked }
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

  /** Flip a card
   *
   * Takes: cardInd, number representing index of Card to be flipped
   */

  flipCard(cardInd: number): void {
    console.log("In models: flipCard");
    this.cards[cardInd].flipped = true;
  }

  /** Draw a card from the deck
   *
   * - Fetch data on 1 card
   * - Make Card instance with data
   * - Make the Card the Player's drawnCard
   * - Set Game's deckIsEmpty using data from API call
   * - If no cards remain in deck, have discard pile shuffled into deck first
   *
   * Takes: game, a Game instance
   */

  async drawFromDeck(game: Game): Promise<void> {
    console.log("In models: drawFromDeck");

    const resp = await axios.get(`${BASE_URL}/${game.deckID}/draw`);

    // Success will be false if there are no cards left in deck to draw
    const success = resp.data.success as boolean;

    // If no cards remain, have discard pile shuffled into deck, and try again
    if (!success) {
      await game.reshuffle();
      await this.drawFromDeck(game);
    } else {
      const cardData = resp.data.cards[0] as tCardData;
      const { value, image, code } = cardData;
      this.drawnCard = new Card(value, image, code);

      // If the last card from deck was just drawn, make deckIsEmpty true
      const remainingCards = resp.data.remaining as number;
      game.deckIsEmpty = remainingCards === 0;
    }
  }

  /** Draw the top card from the discard pile
   *
   * - Make Card at top of discard pile Player's drawnCard
   * - Set Game's topDiscard to null, showing card has been taken
   *
   * Takes: game, a Game instance
   */

  drawFromDiscards(game: Game): void {
    console.log("In models: drawFromDiscards");

    this.drawnCard = game.topDiscard as Card;
    game.topDiscard = null;
  }

  /** Discard drawn card to top of discard pile
   *
   * - If the Game's topDiscard is a Card, use its code to add the card
   *      to the deck's card-api discard pile, and set Game's
   *      discardPileHasCards to true
   * - Make Game's topDiscard the Player's drawnCard
   * - Set Player's drawnCard to null, showing they've discarded it
   *
   * Takes: game, a Game instance
   */

  async discardDrawnCard(game: Game): Promise<void> {
    console.log("In models: discardDrawnCard");

    if (game.topDiscard instanceof Card) {

      // Current Game topDiscard is about to be added to card-api discard pile
      game.discardPileHasCards = true;

      await axios.get(
        `${BASE_URL}/${game.deckID}/pile/discard/add`,
        { params: { cards: game.topDiscard.code } }
      );
    }

    game.topDiscard = this.drawnCard as Card;
    this.drawnCard = null;
  }

  /** Trade Card in cards array with drawnCard
   *  Discard Card that was previously in player's cards array
   *
   * - If the Game's topDiscard is a Card, use its code to add the card
   *      to the deck's card-api discard pile, and set Game's
   *      discardPileHasCards to true
   * - Make Card at the index of Player's cards array the Game's topDiscard
   * - Make drawnCard the Card at the given index in Player's cards array
   * - Set Player's drawnCard to null, showing they've discarded it
   *
   * Takes:
   * - game: a Game instance
   * - cardInd: number representing index of Card to be swapped with drawnCard
   */

  async takeDrawnCard(cardInd: number, game: Game): Promise<void> {
    console.log("In models: takeDrawnCard");

    if (game.topDiscard instanceof Card) {

      // Current Game topDiscard is about to be added to card-api discard pile
      game.discardPileHasCards = true;

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

export { Game, Player, Card, BASE_URL, POINTS_PER_GAME };