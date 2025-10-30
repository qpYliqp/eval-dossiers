import { Component, Input } from '@angular/core';
import { Listable } from '../../../../core/interfaces/listable';
import { SmallButtonComponent } from '../../buttons/small-button/small-button.component';
import { CommonModule } from '@angular/common';
import { ListAction } from '../../../../core/interfaces/listAction';

@Component({
  selector: 'viewing-list',
  imports: [CommonModule],
  templateUrl: './viewing-list.component.html',
  styleUrls: ['./viewing-list.component.scss', './header-list.scss', './row-list.scss']
})
export class ViewingListComponent<Entry extends Listable> {

  @Input() entries: Entry[] = [];
  @Input() columns: { key: string, label: string }[] = [];
  @Input() actions: ListAction<Entry>[] = [];
  @Input() headerClass?: string = "classic-header-list";
  @Input() rowClass?: string = "classic-row-list";
  @Input() rowClassFunction?: (entry: Entry) => string;



  hasActions(): boolean {
    return this.actions.length > 0;
  }

  executeAction(action: ListAction<Entry>, entry: Entry): void {
    action.execute(entry);
  }

}