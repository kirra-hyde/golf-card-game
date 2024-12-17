import { describe, it, expect, beforeEach } from 'vitest';
import { randSelectPlayer, getNextPlayer, checkAllFlipped, getWinnerInd,
  numberifyVal, getIndFromCardSpaceId, getCardSpaceId, getDrawnCardSpaceId,
  getDrawnCardBackground } from './utilities';
import { Player, Game, Card } from './models';

let testPlayers: Player[];
let testGame: Game;
let testCards: Card[];

beforeEach(function () {
  testPlayers = [
    new Player('Player 1'),
    new Player('Player 2'),
    new Player('Player 3'),
    new Player('Player 4'),
  ];

  testGame = new Game("123", testPlayers);

  testCards = [
    new Card("ACE", "www.pic.com", "AS"),
    new Card("2", "www.pic.com", "2C"),
    new Card("3", "www.pic.com", "3H"),
    new Card("4", "www.pic.com", "4D"),
    new Card("5", "www.pic.com", "5C"),
    new Card("6", "www.pic.com", "6S"),
  ];

  for (let player of testPlayers) {
    player.cards = testCards;
  }
});

describe('randSelectPlayer', () => {
  it('should return a player from the given array of players', () => {
    const selectedPlayer = randSelectPlayer(testPlayers);

    expect(testPlayers).toContain(selectedPlayer);
  });
});

describe('getNextPlayer', () => {
  it('should return the next player in the array', () => {
    const nextPlayer = getNextPlayer(testPlayers, testPlayers[0]);

    expect(nextPlayer).toBe(testPlayers[1]);
  });

  it('should return the first player when the given player is the last in the array', () => {
    const nextPlayer = getNextPlayer(testPlayers, testPlayers[testPlayers.length - 1]);

    expect(nextPlayer).toBe(testPlayers[0]);
  });
});

describe('checkAllFlipped', () => {
  it('should return true if all of the current player\'s cards are flipped', () => {
    for (let card of testGame.currPlayer.cards) {
      card.flipped = true;
    }

    const allFlipped = checkAllFlipped(testGame);

    expect(allFlipped).toBe(true);
  });

  it('should return false if not all of the current player\'s cards are flipped', () => {
    testGame.currPlayer.cards[0].flipped = true;
    testGame.currPlayer.cards[1].flipped = false;

    const allFlipped = checkAllFlipped(testGame);

    expect(allFlipped).toBe(false);
  });
});

describe('getWinnerInd', () => {
  it('should return the index of the player with the lowest score', () => {
    testGame.scores = [10, 5, 8, 12];
    const winnerInd = getWinnerInd(testGame);

    expect(winnerInd).toBe(1);
  });

  it('should handle ties by returning the index of the first player with the lowest score', () => {
    testGame.scores = [10, 5, 5, 12];
    const winnerInd = getWinnerInd(testGame);

    expect(winnerInd).toBe(1);
  });

  it('should return the correct index when all players have the same score', () => {
    testGame.scores = [5, 5, 5, 5];
    const winnerInd = getWinnerInd(testGame);

    expect(winnerInd).toBe(0);
  });

  it('should return the correct index when scores are in descending order', () => {
    testGame.scores = [12, 10, 8, 5];
    const winnerInd = getWinnerInd(testGame);

    expect(winnerInd).toBe(3);
  });

  it('should return the correct index when scores are in ascending order', () => {
    testGame.scores = [5, 8, 10, 12];
    const winnerInd = getWinnerInd(testGame);

    expect(winnerInd).toBe(0);
  });
});

describe('numberifyVal', () => {
  it('should return the correct point value for KING', () => {
    expect(numberifyVal("KING")).toBe(0);
  });

  it('should return the correct point value for ACE', () => {
    expect(numberifyVal("ACE")).toBe(1);
  });

  it('should return the correct point value for JACK', () => {
    expect(numberifyVal("JACK")).toBe(10);
  });

  it('should return the correct point value for QUEEN', () => {
    expect(numberifyVal("QUEEN")).toBe(10);
  });

  it('should return the correct point value for numeric cards', () => {
    expect(numberifyVal("3")).toBe(3);
  });

  it('should handle invalid values by returning NaN', () => {
    expect(numberifyVal("INVALID")).toBeNaN();
  });
});

describe('getIndFromCardSpaceId', () => {
  it('should return the correct index from a card space id', () => {
    expect(getIndFromCardSpaceId("p1-3")).toBe(3);
    expect(getIndFromCardSpaceId("p2-0")).toBe(0);
    expect(getIndFromCardSpaceId("p3-5")).toBe(5);
    expect(getIndFromCardSpaceId("p4-1")).toBe(1);
  });
});

describe('getCardSpaceId', () => {
  it('should return the correct card space id for a given card index and player', () => {
    expect(getCardSpaceId(2, testGame, testPlayers[0])).toBe("p1-2");
    expect(getCardSpaceId(0, testGame, testPlayers[1])).toBe("p2-0");
    expect(getCardSpaceId(4, testGame, testPlayers[2])).toBe("p3-4");
    expect(getCardSpaceId(1, testGame, testPlayers[3])).toBe("p4-1");
  });

  it('should return the correct card space id for a given card index and the current player', () => {
    testGame.currPlayer = testPlayers[0];
    expect(getCardSpaceId(3, testGame)).toBe("p1-3");
    testGame.currPlayer = testPlayers[1];
    expect(getCardSpaceId(1, testGame)).toBe("p2-1");
    testGame.currPlayer = testPlayers[2];
    expect(getCardSpaceId(5, testGame)).toBe("p3-5");
    testGame.currPlayer = testPlayers[3];
    expect(getCardSpaceId(2, testGame)).toBe("p4-2");
  });
});

describe('getDrawnCardSpaceId', () => {
  it('should return the correct drawn card space id for the current player', () => {
    testGame.currPlayer = testPlayers[0];
    expect(getDrawnCardSpaceId(testGame)).toBe("drawn-card-1");
    testGame.currPlayer = testPlayers[1];
    expect(getDrawnCardSpaceId(testGame)).toBe("drawn-card-2");
    testGame.currPlayer = testPlayers[2];
    expect(getDrawnCardSpaceId(testGame)).toBe("drawn-card-3");
    testGame.currPlayer = testPlayers[3];
    expect(getDrawnCardSpaceId(testGame)).toBe("drawn-card-4");
  });
});












// import { describe, test, expect, beforeEach, vi } from "vitest";
// import { Game, Player, Card } from "./models";
// import {
//   randSelectPlayer, getNextPlayer, randSelectEmptyColInd, getIndFromCardSpaceId,
//   getCardSpaceId, checkForMatch, getPlayerIndex, getDrawnCardSpaceId,
//   numberifyVal, getLowColPoints, getEmptyColInds, sortCards, getBadVals,
//   getBestToSwap, getIndInPinch, checkAllFlipped, getWinnerInd,
// } from "./utilities";


// let testPlayer1: Player;
// let testPlayer2: Player;
// let testPlayer3: Player;
// let testPlayer4: Player;
// let testPlayers: Player[];
// let testGame: Game;

// beforeEach(function () {
//   testPlayer1 = new Player("p1");
//   testPlayer2 = new Player("p2");
//   testPlayer3 = new Player("p3");
//   testPlayer4 = new Player("p4");
//   testPlayers = [testPlayer1, testPlayer2, testPlayer3, testPlayer4];
//   testGame = new Game("123", testPlayers);

//   const p1CardData = [
//     { value: "JACK", image: "pic.com", code: "JD" },
//     { value: "4", image: "pic.com", code: "4C" },
//     { value: "JACK", image: "pic.com", code: "JH" },
//     { value: "7", image: "pic.com", code: "7H" },
//     { value: "3", image: "pic.com", code: "3H" },
//     { value: "ACE", image: "pic.com", code: "AH" },
//   ];
//   testPlayer1.cards = p1CardData.map(el => new Card(el.value, el.image, el.code));

//   const p2CardData = [
//     { value: "3", image: "pic.com", code: "3S" },
//     { value: "4", image: "pic.com", code: "4D" },
//     { value: "9", image: "pic.com", code: "9H" },
//     { value: "QUEEN", image: "pic.com", code: "QH" },
//     { value: "ACE", image: "pic.com", code: "AC" },
//     { value: "KING", image: "pic.com", code: "KH" },
//   ];
//   testPlayer2.cards = p2CardData.map(el => new Card(el.value, el.image, el.code));

//   const p3CardData = [
//     { value: "5", image: "pic.com", code: "5S" },
//     { value: "8", image: "pic.com", code: "8S" },
//     { value: "3", image: "pic.com", code: "3D" },
//     { value: "9", image: "pic.com", code: "9D" },
//     { value: "ACE", image: "pic.com", code: "AD" },
//     { value: "QUEEN", image: "pic.com", code: "QC" },
//   ];
//   testPlayer3.cards = p3CardData.map(el => new Card(el.value, el.image, el.code));

//   const p4CardData = [
//     { value: "JACK", image: "pic.com", code: "JC" },
//     { value: "6", image: "pic.com", code: "6D" },
//     { value: "4", image: "pic.com", code: "4S" },
//     { value: "9", image: "pic.com", code: "9C" },
//     { value: "10", image: "pic.com", code: "0H" },
//     { value: "QUEEN", image: "pic.com", code: "QS" },
//   ];
//   testPlayer4.cards = p4CardData.map(el => new Card(el.value, el.image, el.code));
// });


// describe("misc utilities", function () {
//   test("randSelectPlayer", function () {
//     expect(randSelectPlayer(testPlayers)).toBeInstanceOf(Player);
//     expect(testPlayers).toContain(randSelectPlayer(testPlayers));
//   });

//   test("getNextPlayer", function () {
//     expect(getNextPlayer(testPlayers, testPlayer1)).toBe(testPlayer2);
//     expect(getNextPlayer(testPlayers, testPlayer2)).toBe(testPlayer3);
//     expect(getNextPlayer(testPlayers, testPlayer4)).toBe(testPlayer1);
//   });

//   test("checkAllFlipped", function () {
//     for (let i = 0; i < 5; i++) {
//       testPlayer1.cards[i].flipped = true;
//     }
//     for (let i = 0; i < 6; i++) {
//       testPlayer2.cards[i].flipped = true;
//     }
//     for (let i = 1; i < 6; i++) {
//       testPlayer4.cards[i].flipped = true;
//     }

//     testGame.currPlayer = testPlayer1;
//     expect(checkAllFlipped(testGame)).toEqual(false);
//     testGame.currPlayer = testPlayer2;
//     expect(checkAllFlipped(testGame)).toEqual(true);
//     testGame.currPlayer = testPlayer3;
//     expect(checkAllFlipped(testGame)).toEqual(false);
//     testGame.currPlayer = testPlayer4;
//     expect(checkAllFlipped(testGame)).toEqual(false);
//   });

//   test("getWinnerInd", function () {
//     testGame.scores = [54, 77, 37, 98];
//     expect(getWinnerInd(testGame)).toEqual(2);
//     testGame.scores = [0, 77, 37, 9];
//     expect(getWinnerInd(testGame)).toEqual(0);
//   });

//   test("numberifyVal", function() {
//     expect(numberifyVal("KING")).toEqual(0);
//     expect(numberifyVal("ACE")).toEqual(1);
//     expect(numberifyVal("3")).toEqual(3);
//     expect(numberifyVal("10")).toEqual(10);
//     expect(numberifyVal("JACK")).toEqual(10);
//     expect(numberifyVal("QUEEN")).toEqual(10);
//   });

//   test("getIndFromCardSpaceId", function () {
//     expect(getIndFromCardSpaceId("p2-3")).toEqual(3);
//   });

//   test("getCardSpaceId", function () {
//     testGame.currPlayer = testPlayer4;
//     expect(getCardSpaceId(0, testGame)).toEqual("p4-0");
//     expect(getCardSpaceId(3, testGame, testPlayer2)).toEqual("p2-3");
//   });

//   test("getDrawnCardSpaceId", function () {
//     testGame.currPlayer = testPlayer1;
//     expect(getDrawnCardSpaceId(testGame)).toEqual("drawn-card-1");
//   });

//   test("getPlayerIndex", function () {
//     testGame.currPlayer = testPlayer2;
//     expect(getPlayerIndex(testGame)).toEqual(1);
//     expect(getPlayerIndex(testGame, testPlayer1)).toEqual(0);
//   });
// });

// describe("computer AI helpers", function () {
//   test("randSelectEmptyColInd", function () {
//     testGame.currPlayer = testPlayer3;
//     Math.random = vi.fn(() => .3);
//     expect(randSelectEmptyColInd(testGame)).toEqual(3);
//     Math.random = vi.fn(() => .7);
//     expect(randSelectEmptyColInd(testGame)).toEqual(2);
//     testPlayer3.cards[0].flipped = true;
//     testPlayer3.cards[1].flipped = true;
//     testPlayer3.cards[3].flipped = true;
//     testPlayer3.cards[4].flipped = true;
//     Math.random = vi.fn(() => .4);
//     expect(randSelectEmptyColInd(testGame)).toEqual(2);
//     Math.random = vi.fn(() => .6);
//     expect(randSelectEmptyColInd(testGame)).toEqual(5);
//     testPlayer3.cards[2].flipped = true;
//     expect(randSelectEmptyColInd(testGame)).toBeUndefined();
//   });

//   test("getEmptyColInds", function () {
//     testGame.currPlayer = testPlayer4;

//     expect(getEmptyColInds(testGame)).toEqual([0, 3, 1, 4, 2, 5]);
//     testPlayer4.cards[0].flipped = true;
//     expect(getEmptyColInds(testGame)).toEqual([1, 4, 2, 5]);
//     testPlayer4.cards[3].flipped = true;
//     expect(getEmptyColInds(testGame)).toEqual([1, 4, 2, 5]);
//     testPlayer4.cards[4].flipped = true;
//     expect(getEmptyColInds(testGame)).toEqual([2, 5]);
//     testPlayer4.cards[2].flipped = true;
//     expect(getEmptyColInds(testGame)).toEqual([]);
//   });

//   test("checkForMatch", function () {
//     testGame.currPlayer = testPlayer1;
//     testGame.topDiscard = new Card("7", "pic.com", "7S");
//     testPlayer1.drawnCard = new Card("JACK", "pic.com", "JC");
//     for (let i = 0; i < 3; i++) {
//       testPlayer1.cards[i].flipped = true;
//     }
//     expect(checkForMatch(testGame, testGame.topDiscard)).toEqual([false, -1]);
//     expect(checkForMatch(testGame, testPlayer1.drawnCard)).toEqual([true, 3]);
//     testPlayer1.cards[3].flipped = true;
//     testPlayer1.cards[3].locked = true;
//     testPlayer1.cards[0].locked = true;
//     expect(checkForMatch(testGame, testGame.topDiscard)).toEqual([false, -1]);
//     expect(checkForMatch(testGame, testPlayer1.drawnCard)).toEqual([true, 5]);
//     testPlayer2.cards[4].flipped = true;
//     testGame.topDiscard = new Card("ACE", "pic.com", "AS");
//     expect(checkForMatch(testGame, testGame.topDiscard, testPlayer2)).toEqual([true, 1]);
//   });

//   test("sortCards", function () {
//     testGame.currPlayer = testPlayer2;
//     testPlayer2.cards[2].flipped = true;
//     testPlayer2.cards[2].locked = true;
//     testPlayer2.cards[3].flipped = true;
//     testPlayer2.cards[4].flipped = true;
//     testPlayer2.cards[5].flipped = true;
//     testPlayer2.cards[5].locked = true;
//     expect(sortCards(testGame)).toEqual([testPlayer2.cards[3], testPlayer2.cards[4]]);
//     testPlayer2.cards[5].flipped = false;
//     testPlayer2.cards[5].locked = false;
//     testPlayer2.cards[2].locked = false;
//     expect(sortCards(testGame)).toEqual([testPlayer2.cards[3], testPlayer2.cards[2], testPlayer2.cards[4]]);

//     testGame.currPlayer = testPlayer3;
//     testPlayer3.cards[1].flipped = true;
//     testPlayer3.cards[1].locked = true;
//     testPlayer3.cards[4].flipped = true;
//     testPlayer3.cards[4].locked = true;
//     expect(sortCards(testGame)).toEqual([]);
//     testPlayer3.cards[1].locked = false;
//     testPlayer3.cards[4].flipped = false;
//     testPlayer3.cards[4].locked = false;
//     testPlayer3.cards[3].flipped = true;
//     testPlayer3.cards[5].flipped = true;
//     expect(sortCards(testGame)).toEqual([testPlayer3.cards[5], testPlayer3.cards[3], testPlayer3.cards[1]]);
//   });

//   test("getLowColPoints", function () {
//     testGame.currPlayer = testPlayer4;
//     testPlayer4.cards[1].locked = true;
//     testPlayer4.cards[1].flipped = true;
//     testPlayer4.cards[4].locked = true;
//     testPlayer4.cards[4].flipped = true;
//     testPlayer4.cards[2].locked = true;
//     testPlayer4.cards[2].flipped = true;
//     testPlayer4.cards[5].locked = true;
//     testPlayer4.cards[5].flipped = true;
//     testPlayer4.cards[0].flipped = true;
//     testGame.topDiscard = new Card("7", "pic.com", "7S");
//     testPlayer4.drawnCard = new Card("JACK", "pic.com", "JC");
//     expect(getLowColPoints(testGame, testGame.topDiscard)).toEqual([17, 3]);
//     expect(getLowColPoints(testGame, testPlayer4.drawnCard)).toEqual([20, 3]);

//     testGame.currPlayer = testPlayer1;
//     testPlayer1.cards[0].flipped = true;
//     testPlayer1.cards[2].flipped = true;
//     testPlayer1.cards[4].flipped = true;
//     expect(getLowColPoints(testGame, testGame.topDiscard)).toEqual([10, 1]);
//   });

//   test("getBadVals", function() {
//     testGame.currPlayer = testPlayer2;
//     testPlayer3.cards[1].flipped = true;
//     testPlayer3.cards[1].locked = true;
//     testPlayer3.cards[4].flipped = true;
//     testPlayer3.cards[4].locked = true;
//     testPlayer3.cards[2].flipped = true;
//     testPlayer3.cards[3].flipped = true;
//     expect(getBadVals(testGame)).toEqual({3: 1, 9: 1});
//     testPlayer3.cards[2].flipped = false;
//     testPlayer3.cards[3].flipped = false;
//     expect(getBadVals(testGame)).toEqual({});
//   });

//   test("getBestToSwap", function() {
//     testGame.currPlayer = testPlayer3;
//     testPlayer3.cards[3].flipped = true;
//     testPlayer3.cards[4].flipped = true;
//     testPlayer3.cards[5].flipped = true;
//     expect(getBestToSwap(testGame)).toEqual(testPlayer3.cards[5]);
//     testPlayer4.cards[3].flipped = true;
//     testPlayer4.cards[4].flipped = true;
//     testPlayer4.cards[5].flipped = true;
//     Math.random = vi.fn(() => .8);
//     expect(getBestToSwap(testGame)).toEqual(testPlayer3.cards[4]);
//     Math.random = vi.fn(() => .03);
//     expect(getBestToSwap(testGame)).toEqual(testPlayer3.cards[5]);
//     testPlayer3.cards[4].locked = true;
//     testPlayer3.cards[1].locked = true;
//     testPlayer3.cards[1].flipped = true;
//     Math.random = vi.fn(() => .8);
//     expect(getBestToSwap(testGame)).toBeUndefined();
//   });

//   test("getIndInPinch", function() {
//     testGame.currPlayer = testPlayer3;
//     testPlayer3.cards[3].flipped = true;
//     testPlayer3.cards[4].flipped = true;
//     testPlayer3.cards[5].flipped = true;

//     Math.random = vi.fn(() => .6);
//     expect(getIndInPinch(testGame, 9)).toEqual(-1);
//     Math.random = vi.fn(() => .8);
//     expect(getIndInPinch(testGame, 9)).toEqual(1);

//     Math.random = vi.fn(() => .6);
//     expect(getIndInPinch(testGame, 6)).toEqual(1);
//     testPlayer3.cards[4].locked = true;
//     expect(getIndInPinch(testGame, 6)).toEqual(0);
//   });
// });