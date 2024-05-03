import { Player, Game } from "./models.js";

/** Randomly choose Player from array of Players
 *
 * Takes: players, an array of Player instances
 * Returns: Player instance
 */

function randSelectPlayer(players: Player[]): Player {
  const playerInd = Math.floor(Math.random() * players.length);
  return players[playerInd];
}

/** Get next player from array
 *
 * Takes:
 * - players: an array of Player instances
 * - player: a Player instance from the array
 * Returns: a Player instance of the next Player in array
 */

function getNextPlayer(players: Player[], player: Player): Player {
  const currPlayerInd = players.indexOf(player);
  if ((currPlayerInd + 1) < players.length) {
    return players[currPlayerInd + 1];
  } else {
    return players[0];
  }
}

/** Check if current player has flipped all cards
 *
 * Takes: game, a Game instance
 * Returns: boolean, true if all of the current player's cards are flipped
*/

function checkAllFlipped(game: Game): boolean {
  const cards = game.currPlayer.cards;
  for (let card of cards) {
    if (!card.flipped) {
      return false;
    }
  }
  return true;
}

/** Get the index of the Player who won
 *
 * Takes: game, a Game instance
 * Returns: number, the index in the Game's players array of the winning Player
 */

function getWinnerInd(game: Game): number {
  let lowScore = 100000;
  let lowInd = -1;
  for (let i = 0; i < game.scores.length; i++) {
    if (game.scores[i] < lowScore) {
      lowScore = game.scores[i];
      lowInd = i;
    }
  }
  return lowInd;
}

/** Get index of Card from id of HTML element affiliated with the Card
 *
 * Takes: id, a string of id of an HTML card element
 * Returns: number, representing index of Card
 */

function getIndFromCardSpaceId(id: string): number {
  return Number(id[3]);
}

/** Get the id of the HTML element of a player's card
 *
 * Takes:
 * - cardInd: a number representing a Card's index
 * - game: a Game instance
 * - player: a Player instance (defaults to current player)
 *
 * Returns: string, the id of an HTML card element
 */

function getCardSpaceId(
       cardInd: number, game: Game, player: Player = game.currPlayer): string {
  const playerInd = getPlayerIndex(game, player);
  return `p${playerInd + 1}-${cardInd}`;
}

/** Get the id of the drawn card space HTML element of the current player
 *
 * Takes: game, a Game instance
 * Returns: string, the id of a drawn card space HTML element
 */

function getDrawnCardSpaceId(game: Game): string {
  return `drawn-card-${getPlayerIndex(game) + 1}`;
}

// Get player's index
function getPlayerIndex(game: Game, player: Player = game.currPlayer): number {
  return game.players.indexOf(player);
}

/*******************************************************************************
 * Helpers functions used for computer player moves
*/

/** Randomly choose an index of card to flip from among reasonable choices
 *
 * Takes:
 * - game: a Game instance
 * - player: a Player instance (defaults to current player)
 * Returns: number representing an index in an array of Card instances
 */

function randSelectCardInd(game: Game, plyr: Player = game.currPlayer): number {
  const unflippedInds = getUnflippedInds(game, plyr);

  // Indexes of cards that are good to flip, if any
  const bestInds = getBestInds(unflippedInds);

  // If there are cards that are good to flip, chose randomly from them
  // If there aren't, chose randomly from all unflipped cards
  if (bestInds.length >= 1) {
    return bestInds[Math.floor(Math.random() * bestInds.length)];
  } else {
    return unflippedInds[Math.floor(Math.random() * unflippedInds.length)];
  }
}

/** Get the indexes of unflipped cards that do not have a flipped card
 *  above them or below them
 *
 * Takes: inds, an array of numbers representing indexes of unflipped cards
 * Returns: an array of numbers representing indexes of unflipped cards
 *    that do not have flipped cards above them or below them
 */

function getBestInds(inds: number[]): number[] {
  const bestInds: number[] = [];

  const passedInds: Record<number, number> = {};
  for (let ind of inds) {

    if (ind - 3 in passedInds) {
      bestInds.push(ind);
      bestInds.push(ind - 3);
    }
    passedInds[ind] = 1;
  }

  return bestInds;
}

/** Get the indexes of a Player's unflipped Cards
 *
 * Takes:
 * - game: a Game instance
 * - player: a Player instance (defaults to current player)
 * Returns: an array of numbers of the indexes of unflipped cards
 */

function getUnflippedInds(game: Game, plr: Player = game.currPlayer): number[] {
  const unflippedInds: number[] = [];

  for (let i = 0; i < plr.cards.length; i++) {
    if (plr.cards[i].flipped === false) {
      unflippedInds.push(i);
    }
  }

  return unflippedInds;
}

/** Check if there is a column where neither Card is flipped
 *
 * Takes: game, a Game instance
 * Returns: boolean, true if there is an unflipped column, otherwise false
 */

function unflippedCol(game: Game): boolean {
  const unflippedInds = getUnflippedInds(game);

  return getBestInds(unflippedInds).length >= 2;
}

/** Check if top discard Card matches one of Player's flipped, swappable Cards
 *
 * Takes:
 * - game: a Game instance
 * - player: a Player instance (defaults to current player)
 * Returns: boolean, true if there's a match, otherwise false
 */

function matchWithDiscard(game: Game, plyr: Player = game.currPlayer): boolean {
  const cards = plyr.cards;
  for (let card of cards) {
    const topDiscard = game.topDiscard?.value;
    if (card.flipped && !card.locked && (card.value === topDiscard)) {
      return true;
    }
  }
  return false;
}

/** Check if currPlayer's drawnCard matches one of their flipped, swappable Cards
 *
 * Takes: game, a Game instance
 * Returns an array of a boolean and a number.  The boolean is true if there's
 *   a match, otherwise false. The number is the index of the matching card,
 *   or -1 if there is no match.
 */

function matchWithDrawnCard(game: Game): [boolean, number] {
  const cards = game.currPlayer.cards;
  for (let i = 0; i < cards.length; i++) {
    const drawnVal = game.currPlayer.drawnCard?.value;
    if (cards[i].flipped && !cards[i].locked && (cards[i].value === drawnVal)) {
      const ind = i < 3 ? i + 3 : i - 3;
      return [true, ind];
    }
  }
  return [false, -1];
}


/** Make array of array of point values and indexes of current player's
 *  flipped, not locked cards. Sorts them from highest point value to lowest.
 *
 * Takes: game, a Game instance
 * Returns: array of arrays of two numbers. The 1st number represents a Card's
 *   point value, the 2nd its index. Arrays are ordered by point value.
 */

function sortVals(game: Game): [number, number][] {
  const cards = game.currPlayer.cards;
  const sortedVals: [number, number][] = [];
  for (let i = 0; i < cards.length; i++) {
    if (cards[i].flipped && !cards[i].locked) {
      const val = numberifyVal(cards[i].value);
      sortedVals.push([val, i]);
    }
  }
  sortedVals.sort((a, b) => {
    if (a[0] > b[0]) {
      return -1;
    } else {
      return 1;
    }
  });
  return sortedVals;
}

/** For deciding whether to lock in a column. Find the lowest point value
 * flipped Card in an unlocked column. Find what the total column point value
 * would be if Player took their drawn card in the unflipped spot in that column.
 *
 * Takes: game, a Game instance
 * Returns: array of two numbers. The 1st represents the potential column point
 *   value. The 2nd represents the index of the unflipped card in that column.
 */

function getLowColPoints(game: Game): [number, number] {
  const cards = game.currPlayer.cards;
  const drawnVal = numberifyVal(game.currPlayer.drawnCard?.value as string);

  let lowColPoints = 21;
  let lowColInd = 6;
  for (let i = 0; i < cards.length; i++) {
    if (!cards[i].locked && cards[i].flipped) {
      const colPoints = numberifyVal(cards[i].value) + drawnVal;
      if (colPoints < lowColPoints) {
        lowColPoints = colPoints;
        lowColInd = i < 3 ? i + 3 : i - 3;
      }
    }
  }
  return [lowColPoints, lowColInd];
}

/** Get the values of the next Player's unflipped, not locked cards
 *
 * Takes: game, a Game instance
 * Returns: object where the keys represent Card values
 */

function getBadVals(game: Game): Record<number, number> {
  const nextCards = getNextPlayer(game.players, game.currPlayer).cards;
  const badVals: Record<number, number> = {};
  for (let card of nextCards) {
    if (card.flipped && !card.locked) {
      badVals[numberifyVal(card.value)] = 1;
    }
  }
  return badVals;
}

/** Get the value and index of the flipped, not locked Card that would be best
 *  to discard--the Card worth the most points that the next player doesn't want
 *
 * Takes:
 * - sortedValsWithInd: array of arrays of two numbers, representing the point
 *   values and indexes of a Player's unflipped, not locked Cards
 * - badVals: object where the keys represent card values the next player wants
 * Returns: an array of 2 numbers represening the point value and index of the
 *   card that would be best to discard, if any.  If none found, undefined
 */

function getBestValToSwap(
      sortedValsWithInds: [number, number][],
      badVals: Record<number, number>
    ): [number, number] | undefined {
  if (sortedValsWithInds.length < 1) {
    return;
  }

  if (!(sortedValsWithInds[0][0] in badVals) || chanceTrue(.05)) {
    return sortedValsWithInds[0];
  }

  if (sortedValsWithInds.length >= 2) {
    sortedValsWithInds.shift();
    return getBestValToSwap(sortedValsWithInds, badVals);
  }
  return;
}

/** Decide whether to take or discard the drawnCard when its not a good Card,
 *  but the next player wants it AND wants all the flipped, not locked Cards
 *
 * Takes:
 * - drawnVal: number representing the value of the current Player's drawnCard
 * - srtdVals: array of arrays of 2 numbers of the point values and indexes of
 *   current player's flipped, not locked cards, sorted by point value
 * Returns: number of index to take drawnCard at, or -1 to discard it
 */

function getIndInPinch(drawnVal: number, srtdVals: [number, number][]): number {
  if ((drawnVal > 7 && chanceTrue(.75)) || srtdVals.length < 1) {
    return -1;
  } else {
    // Last item in sortedVals will have lowest point value
    const lastInd = srtdVals[srtdVals.length - 1][1];
    // Take Card at index across from Card with lowest point value
    return lastInd < 3 ? lastInd + 3 : lastInd - 3;
  }
}

/** Covertts Card's value to it numerical point value
 *
 * Takes: string representing a Card's value
 * Returns: number representing a Card's point value
 */

function numberifyVal(val: string): number {
  let points: number;
  switch (val) {
    case "KING":
      points = 0;
      break;
    case "ACE":
      points = 1;
      break;
    case "JACK":
      points = 10;
      break;
    case "QUEEN":
      points = 10;
      break;
    default:
      points = Number(val);
  }
  return points;
}

/** Return true a percent of the time determined by passed in number
 *
 * Takes: chance, number representing the percentage it should return true
 * Returns: boolean
 */

function chanceTrue(chance: number): boolean {
  return Math.random() < chance;
}


export {
  randSelectPlayer, getNextPlayer, randSelectCardInd, getIndFromCardSpaceId,
  getCardSpaceId, unflippedCol, chanceTrue, matchWithDiscard, getPlayerIndex,
  getDrawnCardSpaceId, sortVals, numberifyVal, getLowColPoints, getUnflippedInds,
  getBestInds, getBadVals, getBestValToSwap, getIndInPinch, matchWithDrawnCard,
  checkAllFlipped, getWinnerInd,
};
