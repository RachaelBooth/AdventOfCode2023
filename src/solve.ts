import { Command } from "commander";

const program = new Command();

program
  .option("-d, --day <number>", "Day", new Date().getDate().toString())
  .option("-o, --part-one")
  .option("-i, --input-file <string>", "Input file name");

program.parse(process.argv);
const options = program.opts();

getAnswer(options.day, options.partOne, options.inputFile);

async function getAnswer(
  day: string,
  part1: boolean,
  inputFile: string,
): Promise<void> {
  const fileLocation = `./day${day}`;
  const solver = await import(fileLocation);
  const inputFileName = inputFile ?? `day${day}`;
  const answer = part1
    ? await solver.solve1(inputFileName)
    : await solver.solve2(inputFileName);
  console.log(`Day ${day}, Part ${part1 ? "1" : "2"}`);
  console.log(`${answer}`);
}
