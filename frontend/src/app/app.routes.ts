import { Routes } from '@angular/router';
import { MasterProgramsSpacesComponent } from './features/master-programs-spaces/components/master-programs-spaces.component';
import { FileUploadComponent } from './features/file-upload/components/file-upload.component';
import { FileMappingComponent } from './features/mapping/components/file-mapping/file-mapping.component';
import { MasterViewingDataComponent } from './features/master-viewing-data/master-viewing-data.component';
import { ValidationCandidatesComponent } from './features/validation-candidates/validation-candidates.component';
import { UpdateDataComponent } from './features/update-data/components/update-data/update-data.component';


export const routes: Routes = [
  { path: '', component: MasterProgramsSpacesComponent },
  { path: 'master/:masterId/files', component: FileUploadComponent },
  { path: 'master/:masterId/mapping', component: FileMappingComponent },
  { path: 'master/:masterId/mapping/:monmasterFileId/:pvFileId', component: FileMappingComponent },
  { path: 'master/:masterId/viewing', component: MasterViewingDataComponent },
  { path: 'master/:masterId/validation', component: ValidationCandidatesComponent },
  { path: 'master/:masterId/update-candidate/:id_candidate', component: UpdateDataComponent }
];
