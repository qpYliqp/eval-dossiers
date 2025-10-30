import { Component, OnInit } from '@angular/core';
import { FileMasterService } from '../file-upload/services/file-master.service';
import { columnMasterEntry } from '../../shared/models/objectListEntries/column-master-entry/column-master-entry';
import { ActivatedRoute } from '@angular/router';
import { FileUploadService } from '../file-upload/services/file-upload.service';
import { ViewingListComponent } from '../../shared/components/lists/viewing-list/viewing-list.component';


@Component({
  selector: 'app-master-viewing-data',
  standalone: true,
  imports: [ViewingListComponent,],
  templateUrl: './master-viewing-data.component.html',
  styleUrl: './master-viewing-data.component.scss'
})
export class MasterViewingDataComponent implements OnInit {

  rowEntries: columnMasterEntry[] = [];
  rowColumns: { key: string, label: string }[] = [];
  masterId: number | null = null;


  constructor(private fileMasterService: FileMasterService, private route: ActivatedRoute, private FileUploadService: FileUploadService) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.masterId = +params['masterId']; // Updated parameter name
    });
    if (this.masterId != null) {
      this.FileUploadService.getMasterFileId(this.masterId).subscribe(response => {
        if (response && response.length > 0) {
          console.log(response[0].fileId);
          this.init(response[0].fileId);
        }
        else {
          console.log("error : fileId not found");
        }
      });
    }
    else {
      console.log("error : master id not found");
    }
  }


  async init(fileId: number) {
    this.fileMasterService.getSelectedColumnsByFileId(fileId).subscribe(header => {
      console.log("Réponse des colonnes :", header);
      columnMasterEntry.setColumns(header);
      this.rowColumns = columnMasterEntry.getColumns()
    });

    this.fileMasterService.dataColumns$.subscribe(columnEntries => {
      this.rowEntries = columnEntries;
      console.log("Liste des columnMasterEntry :", this.rowEntries);
    });

    await this.fileMasterService.getDataColumnsByFileId(fileId);


  }



}
