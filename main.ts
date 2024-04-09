import { Game, Player, Card } from "./models.js";
import { randComputerFlip } from "./utilties.js";

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
const $drawnCardSpace = $("#drawn-card");
const $deck = $("#deck");

async function handleGame(evt: Event): Promise<void> {
  evt.preventDefault();
  console.log("In main: start");

  const mainPlayerName = startGameScreen();
  const currentGame = await Game.startGame(mainPlayerName);

  dealMessage(currentGame);
  await currentGame.dealGame();

  discardUI(currentGame.topDiscard as Card);

  firstComputerFlips(currentGame);
  await pause();
  showFlipMessage();
  await flipCard(currentGame);
  await flipCard(currentGame);
  $messages.hide();

  while (currentGame.gameFinished === false) {
    while (currentGame.roundFinished === false) {
      if (currentGame.currPlayer === currentGame.players[0]) {
        await playerTurn(currentGame);
      } // else {
      //   computerTurn(currentGame);
      // }
      currentGame.switchTurn();
      currentGame.roundFinished = true;
    }
    currentGame.gameFinished = true;
  }
  console.log("FINISHED!!");
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
  return new Promise(function (resolve) {

    $mainPlayerCardsArea.on("click", ".clickable", function(evt) {
      $mainPlayerCardsArea.off();
      const $cardSpace = $(evt.target);
      $cardSpace.removeClass("clickable");

      const cardSpaceID = $cardSpace.attr("id") as string;
      const card = getCardFromCardSpaceID(cardSpaceID, game);
      showCard(card, cardSpaceID);
      card.flip();
      resolve();
    });
  });
}

// Handler
function drawOrFlip(game: Game): Promise<void> {
  console.log("In main: drawOrFlip");
  return new Promise(function (resolve) {

    $cardsArea.on("click", ".clickable", async function(evt) {
      $cardsArea.off();
      const $clicked = $(evt.target);

      if ($clicked.attr("id") === "discards") {
        drawFromDiscards(game);
        await takeOrDiscard(game)
        resolve();
      } else if ($clicked.attr("id") === "deck") {
        await drawFromDeck(game);
        await takeOrDiscard(game);
        resolve();
      } else {
        $clicked.removeClass("clickable");
        const cardSpaceID = $clicked.attr("id") as string;
        const card = getCardFromCardSpaceID(cardSpaceID, game);
        showCard(card, cardSpaceID);
        card.flip();
        resolve();
      }
    });
  });
}

//Handler
function takeOrDiscard(game: Game): Promise<void> {
  console.log("In main: takeOrDiscard");
  $deck.removeClass("clickable");

  return new Promise(function (resolve) {

    $cardsArea.on("click", ".clickable", async function(evt) {
      $cardsArea.off();
      $deck.addClass("clickable");
      const $clicked = $(evt.target);

      if ($clicked.attr("id") === "discards") {
        discardUI(game.currPlayer.drawnCard as Card);
        await game.currPlayer.discardDrawnCard(game);
        resolve();
      } else {
        const cardSpaceId = $clicked.attr("id") as string;
        const cardInd = getIndFromCardSpaceId(cardSpaceId);
        await game.currPlayer.takeDrawnCard(cardInd, game);
        takeCardUI(game, cardSpaceId);
        resolve();
      }
    });
  })
}

function takeCardUI(game: Game, cardSpaceID: string) {
  discardUI(game.topDiscard as Card);
  const card = getCardFromCardSpaceID(cardSpaceID, game);
  showCard(card, cardSpaceID);
}

// Sub-handler for computer player flips: Call show card(ui) and Card.flip(data)
function computerFlip(game: Game, player: Player): void {
  console.log("In main: computerFlip");
  const indOfCardToFlip = randComputerFlip(player);
  const cardSpaceID = getCardSpaceId(indOfCardToFlip, player, game);
  const card = player.cards[indOfCardToFlip];

  showCard(card, cardSpaceID);
  card.flip();
}

//handler for main player's turn
async function playerTurn(game: Game): Promise<void> {
  console.log("In main: playerTurn");
  await pause();
  turnMessage(game);

  await drawOrFlip(game);
}

// handler
function drawFromDiscards(game: Game): void {
  console.log("In main: drawFromDiscards");
  game.currPlayer.drawFromDiscards(game);
  updateUIForDiscardDraw(game);
}

//handler
async function drawFromDeck(game: Game): Promise<void> {
  console.log("In main: drawFromDeck");
  if (game.deckIsEmpty === true) {
    updateUIForReshuffle();
  }
  await game.currPlayer.drawFromDeck(game);
  updateUIForDeckDraw(game);
}

//UI
function updateUIForReshuffle(): void {
  console.log("In main: updateUIForReshuffle");
  $discards.attr("src", "./images/discards_placeholder.png");
  $discards.attr("alt", "discards go here");
  $deck.attr("src", "./images/deck.png");
  $deck.attr("alt", "main deck of cards");
}

//UI
function updateUIForDiscardDraw(game: Game): void {
  console.log("In main: updateUIForDiscardDraw")
  if (game.discardPileHasCards) {
    $discards.attr("src", "./images/discards.png");
    $discards.attr("alt", "discards pile")
  } else {
    $discards.attr("src", "./images/discards_placeholder.png");
    $discards.attr("alt", "discards go here");
  }

  const card = game.currPlayer.drawnCard as Card;
  $drawnCardSpace.attr("src", card.image);
  $drawnCardSpace.attr("alt", `front of card, a ${card.value}`);
}

//UI
function updateUIForDeckDraw(game: Game): void {
  console.log("In main: updateUIForDeckDraw");
  if (game.deckIsEmpty) {
    $deck.attr("src", "./images/empty_deck.png");
    $deck.attr("alt", "No more cards. Click me to get discard pile and shuffle.");
  }

  const card = game.currPlayer.drawnCard as Card;
  $drawnCardSpace.attr("src", card.image);
  $drawnCardSpace.attr("alt", `front of card, a ${card.value}`);
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

// UI: Function that takes a string of html element id and uses it to update image, in hand
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

// Utility
function getIndFromCardSpaceId(id: string): number {
  return Number(id[3]);
}

// Utility?
function getCardSpaceId(cardInd: number, player: Player, game: Game): string {
  const playerInd = game.players.indexOf(player);
  return `p${playerInd + 1}-${cardInd}`;
}

//UI:  Shows a discarded card face up in discards place.
function discardUI(card: Card): void {
  $discards.attr("src", card.image);
  $discards.attr("alt", `front of card, a ${card.value}`);
  clearDrawnCardSpace();
}

//UI
function showFlipMessage(): void {
  $messages.show();
  $messages.text("Flip 2 cards");
}

//UI
function clearDrawnCardSpace(): void {
  $drawnCardSpace.attr("src", "./images/drawn_placeholder.png");
  $drawnCardSpace.attr("alt", "your drawn cards go here");
}

function dealMessage(game: Game): void {
  $messages.show();

  if (game.currDealer === game.players[0]) {
    $messages.text("Your deal");
  } else {
    $messages.text(`${game.currDealer.name}'s deal`);
  }

  setTimeout(() => {
    $messages.hide();
  }, 800);
}

function turnMessage(game: Game): void {
  $messages.show();

  if (game.currPlayer === game.players[0]) {
    $messages.text("Your turn");
  } else {
    $messages.text(`${game.currPlayer.name}'s turn`);
  }

  setTimeout(() => {
    $messages.hide();
  }, 800);
}

function pause () {
  return new Promise((resolve) => {
    setTimeout(resolve, 800);
  })
}
