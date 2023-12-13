import { readAsLines } from "./inputParser";

type conditionRecordRow = {
  row: string;
  groupSizes: number[];
};

function parseRow(line: string): conditionRecordRow {
  const parts = line.split(" ");
  const row = parts[0];
  const groupSizes = parts[1].split(",").map((s) => parseInt(s));
  return { row, groupSizes };
}

async function readConditionRecords(
  inputFileName: string,
): Promise<conditionRecordRow[]> {
  const lines = await readAsLines(inputFileName);
  return lines.map(parseRow);
}

function countPossibleArrangements(rowRecord: conditionRecordRow): number {
  let arrangements = [{ row: "", counts: "", currentCount: 0, weight: 1 }];
  const groupSizes = `,${rowRecord.groupSizes}`;
  let i = 0;
  while (i < rowRecord.row.length) {
    const nextSpring =
      rowRecord.row[i] == "?" ? [".", "#"] : [rowRecord.row[i]];
    const next = {};
    for (let a of arrangements) {
      for (let n of nextSpring) {
        const row = a.row + n;
        let counts = a.counts;
        let currentCount = a.currentCount;
        if (n == "#") {
          currentCount++;
        } else if (currentCount > 0) {
          counts = `${counts},${currentCount}`;
          currentCount = 0;
        }
        const duplicate = next[`${n}:${currentCount}:${counts}`];
        if (duplicate) {
          duplicate.weight = duplicate.weight + a.weight;
        } else {
          if (groupSizes.startsWith(counts)) {
            next[`${n}:${currentCount}:${counts}`] = {
              row,
              counts,
              currentCount,
              weight: a.weight,
            };
          }
        }
      }
    }
    arrangements = Object.values(next);
    i++;
  }
  // Deal with the end of the row
  arrangements = arrangements
    .map((a) => {
      if (a.currentCount > 0) {
        return {
          row: a.row,
          counts: `${a.counts},${a.currentCount}`,
          currentCount: 0,
          weight: a.weight,
        };
      }
      return a;
    })
    .filter((a) => a.counts == groupSizes);
  return arrangements.reduce((curr, next) => curr + next.weight, 0);
}

export async function solve1(inputFileName: string): Promise<number> {
  const conditionRecords = await readConditionRecords(inputFileName);
  return conditionRecords.reduce(
    (curr, next) => curr + countPossibleArrangements(next),
    0,
  );
}

export async function solve2(inputFileName: string): Promise<number> {
  const conditionRecords = await readConditionRecords(inputFileName);
  // Eww
  const expanded = conditionRecords.map((cr) => ({
    row: cr.row + "?" + cr.row + "?" + cr.row + "?" + cr.row + "?" + cr.row,
    groupSizes: cr.groupSizes
      .concat(cr.groupSizes)
      .concat(cr.groupSizes)
      .concat(cr.groupSizes)
      .concat(cr.groupSizes),
  }));
  return expanded.reduce(
    (curr, next) => curr + countPossibleArrangements(next),
    0,
  );
}
