import { Listable } from "./listable";
export interface ListAction<T extends Listable = Listable> {
    id: string;
    icon: string;
    label: string;
    execute: (param: T) => void;
  }