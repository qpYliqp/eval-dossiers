import { Directive, ElementRef, Renderer2 } from '@angular/core';

@Directive({
  selector: '[repertoire]',
  standalone: true
})
export class RepertoireDirective {
  constructor(private el: ElementRef, private renderer: Renderer2) {
  }
}
