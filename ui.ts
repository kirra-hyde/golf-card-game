import { Game, Card } from "./models.js";
import { getCardFromCardSpaceID } from "./utilties.js";

const $startScreen = $("#start-screen");
const $cardsArea = $("#cards-area");

const $nameField = $("#name-field") as JQuery<HTMLInputElement>;
const $nameSpace = $("#p1-name");
const $discards = $("#discards");
const $messages = $("#messages");
const $drawnCardSpace = $("#drawn-card");
const $deck = $("#deck");


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
  $cardsArea.show();
  $nameSpace.text(mainPlayerName);
  return mainPlayerName;
}

/** Update images when player takes their drawn card
 *
 * - Have pic of replaced card shown in discard pile
 * - Have pic of taken card shown in player's card area
 * - Have holder space shown in player's drawn card spot
 *
 * Takes:
 * - game: a Game instance
 * - cardSpaceId: a string of the id of an HTML element for showing cards
 */

function updatePicsOnTakeDrawnCard(game: Game, cardSpaceID: string): void {
  showTopDiscard(game.topDiscard as Card);
  clearDrawnCardSpace();
  const card = getCardFromCardSpaceID(cardSpaceID, game);
  showCardInHand(card, cardSpaceID);
}

/** Update images when discards are shuffled into the main deck */

function updatePicsOnReshuffle(): void {
  $discards.attr("src", "./images/discards_placeholder.png");
  $discards.attr("alt", "discards go here");
  $deck.attr("src", "./images/deck.png");
  $deck.attr("alt", "main deck of cards");
}

/** Show image of a card in a space in a player's card area
 *
 * Takes:
 * - card: Card instance, whose image will be shown
 * - cardSpaceId: string of the id of the HTML element where image will be shown
 */

function showCardInHand(card: Card, cardSpaceID: string): void {
  const $cardSpace = $(`#${cardSpaceID}`);
  $cardSpace.attr("src", card.image);
  $cardSpace.attr("alt", `front of card, a ${card.value}`);
}

/** Show image of card in discard pile
 *
 * Takes: card, a Card instance, whose image will be shown
 */

function showTopDiscard(card: Card): void {
  $discards.attr("src", card.image);
  $discards.attr("alt", `front of card, a ${card.value}`);
}

/** Remove image of card from discard pile
 *
 * Takes: game, a Game instance
 */

function clearTopDiscardSpace(game: Game): void {
  if (game.discardPileHasCards) {
    $discards.attr("src", "./images/discards.png");
    $discards.attr("alt", "discards pile");
  } else {
    $discards.attr("src", "./images/discards_placeholder.png");
    $discards.attr("alt", "discards go here");
  }
}

/** Show image of main player's drawn card in their drawn card spot
 *
 * Takes: game, a Game instance
 */
function showDrawnCard(game: Game): void {
  const card = game.players[0].drawnCard as Card;
  $drawnCardSpace.attr("src", card.image);
  $drawnCardSpace.attr("alt", `front of card, a ${card.value}`);
}

/** Show empty placeholder image in main player's drawn card spot */

function clearDrawnCardSpace(): void {
  $drawnCardSpace.attr("src", "./images/drawn_placeholder.png");
  $drawnCardSpace.attr("alt", "your drawn cards go here");
}

/** If deck is empty, show image of empty deck placeholder in deck area
 *
 * Takes: game, a Game instance
 */

function clearDeckIfEmpty(game: Game): void {
  if (game.deckIsEmpty) {
    $deck.attr("src", "./images/empty_deck.png");
    $deck.attr("alt", "No more cards. Click me to get discard pile and shuffle.");
  }
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


export {
  showCardsArea, updatePicsOnTakeDrawnCard, showDrawnCard, clearDrawnCardSpace,
  clearTopDiscardSpace, clearDeckIfEmpty, showFlipMessage, showDealMessage,
  showTurnMessage, showTopDiscard, showCardInHand, updatePicsOnReshuffle
};