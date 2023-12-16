import * as _ from "lodash";
import { readAsLines } from "./inputParser";

type cubeSet = {
  red: number;
  green: number;
  blue: number;
};

type game = {
  id: number;
  handfuls: cubeSet[];
};

function includes(set: cubeSet, subset: cubeSet): boolean {
  return set.red >= subset.red && set.green >= subset.green && set.blue >= subset.blue;
}

function isPossible(game: game, bag: cubeSet): boolean {
  return _.every(game.handfuls, (handful) => includes(bag, handful));
}

function sumPossibleGameIds(games: game[], bag: cubeSet): number {
  return _.sumBy(games, (game) => (isPossible(game, bag) ? game.id : 0));
}

function findSmallestPossibleBag(game: game): cubeSet {
  return {
    red: _.max(_.map(game.handfuls, (h) => h.red)),
    green: _.max(_.map(game.handfuls, (h) => h.green)),
    blue: _.max(_.map(game.handfuls, (h) => h.blue)),
  };
}

function findPower(bag: cubeSet): number {
  return bag.red * bag.green * bag.blue;
}

function parseLine(line: string): game {
  const gameParts = line.split(":");
  const gameId = parseInt(gameParts[0].split(" ")[1]);

  const handfuls = [];
  const handfulParts = gameParts[1].split(";");
  for (let h of handfulParts) {
    let handful = {
      blue: 0,
      red: 0,
      green: 0,
    };
    const sections = h.split(",");
    for (let s of sections) {
      const trimmed = _.trim(s);
      const value = parseInt(trimmed.split(" ")[0]);
      // Assume nothing ends up appearing twice here
      if (_.endsWith(trimmed, "blue")) {
        handful.blue = value;
      } else if (_.endsWith(trimmed, "red")) {
        handful.red = value;
      } else if (_.endsWith(trimmed, "green")) {
        handful.green = value;
      }
    }
    handfuls.push(handful);
  }
  return {
    id: gameId,
    handfuls,
  };
}

async function readAsGames(inputFileName: string): Promise<game[]> {
  const lines = await readAsLines(inputFileName);
  return _.map(lines, parseLine);
}

export async function solve1(inputFileName: string): Promise<number> {
  const games = await readAsGames(inputFileName);
  return sumPossibleGameIds(games, { red: 12, green: 13, blue: 14 });
}

export async function solve2(inputFileName: string): Promise<number> {
  const games = await readAsGames(inputFileName);
  return _.sumBy(games, (game) => findPower(findSmallestPossibleBag(game)));
}
