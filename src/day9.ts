import { readAsLines } from "./inputParser";

function calculateDifferences(sequence: number[]): number[] {
  const result = [];
  let i = 0;
  while (i < sequence.length - 1) {
    result.push(sequence[i + 1] - sequence[i]);
    i++;
  }
  return result;
}

function findNextSequenceElement(sequence: number[]): number {
  const differences: number[][] = [calculateDifferences(sequence)];
  while (differences[differences.length - 1].some((d) => d != 0)) {
    differences.push(calculateDifferences(differences[differences.length - 1]));
  }

  // I feel like I should we working out the polynomial and letting myself calculate any element
  // But that's a pain, so lets actually try the naive way first
  return differences.reduce(
    (curr, next) => curr + next[next.length - 1],
    sequence[sequence.length - 1],
  );
}

async function readSequences(inputFileName: string): Promise<number[][]> {
  const lines = await readAsLines(inputFileName);
  return lines.map((line) => line.split(" ").map((p) => parseInt(p)));
}

export async function solve1(inputFileName: string): Promise<number> {
  const sequences = await readSequences(inputFileName);
  return sequences.reduce((curr, next) => curr + findNextSequenceElement(next), 0);
}

export async function solve2(inputFileName: string): Promise<number> {
  const sequences = await readSequences(inputFileName);
  // Well that was not what I thought the second half would be!
  return sequences.reduce((curr, next) => curr + findNextSequenceElement(next.reverse()), 0);
}
