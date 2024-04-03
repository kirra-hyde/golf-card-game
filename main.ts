import { Game, Player, Card } from "./models.js";

async function start() {
  console.log("In main: start");
  const currentGame = await Game.startGame();
  await currentGame.dealGame();

  currentGame.players[0].drawFromDeck(currentGame);
};