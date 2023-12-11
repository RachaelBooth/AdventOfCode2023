import { Dictionary } from "./dictionary";
import { readAsLines } from "./inputParser";

function locationToString(x: number, y: number): string {
  return `${x},${y}`;
}

async function readPipes(
  inputFileName: string,
): Promise<{
  S: string;
  pipes: Dictionary<{ links: string[]; type: string }>;
  maxX;
  maxY;
}> {
  const lines = await readAsLines(inputFileName);
  const pipes = new Dictionary<{ links: string[]; type: string }>();
  let S;
  let y = 0;
  let x = 0;
  while (y < lines.length) {
    x = 0;
    while (x < lines[y].length) {
      switch (lines[y][x]) {
        case "|":
          pipes.set(locationToString(x, y), {
            links: [locationToString(x, y - 1), locationToString(x, y + 1)],
            type: lines[y][x],
          });
          break;
        case "-":
          pipes.set(locationToString(x, y), {
            links: [locationToString(x - 1, y), locationToString(x + 1, y)],
            type: lines[y][x],
          });
          break;
        case "L":
          pipes.set(locationToString(x, y), {
            links: [locationToString(x, y - 1), locationToString(x + 1, y)],
            type: lines[y][x],
          });
          break;
        case "J":
          pipes.set(locationToString(x, y), {
            links: [locationToString(x, y - 1), locationToString(x - 1, y)],
            type: lines[y][x],
          });
          break;
        case "7":
          pipes.set(locationToString(x, y), {
            links: [locationToString(x, y + 1), locationToString(x - 1, y)],
            type: lines[y][x],
          });
          break;
        case "F":
          pipes.set(locationToString(x, y), {
            links: [locationToString(x, y + 1), locationToString(x + 1, y)],
            type: lines[y][x],
          });
          break;
        case "S":
          // By inspection of my input
          pipes.set(locationToString(x, y), {
            links: [locationToString(x, y - 1), locationToString(x - 1, y)],
            type: "J",
          });
          S = locationToString(x, y);
          break;
      }
      x++;
    }
    y++;
  }
  return { S, pipes, maxX: x, maxY: y };
}

export async function solve1(inputFileName: string): Promise<number> {
  const { S, pipes } = await readPipes(inputFileName);
  let a = [S, pipes.get(S).links[0]];
  let b = [S, pipes.get(S).links[1]];
  // Assuming this is going to be a unique point, should check for crossover
  while (a[a.length - 1] != b[b.length - 1]) {
    // Instructions do say there should always be exactly two neighbours for these
    a.push(
      pipes.get(a[a.length - 1]).links.filter((l) => l != a[a.length - 2])[0],
    );
    b.push(
      pipes.get(b[b.length - 1]).links.filter((l) => l != b[b.length - 2])[0],
    );
  }
  return a.length - 1;
}

export async function solve2(inputFileName: string): Promise<number> {
  const { S, pipes, maxX, maxY } = await readPipes(inputFileName);
  let loop = [S, pipes.get(S).links[0]];
  while (loop[loop.length - 1] != S) {
    loop.push(
      pipes
        .get(loop[loop.length - 1])
        .links.filter((l) => l != loop[loop.length - 2])[0],
    );
  }
  let insideLoop = false;
  let up = false;
  let y = 0;
  let count = 0;
  // It's impossible to be inside and on the edge
  while (y < maxY) {
    let x = 0;
    while (x < maxX) {
      if (loop.includes(locationToString(x, y))) {
        let type = pipes.get(locationToString(x, y)).type;
        switch (type) {
          case "|":
            insideLoop = !insideLoop;
            break;
          case "-":
            // no change
            break;
          case "L":
            // Loop enters this line from above
            up = true;
            break;
          case "J":
            if (up) {
              // Loop exits back up - no change to whether inside the loop
              up = false;
            } else {
              // Loop has crossed this line
              insideLoop = !insideLoop;
            }
            break;
          case "7":
            if (up) {
              // Loop has crossed this line
              insideLoop = !insideLoop;
            } else {
              // Loop exits back down - no change to whether inside the loop
              up = false;
            }
            break;
          case "F":
            // Loop enters this line from below
            up = false;
            break;
        }
      } else {
        if (insideLoop) {
          count++;
        }
      }
      x++;
    }
    y++;
  }
  return count;
}
