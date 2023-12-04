import * as _ from "lodash";
import { readAsLines } from "./inputParser";
import { Dictionary } from "./dictionary";

type card = {
  id: number;
  numbers: number[];
  winningNumbers: number[];
};

function parseCard(line: string): card {
  const colonParts = line.split(":");
  const id = parseInt(_.trimStart(colonParts[0], "Card "));

  const numberParts = colonParts[1].split("|");
  const numbers = _.map(
    _.filter(numberParts[0].split(" "), (n) => n != ""),
    (n) => parseInt(n),
  );
  const winningNumbers = _.map(
    _.filter(numberParts[1].split(" "), (n) => n != ""),
    (n) => parseInt(n),
  );

  return { id, numbers, winningNumbers };
}

async function parseCards(inputFileName: string): Promise<card[]> {
  const lines = await readAsLines(inputFileName);
  return _.map(lines, parseCard);
}

function calculatePoints(card: card): number {
  const count = _.filter(card.numbers, (n) =>
    _.includes(card.winningNumbers, n),
  ).length;
  if (count == 0) {
    return 0;
  }
  return Math.pow(2, count - 1);
}

function countWins(card: card): number {
  return _.filter(card.numbers, (n) => _.includes(card.winningNumbers, n))
    .length;
}

export async function solve1(inputFileName: string): Promise<number> {
  const cards = await parseCards(inputFileName);
  return _.sumBy(cards, calculatePoints);
}

export async function solve2(inputFileName: string): Promise<number> {
  const cards = await parseCards(inputFileName);
  // Conveniently, cards are in order
  let counts = new Dictionary(1);
  let total = 0;
  for (let card of cards) {
    const p = countWins(card);
    const instances = counts.get(card.id);
    let i = 1;
    while (i <= p) {
      counts.update(card.id + i, (c) => c + instances);
      i++;
    }
    total = total + instances;
  }
  return total;
}
