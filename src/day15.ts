import { readWholeInput } from "./inputParser";
import * as _ from "lodash";

async function readInput(inputFileName: string): Promise<string[]> {
  const line = await readWholeInput(inputFileName);
  return line.split(",");
}

// This may have been premature optimisation - it is used but not sure if actually necessary
const HashSeen = new Set<string>();
const HashCache = {};

function toStringRep(currentValue: number, character: number): string {
  return `${currentValue}:${character}`;
}

function hashChar(currentValue: number, character: number): number {
  const key = toStringRep(currentValue, character);
  if (HashSeen.has(key)) {
    return HashCache[key];
  }

  let v = currentValue + character;
  v = v * 17;
  v = v % 256;
  HashSeen.add(key);
  HashCache[key] = v;
  return v;
}

function hash(s: string): number {
  let currentValue = 0;
  let i = 0;
  while (i < s.length) {
    const charCode = s.charCodeAt(i);
    currentValue = hashChar(currentValue, charCode);
    i++;
  }
  return currentValue;
}

export async function solve1(inputFileName: string): Promise<number> {
  const steps = await readInput(inputFileName);
  return steps.reduce((curr, next) => curr + hash(next), 0);
}

export async function solve2(inputFileName: string): Promise<number> {
  const steps = await readInput(inputFileName);
  const boxKeys = new Set<number>();
  const boxes: { [key: number]: { label: string; focalLength: number }[] } = {};
  for (const step of steps) {
    const operator = step[step.length - 1] == "-" ? "-" : "=";
    const parts = step.split(operator);
    const lens = parts[0];
    const box = hash(lens);
    if (!boxKeys.has(box)) {
      boxes[box] = [];
      boxKeys.add(box);
    }

    if (operator == "-") {
      _.remove(boxes[box], (l) => l.label == lens);
    } else {
      const focalLength = parseInt(parts[1]);
      const lensIndex = _.findIndex(boxes[box], (l) => l.label == lens);
      if (lensIndex != -1) {
        boxes[box][lensIndex] = { label: lens, focalLength };
      } else {
        boxes[box].push({ label: lens, focalLength });
      }
    }
  }

  let focusingPower = 0;
  for (const key of boxKeys) {
    let i = 0;
    while (i < boxes[key].length) {
      focusingPower = focusingPower + (key + 1) * (i + 1) * boxes[key][i].focalLength;
      i++;
    }
  }
  return focusingPower;
}
