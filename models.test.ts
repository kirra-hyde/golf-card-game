import { describe, test, expect, beforeEach } from "vitest";
import { Game, Player, Card, BASE_URL } from "./models";
import axios from "axios";
import MockAdaptor from "axios-mock-adapter";

const mock = new MockAdaptor(axios);

let testPlayer: Player;
let testGame: Game;
let testCard: Card;
let testCard2: Card;
let testCard3: Card;
let testCard4: Card;

beforeEach(function () {
  const testPlayerNames = ["p1", "p2", "p3", "p4"];
  const testPlayers = testPlayerNames.map(name => new Player(name));
  testPlayer = new Player("test player");
  testGame = new Game("123", testPlayers);
  testCard = new Card("8", "http://www.pic.com", "8C");
  testCard2 = new Card("9", "http://www.pic.com", "9C");
  testCard3 = new Card("10", "http://www.pic.com", "0C");
  testCard4 = new Card("JACK", "http://www.pic.com", "JC");
});


describe("Card class", function () {
  test("Card created correctly", function () {
    const card = new Card("ACE", "http://www.pic.com", "AD");
    expect(card.code).toEqual("AD");
    expect(card.value).toEqual("ACE");
    expect(card.image).toEqual("http://www.pic.com");
    expect(card.flipped).toEqual(false);
  });
});


describe("Game class", function () {

  test("startGame", async function () {
    // Mock the axios.get method to return a mock response with a deck ID
    mock.onGet(`${BASE_URL}/new/shuffle`).reply(200, { deck_id: "456" });

    const game = await Game.startGame();

    expect(game).toBeInstanceOf(Game);
    expect(game.deckID).toEqual("456");
    for (let player of game.players) {
      expect(player).toBeInstanceOf(Player);
    }
    expect(game.players).toEqual([
      { cards: [], name: "You", drawnCard: null },
      { cards: [], name: "Billy", drawnCard: null },
      { cards: [], name: "Bobby", drawnCard: null },
      { cards: [], name: "Buddy", drawnCard: null },
    ]);
    expect(game.currPlayer).toBeInstanceOf(Player);
    expect(game.topDiscard).toBeNull();
    expect(game.deckIsEmpty).toEqual(false);
    expect(game.discardPileHasCards).toEqual(false);
  });

  test("dealGame", async function () {
    const game = testGame;
    const shortUrl = `${BASE_URL}/${game.deckID}/draw`;

    // Mock the axios.get method to return mock responses with card data
    mock.onGet(shortUrl, { params: { count: 6 } }).reply(200, {
      cards: [
        { code: "1S", image: "www.pic1.com", value: "ACE" },
        { code: "2S", image: "www.pic2.com", value: "2" },
        { code: "3S", image: "www.pic3.com", value: "3" },
        { code: "4S", image: "www.pic4.com", value: "4" },
        { code: "5S", image: "www.pic5.com", value: "5" },
        { code: "6S", image: "www.pic6.com", value: "6" },
      ]
    });

    mock.onGet(shortUrl).reply(200, {
      cards: [
        { code: "7S", image: "www.pic7.com", value: "7" }
      ]
    });

    await game.dealGame();

    for (let player of game.players) {
      expect(player.cards[0]).toBeInstanceOf(Card);
      expect(player.cards[5]).toBeInstanceOf(Card);
      expect(player.cards).toEqual([
        { code: "1S", image: "www.pic1.com", value: "ACE", flipped: false, locked: false },
        { code: "2S", image: "www.pic2.com", value: "2", flipped: false, locked: false },
        { code: "3S", image: "www.pic3.com", value: "3", flipped: false, locked: false },
        { code: "4S", image: "www.pic4.com", value: "4", flipped: false, locked: false },
        { code: "5S", image: "www.pic5.com", value: "5", flipped: false, locked: false },
        { code: "6S", image: "www.pic6.com", value: "6", flipped: false, locked: false },
      ]);
    }

    expect(game.topDiscard).toEqual(
      { code: "7S", image: "www.pic7.com", value: "7", flipped: false, locked: false }
    );
  });

  test("switchTurn", function () {
    const game = testGame;
    game.currPlayer = game.players[2];

    game.switchTurn();
    expect(game.currPlayer).toBe(game.players[3]);

    game.switchTurn();
    expect(game.currPlayer).toBe(game.players[0]);
  });

  test("reshuffle", async function () {
    const game = testGame;
    const card1 = testCard;
    game.topDiscard = card1;
    game.deckIsEmpty = true;
    game.discardPileHasCards = true;

    mock.onGet(`${BASE_URL}/${game.deckID}/pile/discard/add`).reply(200);
    mock.onGet(`${BASE_URL}/${game.deckID}/pile/discard/return`).reply(200);
    mock.onGet(`${BASE_URL}/${game.deckID}/shuffle`).reply(200);

    await game.reshuffle();

    expect(game.topDiscard).toBeNull();
    expect(game.deckIsEmpty).toEqual(false);
    expect(game.discardPileHasCards).toEqual(false);
  });
});


describe("Player class", function () {
  test("Player created successfully", function () {
    const player = new Player("test player");

    expect(player.cards).toEqual([]);
    expect(player.name).toEqual("test player");
    expect(player.drawnCard).toBeNull();
  });

  test("flipCard", function () {
    const player = testPlayer;
    const card1 = testCard;
    const card2 = testCard2;
    player.cards = [card1, card2];

    expect(player.cards[0].flipped).toEqual(false);
    expect(player.cards[1].flipped).toEqual(false);

    player.flipCard(1);

    expect(player.cards[0].flipped).toEqual(false);
    expect(player.cards[1].flipped).toEqual(true);

    player.flipCard(1);

    expect(player.cards[0].flipped).toEqual(false);
    expect(player.cards[1].flipped).toEqual(true);
  });

  test("drawFromDeck with multiple cards", async function () {
    const game = testGame;
    const player = game.players[0];

    mock.onGet(`${BASE_URL}/${game.deckID}/draw`).reply(200, {
      success: true,
      cards: [{ value: "KING", image: "www.pic.com", code: "KH" }],
      remaining: 5
    });

    expect(game.deckIsEmpty).toEqual(false);

    await player.drawFromDeck(game);

    expect(player.drawnCard).toBeInstanceOf(Card);
    expect(player.drawnCard).toEqual({
      code: "KH",
      value: "KING",
      flipped: false,
      locked: false,
      image: "www.pic.com"
    });
    expect(game.deckIsEmpty).toEqual(false);
  });

  test("drawFromDeck with one card", async function () {
    const game = testGame;
    const player = game.players[0];

    mock.onGet(`${BASE_URL}/${game.deckID}/draw`).reply(200, {
      success: true,
      cards: [{ value: "KING", image: "www.pic.com", code: "KH" }],
      remaining: 0
    });

    expect(game.deckIsEmpty).toEqual(false);

    await player.drawFromDeck(game);

    expect(game.deckIsEmpty).toEqual(true);
  });

  test("drawFromDiscards", function () {
    const game = testGame;
    const player = game.players[0];
    const card = testCard;

    game.topDiscard = card;

    expect(player.drawnCard).toBeNull();

    player.drawFromDiscards(game);

    expect(player.drawnCard).toBe(card);
    expect(game.topDiscard).toBeNull();
  });

  test("discardDrawnCard", async function () {
    const game = testGame;
    const player = game.players[0];
    const card1 = testCard;
    const card2 = testCard2

    player.drawnCard = card1;

    expect(game.topDiscard).toBeNull();
    expect(game.discardPileHasCards).toEqual(false);

    await player.discardDrawnCard(game);

    expect(game.topDiscard).toBe(card1);
    expect(player.drawnCard).toBeNull();
    expect(game.discardPileHasCards).toEqual(false);

    player.drawnCard = card2;

    await player.discardDrawnCard(game);

    expect(game.topDiscard).toBe(card2);
    expect(player.drawnCard).toBeNull();
    expect(game.discardPileHasCards).toEqual(true);
  });

  test("takeDrawnCard", async function () {
    const game = testGame;
    const player = testGame.players[0];
    const card1 = testCard;
    const card2 = testCard2;
    const card3 = testCard3;
    const card4 = testCard4;

    player.cards = [card1, card2];
    player.drawnCard = card3;

    expect(game.topDiscard).toBeNull();
    expect(card3.flipped).toEqual(false);
    expect(card4.flipped).toEqual(false);
    expect(game.discardPileHasCards).toEqual(false);

    await player.takeDrawnCard(1, game);

    expect(player.cards).toEqual([card1, card3]);
    expect(game.topDiscard).toBe(card2);
    expect(card3.flipped).toEqual(true);
    expect(card4.flipped).toEqual(false);
    expect(player.drawnCard).toBeNull();
    expect(game.discardPileHasCards).toEqual(false);

    player.drawnCard = card4;

    await player.takeDrawnCard(0, game);

    expect(player.cards).toEqual([card4, card3]);
    expect(game.topDiscard).toBe(card1);
    expect(card3.flipped).toEqual(true);
    expect(card4.flipped).toEqual(true);
    expect(player.drawnCard).toBeNull();
    expect(game.discardPileHasCards).toEqual(true);
  });
});
