// Custom dictionary object because I keep wanting the same thing

export class Dictionary<T> {
  private values: { [key: string | number]: T };
  private defaultValue?: T;

  public constructor(defaultValue?: T) {
    this.defaultValue = defaultValue;
    this.values = {};
  }

  public set(key: string | number, value: T): void {
    this.values[key] = value;
  }

  public get(key: string | number): T {
    return this.values[key] || this.defaultValue;
  }

  public update(key: string | number, updateFunction: (current: T) => T): void {
    this.set(key, updateFunction(this.get(key)));
  }
}
