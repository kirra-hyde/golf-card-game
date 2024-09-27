import { describe, test, expect, beforeEach } from "vitest";
import { Game, Player, Card, BASE_URL, POINTS_PER_GAME } from "./models";
import axios from "axios";
import MockAdaptor from "axios-mock-adapter";

const mock = new MockAdaptor(axios);

let testPlayers: Player[];
let testGame: Game;
let testCard: Card;
let testCard2: Card;

beforeEach(function () {
  const testPlayerNames = ["p1", "p2", "p3", "p4"];
  testPlayers = testPlayerNames.map(name => new Player(name));
  testGame = new Game("123", testPlayers);
  testCard = new Card("10", "http://www.pic.com", "10C");
  testCard2 = new Card("KING", "http://www.pic.com", "KC");

  const cards = [
    new Card("ACE", "http://www.pic.com", "AC"),
    new Card("2", "http://www.pic.com", "2C"),
    new Card("3", "http://www.pic.com", "3C"),
    new Card("4", "http://www.pic.com", "4C"),
    new Card("5", "http://www.pic.com", "5C"),
    new Card("6", "http://www.pic.com", "6C"),
  ];

  for (let player of testGame.players) {
    player.cards = cards;
  }
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
    const game = new Game("123", testPlayers);
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
    game.currPlayer.cards[1].flipped = true;
    game.turnsLeft = 4;

    game.switchTurn();

    expect(game.currPlayer).toBe(game.players[3]);
    expect(testGame.countdown).toEqual(false);
    expect(testGame.turnsLeft).toEqual(4);

    for (let card of testGame.currPlayer.cards) {
      card.flipped = true;
    }

    game.switchTurn();

    expect(game.currPlayer).toBe(game.players[0]);
    expect(testGame.countdown).toEqual(true);
    expect(testGame.turnsLeft).toEqual(3);
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

  test("switchRound", async function () {
    const game = testGame;

    game.countdown = true;
    game.turnsLeft = 0;
    game.currDealer = testPlayers[1];

    mock.onGet(`${BASE_URL}/${game.deckID}/shuffle`).reply(200);

    await game.switchRound();

    expect(game.countdown).toEqual(false);
    expect(game.turnsLeft).toEqual(game.players.length);
    expect(game.currDealer).toBe(testPlayers[2]);
    expect(game.currPlayer).toBe(testPlayers[3]);
  });

  test("lockCards", function () {
    const game = testGame;
    const player = testGame.players[2];
    player.cards[1].flipped = true;

    const lockedCards = game.lockCards(1, player);

    expect(lockedCards).toBeUndefined();
    expect(player.cards[1].locked).toEqual(false);
    expect(player.cards[4].locked).toEqual(false);

    player.cards[4].flipped = true;

    const lockedCards2 = game.lockCards(1, player);

    expect(lockedCards2).toEqual([1, 4]);
    expect(player.cards[1].locked).toEqual(true);
    expect(player.cards[4].locked).toEqual(true);

    player.cards[5].flipped = true;

    const lockedCards3 = game.lockCards(5, player);

    expect(lockedCards3).toBeUndefined();
    expect(player.cards[5].locked).toEqual(false);
    expect(player.cards[2].locked).toEqual(false);

    player.cards[2].flipped = true;

    const lockedCards4 = game.lockCards(5, player);

    expect(lockedCards4).toEqual([2, 5]);
    expect(player.cards[5].locked).toEqual(true);
    expect(player.cards[2].locked).toEqual(true);
  });

  test("checkIfOver", function () {
    const game = testGame;
    const enoughPts = POINTS_PER_GAME;
    game.scores = [enoughPts - 1, enoughPts - 5, enoughPts - 3, enoughPts - 10];

    const isOver = game.checkIfOver();

    expect(isOver).toEqual(false);
    expect(game.gameFinished).toEqual(false);

    game.scores = [enoughPts, enoughPts - 5, enoughPts - 3, enoughPts - 10];

    const isOver2 = game.checkIfOver();

    expect(isOver2).toEqual(true);
    expect(game.gameFinished).toEqual(true);
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
    const player = testGame.players[0];

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
    const card2 = testCard2;

    mock.onGet(`${BASE_URL}/${game.deckID}/pile/discard/add`).reply(200);

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
    player.drawnCard = card1;

    mock.onGet(`${BASE_URL}/${game.deckID}/pile/discard/add`).reply(200);

    expect(card1.flipped).toEqual(false);
    expect(game.topDiscard).toBeNull();
    expect(player.cards[1]).toEqual(
      { code: "2C", image: "http://www.pic.com", value: "2", flipped: false, locked: false }
    );
    expect(game.discardPileHasCards).toEqual(false);

    await player.takeDrawnCard(1, game);

    expect(player.cards[1]).toBe(card1);
    expect(card1.flipped).toEqual(true);
    expect(game.topDiscard).toEqual(
      { code: "2C", image: "http://www.pic.com", value: "2", flipped: false, locked: false }
    );
    expect(player.drawnCard).toBeNull();
    expect(game.discardPileHasCards).toEqual(false);

    player.drawnCard = card2;
    expect(card2.flipped).toEqual(false);

    await player.takeDrawnCard(1, game);

    expect(player.cards[1]).toBe(card2);
    expect(game.topDiscard).toBe(card1);
    expect(card1.flipped).toEqual(true);
    expect(card2.flipped).toEqual(true);
    expect(player.drawnCard).toBeNull();
    expect(game.discardPileHasCards).toEqual(true);
  });
});
