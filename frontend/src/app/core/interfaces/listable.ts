export abstract class Listable {
  static  getColumns(): { key: string, label: string }[] { return []; }
  abstract getValues(): { [key: string]: any };
}