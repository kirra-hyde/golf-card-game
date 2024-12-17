import { describe, test, expect, beforeEach, vi } from "vitest";
import { Game, Player, Card } from "./models";
import {
  randSelectPlayer, getNextPlayer, randSelectEmptyColInd, getIndFromCardSpaceId,
  getCardSpaceId, checkForMatch, getPlayerIndex, getDrawnCardSpaceId,
  numberifyVal, getLowColPoints, getEmptyColInds, sortCards, getBadVals,
  getBestToSwap, getIndInPinch, checkAllFlipped, getWinnerInd,
} from "./utilities";


let testPlayer1: Player;
let testPlayer2: Player;
let testPlayer3: Player;
let testPlayer4: Player;
let testPlayers: Player[];
let testGame: Game;

beforeEach(function () {
  testPlayer1 = new Player("p1");
  testPlayer2 = new Player("p2");
  testPlayer3 = new Player("p3");
  testPlayer4 = new Player("p4");
  testPlayers = [testPlayer1, testPlayer2, testPlayer3, testPlayer4];
  testGame = new Game("123", testPlayers);

  const p1CardData = [
    { value: "JACK", image: "pic.com", code: "JD" },
    { value: "4", image: "pic.com", code: "4C" },
    { value: "JACK", image: "pic.com", code: "JH" },
    { value: "7", image: "pic.com", code: "7H" },
    { value: "3", image: "pic.com", code: "3H" },
    { value: "ACE", image: "pic.com", code: "AH" },
  ];
  testPlayer1.cards = p1CardData.map(el => new Card(el.value, el.image, el.code));

  const p2CardData = [
    { value: "3", image: "pic.com", code: "3S" },
    { value: "4", image: "pic.com", code: "4D" },
    { value: "9", image: "pic.com", code: "9H" },
    { value: "QUEEN", image: "pic.com", code: "QH" },
    { value: "ACE", image: "pic.com", code: "AC" },
    { value: "KING", image: "pic.com", code: "KH" },
  ];
  testPlayer2.cards = p2CardData.map(el => new Card(el.value, el.image, el.code));

  const p3CardData = [
    { value: "5", image: "pic.com", code: "5S" },
    { value: "8", image: "pic.com", code: "8S" },
    { value: "3", image: "pic.com", code: "3D" },
    { value: "9", image: "pic.com", code: "9D" },
    { value: "ACE", image: "pic.com", code: "AD" },
    { value: "QUEEN", image: "pic.com", code: "QC" },
  ];
  testPlayer3.cards = p3CardData.map(el => new Card(el.value, el.image, el.code));

  const p4CardData = [
    { value: "JACK", image: "pic.com", code: "JC" },
    { value: "6", image: "pic.com", code: "6D" },
    { value: "4", image: "pic.com", code: "4S" },
    { value: "9", image: "pic.com", code: "9C" },
    { value: "10", image: "pic.com", code: "0H" },
    { value: "QUEEN", image: "pic.com", code: "QS" },
  ];
  testPlayer4.cards = p4CardData.map(el => new Card(el.value, el.image, el.code));
});


describe("misc utilities", function () {
  test("randSelectPlayer", function () {
    expect(randSelectPlayer(testPlayers)).toBeInstanceOf(Player);
    expect(testPlayers).toContain(randSelectPlayer(testPlayers));
  });

  test("getNextPlayer", function () {
    expect(getNextPlayer(testPlayers, testPlayer1)).toBe(testPlayer2);
    expect(getNextPlayer(testPlayers, testPlayer2)).toBe(testPlayer3);
    expect(getNextPlayer(testPlayers, testPlayer4)).toBe(testPlayer1);
  });

  test("checkAllFlipped", function () {
    for (let i = 0; i < 5; i++) {
      testPlayer1.cards[i].flipped = true;
    }
    for (let i = 0; i < 6; i++) {
      testPlayer2.cards[i].flipped = true;
    }
    for (let i = 1; i < 6; i++) {
      testPlayer4.cards[i].flipped = true;
    }

    testGame.currPlayer = testPlayer1;
    expect(checkAllFlipped(testGame)).toEqual(false);
    testGame.currPlayer = testPlayer2;
    expect(checkAllFlipped(testGame)).toEqual(true);
    testGame.currPlayer = testPlayer3;
    expect(checkAllFlipped(testGame)).toEqual(false);
    testGame.currPlayer = testPlayer4;
    expect(checkAllFlipped(testGame)).toEqual(false);
  });

  test("getWinnerInd", function () {
    testGame.scores = [54, 77, 37, 98];
    expect(getWinnerInd(testGame)).toEqual(2);
    testGame.scores = [0, 77, 37, 9];
    expect(getWinnerInd(testGame)).toEqual(0);
  });

  test("numberifyVal", function() {
    expect(numberifyVal("KING")).toEqual(0);
    expect(numberifyVal("ACE")).toEqual(1);
    expect(numberifyVal("3")).toEqual(3);
    expect(numberifyVal("10")).toEqual(10);
    expect(numberifyVal("JACK")).toEqual(10);
    expect(numberifyVal("QUEEN")).toEqual(10);
  });

  test("getIndFromCardSpaceId", function () {
    expect(getIndFromCardSpaceId("p2-3")).toEqual(3);
  });

  test("getCardSpaceId", function () {
    testGame.currPlayer = testPlayer4;
    expect(getCardSpaceId(0, testGame)).toEqual("p4-0");
    expect(getCardSpaceId(3, testGame, testPlayer2)).toEqual("p2-3");
  });

  test("getDrawnCardSpaceId", function () {
    testGame.currPlayer = testPlayer1;
    expect(getDrawnCardSpaceId(testGame)).toEqual("drawn-card-1");
  });

  test("getPlayerIndex", function () {
    testGame.currPlayer = testPlayer2;
    expect(getPlayerIndex(testGame)).toEqual(1);
    expect(getPlayerIndex(testGame, testPlayer1)).toEqual(0);
  });
});

describe("computer AI helpers", function () {
  test("randSelectEmptyColInd", function () {
    testGame.currPlayer = testPlayer3;
    Math.random = vi.fn(() => .3);
    expect(randSelectEmptyColInd(testGame)).toEqual(3);
    Math.random = vi.fn(() => .7);
    expect(randSelectEmptyColInd(testGame)).toEqual(2);
    testPlayer3.cards[0].flipped = true;
    testPlayer3.cards[1].flipped = true;
    testPlayer3.cards[3].flipped = true;
    testPlayer3.cards[4].flipped = true;
    Math.random = vi.fn(() => .4);
    expect(randSelectEmptyColInd(testGame)).toEqual(2);
    Math.random = vi.fn(() => .6);
    expect(randSelectEmptyColInd(testGame)).toEqual(5);
    testPlayer3.cards[2].flipped = true;
    expect(randSelectEmptyColInd(testGame)).toBeUndefined();
  });

  test("getEmptyColInds", function () {
    testGame.currPlayer = testPlayer4;

    expect(getEmptyColInds(testGame)).toEqual([0, 3, 1, 4, 2, 5]);
    testPlayer4.cards[0].flipped = true;
    expect(getEmptyColInds(testGame)).toEqual([1, 4, 2, 5]);
    testPlayer4.cards[3].flipped = true;
    expect(getEmptyColInds(testGame)).toEqual([1, 4, 2, 5]);
    testPlayer4.cards[4].flipped = true;
    expect(getEmptyColInds(testGame)).toEqual([2, 5]);
    testPlayer4.cards[2].flipped = true;
    expect(getEmptyColInds(testGame)).toEqual([]);
  });

  test("checkForMatch", function () {
    testGame.currPlayer = testPlayer1;
    testGame.topDiscard = new Card("7", "pic.com", "7S");
    testPlayer1.drawnCard = new Card("JACK", "pic.com", "JC");
    for (let i = 0; i < 3; i++) {
      testPlayer1.cards[i].flipped = true;
    }
    expect(checkForMatch(testGame, testGame.topDiscard)).toEqual([false, -1]);
    expect(checkForMatch(testGame, testPlayer1.drawnCard)).toEqual([true, 3]);
    testPlayer1.cards[3].flipped = true;
    testPlayer1.cards[3].locked = true;
    testPlayer1.cards[0].locked = true;
    expect(checkForMatch(testGame, testGame.topDiscard)).toEqual([false, -1]);
    expect(checkForMatch(testGame, testPlayer1.drawnCard)).toEqual([true, 5]);
    testPlayer2.cards[4].flipped = true;
    testGame.topDiscard = new Card("ACE", "pic.com", "AS");
    expect(checkForMatch(testGame, testGame.topDiscard, testPlayer2)).toEqual([true, 1]);
  });

  test("sortCards", function () {
    testGame.currPlayer = testPlayer2;
    testPlayer2.cards[2].flipped = true;
    testPlayer2.cards[2].locked = true;
    testPlayer2.cards[3].flipped = true;
    testPlayer2.cards[4].flipped = true;
    testPlayer2.cards[5].flipped = true;
    testPlayer2.cards[5].locked = true;
    expect(sortCards(testGame)).toEqual([testPlayer2.cards[3], testPlayer2.cards[4]]);
    testPlayer2.cards[5].flipped = false;
    testPlayer2.cards[5].locked = false;
    testPlayer2.cards[2].locked = false;
    expect(sortCards(testGame)).toEqual([testPlayer2.cards[3], testPlayer2.cards[2], testPlayer2.cards[4]]);

    testGame.currPlayer = testPlayer3;
    testPlayer3.cards[1].flipped = true;
    testPlayer3.cards[1].locked = true;
    testPlayer3.cards[4].flipped = true;
    testPlayer3.cards[4].locked = true;
    expect(sortCards(testGame)).toEqual([]);
    testPlayer3.cards[1].locked = false;
    testPlayer3.cards[4].flipped = false;
    testPlayer3.cards[4].locked = false;
    testPlayer3.cards[3].flipped = true;
    testPlayer3.cards[5].flipped = true;
    expect(sortCards(testGame)).toEqual([testPlayer3.cards[5], testPlayer3.cards[3], testPlayer3.cards[1]]);
  });

  test("getLowColPoints", function () {
    testGame.currPlayer = testPlayer4;
    testPlayer4.cards[1].locked = true;
    testPlayer4.cards[1].flipped = true;
    testPlayer4.cards[4].locked = true;
    testPlayer4.cards[4].flipped = true;
    testPlayer4.cards[2].locked = true;
    testPlayer4.cards[2].flipped = true;
    testPlayer4.cards[5].locked = true;
    testPlayer4.cards[5].flipped = true;
    testPlayer4.cards[0].flipped = true;
    testGame.topDiscard = new Card("7", "pic.com", "7S");
    testPlayer4.drawnCard = new Card("JACK", "pic.com", "JC");
    expect(getLowColPoints(testGame, testGame.topDiscard)).toEqual([17, 3]);
    expect(getLowColPoints(testGame, testPlayer4.drawnCard)).toEqual([20, 3]);

    testGame.currPlayer = testPlayer1;
    testPlayer1.cards[0].flipped = true;
    testPlayer1.cards[2].flipped = true;
    testPlayer1.cards[4].flipped = true;
    expect(getLowColPoints(testGame, testGame.topDiscard)).toEqual([10, 1]);
  });

  test("getBadVals", function() {
    testGame.currPlayer = testPlayer2;
    testPlayer3.cards[1].flipped = true;
    testPlayer3.cards[1].locked = true;
    testPlayer3.cards[4].flipped = true;
    testPlayer3.cards[4].locked = true;
    testPlayer3.cards[2].flipped = true;
    testPlayer3.cards[3].flipped = true;
    expect(getBadVals(testGame)).toEqual({3: 1, 9: 1});
    testPlayer3.cards[2].flipped = false;
    testPlayer3.cards[3].flipped = false;
    expect(getBadVals(testGame)).toEqual({});
  });

  test("getBestToSwap", function() {
    testGame.currPlayer = testPlayer3;
    testPlayer3.cards[3].flipped = true;
    testPlayer3.cards[4].flipped = true;
    testPlayer3.cards[5].flipped = true;
    expect(getBestToSwap(testGame)).toEqual(testPlayer3.cards[5]);
    testPlayer4.cards[3].flipped = true;
    testPlayer4.cards[4].flipped = true;
    testPlayer4.cards[5].flipped = true;
    Math.random = vi.fn(() => .8);
    expect(getBestToSwap(testGame)).toEqual(testPlayer3.cards[4]);
    Math.random = vi.fn(() => .03);
    expect(getBestToSwap(testGame)).toEqual(testPlayer3.cards[5]);
    testPlayer3.cards[4].locked = true;
    testPlayer3.cards[1].locked = true;
    testPlayer3.cards[1].flipped = true;
    Math.random = vi.fn(() => .8);
    expect(getBestToSwap(testGame)).toBeUndefined();
  });

  test("getIndInPinch", function() {
    testGame.currPlayer = testPlayer3;
    testPlayer3.cards[3].flipped = true;
    testPlayer3.cards[4].flipped = true;
    testPlayer3.cards[5].flipped = true;

    Math.random = vi.fn(() => .6);
    expect(getIndInPinch(testGame, 9)).toEqual(-1);
    Math.random = vi.fn(() => .8);
    expect(getIndInPinch(testGame, 9)).toEqual(1);

    Math.random = vi.fn(() => .6);
    expect(getIndInPinch(testGame, 6)).toEqual(1);
    testPlayer3.cards[4].locked = true;
    expect(getIndInPinch(testGame, 6)).toEqual(0);
  });
});