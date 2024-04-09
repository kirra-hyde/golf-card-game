import { Player, Game } from "./models.js";

function randPlayer(players: Player[]): Player {
  const playerNum = Math.floor(Math.random() * players.length);
  return players[playerNum];
}

function changePlayer(game: Game): Player {
  const currPlayerInd = game.players.indexOf(game.currPlayer);
  if ((currPlayerInd + 1) < game.players.length) {
    return game.players[currPlayerInd + 1];
  } else {
    return game.players[0];
  }
}

function getPrevPlayer(game: Game): Player {
  const currPlayerInd = game.players.indexOf(game.currPlayer);
  if ((currPlayerInd - 1) >= 0) {
    return game.players[currPlayerInd - 1];
  } else {
    return game.players[game.players.length - 1];
  }
}

// Takes a player.  Makes an array of the indices of the player's already flipped cards.  Returns an index of card to be flipped.
function randComputerFlip(player: Player): number {
  const flippedInds: number[] = [];

  for (let i = 0; i < player.cards.length; i++) {
    if (player.cards[i].flipped === true) {
      flippedInds.push(i);
    }
  }
  return randInd(flippedInds);
}

// Takes array of indices of flipped cards.  Returns a random index of unflipped card that's not in a line with a flipped card.
function randInd(inds: number[]): number {
  const wrongInds: number[] = [];

  for (let ind of inds) {
    wrongInds.push(ind);
    if (ind < 3) {
      wrongInds.push(ind + 3);
    } else if (ind >= 3) {
      wrongInds.push(ind - 3);
    }
  }

  const rightInds: number[] = [];

  for (let i = 0; i < 6; i++) {
    if (!wrongInds.includes(i)) {
      rightInds.push(i);
    }
  }

  const randIndInd = (Math.floor(Math.random() * rightInds.length));
  return rightInds[randIndInd];
}

export { randPlayer, changePlayer, randComputerFlip, getPrevPlayer };
