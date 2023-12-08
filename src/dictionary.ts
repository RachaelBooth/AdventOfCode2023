import * as _ from "lodash";

// Custom dictionary object because I keep wanting the same thing

export class Dictionary<T> {
  protected values: { [key: string | number]: T };
  private defaultValue?: T;

  public constructor(defaultValue?: T) {
    this.defaultValue = defaultValue;
    this.values = {};
  }

  public keys(): (string | number)[] {
    return _.keys(this.values);
  }

  public set(key: string | number, value: T): void {
    this.values[key] = value;
  }

  public get(key: string | number): T {
    // This will have problems if you then modify the value directly
    // So don't do that, or update this when you do
    return this.values[key] || this.defaultValue;
  }

  public update(key: string | number, updateFunction: (current: T) => T): void {
    this.set(key, updateFunction(this.get(key)));
  }
}

export class ListDictionary<T> extends Dictionary<T[]> {
  public constructor() {
    super([]);
  }

  public addTo(key: string | number, value: T): void {
    if (!(key in this.values)) {
      this.set(key, []);
    }
    this.values[key].push(value);
  }

  public includes(key: string | number, value: T): boolean {
    return this.get(key).includes(value);
  }

  public includesWhere(
    key: string | number,
    matchFunction: (value: T) => boolean,
  ): boolean {
    return this.get(key).some((v) => matchFunction(v));
  }

  public valuesWhere(
    key: string | number,
    matchFunction: (value: T) => boolean,
  ): T[] {
    return this.get(key).filter((v) => matchFunction(v));
  }
}
