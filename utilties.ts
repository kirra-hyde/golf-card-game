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
 * - players, an array of Player instances
 * - player, a Player instance from the array
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

/** Get index of Card from id of HTML element affiliated with the Card
 *
 * Takes: id, a string of id of an HTML card element
 * Returns: number, representing index of Card
 */

function getIndFromCardSpaceId(id: string): number {
  return Number(id[3]);
}

/** Get the id of the HTML element of a player's Card
 *
 * Takes:
 * - cardInd: a number representing a Card's index
 * - game: a Game instance
 * - player: a Player instance (defaults to current player)
 *
 * Returns: the id of an HTML card element
 */

function getCardSpaceId(cardInd: number, game: Game, player: Player = game.currPlayer): string {
  const playerInd = getPlayerIndex(game, player);
  return `p${playerInd + 1}-${cardInd}`;
}

/** Get the id of the drawn card space HTML element of the current player
 *
 * Takes: game, a Game instance
 * Returns: a string of the id of a drawn card space HTML element
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
 * - game, a Game instance
 * - player, a Player instance (defaults to current player)
 * Returns: number representing an index in an array of Card instances
 */

function randSelectCardInd(game: Game, player: Player = game.currPlayer): number {
  const unflippedInds = getUnflippedInds(game, player);

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

//Takes player, returns indexes of their unflipped cards
function getUnflippedInds(game: Game, player: Player = game.currPlayer): number[] {
  const unflippedInds: number[] = [];

  for (let i = 0; i < player.cards.length; i++) {
    if (player.cards[i].flipped === false) {
      unflippedInds.push(i);
    }
  }

  return unflippedInds;
}

// true if unflipped column
function unflippedCol(game: Game): boolean {
  const unflippedInds = getUnflippedInds(game);

  return getBestInds(unflippedInds).length >= 2;
}

// true if top discard matches one of passed in player's flipped cards
function matchWithDiscard(game: Game, player: Player = game.currPlayer): boolean {
  const cards = player.cards;
  for (let card of cards) {
    if (card.flipped && !card.locked && (card.value === game.topDiscard?.value)) {
      return true;
    }
  }
  return false;
}

// true if current player's drawn card matches one of their flipped cards
function matchWithDrawnCard(game: Game, player: Player = game.currPlayer): [boolean, number] {
  const cards = player.cards;
  for (let i = 0; i < cards.length; i++) {
    if (cards[i].flipped && !cards[i].locked && (cards[i].value === player.drawnCard?.value)) {
      const ind = i < 3 ? i + 3 : i - 3;
      return [true, ind];
    }
  }
  return [false, -1];
}


/** Makes array of array of point values and indexes of current player's
 * flipped, unlocked cards, from highest point value to lowest.
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

function getLowColPoints(game: Game): [number, number] {
  const cards = game.currPlayer.cards;
  const val = numberifyVal(game.currPlayer.drawnCard?.value as string);

  // Lock a column if it'll have a low score
  let lowColPoints = 20;
  let lowColInd = 6;
  for (let i = 0; i < cards.length; i++) {
    if (!cards[i].locked && cards[i].flipped) {
      const colPoints = numberifyVal(cards[i].value) + val;
      if (colPoints < lowColPoints) {
        lowColPoints = colPoints;
        lowColInd = i < 3 ? i + 3 : i - 3;
      }
    }
  }
  return [lowColPoints, lowColInd];
}

/** Gets record with keys of point values of next players flipped unlocked cards */
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

// What would be best val to swap (if any)?  Return it with its index.
function getBestValToSwap(sortedVals: [number, number][], badVals: Record<number, number>) {
  if (sortedVals.length < 1) {
    return;
  }

  if (!(sortedVals[0][0] in badVals) || chanceTrue(.05)) {
    return sortedVals[0];
  }

  if (sortedVals.length >= 2) {
    sortedVals.shift();
    return getBestValToSwap(sortedVals, badVals);
  }
  return;
}

// Meant for if drawnCard and all flipped cards are in next player's hand
// If it's high, discard it.  Otherwise, take it across from lowest flipped card.
function getIndInPinch(drawnVal: number, sortedVals: [number, number][]): number {
  if (drawnVal > 7 || sortedVals.length < 1) {
    return -1;
  } else {
    const lastInd = sortedVals[sortedVals.length - 1][1];
    return lastInd < 3 ? lastInd + 3 : lastInd - 3;
  }
}

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

// chance function
function chanceTrue(chance: number): boolean {
  return Math.random() < chance;
}


export {
  randSelectPlayer, getNextPlayer, randSelectCardInd, getIndFromCardSpaceId,
  getCardSpaceId, unflippedCol, chanceTrue, matchWithDiscard, getPlayerIndex,
  getDrawnCardSpaceId, sortVals, numberifyVal, getLowColPoints, getUnflippedInds,
  getBestInds, getBadVals, getBestValToSwap, getIndInPinch, matchWithDrawnCard,
};
