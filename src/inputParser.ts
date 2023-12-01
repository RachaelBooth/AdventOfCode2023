import * as fs from "node:fs/promises";

function filePath(inputFileName: string): string {
  return `./inputs/${inputFileName}.txt`;
}

// They're not going to be that big. Probably.
export async function readWholeInput(inputFileName: string): Promise<string> {
  return await fs.readFile(filePath(inputFileName), "utf8");
}

export async function readAsLines(inputFileName: string): Promise<string[]> {
  const content = await readWholeInput(inputFileName);
  return content.split(/\r?\n/);
}
