import { Player, Game, Card } from "./models.js";

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

/** Get Card instance from id of HTML element affiliated with the card
 *
 * Takes:
 * - id: string of id of an HTML card element
 * - game: Game instance
 * Returns: Card instance
 */

function getCardFromCardSpaceID(id: string, game: Game): Card {
  const playerInd = Number(id[1]) - 1;
  const cardInd = Number(id[3]);

  return game.players[playerInd].cards[cardInd];
}

/** Get index of Card from id of HTML element affiliated with the Card
 *
 * Takes: id, a string of id of an HTML card element
 * Returns: number, representing index of Card
 */

function getIndFromCardSpaceId(id: string): number {
  return Number(id[3]);
}

/** Given a Card's index and the Player who has the Card, get the id of the
 *  HTML element affiliated with the Card
 *
 * Takes:
 * - cardInd: a number representing a Card's index
 * - player: a Player instance
 * - game: a Game instance
 *
 * Returns: the id of an HTML card element
 */

function getCardSpaceId(cardInd: number, player: Player, game: Game): string {
  const playerInd = game.players.indexOf(player);
  return `p${playerInd + 1}-${cardInd}`;
}



/*******************************************************************************
 * Helpers functions used for computer player moves
*/

/** Randomly choose an index of card to flip from among reasonable choices
 *
 * Takes: player, a Player instance
 * Returns: number representing an index in an array of Card instances
 */

function randSelectCardInd(player: Player): number {
  const unflippedInds = getUnflippedInds(player);

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

  const passedInds: Record<number, number> = {}
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
function getUnflippedInds(player: Player): number[] {
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
  const unflippedInds = getUnflippedInds(game.currPlayer);

  return (getBestInds(unflippedInds).length >= 2);
}

// true if top discard matches one of currplayer's flipped cards
function matchWithDiscard(game: Game, player: Player): boolean {
  const flippedCards = player.cards.filter(card => card.flipped);
  return flippedCards.some(card => card.value === game.topDiscard?.value);
}

// chance function
function chanceTrue(chance: number): boolean {
  return Math.random() < chance;
}



export {
  randSelectPlayer, getNextPlayer, randSelectCardInd, getCardFromCardSpaceID,
  getIndFromCardSpaceId, getCardSpaceId, unflippedCol, chanceTrue, matchWithDiscard
};
