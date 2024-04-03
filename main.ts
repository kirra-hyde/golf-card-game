import { Game, Player, Card } from "./models.js";

const $startScreen = $("#start-screen");
const $cardsArea = $("#cards-area");

$cardsArea.hide();

async function start() {
  console.log("In main: start");
  const currentGame = await Game.startGame();

  await currentGame.dealGame();
};


//To start game: get player name from form w/ validation check that it's not billy, etc.