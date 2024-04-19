import { Game, Player, Card } from "./models.js";
import {
  randSelectCardInd, getCardFromCardSpaceID, getIndFromCardSpaceId,
  getCardSpaceId, unflippedCol, chanceTrue, matchWithDiscard,
  getNextPlayer
} from "./utilties.js";
import {
  showCardsArea, updatePicsOnTakeDrawnCard, showDrawnCard, clearDrawnCardSpace,
  clearTopDiscardSpace, clearDeckIfEmpty, showFlipMessage, showDealMessage,
  showTurnMessage, showTopDiscard, showCardInHand, updatePicsOnReshuffle,
  makeUnclickable, resetCardArea,
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

  while (currentGame.gameFinished === false) {
    while (currentGame.roundFinished === false) {
      await startRound(currentGame);
      // The player at index 0 of "game.players" is the main player.
      if (currentGame.currPlayer === currentGame.players[0]) {
        await startMainPlayerTurn(currentGame);
      } else {
        await computerTurn(currentGame);
      }
      currentGame.switchTurn();
      // Function to check if round is finished, and if so, make roundFinished true
      currentGame.roundFinished = true;
    }
    // Some message with current scores
    await currentGame.switchRound();
    resetCardArea();
    // Function to check if game is finished, and if so, make gameFinished true
    currentGame.gameFinished = true;
  }
  console.log("FINISHED!!");
};

// Launches the game
startForm.addEventListener("submit", handleGame);

/** Starts a new round
 *
 * - Has cards dealt
 * - Has main and computer players flip 2 cards
 */

async function startRound(game: Game) {
  showDealMessage(game);
  await game.dealGame();
  showTopDiscard(game.topDiscard as Card);

  flipComputerCards(game);
  await shortPause();
  showFlipMessage();
  await mainPlayerFlip(game);
  await mainPlayerFlip(game);
}

/*******************************************************************************
 * Handlers for main player actions
* /

/** Let main player click a face-down card to flip it (for start of rounds)
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

    $mainPlayerCardsArea.on("click", ".flippable", function (evt) {
      $mainPlayerCardsArea.off();
      const $cardSpace = $(evt.target);
      $cardSpace.removeClass("flippable");
      const id = $cardSpace.attr("id") as string;
      const inds = game.lockCards(getIndFromCardSpaceId(id), game.players[0]);
      if (inds) {
        makeUnclickable(game, inds);
      }
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
  console.log("In main: startMainPlayerTurn");
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
 * - Make that card-space unflippable
 * - Have card flipped
 *
 * Takes: game, a Game instance
 */

function drawOrFlip(game: Game): Promise<void> {
  console.log("In main: drawOrFlip");

  // Returns a Promise so that we can "await" it, and thus wait for
  // main player to take action before continuing game
  return new Promise(function (resolve) {

    $cardsArea.on("click", ".flippable, #discards, #deck", async function (evt) {
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
        $clicked.removeClass("flippable");
        const id = $clicked.attr("id") as string;
        const inds = game.lockCards(getIndFromCardSpaceId(id));
        if (inds) {
          makeUnclickable(game, inds);
        }
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
        clearDrawnCardSpace(game);
        resolve();
      } else {
        const cardSpaceId = $clicked.attr("id") as string;
        const cardInd = getIndFromCardSpaceId(cardSpaceId);
        await game.currPlayer.takeDrawnCard(cardInd, game);
        updatePicsOnTakeDrawnCard(game, cardSpaceId);
        $clicked.removeClass("flipped");
        const id = $clicked.attr("id") as string;
        const inds = game.lockCards(getIndFromCardSpaceId(id));
        if (inds) {
          makeUnclickable(game, inds);
        }
        resolve();
      }
    });
  });
}


/*******************************************************************************
 * Handlers for computer player actions
*/

/** Have each computer controlled player flip a card twice (for start of rounds)
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

/** Have a message that it's a computer player's turn shown, and start the turn
 *
 * Takes: game, a Game instance
 */

async function computerTurn(game: Game): Promise<void> {
  console.log("In main: computerTurn");
  await shortPause();
  showTurnMessage(game);
  await longPause();

  const action = computerDrawOrFlip(game);
  if (action === "flip") {
    computerFlip(game);
    return;
  }
  if (action === "drawDeck") {
    await drawFromDeck(game);
    await shortPause();
  }
  if (action === "drawDiscard") {
    drawFromDiscards(game);
    await shortPause();
  }
}

// chooses whether to draw or flip
function computerDrawOrFlip(game: Game): string {

  let action: string;

  if (unflippedCol(game)) {
    if (chanceTrue(.5)) {
      action = "flip";
      const nextPlayer = getNextPlayer(game.players, game.currPlayer)
      if (matchWithDiscard(game, nextPlayer) && chanceTrue(.96)) {
        action = "drawDeck";
      }
    } else {
      action = "drawDeck";
    }
  } else {
    action = "drawDeck";
  }

  const value = game.topDiscard?.value;

  if (value === "ACE" || value === "KING") {
    action = "drawDiscard";
  }
  if (value === "2" && chanceTrue(.95)) {
    action = "drawDiscard";
  }
  if (value === "3" && chanceTrue(.85)) {
    action = "drawDiscard";
  }
  if (value === "4" && chanceTrue(.75)) {
    action = "drawDiscard";
  }
  if (value === "5" && chanceTrue(.65)) {
    action = "drawDiscard";
  }
  if (value === "6" && chanceTrue(.30)) {
    action = "drawDiscard";
  }

  if (matchWithDiscard(game, game.currPlayer) && chanceTrue(.98)) {
    action = "drawDiscard";
  }
  return action;
}

// function computerTakeOrDiscard(game: Game) {
//   const value = game.currPlayer.drawnCard?.value;

//   if
// }

/** Have a semi-random card from a given computer player flipped
 *
 * Takes:
 * - game: a Game instance
 * - (optional) player: a Player instance, of a computer controlled player
 */

function computerFlip(game: Game, player: Player = game.currPlayer): void {
  console.log("In main: computerFlip");

  const indOfCardToFlip = randSelectCardInd(player);
  const cardSpaceID = getCardSpaceId(indOfCardToFlip, player, game);
  flip(cardSpaceID, game);
  game.lockCards(indOfCardToFlip, player);
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
  showDrawnCard(game);
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
  showDrawnCard(game);
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

/** Pause game for 3 seconds, simulates computer player thinking */

function longPause() {
  return new Promise((resolve) => {
    setTimeout(resolve, 3000);
  });
}