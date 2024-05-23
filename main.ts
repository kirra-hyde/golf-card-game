import { Game, Player, Card } from "./models.js";
import {
  randSelectEmptyColInd, getIndFromCardSpaceId, getCardSpaceId, getVerticalInd,
  getDrawnCardSpaceId, chanceTrue, checkForMatch, getNextPlayer, numberifyVal,
  getLowColPoints, getBadVals, getBestToSwap, getIndInPinch, getCardIndex,
} from "./utilities.js";
import {
  showCardsArea, showCard, clearDrawnCardSpace, clearTopDiscardSpace, flipCard,
  clearDeckIfEmpty, showFlipMessage, showDealMessage, showTurnMessage,
  updatePicsOnReshuffle, makeUnclickable, resetCardArea, shortPause, longPause,
  showScores, showEndScreen, boldenName, unboldenName, tinyPause
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
      await tinyPause();
      unboldenName(currentGame);
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
 * - Deal cards
 * - Have main and computer players flip 2 cards
 */

async function startRound(game: Game): Promise<void> {
  console.log("In main: startRound");
  await shortPause();
  showDealMessage(game);
  await game.dealGame();
  await shortPause();
  showCard(game.topDiscard as Card, "discards");

  await shortPause();
  for (let player of game.players.slice(1)) {
    flip(game, randSelectEmptyColInd(game, player) as number, player);
    flip(game, randSelectEmptyColInd(game, player) as number, player);
  }
  showFlipMessage();
  await setupFlipListeners(game);
  await setupFlipListeners(game);
}

/** End a round
 *
 * - Show all cards
 * - Update game's scores and display them
 * - Change game's round to a new round
 * - Set up listener to reset UI for a new round
 * - Check if any score is high enough that the game is over. If so:
 *   - Mark game as finished
 *   - Show ending message
 */

async function endRound(game: Game): Promise<void> {
  console.log("In main: endRound");
  await shortPause();
  const roundScores: number[] = [];

  for (let player of game.players) {
    let score = 0;
    for (let card of player.cards) {
      const ind = getCardIndex(game, card, player);
      const verticalInd = getVerticalInd(game, card, player);
      if (!card.flipped) {
        flipCard(card, getCardSpaceId(ind, game, player));
      }
      if (card.value !== player.cards[verticalInd].value) {
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
 * - Flip card
 *
 * Takes: game, a Game instance
 */

function setupFlipListeners(game: Game): Promise<void> {
  console.log("In main: mainPlayerFlip");

  return new Promise((resolve) => {

    $mainPlayerCardsArea.on("click", ".flippable", function (evt) {
      $mainPlayerCardsArea.off();
      const $cardSpace = $(evt.target).parent().prev().children();
      console.log("What is $cardSpace?:", $cardSpace);
      const id = $cardSpace.attr("id") as string;
      flip(game, getIndFromCardSpaceId(id), game.players[0]);
      resolve();
    });
  });
}

/** Set up listener that will reset UI for new round when clicked */

function setupNewRoundListener(): Promise<void> {
  console.log("In main: setupNewRoundListener");

  return new Promise((resolve) => {

    $cardsArea.on("click", async function () {
      $cardsArea.off();
      await resetCardArea();
      resolve();
    });
  });
}

/** Handler for the main player's turn
 *
 * Takes: game, a Game instance
 */

async function handleMainPlayerTurn(game: Game): Promise<void> {
  console.log("In main: handleMainPlayerTurn");
  await shortPause();
  showTurnMessage(game);
  boldenName(game);

  const drawOrFlipChoice = await setupFlipOrDrawListeners();

  if (drawOrFlipChoice === "discards") {
    drawFromDiscards(game);
    const id = await setupTakeListeners();
    await takeDrawnCard(game, getIndFromCardSpaceId(id));
    return;
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
}

/** Set up click listeners to let main player choose to draw or flip a card
 *
 * Returns: (promise of) string, of id of clicked HTML element
 */

function setupFlipOrDrawListeners(): Promise<string> {
  console.log("In main: setupFlipOrDrawListeners");
  return new Promise((resolve) => {
    $cardsArea.on("click", ".flippable, #discards, #deck", function (evt) {
      $cardsArea.off();
      const $target = $(evt.target);
      let id: string;
      if ($target.is(".pic")) {
        id = $target.attr("id") as string;
      } else {
        const $cardSpace = $target.parent().prev().children();
        id = $cardSpace.attr("id") as string;
      }
      resolve(id);
    });
  });
}

/** Set up listeners for main player to choose to take or discard their drawn card
 *
 * Returns: (promise of) string, of id of clicked HTML element
 */

function setupTakeOrDiscardListeners(): Promise<string> {
  console.log("In main: setupTakeOrDiscardListeners");

  // Drawn cards can't be returned to deck, so make deck unclickable for now
  $deck.removeClass("clickable");

  return new Promise((resolve) => {

    $cardsArea.on("click", ".clickable", function (evt) {
      $cardsArea.off();
      $deck.addClass("clickable");
      const $target = $(evt.target);
      let id: string;
      if ($target.is(".pic")) {
        id = $target.attr("id") as string;
      } else {
        const $front= $target.closest(".flipper").find(".front").children();
        id = $front.attr("id") as string;
      }
      resolve(id);
    });
  });
}

/** Set up listeners for main player to choose where to take drawn card
 *
 * Returns: (promise of) string, of id of clicked HTML element
 */

function setupTakeListeners(): Promise<string> {
  console.log("In main: setupTakeListeners");

  return new Promise((resolve) => {

    $mainPlayerCardsArea.on("click", ".clickable", function (evt) {
      const $front= $(evt.target).closest(".flipper").find(".front").children();
      const id = $front.attr("id") as string;

      resolve(id);
    });
  });
}


/*******************************************************************************
 * Handlers for computer player actions
*/

/** Handler for a computer player's turn
 *
 * Takes: game, a Game instance
 */

async function handleComputerTurn(game: Game): Promise<void> {
  console.log("In main: handleComputerTurn");
  await shortPause();
  showTurnMessage(game);
  boldenName(game);
  await longPause();

  const drawOrFlipAction = determineDrawOrFlip(game);

  if (drawOrFlipAction === "flip") {
    flip(game, randSelectEmptyColInd(game) as number);
    return;
  }
  if (drawOrFlipAction[0] === "drawDiscard") {
    drawFromDiscards(game);
    const indToTakeCard = drawOrFlipAction[1] as number;
    await longPause();
    await takeDrawnCard(game, indToTakeCard);
    return;
  }
  if (drawOrFlipAction === "drawDeck") {
    await drawFromDeck(game);
  }

  await longPause();
  const takeOrDiscardAction = determineTakeOrDiscard(game);

  if (takeOrDiscardAction < 0) {
    await discardDrawnCard(game);
  } else {
    await takeDrawnCard(game, takeOrDiscardAction);
  }
}

/** Determine whether a computer player should choose to flip a card, draw from
 *  the deck, or draw from the discard pile. If choice is discard pile,
 *  determine where to take discarded card.
 *
 * Takes: game, a Game instance
 * Returns:
 * - string, representing the player's choice to flip or draw from deck. OR
 * - array of "drawDiscard"--the players choice--and a number--which index
 *   to take the discarded card at
 */

function determineDrawOrFlip(game: Game):
  "flip" | "drawDeck" | ["drawDiscard", number] {
  console.log("In main: determineDrawOrFlip");

  const topDiscard = game.topDiscard as Card;
  const topDiscardPoints = numberifyVal(topDiscard.value);

  const [isMatch, vertInd] = checkForMatch(game, topDiscard);
  // Take the top discard if it matches a flipped card that isn't locked
  if (isMatch && chanceTrue(.98)) {
    return ["drawDiscard", vertInd];
  }

  // If you can lock in a column with a low value, do it
  const [lowColPoints, lowColInd] = getLowColPoints(game, topDiscard);
  if (
    lowColPoints < 4 ||
    (lowColPoints === 4 && chanceTrue(.65)) ||
    (lowColPoints === 5 && chanceTrue(.35))
  ) {
    return ["drawDiscard", lowColInd];
  }

  const unflippedColInd = randSelectEmptyColInd(game);

  //If card at top of discard pile is decent, and there's a good place to take
  // it at, take it.
  if (
    topDiscardPoints <= 1 ||
    (topDiscardPoints === 2 && chanceTrue(.95)) ||
    (topDiscardPoints === 3 && chanceTrue(.85)) ||
    (topDiscardPoints === 4 && chanceTrue(.75)) ||
    (topDiscardPoints === 5 && chanceTrue(.6)) ||
    (topDiscardPoints === 6 && chanceTrue(.3))
  ) {

    // An unflipped column is the best place to take a card
    if (unflippedColInd) {
      return ["drawDiscard", unflippedColInd];
    }

    // The highest flipped swappable card the next player doesn't want, if any
    const worstCard = getBestToSwap(game);
    // If card in discard pile is an improvement on worst card, take it
    if (worstCard && (numberifyVal(worstCard.value) > topDiscardPoints)) {
      return ["drawDiscard", getCardIndex(game, worstCard)];
    }
  }

  // Don't leave a card the next player needs in the discard pile
  const nextPlayer = getNextPlayer(game.players, game.currPlayer);
  if (checkForMatch(game, topDiscard, nextPlayer)[0] && chanceTrue(.9)) {
    return "drawDeck";
  }

  // Don't flip a card if doing so will lock a column
  if (!unflippedColInd) {
    return "drawDeck";
  }

  // At this point, flipping and drawing from the deck are both reasonable choices
  if (chanceTrue(.5)) {
    return "flip";
  } else {
    return "drawDeck";
  }
}

/** Determine whether computer player should take or discard card drawn from deck
 *
 * Takes: game, a game instance
 * Returns: number, representing index to take the card at, or -1 to discard it
 */

function determineTakeOrDiscard(game: Game): number {
  console.log("In main: determineTakeOrDiscard");

  const drawnCard = game.currPlayer.drawnCard as Card;
  const drawnVal = drawnCard.value;
  const drawnPoints = numberifyVal(drawnVal);
  const unflippedColInd = randSelectEmptyColInd(game);
  // Vals that next player wants, so avoid discarding cards with these values
  const badVals = getBadVals(game);

  // Always try to get cards of same value in the same column
  const [isMatch, matchInd] = checkForMatch(game, drawnCard);
  if (isMatch && chanceTrue(.98)) {
    return matchInd;
  }

  // If you can lock in a column with a low value, do it
  const [lowColPoints, lowColInd] = getLowColPoints(game, drawnCard);
  if (
    lowColPoints < 4 ||
    (lowColPoints === 4 && chanceTrue(.65)) ||
    (lowColPoints === 5 && chanceTrue(.3))
  ) {
    return lowColInd;
  }

  // If there's a column without flipped cards, take half-decent cards into it
  if (unflippedColInd) {
    if (
      drawnPoints <= 2 ||
      (drawnPoints === 3 && chanceTrue(.98)) ||
      (drawnPoints === 4 && chanceTrue(.95)) ||
      (drawnPoints === 5 && chanceTrue(.9)) ||
      (drawnPoints === 6 && chanceTrue(.8)) ||
      chanceTrue(.55)
    ) {
      return unflippedColInd;
    }

    // Even bad cards should be taken if you don't want the next player to get it
    if (drawnVal in badVals && chanceTrue(.9)) {
      return unflippedColInd;
    }
  }

  // Value and index of the worst swappable card that the next player doesn't want
  const worstCard = getBestToSwap(game);

  // For rare case where next player wants all swappable cards
  if (!worstCard) {
    if (!(drawnVal in badVals) || chanceTrue(.05)) {
      return -1;
    } else {
      return getIndInPinch(game, drawnPoints);
    }
  }

  // If drawn card is lower than best card to swap, swap them
  if (drawnPoints < numberifyVal(worstCard.value)) {
    if (
      drawnPoints <= 4 ||
      (drawnPoints <= 6 && chanceTrue(.95)) ||
      (drawnPoints >= 7 && chanceTrue(.9))
    ) {
      return getCardIndex(game, worstCard);
    }
  }

  // If drawn card is wanted by next player, try to take it
  if (drawnVal in badVals && chanceTrue(.95)) {
    const difference = drawnPoints - numberifyVal(worstCard.value);
    if (
      difference <= 2 ||
      difference === 3 && chanceTrue(.95) ||
      difference === 4 && chanceTrue(.9) ||
      difference === 5 && chanceTrue(.8) ||
      difference === 6 && chanceTrue(.75) ||
      difference === 7 && chanceTrue(.65) ||
      difference >= 8 && chanceTrue(.6)
    ){
      return getCardIndex(game, worstCard)
    }
  }

  return -1;
}


/*******************************************************************************
 * Handlers for actions taken by both main player and computer players
*/

/** Flip a card
 *
 * - Flip Card instance
 * - Lock the Card with the other Card in its column, if needed
 * - Display card's image
 * If main player's turn:
 *  - Remove class "flippable" from card's HTML element
 *  - Remove class "clickable" from HTML elements of locked cards, if any
 *
 * Takes:
 * - game: a Game instance
 * - ind: a number of the index of the card to be flipped
 * - player: a Player instance (defaults to current player)
 */

function flip(game: Game, ind: number, player: Player = game.currPlayer): void {
  console.log("In main: flip");
  player.flipCard(ind);
  const lockedInds = game.lockCards(ind, player);

  const cardSpaceId = getCardSpaceId(ind, game, player);
  flipCard(player.cards[ind], cardSpaceId);

  // If the card flipped is the main player's, update classes
  if (player === game.players[0]) {
    $(`#${cardSpaceId}`).closest(".cards").removeClass("flippable");
    if (lockedInds) {
      makeUnclickable(game, lockedInds, player);
    }
  }
}

/** Have current player take Card at top of discard pile as their drawn card,
 *  and update images accordingly
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

/** Have current player draw Card from deck, and update images accordingly
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

/** Have current Player discard their drawn card, and update images accordingly
 *
 * Takes: game, a Game instance
 */

async function discardDrawnCard(game: Game): Promise<void> {
  console.log("In main: discardDrawnCard");
  await game.currPlayer.discardDrawnCard(game);

  showCard(game.topDiscard as Card, "discards");
  clearDrawnCardSpace(game);
}

/** Take a drawn card
 *
 * - Have current player swap their drawn Card with a Card in their hand
 * - If needed, lock taken Card and the other Card in its column
 * - Update images accordingly
 * If main player's turn:
 *  - Remove class "flippable" from taken card's HTML element
 *  - Remove class "clickable" from HTML elements of locked cards, if any
 */

async function takeDrawnCard(game: Game, cardInd: number): Promise<void> {
  console.log("In main: takeDrawnCard");
  await game.currPlayer.takeDrawnCard(cardInd, game);
  const inds = game.lockCards(cardInd);

  showCard(game.topDiscard as Card, "discards");
  clearDrawnCardSpace(game);
  const card = game.currPlayer.cards[cardInd];
  const cardSpaceId = getCardSpaceId(cardInd, game);
  showCard(card, cardSpaceId);

  if (game.currPlayer === game.players[0]) {
    $(`#${cardSpaceId}`).closest(".cards").removeClass("flippable");
    if (inds) {
      makeUnclickable(game, inds);
    }
  }
}