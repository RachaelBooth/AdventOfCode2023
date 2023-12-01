import * as _ from "lodash";
import { readAsLines } from "./inputParser";

function calculateCalibrationValue(line: string): number {
  const digits = line.match(/\d/g);
  const calibrationValue = `${digits[0]}${digits[digits.length - 1]}`;
  return parseInt(calibrationValue);
}

function digit(line: string, index: number): number | null {
  if (line[index].match(/\d/)) {
    return parseInt(line[index]);
  }

  // 0 not mentioned as counting
  const wordNumbers = [
    {
      word: "one",
      number: 1,
    },
    {
      word: "two",
      number: 2,
    },
    {
      word: "three",
      number: 3,
    },
    {
      word: "four",
      number: 4,
    },
    {
      word: "five",
      number: 5,
    },
    {
      word: "six",
      number: 6,
    },
    {
      word: "seven",
      number: 7,
    },
    {
      word: "eight",
      number: 8,
    },
    {
      word: "nine",
      number: 9,
    },
  ];

  for (let n of wordNumbers) {
    if (line.slice(index, index + n.word.length) == n.word) {
      return n.number;
    }
  }

  return null;
}

function firstDigit(line: string): number {
  let i = 0;
  while (i < line.length) {
    const d = digit(line, i);
    if (d != null) {
      return d;
    }
    i++;
  }
}

function lastDigit(line: string): number {
  let i = 0;
  while (i < line.length) {
    const d = digit(line, line.length - (i + 1));
    if (d != null) {
      return d;
    }
    i++;
  }
}

function calculateCalibrationValueIncludingWords(line: string): number {
  return parseInt(`${firstDigit(line)}${lastDigit(line)}`);
}

export async function solve1(inputFileName: string): Promise<number> {
  const calibrationDocument = await readAsLines(inputFileName);
  return _.sumBy(calibrationDocument, calculateCalibrationValue);
}

export async function solve2(inputFileName: string): Promise<number> {
  const calibrationDocument = await readAsLines(inputFileName);
  return _.sumBy(calibrationDocument, calculateCalibrationValueIncludingWords);
}
