import { readAsLines } from "./inputParser";
import * as _ from "lodash";

enum handType {
  FiveOfAKind = 6,
  FourOfAKind = 5,
  FullHouse = 4,
  ThreeOfAKind = 3,
  TwoPair = 2,
  OnePair = 1,
  HighCard = 0,
}

type hand = {
  hand: string;
  type: handType;
  bid: number;
};

// 10 isn't really a face card but ah well
const faceCardToNumber = {
  T: 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

function cardToNumber(card: string, useJokers: boolean = false): number {
  if (useJokers && card == "J") {
    return 1;
  }

  if (card.match(/[TJQKA]/)) {
    return faceCardToNumber[card];
  }
  return parseInt(card);
}

function compare(
  current: hand,
  comparator: hand,
  useJokers: boolean = false,
): number {
  if (current.type != comparator.type) {
    return current.type - comparator.type;
  }

  let i = 0;
  while (i < current.hand.length) {
    if (current.hand[i] != comparator.hand[i]) {
      return (
        cardToNumber(current.hand[i], useJokers) -
        cardToNumber(comparator.hand[i], useJokers)
      );
    }
    i++;
  }

  return 0;
}

function parseHand(line: string, useJokers: boolean = false): hand {
  const parts = line.split(" ");
  const bid = parseInt(parts[1]);
  const hand = parts[0];
  let counts = _.countBy(hand.split(""));
  let jokers = 0;

  if (useJokers && _.has(counts, "J") && _.keys(counts).length > 1) {
    jokers = counts["J"];
    counts = _.omit(counts, ["J"]);
  }

  // Sort descending
  const sortedCounts = _.values(counts).sort((a, b) => b - a);

  if (useJokers) {
    sortedCounts[0] = sortedCounts[0] + jokers;
  }

  let type;
  if (sortedCounts[0] == 5) {
    type = handType.FiveOfAKind;
  } else if (sortedCounts[0] == 4) {
    type = handType.FourOfAKind;
  } else if (sortedCounts[0] == 3 && sortedCounts[1] == 2) {
    type = handType.FullHouse;
  } else if (sortedCounts[0] == 3) {
    type = handType.ThreeOfAKind;
  } else if (sortedCounts[0] == 2 && sortedCounts[1] == 2) {
    type = handType.TwoPair;
  } else if (sortedCounts[0] == 2) {
    type = handType.OnePair;
  } else {
    type = handType.HighCard;
  }

  return {
    hand,
    type,
    bid,
  };
}

async function readHands(
  inputFileName: string,
  useJokers: boolean = false,
): Promise<hand[]> {
  const lines = await readAsLines(inputFileName);
  return lines.map((line) => parseHand(line, useJokers));
}

export async function solve1(inputFileName: string): Promise<number> {
  const hands = await readHands(inputFileName);
  hands.sort(compare);
  let totalWinnings = 0;
  let rank = 1;
  while (rank <= hands.length) {
    totalWinnings = totalWinnings + rank * hands[rank - 1].bid;
    rank++;
  }
  return totalWinnings;
}

export async function solve2(inputFileName: string): Promise<number> {
  const hands = await readHands(inputFileName, true);
  hands.sort((a, b) => compare(a, b, true));
  let totalWinnings = 0;
  let rank = 1;
  while (rank <= hands.length) {
    totalWinnings = totalWinnings + rank * hands[rank - 1].bid;
    rank++;
  }
  return totalWinnings;
}
