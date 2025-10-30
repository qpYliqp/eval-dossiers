import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { UploadSectionComponent, SelectedFile } from './upload-section.component';
import { By } from '@angular/platform-browser';
import { ElementRef } from '@angular/core';

describe('UploadSectionComponent', () => {
  let component: UploadSectionComponent;
  let fixture: ComponentFixture<UploadSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadSectionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UploadSectionComponent);
    component = fixture.componentInstance;
    
    // Create an actual input element
    const inputElement = document.createElement('input');
    inputElement.type = 'file';
    // Instead of assigning a spy directly to click, we'll use spyOn later.
    component.fileInput = new ElementRef(inputElement);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should trigger file input click when triggerFileInput is called', () => {
    // Use spyOn to wrap the native click method.
    spyOn(component.fileInput.nativeElement, 'click');
    component.triggerFileInput();
    expect(component.fileInput.nativeElement.click).toHaveBeenCalled();
  });

  it('should emit fileSelected when onFileSelected is called with a file event', () => {
    const dummyFile = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    const event = { target: { files: [dummyFile] } } as any as Event;
    spyOn(component.fileSelected, 'emit');
    component.onFileSelected(event);
    expect(component.fileSelected.emit).toHaveBeenCalled();
    const emitted: SelectedFile = (component.fileSelected.emit as jasmine.Spy).calls.mostRecent().args[0];
    expect(emitted.name).toBe('test.pdf');
    expect(emitted.type).toBe('pdf');
  });

  it('should emit fileClear when clearSelectedFile is called', () => {
    spyOn(component.fileClear, 'emit');
    component.clearSelectedFile();
    expect(component.fileClear.emit).toHaveBeenCalled();
  });

  it('should add "active" class on dragover and remove it on dragleave', () => {
    const container = document.createElement('div');
    container.className = 'drag-drop-container';

    const dragOverEvent = new DragEvent('dragover', { bubbles: true });
    Object.defineProperty(dragOverEvent, 'target', { value: container });
    component.onDragOver(dragOverEvent);
    expect(container.classList.contains('active')).toBeTrue();

    const dragLeaveEvent = new DragEvent('dragleave', { bubbles: true });
    Object.defineProperty(dragLeaveEvent, 'target', { value: container });
    component.onDragLeave(dragLeaveEvent);
    expect(container.classList.contains('active')).toBeFalse();
  });

  it('should process file drop and emit fileSelected', () => {
    spyOn(component.fileSelected, 'emit');
    const dummyFile = new File(['dummy content'], 'dropped.txt', { type: 'text/plain' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(dummyFile);

    const dropEvent = new DragEvent('drop', { bubbles: true, dataTransfer });
    const container = document.createElement('div');
    container.className = 'drag-drop-container';
    document.body.appendChild(container);
    Object.defineProperty(dropEvent, 'target', { value: container });
    
    component.onFileDrop(dropEvent);
    expect(component.fileSelected.emit).toHaveBeenCalled();
    document.body.removeChild(container);
  });
});
