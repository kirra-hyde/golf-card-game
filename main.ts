import { Game, Player, Card } from "./models.js";
import { randComputerFlip, getPrevPlayer } from "./utilties.js";

const $startScreen = $("#start-screen");
const $cardsArea = $("#cards-area");
const $mainPlayerCardsArea = $("#p1");

// Changed 'startForm' from jQuery object to vanilla HTML element because of
// warning that '$startForm.on("submit", handleGame)' was deprecated.
const startForm = document.getElementById("start-form") as HTMLFormElement;
const $nameField = $("#name-field") as JQuery<HTMLInputElement>;
const $nameSpace = $("#p1-name");
const $discards = $("#discards");
const $messages = $("#messages");

async function handleGame(evt: Event): Promise<void> {
  evt.preventDefault();
  console.log("In main: start");

  const mainPlayerName = startGameScreen();
  const currentGame = await Game.startGame(mainPlayerName);

  dealMessage(currentGame);
  await currentGame.dealGame();

  if (currentGame.topDiscard) {
    discard(currentGame.topDiscard);
  }

  firstComputerFlips(currentGame);
  showFlipMessage();
  await flipCard(currentGame);
  await flipCard(currentGame);
  $messages.hide();

  while (currentGame.gameFinished === false) {

  }
};

//NOTE to self: Don't permit computer to flip with 3 cards already flipped.

startForm.addEventListener("submit", handleGame);

/** Gets name from form, Updates appearance of screen when game is started, returns name.*/
function startGameScreen(): string {
  const mainPlayerName = $nameField.val() || "You";
  $startScreen.hide();
  $cardsArea.show();
  $nameSpace.text(mainPlayerName);
  return mainPlayerName;
}


// Sub-handler for main player flips: calls show card(ui) and Card.flip(data)
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

// Sub-handler for computer player flips: Call show card(ui) and Card.flip(data)
function computerFlip(game: Game, player: Player) {
  const indOfCardToFlip = randComputerFlip(player);
  const cardSpaceID = getCardSpaceId(indOfCardToFlip, player, game);
  const card = player.cards[indOfCardToFlip];

  showCard(card, cardSpaceID);
  card.flip();
}

// Handles intial computer player flips
function firstComputerFlips(game: Game): void {
  computerFlip(game, game.players[1]);
  computerFlip(game, game.players[1]);
  computerFlip(game, game.players[2]);
  computerFlip(game, game.players[2]);
  computerFlip(game, game.players[3]);
  computerFlip(game, game.players[3]);
}

// UI: Function that takes a string of html element id and uses it to update image
function showCard(card: Card, cardSpaceID: string): void {
  const $cardSpace = $(`#${cardSpaceID}`);
  $cardSpace.attr("src", card.image);
  $cardSpace.attr("alt", `front of card, a ${card.value}`);
}

// Utility?
function getCardFromCardSpaceID(id: string, game: Game): Card {
  const playerInd = Number(id[1]) - 1;
  const cardInd = Number(id[3]);

  return game.players[playerInd].cards[cardInd];
}

// Utility?
function getCardSpaceId(cardInd: number, player: Player, game: Game): string {
  const playerInd = game.players.indexOf(player);
  return `p${playerInd + 1}-${cardInd}`;
}

//UI:  Makes a discarded card face up.
function discard(card: Card): void {
  $discards.attr("src", card.image);
  $discards.attr("alt", `front of card, a ${card.value}`);
}

//UI
function showFlipMessage(): void {
  setTimeout(() => {
    $messages.show();
    $messages.text("Flip 2 cards");
  }, 1000);
}

function dealMessage(game: Game): void {
  $messages.show();

  const dealer = getPrevPlayer(game);
  if (dealer === game.players[0]) {
    $messages.text("Your deal");
  } else {
    $messages.text(`${dealer.name}'s deal`);
  }

  setTimeout(() => {
    $messages.hide();
  }, 800);
}
