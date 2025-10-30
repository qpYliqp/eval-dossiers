import { Component, Input, Output, EventEmitter, Renderer2,Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'no-scroll',
  standalone: true,
  imports: [],
  templateUrl: './no-scroll.component.html',
  styleUrl: './no-scroll.component.scss'
})
export class NoScrollComponent {

  constructor(
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {}
  
  ngOnInit() {
    this.renderer.addClass(this.document.body, 'no-scroll');
  }
  
  ngOnDestroy() {
    this.renderer.removeClass(this.document.body, 'no-scroll');
  }
  

}
