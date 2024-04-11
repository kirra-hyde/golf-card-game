import { Game, Player, Card } from "./models.js";
import {
  randSelectCardInd, getCardFromCardSpaceID, getIndFromCardSpaceId,
  getCardSpaceId
} from "./utilties.js";
import {
  showCardsArea, updatePicsOnTakeDrawnCard, showDrawnCard, clearDrawnCardSpace,
  clearTopDiscardSpace, clearDeckIfEmpty, showFlipMessage, showDealMessage,
  showTurnMessage, showTopDiscard, showCardInHand, updatePicsOnReshuffle
} from "./ui.js";

const $cardsArea = $("#cards-area");
const $mainPlayerCardsArea = $("#p1");

// Changed 'startForm' from jQuery object to vanilla HTML element because of
// warning that '$startForm.on("submit", handleGame)' was deprecated.
const startForm = document.getElementById("start-form") as HTMLFormElement;
const $deck = $("#deck");


/** Primary game handler */

async function handleGame(evt: Event): Promise<void> {
  evt.preventDefault();
  console.log("In main: handleGame");

  const mainPlayerName = showCardsArea();
  const currentGame = await Game.startGame(mainPlayerName);

  showDealMessage(currentGame);
  await currentGame.dealGame();
  showTopDiscard(currentGame.topDiscard as Card);

  flipComputerCards(currentGame);
  await shortPause();
  showFlipMessage();
  await mainPlayerFlip(currentGame);
  await mainPlayerFlip(currentGame);

  while (currentGame.gameFinished === false) {
    while (currentGame.roundFinished === false) {

      // The player at index 0 of "game.players" is the main player.
      if (currentGame.currPlayer === currentGame.players[0]) {
        await startMainPlayerTurn(currentGame);
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

// Launches the game
startForm.addEventListener("submit", handleGame);


/*******************************************************************************
 * Handlers for main player actions
* /

/** Let main player click a face-down card to flip it, for start of game
 *
 * Put listener on (clickable) card-spaces in player's card-area. When clicked:
 * - Remove listener
 * - Make that card-space unclickable (once flipped, a card is locked in)
 * - Have card flipped
 *
 * Takes: game, a Game instance
 */

function mainPlayerFlip(game: Game): Promise<void> {
  console.log("In main: mainPlayerFlip");

  // It returns a Promise so that we can "await" it in "handleGame", and thus
  // wait for main player to click on a card before continuing game
  return new Promise(function (resolve) {

    $mainPlayerCardsArea.on("click", ".clickable", function (evt) {
      $mainPlayerCardsArea.off();
      const $cardSpace = $(evt.target);
      $cardSpace.removeClass("clickable");

      flip($cardSpace.attr("id") as string, game);
      resolve();
    });
  });
}

/** Have a message that it's the main player's turn shown, and start the turn
 *
 * Takes: game, a Game instance
 */

async function startMainPlayerTurn(game: Game): Promise<void> {
  console.log("In main: playerTurn");
  await shortPause();
  showTurnMessage(game);

  await drawOrFlip(game);
}

/** Let main player choose to draw a card or flip a card
 *
 * Put listener on deck, discard pile, and (clickable) card-spaces in player's
 * card area. When clicked, remove listener.
 * If discard pile is clicked:
 * - Have card drawn from discard pile
 * - Let player take the card or discard it
 * If deck if clicked:
 * - Have card drawn from deck
 * - Let player take the card or discard it
 * If card-space is clicked:
 * - Make that card-space unclickable (once flipped, a card is locked in)
 * - Have card flipped
 *
 * Takes: game, a Game instance
 */

function drawOrFlip(game: Game): Promise<void> {
  console.log("In main: drawOrFlip");

  // Returns a Promise so that we can "await" it, and thus wait for
  // main player to take action before continuing game
  return new Promise(function (resolve) {

    $cardsArea.on("click", ".clickable", async function (evt) {
      $cardsArea.off();
      const $clicked = $(evt.target);

      if ($clicked.attr("id") === "discards") {
        drawFromDiscards(game);
        showDrawnCard(game);
        await takeOrDiscard(game);
        resolve();
      } else if ($clicked.attr("id") === "deck") {
        await drawFromDeck(game);
        showDrawnCard(game);
        await takeOrDiscard(game);
        resolve();
      } else {
        $clicked.removeClass("clickable");
        flip($clicked.attr("id") as string, game);
        resolve();
      }
    });
  });
}

/** Let main player choose to take or discard their drawn card
 *
 * Put listener on discard pile and (clickable) card-spaces in player's card
 * area. When clicked, remove listener.
 * If discard pile is clicked:
 * - Have the player discard the drawn Card instance
 * - Have the drawn card's image displayed in discard pile
 * If card-space is clicked:
 * - Have player discard Card linked to space and take drawn Card in its place
 * - Have the images in discard pile and card-space updated accordingly
 *
 * Takes: game, a Game instance
 */

function takeOrDiscard(game: Game): Promise<void> {
  console.log("In main: takeOrDiscard");

  // Drawn cards can't be returned to deck, so make deck unclickable for now
  $deck.removeClass("clickable");

  // Returns a Promise so that we can "await" it, and thus wait for
  // main player to take action before continuing game
  return new Promise(function (resolve) {

    $cardsArea.on("click", ".clickable", async function (evt) {
      $cardsArea.off();
      $deck.addClass("clickable");
      const $clicked = $(evt.target);

      if ($clicked.attr("id") === "discards") {
        await game.currPlayer.discardDrawnCard(game);
        showTopDiscard(game.topDiscard as Card);
        clearDrawnCardSpace();
        resolve();
      } else {
        const cardSpaceId = $clicked.attr("id") as string;
        const cardInd = getIndFromCardSpaceId(cardSpaceId);
        await game.currPlayer.takeDrawnCard(cardInd, game);
        updatePicsOnTakeDrawnCard(game, cardSpaceId);
        resolve();
      }
    });
  });
}


/*******************************************************************************
 * Handlers for computer player actions
*/

/** Have each computer controlled player flip a card twice, for start of game
 *
 * Takes: game, a Game instance
 */

function flipComputerCards(game: Game): void {
  computerFlip(game, game.players[1]);
  computerFlip(game, game.players[1]);
  computerFlip(game, game.players[2]);
  computerFlip(game, game.players[2]);
  computerFlip(game, game.players[3]);
  computerFlip(game, game.players[3]);
}

/** Have a semi-random card from a given computer player flipped
 *
 * Takes:
 * - game: a Game instance
 * - player: a Player instance, representing a computer controlled player
 */

function computerFlip(game: Game, player: Player): void {
  console.log("In main: computerFlip");

  const indOfCardToFlip = randSelectCardInd(player);
  const cardSpaceID = getCardSpaceId(indOfCardToFlip, player, game);
  flip(cardSpaceID, game);
}


/*******************************************************************************
 * Handlers for actions taken by both main player and computer players
*/

/** Flip a card.  Have Card instance flipped and its image displayed
 *
 * Takes:
 * - cardSpaceId: a string of the id of an HTML element for showing cards
 * - game: game, a Game instance
 */

function flip(cardSpaceID: string, game: Game): void {
  const card = getCardFromCardSpaceID(cardSpaceID, game);
  card.flip();
  showCardInHand(card, cardSpaceID);
}

/** Have current player take Card at top of discard pile as their drawn card,
 *  and have images updated accordingly
 *
 * Takes: game, a Game instance
 */

function drawFromDiscards(game: Game): void {
  console.log("In main: drawFromDiscards");
  game.currPlayer.drawFromDiscards(game);
  clearTopDiscardSpace(game);
}

/** Have current player draw Card from deck, and have images updated accordingly
 *
 * Takes: game, a Game instance
 */

async function drawFromDeck(game: Game): Promise<void> {
  console.log("In main: drawFromDeck");
  if (game.deckIsEmpty === true) {
    updatePicsOnReshuffle();
  }
  await game.currPlayer.drawFromDeck(game);
  clearDeckIfEmpty(game);
}


/*******************************************************************************
 * Pauses
*/

/** Pause game for .8 seconds, for image changes to not feel too rushed */

function shortPause() {
  return new Promise((resolve) => {
    setTimeout(resolve, 800);
  });
}

/** Pause game for 2 seconds, simulates computer player thinking */

function longPause() {
  return new Promise((resolve) => {
    setTimeout(resolve, 2000);
  });
}