import { Game, Player, Card } from "./models.js";
import {
  randSelectCardInd, getIndFromCardSpaceId, getCardSpaceId, getDrawnCardSpaceId,
  chanceTrue, matchWithDiscard, getNextPlayer, getPlayerIndex, unflippedCol,
} from "./utilties.js";
import {
  showCardsArea, showCard, clearDrawnCardSpace, clearTopDiscardSpace,
  clearDeckIfEmpty, showFlipMessage, showDealMessage, showTurnMessage,
  updatePicsOnReshuffle, makeUnclickable, resetCardArea, shortPause, longPause,
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
    await startRound(currentGame);

    while (currentGame.roundFinished === false) {

      // The player at index 0 of "game.players" is the main player.
      if (currentGame.currPlayer === currentGame.players[0]) {
        await handleMainPlayerTurn(currentGame);
      } else {
        await handleComputerTurn(currentGame);
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

/** Start a new round
 *
 * - Have cards dealt
 * - Have main and computer players flip 2 cards
 */

async function startRound(game: Game) {
  showDealMessage(game);
  await game.dealGame();
  showCard(game.topDiscard as Card, "discards");

  for (let player of game.players.slice(1)) {
    flip(game, randSelectCardInd(game, player), player);
  }
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
      const id = $cardSpace.attr("id") as string;
      flip(game, getIndFromCardSpaceId(id), game.players[0]);
      resolve();
    });
  });
}

/** Have a message that it's the main player's turn shown, and start the turn
 *
 * Takes: game, a Game instance
 */

async function handleMainPlayerTurn(game: Game): Promise<void> {
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
        await takeOrDiscard(game);
        resolve();
      } else if ($clicked.attr("id") === "deck") {
        await drawFromDeck(game);
        await takeOrDiscard(game);
        resolve();
      } else {
        const id = $clicked.attr("id") as string;
        flip(game, getIndFromCardSpaceId(id));
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
 * If card-space is clicked:
 * - Have player discard Card linked to space and take drawn Card in its place
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
        await discardDrawnCard(game);
        resolve();
      } else {
        const cardSpaceId = $clicked.attr("id") as string;
        await takeDrawnCard(game, getIndFromCardSpaceId(cardSpaceId));
        resolve();
      }
    });
  });
}


/*******************************************************************************
 * Handlers for computer player actions
*/

/** Have a message that it's a computer player's turn shown, and start the turn
 *
 * Takes: game, a Game instance
 */

async function handleComputerTurn(game: Game): Promise<void> {
  console.log("In main: computerTurn");
  await shortPause();
  showTurnMessage(game);
  await longPause();

  const action = computerDrawOrFlip(game);
  if (action === "flip") {
    flip(game, randSelectCardInd(game));
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


/*******************************************************************************
 * Handlers for actions taken by both main player and computer players
*/

/** Flip a card
 *
 * - Have Card instance flipped
 * - Have Card and the other Card in its column locked, if needed
 * - Have the card's image displayed
 * If main player's turn:
 *  - Remove class "flippable" from card's HTML element
 *  - Remove class "clickable" from HTML elements of locked cards, if any
 *
 * Takes:
 * - game: a Game instance
 * - cardInd: a number of the index of the card to be flipped
 * - player: a Player instance (defaults to current player)
 */

function flip(game: Game, cardInd: number, player: Player = game.currPlayer): void {
  player.flipCard(cardInd);
  const lockedInds = game.lockCards(cardInd, player);

  const playerInd = getPlayerIndex(game, player);
  showCard(player.cards[cardInd], `p${playerInd + 1}-${cardInd}`);

  // If the card flipped is the main player's, update classes
  if (player === game.players[0]) {
    $(`#${getCardSpaceId(cardInd, game, player)}`).removeClass("flippable");
    if (lockedInds) {
      makeUnclickable(game, lockedInds, player);
    }
  }
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
  const card = game.currPlayer.drawnCard as Card;
  showCard(card, getDrawnCardSpaceId(game));
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
  const card = game.currPlayer.drawnCard as Card;
  showCard(card, getDrawnCardSpaceId(game));
  clearDeckIfEmpty(game);
}

/** Have currPlayer discard their drawn card. Have images updated accordingly.
 *
 * Takes: game, a Game instance
 */

async function discardDrawnCard(game: Game): Promise<void> {
  await game.currPlayer.discardDrawnCard(game);

  showCard(game.topDiscard as Card, "discards");
  clearDrawnCardSpace(game);
}

/** Take a drawn card
 *
 * - Have current player swap their drawn Card with a Card in their hand
 * - Have taken Card and the other Card in its column locked, if needed
 * - Have images updated accordingly
 * If main player's turn:
 *  - Remove class "flippable" from taken card's HTML element
 *  - Remove class "clickable" from HTML elements of locked cards, if any
 */

async function takeDrawnCard(game: Game, cardInd: number): Promise<void> {
  await game.currPlayer.takeDrawnCard(cardInd, game);
  const inds = game.lockCards(cardInd);

  showCard(game.topDiscard as Card, "discards");
  clearDrawnCardSpace(game);
  const card = game.currPlayer.cards[cardInd];
  const cardSpaceId = getCardSpaceId(cardInd, game);
  showCard(card, cardSpaceId);

  if (game.currPlayer === game.players[0]) {
    $(`#${cardSpaceId}`).removeClass("flipped");
    if (inds) {
      makeUnclickable(game, inds);
    }
  }
}