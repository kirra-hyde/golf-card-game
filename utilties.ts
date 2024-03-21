import { Player } from "./models.js";

function randPlayer(players: Player[]): Player {
  const playerNum = Math.floor(Math.random() * players.length);
  return players[playerNum];
}

function changePlayer(player: Player, players: Player[]): Player {
  const currPlayerInd = players.findIndex(p => p.name === player.name);
  if ((currPlayerInd + 1) < players.length) {
    return players[currPlayerInd + 1];
  } else {
    return players[0];
  }
}

export { randPlayer, changePlayer };
