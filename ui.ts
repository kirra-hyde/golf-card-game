import { Game, Card, Player } from "./models.js";
import {
  getCardSpaceId, getDrawnCardSpaceId, getPlayerIndex, getWinnerInd, getDrawnCard,
  calcMoveDistance, getDrawnCardBackground, calcMoveDistanceWithRotate,
  getDrawnCardArea, getRotation,
} from "./utilities.js";

import discardsPlaceholder from "./images/discards_placeholder.png";
import deck from "./images/deck.png";
import discardPile from "./images/discards.png";
import emptyDeck from "./images/empty_deck.png";
import cardBack from "./images/back.png";
import blank from "./images/blank.png";

const $startScreen = $("#start-screen");
const $cardsArea = $("#cards-area");
const $endRoundScreen = $("#end-round-screen");
const $endScreen = $("#end-screen");

const $nameField = $("#name-field") as JQuery<HTMLInputElement>;
const $nameSpace = $("#p1-name");
const $discards = $("#discards");
const $topDiscard = $("#top-discard");
const $messages = $("#messages");
const $deck = $("#deck");
const $deckCard = $("#deck-card");
const $deckArea = $("#deck-area");
const $roundScores = $("#round-scores");
const $totalScores = $("#total-scores");
const $endMessage = $("#end-message");
const $lastRoundScores = $("#last-round-scores");
const $finalScores = $("#final-scores");

const TAKE_TIME = 500;

/*******************************************************************************
 * UI for player moves
*/

/** Update UI after drawing from discard pile
 *
 * Takes: game, a Game instance
 */

async function drawDiscardUI(game: Game): Promise<void> {
  const fromOffset = $discards.offset() as JQuery.Coordinates;
  const toOffset = getDrawnCardBackground(game).offset() as JQuery.Coordinates;
  const { top, left } = calcMoveDistance(fromOffset, toOffset);
  const { start, end } = getRotation(game, "draw");

  $topDiscard.css("--start-angle", `${start}deg`);
  $topDiscard.css("--end-angle", `${end}deg`);
  $topDiscard.css("--horizontal-distance", `${left}px`);
  $topDiscard.css("--vertical-distance", `${top}px`);
  $topDiscard.css("animation", `take-card ${TAKE_TIME}ms`);

  await takePause();
  clearTopDiscardSpace();
  const card = game.currPlayer.drawnCard as Card;
  showImg(card, getDrawnCardSpaceId(game));

  $topDiscard.css("animation", "");
}

/** Update UI after taking a drawn card
 *
 * Takes:
 * - game: a Game instance
 * - cardInd: a number of the index where the card was taken to
 */

async function takeDrawnUI(game: Game, cardInd: number): Promise<void> {

  // Animation 1: discard card from the hand

  // Element to be animated
  const cardSpaceId = getCardSpaceId(cardInd, game);
  const $handCard = $(`#${cardSpaceId}`).closest(".card");

  // Flip card about to be discarded, if it's face down
  if (!$handCard.is(".face-up")) {
    flipCard(game.topDiscard as Card, cardSpaceId);
    await takePause();
  }
  // Ancestors of $handCard. Their z-index needs raised so $handCard stays visible through animation
  const $handCardArea = $handCard.parent();
  const $playerCardsArea = $handCardArea.parent();

  const $drawnCardBackground = getDrawnCardBackground(game);
  const drawnCoords = $drawnCardBackground.offset() as JQuery.Coordinates;
  const handCoords = $handCard.offset() as JQuery.Coordinates;
  const discardCoords = $discards.offset() as JQuery.Coordinates;

  const discardDistance = calcMoveDistanceWithRotate(handCoords, discardCoords, game);

  // Adjust z-indexes so that $handcard stays visible through animation
  $handCardArea.css("z-index", "6");
  $playerCardsArea.css("z-index", "5");
  const rotations = getRotation(game, "discard");

  $handCard.css("--start-angle", `${rotations.start}deg`);
  $handCard.css("--end-angle", `${rotations.end}deg`);
  $handCard.css("--horizontal-distance", `${discardDistance.left}px`);
  $handCard.css("--vertical-distance", `${discardDistance.top}px`);

  // The animation
  $handCard.css("animation", `take-flipped-card ${TAKE_TIME}ms`);

  await takePause();

  // Set images to how they should be after animation
  showImg(game.topDiscard as Card, "top-discard");
  $handCard.hide();

  // Clear all the z-index changes and animation
  $handCard.css("animation", "");
  $handCardArea.css("z-index", "");
  $playerCardsArea.css("z-index", "");


  // Animation 2: Take drawn card into hand
  const card = game.currPlayer.cards[cardInd];

  // Element to be animated
  const drawnCardSpaceId = getDrawnCardSpaceId(game);
  const $drawnCard = $(`#${drawnCardSpaceId}`);

  const takeDistance = calcMoveDistanceWithRotate(drawnCoords, handCoords, game);
  const { start, end } = getRotation(game, "take");

  // Adjust the z-indexes so the drawn card stays visible through animation
  const $drawnCardArea = getDrawnCardArea(game);
  $drawnCardArea.css("z-index", "4");
  $drawnCardBackground.css("z-index", "5");
  $drawnCard.css("z-index", "6");


  // The animation
  $drawnCard.css("--start-angle", `${start}deg`);
  $drawnCard.css("--end-angle", `${end}deg`);
  $drawnCard.css("--horizontal-distance", `${takeDistance.left}px`);
  $drawnCard.css("--vertical-distance", `${takeDistance.top}px`);
  $drawnCard.css("animation", `take-card ${TAKE_TIME}ms`);

  await takePause();

  // Set images to how they should be after animation and clear z-indexes
  $handCard.show();
  showCard(card, cardSpaceId);
  clearDrawnCardSpace(game);
  $drawnCard.css("animation", "");
  $drawnCardArea.css("z-index", "");
  $drawnCardBackground.css("z-index", "");
  $drawnCard.css("z-index", "");
}

/** Update UI after drawing from the deck
 *
 * Takes:
 * - game: a Game instance
 */

async function drawDeckUI(game: Game) {
  const card = game.currPlayer.drawnCard as Card;
  showImg(card, "deck-card");

  const fromOffset = $deck.offset() as JQuery.Coordinates;
  const toOffset = getDrawnCardBackground(game).offset() as JQuery.Coordinates;
  const { left, top } = calcMoveDistance(fromOffset, toOffset);
  const { start, end } = getRotation(game, "draw");

  $deckCard.css("--start-angle", `${start}deg`);
  $deckCard.css("--end-angle", `${end}deg`);
  $deckCard.css("--horizontal-distance", `${left}px`);
  $deckCard.css("--vertical-distance", `${top}px`);
  $deckCard.css("animation", `take-card ${TAKE_TIME}ms`);

  await takePause();

  showImg(card, getDrawnCardSpaceId(game));

  $deckCard.removeAttr("src");
  $deckCard.hide();
  $deckCard.css("animation", "");

  clearDeckIfEmpty(game);
}

/** Update UI after discarding a card drawn from the deck
 *
 * Takes:
 * - game: a Game instance
 */

async function discardDrawnUI(game: Game) {

  const $card = getDrawnCard(game);
  const $cardArea = $card.parent();

  const fromOffset = $card.offset() as JQuery.Coordinates;
  const toOffset = $discards.offset() as JQuery.Coordinates;
  const { left, top } = calcMoveDistanceWithRotate(fromOffset, toOffset, game);
  const { start, end } = getRotation(game, "discard");

  $cardArea.css("z-index", "5");
  $card.css("--start-angle", `${start}deg`);
  $card.css("--end-angle", `${end}deg`);
  $card.css("--horizontal-distance", `${left}px`);
  $card.css("--vertical-distance", `${top}px`);
  $card.css("animation", `take-card ${TAKE_TIME}ms`);

  await takePause();

  showImg(game.topDiscard as Card, "top-discard");
  clearDrawnCardSpace(game);

  $card.css("animation", "");
  $cardArea.css("z-index", "");
}


/*******************************************************************************
 * Misc
*/

/** Make card back images move from deck to each card spot */

async function dealUI(game: Game) {
  const fromOffset = $deck.offset() as JQuery.Coordinates;
  const cardSpaces = $(".card-space").toArray();
  cardSpaces.sort(() => Math.random() - .5);

  for (let space of cardSpaces) {
    const toOffset = $(space).offset() as JQuery.Coordinates;
    const $tempDiv = $("<img>");
    $tempDiv.attr("src", cardBack);
    $deckArea.append($tempDiv);
    $tempDiv.css("position", "absolute");
    $tempDiv.css("width", "90%");
    $tempDiv.css("height", "100%");

    const { left, top } = calcMoveDistance(fromOffset, toOffset);

    $tempDiv.css("--horizontal-distance", `${left}px`);
    $tempDiv.css("--vertical-distance", `${top}px`);
    $tempDiv.css("animation", "deal-card 50ms");

    await tinyPause();

    $(space).children().show();
    $tempDiv.remove();
  }
  await tinyPause();

  const card = game.topDiscard as Card;
  showImg(card, "top-discard");
}

async function shuffle() {
  for (let i = 0; i < 8; i++) {
    const $tempCard = $("<img>");
    $tempCard.addClass("temp");
    $tempCard.attr("src", cardBack);
    $tempCard.css("visibility", "hidden");

    const delay = Math.random() * 0.5;
    const direction = Math.random() < 0.5 ? 1 : -1;
    const rotate = Math.random() * 20 * direction;
    const translateX = Math.random() * 20 * direction;
    const translateY = Math.random() * 20 * direction;
    $($tempCard).css("animation", `shuffle 600ms ease-in-out ${delay}s infinite`);
    $($tempCard).css("transform", `translate(${translateX}px, ${translateY}px) rotate(${rotate}deg)`);

    $deckArea.append($tempCard);
  }
  // Cards have random delays before they start shuffling, so they're not in unison.
  // We wait to show the cards so that they'll all be moving when they're shown.
  await shufflePause();
  $(".temp").css("visibility", "visible");
  await shortPause();
  $(".temp").remove();
}

/** Show the card area where the game is played
 *
 * - Get main player name from form
 * - Update screen to show card area with main player name
 *
 * Returns: mainPlayerName, a string representing the main player's name
 */

function showCardsArea(): string {
  const mainPlayerName = $nameField.val() || "You";
  $startScreen.hide();
  $cardsArea.css("display", "grid");
  $nameSpace.text(mainPlayerName);
  return mainPlayerName;
}

/** Update images when discards are shuffled into the main deck */

async function updatePicsOnReshuffle(): Promise<void> {
  $discards.attr("src", discardsPlaceholder);
  $discards.attr("alt", "discards go here");
  await tinyPause();
  $topDiscard.attr("src", blank);
  $deck.attr("src", deck);
  $topDiscard.removeAttr("alt");
  $deck.attr("alt", "main deck of cards");
  await shuffle();
  await shortPause();
}

/** Flip card face up and show image w/out flip animation
 *
 * Takes:
 * - card: Card instance, whose image will be shown
 * - cardSpaceId: string of the id of the HTML element where image will be shown
 */

function showCard(card: Card, cardSpaceID: string): void {
  const $cardSpace = $(`#${cardSpaceID}`);
  $cardSpace.attr("src", card.image);
  $cardSpace.attr("alt", `front of card, a ${card.value}`);
  const $flipper = $cardSpace.closest(".card");
  $flipper.css("transition", "0s");
  $flipper.css("transform", "rotateY(180deg)");
  $cardSpace.show();
  $flipper.addClass("face-up");
}

/** Show image of a card, with flip animation
 *
 * Takes:
 * - card: Card instance, whose image will be shown
 * - cardSpaceId: string of the id of the HTML element where image will be shown
 */

function flipCard(card: Card, cardSpaceID: string): void {
  const $cardSpace = $(`#${cardSpaceID}`);
  $cardSpace.attr("src", card.image);
  $cardSpace.attr("alt", `front of card, a ${card.value}`);
  const $flipper = $cardSpace.closest(".card");
  $flipper.css("transform", "rotateY(180deg)");
  $flipper.addClass("face-up");
}

/** Show image of a card, no flipping or animations
 *
 * Takes:
 * - card: Card instance, whose image will be shown
 * - cardSpaceId: string of the id of the HTML element where image will be shown
 */

function showImg(card: Card, cardSpaceID: string): void {
  const $cardSpace = $(`#${cardSpaceID}`);
  $cardSpace.attr("src", card.image);
  $cardSpace.attr("alt", `front of card, a ${card.value}`);
  $cardSpace.show();
}

/** Remove image of card from discard pile
 *
 * Takes: game, a Game instance
 */

function clearTopDiscardSpace(): void {
  $topDiscard.removeAttr("src");
  $topDiscard.removeAttr("alt");
  $topDiscard.hide();
}

/** Show empty placeholder image in current player's drawn card spot */

function clearDrawnCardSpace(game: Game): void {
  const $drawnCardSpace = getDrawnCard(game);
  $drawnCardSpace.removeAttr("src");
  $drawnCardSpace.removeAttr("alt");
  $drawnCardSpace.hide();
}

/** If deck is empty, show image of empty deck placeholder in deck area
 *
 * Takes: game, a Game instance
 */

function clearDeckIfEmpty(game: Game): void {
  if (game.deckIsEmpty) {
    $deck.attr("src", emptyDeck);
    $deck.attr("alt", "No more cards. Click me to get discard pile and shuffle.");
  }
}

/** Updates discard pile images
 *
 * Takes: game, a Game instance
 */

function updateDiscardPile(): void {
  $discards.attr("src", discardPile);
  $discards.attr("alt", "discards pile");
}

/** Remove "clickable" class from a column of flipped cards
 *
 * Takes:
 * - game: a Game instance
 * - inds: an array of numbers representing the indexes of cards
 * - player: a Player instance, the owner of the cards (defaults to currPlayer)
 */

function makeUnclickable(
  game: Game, inds: number[], player: Player = game.currPlayer): void {
  const id1 = getCardSpaceId(inds[0], game, player);
  const id2 = getCardSpaceId(inds[1], game, player);
  $(`#${id1}`).closest(".card").removeClass("clickable");
  $(`#${id2}`).closest(".card").removeClass("clickable");
}

/** Make a card unflippable by removing the "flippable" class.
 *  Optionally, make cards unclickable.
 *
 * Takes:
 * - game: a Game instance
 * - cardInd: a number representing the index of the Card to make unflippable
 * - inds: an array of card indices to make unclickable (optional)
 */

function makeUnflippable(game: Game, cardInd: number, inds: number[] | void) {
  if (game.currPlayer === game.players[0]) {
    const cardSpaceId = getCardSpaceId(cardInd, game);
    const $card = $(`#${cardSpaceId}`).closest(".card");
    $card.removeClass("flippable");

    if (inds) {
      makeUnclickable(game, inds);
    }
  }
}

/** Show round scores and cumulative scores, for end of round
 *
 * Takes:
 *   - roundScores: an array of numbers of the player's scores for the round
 *   - game: a Game instance
 */

function showScores(game: Game, roundScores: number[]): void {

  const roundMessage = makeScoreMessage(roundScores, game);
  $roundScores.text(`Round scores:  ${roundMessage}`);

  const totalMessage = makeScoreMessage(game.scores, game);
  $totalScores.text(`Total scores:  ${totalMessage}`);

  $endRoundScreen.show();
}

/** Show end of game message, scores for round, and final scores
 *
 * Takes:
 *   - roundScores: an array of numbers of the player's scores for the round
 *   - game: a Game instance
 */

function showEndScreen(game: Game, roundScores: number[]): void {

  const roundMessage = makeScoreMessage(roundScores, game);
  $lastRoundScores.text(`Round scores:  ${roundMessage}`);

  let endMessage: string;
  const winner = game.getWinner(); // Use the new getWinner method
  if (winner === game.players[0]) {
    endMessage = "Congratulations, you win!!";
  } else {
    endMessage = `${winner.name} wins`;
  }
  $endMessage.text(endMessage);

  const totalMessage = makeScoreMessage(game.scores, game);
  $finalScores.text(totalMessage);

  $endScreen.show();
}

/** Make a message about Players' scores
 *
 * Takes:
 *   - scores: an array of numbers representing the player's scores
 *   - game: a Game instance
 * Returns: a string of a message with the player's scores
 */

function makeScoreMessage(scores: number[], game: Game): string {
  const [tot1, tot2, tot3, tot4] = scores;
  const name = game.players[0].name;
  const msg = `${name}: ${tot1}, Billy: ${tot2}, Bobby: ${tot3}, Buddy: ${tot4}`;
  return msg;
}

/** Set UI for a new round
 *
 * - Show full deck, empty discard pile, and back of cards for cards in hands
 * - Give HTML elements for main player cards classes "clickable" and "flippable"
 */

async function resetCardArea(): Promise<void> {
  console.log("in resetCardArea");

  const $cards = $(".card");
  $discards.attr("src", discardsPlaceholder);
  $discards.attr("alt", "discards go here");
  await takePause();
  $cards.hide();
  $topDiscard.hide();
  $cards.find("img").attr("src", cardBack);
  $cards.find("img").attr("alt", "back of card");
  $cards.removeClass("face-up");
  $cards.css("transform", "rotateY(0deg)");
  $cards.css("transition", "transform 0.6s");
  await tinyPause();

  const $mainPlayerCards = $("#p1 .card");
  $mainPlayerCards.addClass("clickable flippable");

  $deck.attr("src", deck);
  $deck.attr("alt", "main deck of cards");
  $topDiscard.removeAttr("src");
  $topDiscard.removeAttr("alt");

  $endRoundScreen.hide();
}

/** Make current player's name bold
 *
 * Takes: game, a Game instance
 */

function boldenName(game: Game) {
  const $nameArea = $(`#p${getPlayerIndex(game) + 1}-name`);
  $nameArea.addClass("bold");
}

/** Make current player's name not bold
 *
 * Takes: game, a Game instance
 */

function unboldenName(game: Game) {
  const $nameArea = $(`#p${getPlayerIndex(game) + 1}-name`);
  $nameArea.removeClass("bold");
}


/*******************************************************************************
 * Messages
*/

/** Display message of who dealer is for .8 seconds
 *
 * Takes: game, a Game instance
 */

function showDealMessage(game: Game): void {
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

/** Display message to flip cards for 1 second */

function showFlipMessage(): void {
  $messages.show();
  $messages.text("Flip 2 cards");

  setTimeout(() => {
    $messages.hide();
  }, 1000);
}

/** Display message of whose turn it is for .8 seconds
 *
 * Takes: game, a Game instance
 */

function showTurnMessage(game: Game): void {
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

/*******************************************************************************
 * Pauses
*/

/** Pause game for 1 seconds, for image changes to not feel too rushed */

function shortPause(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });
}

/** Pause game for 1.3 seconds, simulates computer player thinking */

function longPause(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 1300);
  });
}

/** Pause game for a beat, for visuals changing in right order */

function tinyPause(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 50);
  });
}

/** Pause game for time it takes to take a card (minus a hair for smoother transition)*/

function takePause(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, TAKE_TIME - 25);
  });
}

/** Pause game to adjust for delays in shuffle animation */

function shufflePause(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 400);
  });
}


export {
  showCardsArea, flipCard, showFlipMessage, showDealMessage, showTurnMessage,
  showImg, updatePicsOnReshuffle, makeUnclickable, resetCardArea, shortPause,
  longPause, showScores, showEndScreen, boldenName, unboldenName, tinyPause,
  drawDiscardUI, discardDrawnUI, takeDrawnUI, makeUnflippable, drawDeckUI,
  updateDiscardPile, dealUI, shuffle, shufflePause,
};