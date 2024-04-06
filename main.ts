import { Game, Player, Card } from "./models.js";

const $startScreen = $("#start-screen");
const $cardsArea = $("#cards-area");
const $mainPlayerCardsArea = $("#p1");

// Changed 'startForm' from jQuery object to vanilla HTML element because of
// warning that '$startForm.on("submit", handleGame)' was deprecated.
const startForm = document.getElementById("start-form") as HTMLFormElement;
const $nameField = $("#name-field") as JQuery<HTMLInputElement>;
const $nameSpace = $("#p1-name");

async function handleGame(evt: Event): Promise<void> {
  evt.preventDefault();
  console.log("In main: start");

  const mainPlayerName = startGameScreen();
  const currentGame = await Game.startGame(mainPlayerName);

  await currentGame.dealGame();

  await flipCard(currentGame);
  await flipCard(currentGame);
};

startForm.addEventListener("submit", handleGame);

/** Gets name from form, Updates appearance of screen when game is started, returns name.*/
function startGameScreen(): string {
  const mainPlayerName = $nameField.val() || "You";
  $startScreen.hide();
  $cardsArea.show();
  $nameSpace.text(mainPlayerName);
  return mainPlayerName;
}


//Sub-handler: calls show card(ui) and Card.flip(data)
function flipCard(game: Game): Promise<void> {
  console.log("In main: flipCard");
  return new Promise(function (resolve, reject) {

    $mainPlayerCardsArea.on("click", "img", function(evt) {
      const $cardSpace = $(evt.target);

      if ($cardSpace.hasClass("flipped")) {
        return;
      }
      $mainPlayerCardsArea.off();
      $cardSpace.addClass("flipped");

      const cardSpaceID = $cardSpace.attr("id")!;
      const card = getCardFromCardSpaceID(cardSpaceID, game);
      showCard(card, cardSpaceID);
      card.flip();
      resolve();
    });
  });
}

//UI: Function that takes a string of html element id and uses it to update image
function showCard(card: Card, cardSpaceID: string): void {
  const $cardSpace = $(`#${cardSpaceID}`);
  $cardSpace.attr("src", card.image);
  $cardSpace.attr("alt", `front of card, a ${card.value}`);
}

//Utility
function getCardFromCardSpaceID(id: string, game: Game): Card {
  const playerInd = Number(id[1]) - 1;
  const cardInd = Number(id[3]);

  return game.players[playerInd].cards[cardInd];
}
