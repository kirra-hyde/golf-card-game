import { Game, Player, Card } from "./models.js";
import {
  randSelectCardInd, getIndFromCardSpaceId, getCardSpaceId, getDrawnCardSpaceId,
  chanceTrue, matchWithDiscard, getNextPlayer, getPlayerIndex, unflippedCol,
  sortVals, numberifyVal, getLowColPoints, getUnflippedInds, getBestInds,
  getBadVals, getBestValToSwap, getIndInPinch, matchWithDrawnCard,
} from "./utilties.js";
import {
  showCardsArea, showCard, clearDrawnCardSpace, clearTopDiscardSpace,
  clearDeckIfEmpty, showFlipMessage, showDealMessage, showTurnMessage,
  updatePicsOnReshuffle, makeUnclickable, resetCardArea, shortPause, longPause,
  showScores, showEndScreen,
} from "./ui.js";

const $cardsArea = $("#cards-area");
const $mainPlayerCardsArea = $("#p1");

// Changed 'startForm' from jQuery object to vanilla HTML element because of
// warning that '$startForm.on("submit", handleGame)' was deprecated.
const startForm = document.getElementById("start-form") as HTMLFormElement;
const $deck = $("#deck");
const $restartButton = $("#restart");

/** Primary game handler */

async function handleGame(evt: Event): Promise<void> {
  evt.preventDefault();
  console.log("In main: handleGame");

  const mainPlayerName = showCardsArea();
  const currentGame = await Game.startGame(mainPlayerName);

  while (currentGame.gameFinished === false) {
    await startRound(currentGame);

    while (currentGame.turnsLeft > 0) {

      // The player at index 0 of "game.players" is the main player.
      if (currentGame.currPlayer === currentGame.players[0]) {
        await handleMainPlayerTurn(currentGame);
      } else {
        await handleComputerTurn(currentGame);
      }
      currentGame.switchTurn();
    }
    await endRound(currentGame);
  }
  console.log("FINISHED!!");
  $restartButton.on("click", () => {
    location.reload();
  });
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
    flip(game, randSelectCardInd(game, player), player);
  }
  await shortPause();
  showFlipMessage();
  await setupFlipListeners(game);
  await setupFlipListeners(game);
}

/** Have cards shown and score calculated and shown at end of round */

async function endRound(game: Game) {
  await shortPause();
  const roundScores: number[] = [];
  for (let i = 0; i < game.players.length; i++) {
    const player = game.players[i];
    let score = 0;
    for (let j = 0; j < player.cards.length; j++) {
      const card = player.cards[j];
      if (!card.flipped) {
        showCard(card, getCardSpaceId(j, game, player));
      }
      if (j < 3 && card.value !== player.cards[j + 3].value) {
        score += numberifyVal(card.value);
      }
      if (j >= 3 && card.value !== player.cards[j - 3].value) {
        score += numberifyVal(card.value);
      }
    }
    roundScores.push(score);
  }
  for (let i = 0; i < roundScores.length; i++) {
    game.scores[i] += roundScores[i];
  }

  await shortPause();
  if (game.checkIfOver()) {
    showEndScreen(game, roundScores);
    return;
  }

  showScores(game, roundScores);
  await game.switchRound();
  await setupNewRoundListener();
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

function setupFlipListeners(game: Game): Promise<void> {
  console.log("In main: mainPlayerFlip");

  // It returns a Promise so that we can "await" it in "handleGame", and thus
  // wait for main player to click on a card before continuing game
  return new Promise((resolve) => {

    $mainPlayerCardsArea.on("click", ".flippable", function (evt) {
      $mainPlayerCardsArea.off();
      const $cardSpace = $(evt.target);
      const id = $cardSpace.attr("id") as string;
      flip(game, getIndFromCardSpaceId(id), game.players[0]);
      resolve();
    });
  });
}

/** Let main player click to start new round */

function setupNewRoundListener(): Promise<void> {
  console.log("In main: setupNewRoundListner");

  return new Promise((resolve) => {

    $cardsArea.on("click", function () {
      $cardsArea.off();
      resetCardArea();
      resolve();
    });
  });
}

/** Handler for the main player's turn
 *
 * Takes: game, a Game instance
 */

async function handleMainPlayerTurn(game: Game): Promise<void> {
  console.log("In main: startMainPlayerTurn");
  await shortPause();
  showTurnMessage(game);

  const drawOrFlipChoice = await setupFlipOrDrawListeners();

  if (drawOrFlipChoice === "discards") {
    drawFromDiscards(game);
  } else if (drawOrFlipChoice === "deck") {
    await drawFromDeck(game);
  } else {
    flip(game, getIndFromCardSpaceId(drawOrFlipChoice));
    return;
  }

  const takeOrDiscardChoice = await setupTakeOrDiscardListeners();

  if (takeOrDiscardChoice === "discards") {
    await discardDrawnCard(game);
  } else {
    await takeDrawnCard(game, getIndFromCardSpaceId(takeOrDiscardChoice));
  }

  return;
}

/** Set up click listeners to let main player choose to draw or flip a card
 *
 * Returns: (promise of) string, of id of clicked HTML element
 */

function setupFlipOrDrawListeners(): Promise<string> {
  return new Promise((resolve) => {
    $cardsArea.on("click", ".flippable, #discards, #deck", function (evt) {
      $cardsArea.off();
      const id = $(evt.target).attr("id") as string;
      resolve(id);
    });
  });
}


/** Set up listeners to let main player choose to take or discard their drawn card
 *
 * Returns: (promise of) string, of id of clicked HTML element
 */

function setupTakeOrDiscardListeners(): Promise<string> {
  console.log("In main: takeOrDiscard");

  // Drawn cards can't be returned to deck, so make deck unclickable for now
  $deck.removeClass("clickable");

  return new Promise((resolve) => {

    $cardsArea.on("click", ".clickable", function (evt) {
      $cardsArea.off();
      $deck.addClass("clickable");
      const id = $(evt.target).attr("id") as string;

      resolve(id);
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

  const drawOrFlipAction = determineDrawOrFlip(game);

  if (drawOrFlipAction === "flip") {
    flip(game, randSelectCardInd(game));
    return;
  }
  if (drawOrFlipAction === "drawDeck") {
    await drawFromDeck(game);
  }
  if (drawOrFlipAction === "drawDiscard") {
    drawFromDiscards(game);
  }

  await shortPause();
  const takeOrDiscardAction = determineTakeOrDiscard(game);

  if (takeOrDiscardAction < 0) {
    await discardDrawnCard(game);
  } else {
    await takeDrawnCard(game, takeOrDiscardAction);
  }
  return;
}

// chooses whether to draw or flip
function determineDrawOrFlip(game: Game): string {

  let action: string;

  if (unflippedCol(game)) {
    if (chanceTrue(.5)) {
      action = "flip";

      const nextPlayer = getNextPlayer(game.players, game.currPlayer);
      if (matchWithDiscard(game, nextPlayer) && chanceTrue(.95)) {
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

  if (matchWithDiscard(game) && chanceTrue(.98)) {
    action = "drawDiscard";
  }

  return action;
}

//Chooses to take or discard
function determineTakeOrDiscard(game: Game): number {

  // Always try to get cards of same value in the same column
  const [isMatch, matchInd] = matchWithDrawnCard(game);
  if (isMatch && chanceTrue(.98)) {
    return matchInd;
  }

  // If you can lock in a column with a low value, do it
  const [lowColPoints, lowColInd] = getLowColPoints(game);
  if (lowColPoints < 4) {
    return lowColInd;
  }
  if (lowColPoints === 4 && chanceTrue(.6)) {
    return lowColInd;
  }
  if (lowColPoints === 5 && chanceTrue(.3)) {
    return lowColInd;
  }

  const unflippedColInds = getBestInds(getUnflippedInds(game));

  // Vals that next player wants, so avoid discarding cards with these values
  const badVals = getBadVals(game);

  // If there's a column without flipped cards, take half-decent cards into it
  if (unflippedColInds.length >= 1) {
    const ind = unflippedColInds[0];
    const val = game.currPlayer.drawnCard?.value as string;
    if (val === "KING" || val === "ACE" || val === "2") {
      return ind;
    } else if (val === "3" && chanceTrue(.95)) {
      return ind;
    } else if (val === "4" && chanceTrue(.9)) {
      return ind;
    } else if (val === "5" && chanceTrue(.85)) {
      return ind;
    } else if (val === "6" && chanceTrue(.65)) {
      return ind;
    } else if (chanceTrue(.55)) {
      return ind;
    }
    if (numberifyVal(val) in badVals && chanceTrue(.9)) {
      return ind;
    }
  }

  // The values and indexes of all the current players cards that can be swapped
  // in order of highest points to lowest
  const sortedVals = sortVals(game);

  const drawnVal = numberifyVal(game.currPlayer.drawnCard?.value as string);

  // Best val to swap (highest val that next player doesn't want) with its index
  const bestValWithInd = getBestValToSwap(sortedVals, badVals);

  // For rare case where next player wants all swappable cards
  if (!bestValWithInd) {
    if (!(drawnVal in badVals) || chanceTrue(.05)) {
      return -1;
    } else {
      return getIndInPinch(drawnVal, sortedVals);
    }
  }

  const [bestVal, bestInd] = bestValWithInd;

  // If drawn card is lower than a swappable card, swap it with the highest
  // swappable card
  if (drawnVal < bestVal) {
    if (drawnVal <= 4) {
      return bestInd;
    }
    if (drawnVal <= 6 && chanceTrue(.9)) {
      return bestInd;
    }
    if (drawnVal >= 7 && chanceTrue(.8)) {
      return bestInd;
    }
  }

  // If drawn card is wanted by next player, take it even if higher than you want
  if (drawnVal in badVals && chanceTrue(.95)) {
    return bestInd;
  }

  return -1;
}


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