import { Player } from "./models.js";

function randPlayer(players: Player[]) {
  const playerNum = Math.floor(Math.random() * players.length);
  return players[playerNum];
}

export { randPlayer };
