import { Listable } from "../../../../core/interfaces/listable";
import { User } from "../../../../core/models/user.model";

export class mappingEntry extends Listable {
  constructor(private mapping: {
    master: { index: number, name: string, description?: string },
    pv: { index: number, name: string, description?: string },
    entryId?: number
  }) {
    super()
  }

  static override getColumns() {
    return [
      { key: 'master', label: 'MonMaster' },
      { key: 'pv', label: 'Université' },
    ];
  }

  getValues() {
    return {
      master: this.mapping.master.description || this.mapping.master.name,
      pv: this.mapping.pv.description || this.mapping.pv.name,
    };
  }

  getMapping() {
    return this.mapping;
  }
}