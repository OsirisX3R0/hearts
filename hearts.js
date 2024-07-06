const player1Display = document.querySelector("#player1");
const player1Score = document.querySelector("#player1 .score");
const player2Display = document.querySelector("#player2");
const player2Score = document.querySelector("#player2 .score");
const player3Display = document.querySelector("#player3");
const player3Score = document.querySelector("#player3 .score");
const player4Display = document.querySelector("#player4");
const player4Score = document.querySelector("#player4 .score");
const player1Hand = document.querySelector("#hand");
const confirmButton = document.querySelector(".confirm");

/**
 * @typedef Player
 * @property {Number} number
 * @property {Number} score
 * @property {String[]} hand
 * @property {Boolean} loser
 */

const ranks = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
];
const suits = ["C", "D", "S", "H"];
const rankHierarchy = {
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  7: 6,
  8: 7,
  9: 8,
  10: 9,
  J: 10,
  Q: 11,
  K: 12,
  A: 13,
};
const suitHierarchy = {
  C: 1,
  D: 2,
  S: 3,
  H: 4,
};

/** Generates a new deck */
const buildDeck = () => {
  const deck = [];

  for (const rank of ranks) {
    for (const suit of suits) {
      deck.push(rank + suit);
    }
  }
  console.log(deck);

  return shuffle(deck);
};

/**
 * Shuffles the deck
 * @param {String[]} deck
 */
const shuffle = (deck) => {
  const newDeck = deck.slice(); // Create a copy of the deck
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

/**
 *
 * @param {String[]} deck
 * @returns {Player[]}
 */
const deal = (deck) => {
  let players = [
    { number: 1, score: 0, hand: [], loser: false },
    { number: 2, score: 0, hand: [], loser: false },
    { number: 3, score: 0, hand: [], loser: false },
    { number: 4, score: 0, hand: [], loser: false },
  ];
  let player = 0;

  for (const card of deck) {
    players[player].hand.push(card);

    player = player === 3 ? 0 : ++player;
  }

  return players.map((player) => ({
    ...player,
    hand: player.hand.sort(sortHand),
  }));
};

/**
 * Extracts the rank/suit from a card string
 * @param {String} card
 */
const getRankAndSuit = (card) => {
  const rank = card.substring(0, card.length - 1);
  const suit = card.substring(card.length - 1);

  return { rank, suit };
};

/**
 * Sorts cards in a player's hand
 * @param {String} a
 * @param {String} b
 */
const sortHand = (a, b) => {
  const { rank: rankA, suit: suitA } = getRankAndSuit(a);
  const { rank: rankB, suit: suitB } = getRankAndSuit(b);

  if (suitHierarchy[suitA] === suitHierarchy[suitB])
    return rankHierarchy[rankA] > rankHierarchy[rankB] ? 1 : -1;

  return suitHierarchy[suitA] > suitHierarchy[suitB] ? 1 : -1;
};

/**
 * Pick 3 from a hand to pass
 * @param {String[]} hand
 */
const pickThree = (hand) => {
  let updatedHand = [...hand];
  let picks = [];
  for (let x = 1; x <= 3; x++) {
    const index = updatedHand.findIndex((card) => {
      const { rank, suit } = getRankAndSuit(card);
      return (
        (rank > rankHierarchy[10] && suit >= suitHierarchy.S) ||
        rank > rankHierarchy[10] ||
        rank > rankHierarchy[6] ||
        true
      );
    });

    const [pick] = updatedHand.splice(index, 1);
    picks.push(pick);
  }

  return [picks, updatedHand];
};

/**
 * Pick 3 from a hand to pass (for human player)
 * @param {String[]} hand
 * @returns {Promise<String[][]>}
 */
const pickThreePlayer1 = (hand) => {
  return new Promise((resolve) => {
    let updatedHand = [...hand];
    let picks = [];

    /**
     * Handles click event for selecting cards
     * @param {Element} playerCard
     */
    const selectHandler = (playerCard) => () => {
      // Get the index of the card in current picks
      let pickIndex = picks.findIndex((card) => card === playerCard.innerHTML);

      if (pickIndex >= 0) {
        // If it's in picks, move it back to the hand
        const [pick] = picks.splice(pickIndex, 1);
        updatedHand.push(pick);
        playerCard.classList.remove("selected");
      } else {
        // Otherwise, move it from hand to picks
        const handIndex = updatedHand.findIndex(
          (card) => card === playerCard.innerHTML
        );
        const [pick] = updatedHand.splice(handIndex, 1);
        picks.push(pick);
        playerCard.classList.add("selected");
      }

      if (picks.length === 3) {
        // Display confirmation button if all 3 picks have been made
        confirmButton.classList.add("show");
      } else {
        // Otherwise, hide the button
        confirmButton.classList.remove("show");
      }
    };

    // Add event listeners to all player 1 cards
    const playerCards = document.querySelectorAll(".player-card");
    playerCards.forEach((playerCard) => {
      playerCard.addEventListener("click", selectHandler(playerCard));
    });

    confirmButton.addEventListener("click", () => {
      // If the confirm button is clicked:
      // - Hide the button
      // - Remove card event listeners
      // - Resolve promise with picks and updated hand
      confirmButton.classList.remove("show");
      playerCards.forEach((playerCard) => {
        playerCard.classList.remove("slected");
        playerCard.removeEventListener("click", selectHandler(playerCard));
      });
      resolve([picks, updatedHand]);
    });
  });
};

/**
 * Visually updates Player 1's hand
 * @param {String[]} hand
 */
const updatePlayer1Hand = (hand) => {
  for (let card of hand) {
    let { suit } = getRankAndSuit(card);
    const span = document.createElement("span");
    span.classList.add("player-card");
    if (suit === "D" || suit === "H") span.classList.add("red");
    span.innerHTML = card;
    player1Hand.appendChild(span);
  }
};

/**
 * Pass cards from one hand to another
 * @param {String[]} picks
 * @param {String[]} deck
 */
const pass = (picks, deck) => {
  // const [picks, passedFrom] = pickThree(from);

  // return [passedFrom.sort(sortHand), [...to, ...picks].sort(sortHand)];
  return [...deck, ...picks].sort(sortHand);
};

/**
 * Finds the next player
 * @param {Player} player
 * @param {Player} previousPlayer
 */
const nextPlayer = (player, previousPlayer = null) => {
  if (!previousPlayer) return player.hand.includes("2C");

  return previousPlayer.number < 4
    ? player.number === previousPlayer.number + 1
    : player.number === 1;
};

/** Game logic */
const game = async () => {
  // Generate the deck
  const deck = buildDeck();
  // console.log(deck);

  // Deal to the players
  let [player1, player2, player3, player4] = deal(deck);
  // console.log(player1);
  // console.log(player2);
  // console.log(player3);
  // console.log(player4);

  // Create the card elements for player 1
  updatePlayer1Hand(player1.hand);

  /** @type {Player} */
  let loser;
  let round = 1;
  while (!loser) {
    // If it's the last round in a set of 4 (4, 8, 12, 16, etc), prepare to pass
    /** @type {String[]} */
    let player1Picks = [];
    /** @type {String[]} */
    let player1Hand = [];
    /** @type {String[]} */
    let player2Picks = [];
    /** @type {String[]} */
    let player2Hand = [];
    /** @type {String[]} */
    let player3Picks = [];
    /** @type {String[]} */
    let player3Hand = [];
    /** @type {String[]} */
    let player4Picks = [];
    /** @type {String[]} */
    let player4Hand = [];
    if (round % 4 !== 0) {
      const player1Result = await pickThreePlayer1(player1.hand);
      player1Picks = player1Result[0];
      player1Hand = player1Result[1];
      const player2Result = pickThree(player2.hand);
      player2Picks = player2Result[0];
      player2Hand = player2Result[1];
      const player3Result = pickThree(player3.hand);
      player3Picks = player3Result[0];
      player3Hand = player3Result[1];
      const player4Result = pickThree(player4.hand);
      player4Picks = player4Result[0];
      player4Hand = player4Result[1];
    }

    // Pass accordingly
    switch (round) {
      // Pass to left (1 -> 2 -> 3 -> 4 -> 1)
      case 1:
        player2.hand = pass(player1Picks, player2Hand);
        player3.hand = pass(player2Picks, player3Hand);
        player4.hand = pass(player3Picks, player4Hand);
        player1.hand = pass(player4Picks, player1Hand);
        break;
      // Pass to right (1 -> 4 -> 3 -> 2 -> 1)
      case 2:
        player4.hand = pass(player1Picks, player4Hand);
        player3.hand = pass(player4Picks, player3Hand);
        player2.hand = pass(player3Picks, player2Hand);
        player1.hand = pass(player2Picks, player1Hand);
        break;
      // Pass across (1 <-> 3 2 -> 4)
      case 3:
        player3.hand = pass(player1Picks, player3Hand);
        player1.hand = pass(player3Picks, player1Hand);
        player2.hand = pass(player4Picks, player2Hand);
        player4.hand = pass(player2Picks, player4Hand);
        break;
      default:
    }

    updatePlayer1Hand(player1.hand);

    // Get initial player order
    const players = [player1, player2, player3, player4];
    let first = players.find(nextPlayer);
    let second = players.find((player) => nextPlayer(player, first));
    let third = players.find((player) => nextPlayer(player, second));
    let fourth = players.find((player) => nextPlayer(player, third));

    let turn = 1;

    while (
      player1.hand.length &&
      player2.hand.length &&
      player3.hand.length &&
      player4.hand.length
    ) {
      turn += 1;
    }

    loser = [player1, player2, player3, player4].find((p) => p.loser);
  }
};

game();
