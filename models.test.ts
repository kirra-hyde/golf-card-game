import { describe, test, it, expect } from "vitest";
import { Game, Player, Card, BASE_URL } from "./models";
import axios from "axios";
import MockAdaptor from "axios-mock-adapter";

const mock = new MockAdaptor(axios);

const testPlayerNames = ["p1", "p2", "p3", "p4"];
const testPlayers = testPlayerNames.map(name => new Player(name));
const testPlayer = new Player("test player");
const testGame = new Game("123", testPlayers);
const testCard = new Card("8", "http://www.pic.com", "8C");
const testCard2 = new Card("9", "http://www.pic.com", "9C");
const testCard3 = new Card("10", "http://www.pic.com", "0C");

describe("Card", function () {
  test("Card created correctly", function () {
    const card = new Card("ACE", "http://www.pic.com", "AD");
    expect(card.code).toEqual("AD");
    expect(card.value).toEqual("ACE");
    expect(card.image).toEqual("http://www.pic.com");
    expect(card.flipped).toEqual(false);
  });
});

describe("Game", function () {

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
        { code: "1S", image: "www.pic1.com", value: "ACE", flipped: false },
        { code: "2S", image: "www.pic2.com", value: "2", flipped: false },
        { code: "3S", image: "www.pic3.com", value: "3", flipped: false },
        { code: "4S", image: "www.pic4.com", value: "4", flipped: false },
        { code: "5S", image: "www.pic5.com", value: "5", flipped: false },
        { code: "6S", image: "www.pic6.com", value: "6", flipped: false },
      ]);
    }

    expect(game.topDiscard?.code).toEqual("7S");
  });

  test("switchTurn", function () {
    const game = testGame;
    game.currPlayer = game.players[2];

    game.switchTurn();
    expect(game.currPlayer).toEqual(game.players[3]);

    game.switchTurn();
    expect(game.currPlayer).toEqual(game.players[0]);
  });

  test("reshuffle", async function () {
    const game = testGame;
    const card = testCard;
    game.topDiscard = card;

    mock.onGet(`${BASE_URL}/${game.deckID}/pile/discard/add`).reply(200);
    mock.onGet(`${BASE_URL}/${game.deckID}/pile/discard/return`).reply(200);
    mock.onGet(`${BASE_URL}/${game.deckID}/shuffle`).reply(200);

    expect(game.topDiscard).toBeInstanceOf(Card);

    await game.reshuffle();
    expect(game.topDiscard).toBeNull();
  });
});

describe("Player", function () {
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

  test("drawFromDeck", async function () {
    const game = testGame;
    const player = testPlayer;

    mock.onGet(`${BASE_URL}/${game.deckID}/draw`).reply(200, {
      success: true,
      cards: [{ value: "KING", image: "www.pic.com", code: "KH" }]
    });

    await player.drawFromDeck(game);

    expect(player.drawnCard).toBeInstanceOf(Card);
    expect(player.drawnCard).toEqual({
      code: "KH",
      value: "KING",
      flipped: false,
      image: "www.pic.com"
    });
  });

  test("drawFromDiscards", function () {
    const game = testGame;
    const player = testGame.players[0];
    const card = testCard;

    game.topDiscard = card;

    expect(player.drawnCard).toBeNull();

    player.drawFromDiscards(game);

    expect(player.drawnCard).toBe(card);
    expect(game.topDiscard).toBeNull();
  });

  test("discardDrawnCard", async function () {
    const game = testGame;
    const player = testGame.players[0];
    const card = testCard;

    player.drawnCard = card;

    expect(game.topDiscard).toBeNull();

    await player.discardDrawnCard(game);

    expect(game.topDiscard).toBe(card);
    expect(player.drawnCard).toBeNull();
  });

  test("takeDrawnCard", async function () {
    const game = testGame;
    const player = testGame.players[0];
    const card1 = testCard;
    const card2 = testCard2;
    const card3 = testCard3;

    player.cards = [card1, card2];
    player.drawnCard = card3;

    expect(game.topDiscard).toBeNull();
    expect(card3.flipped).toEqual(false);

    await player.takeDrawnCard(1, game);

    expect(player.cards).toEqual([card1, card3]);
    expect(game.topDiscard).toBe(card2);
    expect(card3.flipped).toEqual(true);
    expect(player.drawnCard).toBeNull();
  });
});
