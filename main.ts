import { Game, Player, Card } from "./models.js";

(async () => {
  const currentGame = await Game.startGame();
  // Use currentGame to deal cards, manage turns, etc.
  currentGame.dealGame();
  currentGame.players[0].drawFromDeck(currentGame);
  $("#root").html(currentGame.players[0].name);
})();