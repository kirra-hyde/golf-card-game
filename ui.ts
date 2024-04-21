import { Game, Card, Player } from "./models.js";
import { getCardSpaceId, getDrawnCardSpaceId } from "./utilties.js";

const $startScreen = $("#start-screen");
const $cardsArea = $("#cards-area");

const $nameField = $("#name-field") as JQuery<HTMLInputElement>;
const $nameSpace = $("#p1-name");
const $discards = $("#discards");
const $messages = $("#messages");
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

/** Update images when discards are shuffled into the main deck */

function updatePicsOnReshuffle(): void {
  $discards.attr("src", "./images/discards_placeholder.png");
  $discards.attr("alt", "discards go here");
  $deck.attr("src", "./images/deck.png");
  $deck.attr("alt", "main deck of cards");
}

/** Show image of a card
 *
 * Takes:
 * - card: Card instance, whose image will be shown
 * - cardSpaceId: string of the id of the HTML element where image will be shown
 */

function showCard(card: Card, cardSpaceID: string): void {
  const $cardSpace = $(`#${cardSpaceID}`);
  $cardSpace.attr("src", card.image);
  $cardSpace.attr("alt", `front of card, a ${card.value}`);
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

/** Show empty placeholder image in current player's drawn card spot */

function clearDrawnCardSpace(game: Game): void {
  const drawnCardSpaceId = getDrawnCardSpaceId(game);
  const $drawnCardSpace = $(`#${drawnCardSpaceId}`);
  $drawnCardSpace.attr("src", "./images/drawn_placeholder.png");
  $drawnCardSpace.attr("alt", "drawn card spot");
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


/** Remove "clickable" class from a column of flipped cards
 *
 * Takes:
 * - game: a Game instance
 * - inds: an array of numbers representing the indexes of cards
 * - player: a Player instance, the owner of the cards (defaults to currPlayer)
 */

function makeUnclickable(game: Game, inds: number[], player: Player = game.currPlayer): void {
  const id1 = getCardSpaceId(inds[0], game, player);
  const id2 = getCardSpaceId(inds[1], game, player);
  $(`#${id1}`).removeClass("clickable");
  $(`#${id2}`).removeClass("clickable");
}

/** Set UI for a new round
 *
 * - Show card backs for cards in players hand, full deck, and empty discard pile
 * - Give HTML elements for main player's cards classes "clickable" and "flippable"
 */

function resetCardArea() {
  console.log("in resetCardArea");

  const $cards = $(".cards");
  $cards.attr("src", "./images/back.png");
  $cards.attr("alt", "back of card");

  const $mainPlayerCards = $("#p1 img");
  $mainPlayerCards.addClass("clickable");
  $mainPlayerCards.addClass("flippable");

  $deck.attr("src", "./images/deck.png");
  $deck.attr("alt", "main deck of cards");
  $discards.attr("src", "./images/discards_placeholder.png");
  $discards.attr("alt", "discards go here");
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


export {
  showCardsArea, showCard, clearDrawnCardSpace, clearTopDiscardSpace,
  clearDeckIfEmpty, showFlipMessage, showDealMessage, showTurnMessage,
  updatePicsOnReshuffle, makeUnclickable, resetCardArea, shortPause, longPause,
};