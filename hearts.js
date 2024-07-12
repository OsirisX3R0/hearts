/** Display elements for cards in play */
const displayEls = {
  player1DisplayEl: document.querySelector("#player1"),
  player2DisplayEl: document.querySelector("#player2"),
  player3DisplayEl: document.querySelector("#player3"),
  player4DisplayEl: document.querySelector("#player4"),
};

/** Display elements for scores */
const scoreEls = {
  player1ScoreEl: document.querySelector("#player1 .score"),
  player2ScoreEl: document.querySelector("#player2 .score"),
  player3ScoreEl: document.querySelector("#player3 .score"),
  player4ScoreEl: document.querySelector("#player4 .score"),
};

/** Display elements for hands (ONLY PLAYER 1) */
const handEls = {
  player1HandEl: document.querySelector("#hand"),
};

/** Confirm button element */
const confirmButton = document.querySelector(".confirm");

/**
 * @typedef PlayersObject
 * @property {Player} player1
 * @property {Player} player2
 * @property {Player} player3
 * @property {Player} player4
 */

/** A game of Hearts */
class Game {
  /** Creates a new instance of the game Hearts */
  constructor() {
    // Generate the deck
    /** @type {Deck} */
    this.deck = new Deck();

    // Deal to the players
    /** @type {PlayersObject} */
    this.players = this.deck.deal();
  }

  /** Begins gameplay */
  async start() {
    // Create the card elements for player 1
    this.players.player1.updateHand();

    /** @type {Player} */
    let round = 1;
    while (!this.loser) {
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
        const player1Result = await this.players.player1.pickThree();
        player1Picks = player1Result[0];
        player1Hand = player1Result[1];
        const player2Result = await this.players.player2.pickThree();
        player2Picks = player2Result[0];
        player2Hand = player2Result[1];
        const player3Result = await this.players.player3.pickThree();
        player3Picks = player3Result[0];
        player3Hand = player3Result[1];
        const player4Result = await this.players.player4.pickThree();
        player4Picks = player4Result[0];
        player4Hand = player4Result[1];
      }

      // Pass accordingly
      switch (round) {
        // Pass to left (1 -> 2 -> 3 -> 4 -> 1)
        case 1:
          this.players.player2.hand = this.pass(player1Picks, player2Hand);
          this.players.player3.hand = this.pass(player2Picks, player3Hand);
          this.players.player4.hand = this.pass(player3Picks, player4Hand);
          this.players.player1.hand = this.pass(player4Picks, player1Hand);
          break;
        // Pass to right (1 -> 4 -> 3 -> 2 -> 1)
        case 2:
          this.players.player4.hand = this.pass(player1Picks, player4Hand);
          this.players.player3.hand = this.pass(player4Picks, player3Hand);
          this.players.player2.hand = this.pass(player3Picks, player2Hand);
          this.players.player1.hand = this.pass(player2Picks, player1Hand);
          break;
        // Pass across (1 <-> 3 2 -> 4)
        case 3:
          this.players.player3.hand = this.pass(player1Picks, player3Hand);
          this.players.player1.hand = this.pass(player3Picks, player1Hand);
          this.players.player2.hand = this.pass(player4Picks, player2Hand);
          this.players.player4.hand = this.pass(player2Picks, player4Hand);
          break;
        default:
      }

      this.players.player1.updateHand();

      // Get initial player order
      let first = this.playersAsArray.find(this.nextPlayer);
      let second = this.playersAsArray.find((player) =>
        this.nextPlayer(player, first)
      );
      let third = this.playersAsArray.find((player) =>
        this.nextPlayer(player, second)
      );
      let fourth = this.playersAsArray.find((player) =>
        this.nextPlayer(player, third)
      );

      let turn = 1;

      while (this.turnOver) {
        turn += 1;
      }
    }
  }

  /**
   * Returns the players as an array
   * @type {Player[]}
   */
  get playersAsArray() {
    return Object.values(this.players);
  }

  /**
   * Returns the loser of the game, if there is one
   * @type {Player | undefined}
   */
  get loser() {
    return Object.values(this.players).find((p) => p.loser);
  }

  /**
   * Whether or not a turn is over
   * @type {Boolean}
   */
  get turnOver() {
    return (
      !this.players.player1.hand.length &&
      !this.players.player2.hand.length &&
      !this.players.player3.hand.length &&
      !this.players.player4.hand.length
    );
  }

  /**
   * Pass cards from one hand to another
   * @param {String[]} picks
   * @param {String[]} deck
   */
  pass(picks, deck) {
    // const [picks, passedFrom] = pickThree(from);

    // return [passedFrom.sort(sortHand), [...to, ...picks].sort(sortHand)];
    return [...deck, ...picks].sort(Deck.sortHand);
  }

  /**
   * Finds the next player
   * @param {Player} player
   * @param {Player} previousPlayer
   */
  nextPlayer(player, previousPlayer = null) {
    if (!previousPlayer) return player.hand.includes("2C");

    return previousPlayer.number < 4
      ? player.number === previousPlayer.number + 1
      : player.number === 1;
  }
}

/** A standard 52-card deck */
class Deck {
  static ranks = [
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
  static suits = ["C", "D", "S", "H"];
  static rankHierarchy = {
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
  static suitHierarchy = {
    C: 1,
    D: 2,
    S: 3,
    H: 4,
  };

  /**
   * Extracts the rank/suit from a card string
   * @param {String} card
   */
  static getRankAndSuit(card) {
    const rank = card.substring(0, card.length - 1);
    const suit = card.substring(card.length - 1);

    return { rank, suit };
  }

  /**
   * Sorts cards in a player's hand
   * @param {String} a
   * @param {String} b
   */
  static sortHand(a, b) {
    const { rank: rankA, suit: suitA } = Deck.getRankAndSuit(a);
    const { rank: rankB, suit: suitB } = Deck.getRankAndSuit(b);

    if (Deck.suitHierarchy[suitA] === Deck.suitHierarchy[suitB])
      return Deck.rankHierarchy[rankA] > Deck.rankHierarchy[rankB] ? 1 : -1;

    return Deck.suitHierarchy[suitA] > Deck.suitHierarchy[suitB] ? 1 : -1;
  }

  /** Creates an instance of `Deck` */
  constructor() {
    /** @type {String[]} */
    this.cards = this.buildDeck();
  }

  /** Generates a new `Deck` */
  buildDeck() {
    const deck = [];

    for (const rank of Deck.ranks) {
      for (const suit of Deck.suits) {
        deck.push(rank + suit);
      }
    }
    console.log(deck);

    return this.shuffle(deck);
  }

  /**
   * Shuffles the deck
   * @param {String[]} deck
   */
  shuffle(deck) {
    const newDeck = deck.slice(); // Create a copy of the deck
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
  }

  /**
   * Deals the deck of cards to the players
   * @returns {PlayersObject}
   */
  deal() {
    /** @type {String[][]} */
    let playerHands = [[], [], [], []];
    let player = 0;

    for (const card of this.cards) {
      playerHands[player].push(card);

      player = player === 3 ? 0 : ++player;
    }

    return playerHands.reduce((playersObj, hand, i) => {
      const number = i + 1;
      const player = new Player(
        number,
        displayEls[`player${number}DisplayEl`],
        scoreEls[`player${number}ScoreEl`],
        handEls[`player${number}HandEl`]
      );
      player.addToHand(hand);

      return {
        ...playersObj,
        [`player${number}`]: player,
      };
    }, {});
  }
}

/** A player in the game */
class Player {
  /**
   * Creates an instance of `Player`
   * @param {Number} number
   * @param {Element} displayEl
   * @param {Element} scoreEl
   * @param {Element?} handEl
   */
  constructor(number, displayEl, scoreEl, handEl = null) {
    /** @type {Number} */
    this.number = number;
    /** @type {Number} */
    this.score = 0;
    /** @type {String[]} */
    this.hand = [];
    /** @type {Boolean} */
    this.loser = false;
    /** @type {Element} */
    this.displayEl = displayEl;
    /** @type {Element} */
    this.scoreEl = scoreEl;
    /** @type {Element?} */
    this.handEl = handEl;
  }

  /**
   * Adds cards to the player's hand
   * @param {String[]} cards
   */
  addToHand(cards) {
    this.hand = [...this.hand, ...cards].sort(Deck.sortHand);
  }

  /**
   * Pick 3 from a hand to pass
   * @returns {Promise<String[][]>}
   */
  pickThree() {
    let updatedHand = [...this.hand];
    let picks = [];

    return new Promise((resolve) => {
      if (this.number === 1) {
        /**
         * Handles click event for selecting cards
         * @param {Element} playerCard
         */
        const selectHandler = (playerCard) => () => {
          // Get the index of the card in current picks
          let pickIndex = picks.findIndex(
            (card) => card === playerCard.innerHTML
          );

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
            playerCard.classList.remove("selected");
            playerCard.removeEventListener("click", selectHandler(playerCard));
          });
          resolve([picks, updatedHand]);
        });
      }

      for (let x = 1; x <= 3; x++) {
        const qSIndex = updatedHand.findIndex((card) => card === "QS");
        const highFaceIndex = updatedHand.findIndex((card) => {
          const { rank, suit } = Deck.getRankAndSuit(card);
          return rank > Deck.rankHierarchy[10] && suit > Deck.suitHierarchy.D;
        });
        const higherThan10Index = updatedHand.findIndex((card) => {
          const { rank } = Deck.getRankAndSuit(card);
          return rank > Deck.rankHierarchy[10];
        });
        const higherThan6Index = updatedHand.findIndex((card) => {
          const { rank } = Deck.getRankAndSuit(card);
          return rank > Deck.rankHierarchy[6];
        });
        const index =
          qSIndex >= 0
            ? qSIndex
            : highFaceIndex >= 0
            ? highFaceIndex
            : higherThan10Index >= 0
            ? higherThan10Index
            : higherThan6Index
            ? higherThan6Index >= 0
            : 0;

        const [pick] = updatedHand.splice(index, 1);
        picks.push(pick);
      }

      resolve([picks, updatedHand]);
    });
  }

  /**
   * Visually updates Player 1's hand
   * @param {String[]} hand
   */
  updateHand() {
    if (!this.handEl) return;

    for (let card of this.hand) {
      let { suit } = Deck.getRankAndSuit(card);
      const span = document.createElement("span");
      span.classList.add("player-card");
      if (suit === "D" || suit === "H") span.classList.add("red");
      span.innerHTML = card;
      this.handEl.appendChild(span);
    }
  }

  /**
   * Visually updates player score
   * @param {Number} score
   */
  updateScore(score) {}
}

const hearts = new Game();
hearts.start();
