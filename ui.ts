import { Game, Card, Player } from "./models.js";
import {
  getCardSpaceId, getDrawnCardSpaceId, getPlayerIndex, getWinnerInd,
  getCardFromInd, getDrawnCard,
} from "./utilities.js";

import discardsPlaceholder from "./images/discards_placeholder.png";
import deck from "./images/deck.png";
import discardPile from "./images/discards.png";
import emptyDeck from "./images/empty_deck.png";
import cardBack from "./images/back.png";

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
 * - Move top discard card to drawn card spot
 * - Clear and hide top discard spot
 * - Show moved card in drawn card spot
 *
 * Takes: game, a Game instance
 */

async function drawDiscardUI(game: Game): Promise<void> {
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

  const card = game.currPlayer.cards[cardInd];
  const cardSpaceId = getCardSpaceId(cardInd, game);

  const $drawnSpot = getDrawnCard(game);
  $drawnSpot.css("animation", `take-card ${TAKE_TIME}ms`);

  const $handCard = getCardFromInd(game, cardInd).closest(".card");
  if (!$handCard.is(".face-up")) {
    showImg(game.topDiscard as Card, cardSpaceId);
    $handCard.css("animation", `take-and-flip-card ${TAKE_TIME}ms`);
  } else {
    $handCard.css("animation", `take-flipped-card ${TAKE_TIME}ms`);
  }
  await takePause();
  $handCard.css("animation", "");
  $drawnSpot.css("animation", "");

  showImg(game.topDiscard as Card, "top-discard");
  clearDrawnCardSpace(game);
  showCard(card, cardSpaceId);
}

/** Update UI after drawing from the deck
 *
 * Takes:
 * - game: a Game instance
 */

async function takeDeckUI(game: Game) {
  const card = game.currPlayer.drawnCard as Card;
  showImg(card, "deck-card");
  $deckCard.css("animation", `take-card ${TAKE_TIME}ms`);

  await takePause();

  showImg(card, getDrawnCardSpaceId(game));

  $deckCard.css("animation", "");
  $deckCard.removeAttr("src");
  $deckCard.hide();

  clearDeckIfEmpty(game);
  updateDiscardPile();
}

async function discardDrawnUI(game: Game) {

  const $card = getDrawnCard(game);
  $card.css("animation", `take-card ${TAKE_TIME}ms`);

  await takePause();

  $card.css("animation", "");
  showImg(game.topDiscard as Card, "top-discard");
  clearDrawnCardSpace(game);

}


/*******************************************************************************
 * Helpers used for player moves
*/

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

function updatePicsOnReshuffle(): void {
  $discards.attr("src", discardsPlaceholder);
  $discards.attr("alt", "discards go here");
  $deck.attr("src", deck);
  $deck.attr("alt", "main deck of cards");
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

function makeUnflippable(game: Game, cardInd: number, inds: number[] | void) {
  if (game.currPlayer === game.players[0]) {
    const $card = getCardFromInd(game, cardInd);
    $card.closest(".card").removeClass("flippable");
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
  const winnerInd = getWinnerInd(game);
  if (winnerInd === 0) {
    endMessage = "Congratulations, you win!!";
  } else {
    endMessage = `${game.players[winnerInd].name} wins`;
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
  $cards.find("img").attr("src", cardBack);
  $cards.find("img").attr("alt", "back of card");
  $cards.removeClass("face-up");

  const $mainPlayerCards = $("#p1 .card");
  $mainPlayerCards.addClass("clickable flippable");

  $cards.css("transition", "0s");
  $cards.css("transform", "rotateY(0deg)");
  await tinyPause();
  $cards.css("transition", "0.6s");

  $deck.attr("src", deck);
  $deck.attr("alt", "main deck of cards");
  $discards.attr("src", discardsPlaceholder);
  $discards.attr("alt", "discards go here");
  $topDiscard.removeAttr("src");
  $topDiscard.removeAttr("alt");
  $topDiscard.hide();

  $endRoundScreen.hide();
  $cards.hide();
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

/** Pause game for time it takes to take a card */

function takePause(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, TAKE_TIME);
  });
}


export {
  showCardsArea, flipCard, showFlipMessage, showDealMessage, showTurnMessage,
  showImg, updatePicsOnReshuffle, makeUnclickable, resetCardArea, shortPause,
  longPause, showScores, showEndScreen, boldenName, unboldenName, tinyPause,
  drawDiscardUI, discardDrawnUI, takeDrawnUI, makeUnflippable, takeDeckUI,
};