import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  Optional,
  Renderer2,
  SecurityContext,
} from '@angular/core';
import { NgControl } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';

@Directive({
  selector: '[appValidator]',
})
export class ValidatorDirective implements OnInit {
  @Input() appValidator = '';

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private sanitizer: DomSanitizer,
    private toastr: ToastrService,
    @Optional() private control: NgControl
  ) {}

  ngOnInit(): void {
    this.change();
  }

  transform(value: string): string {
    switch (this.appValidator) {
      case 'html':
        let html = this.sanitizer.sanitize(SecurityContext.HTML, value);
        var check = this.check(value, html);
        return check ? value : '';
      case 'script':
        let script = this.sanitizer.sanitize(SecurityContext.SCRIPT, value);
        var check = this.check(value, script);
        return check ? value : '';
      case 'style':
        let style = this.sanitizer.sanitize(SecurityContext.STYLE, value);
        var check = this.check(value, style);
        return check ? value : '';
      case 'url':
        let url = value;
        if (
          this.sanitizer
            .sanitize(SecurityContext.URL, url.replace(/^(.*?):\/\//, ''))
            .includes('unsafe')
        ) {
          this.toastr.error('', 'Unsafe input detected!');
          return '';
        } else {
          url = this.sanitizer.sanitize(SecurityContext.HTML, value);
          var check = this.check(value, url);
          return check ? value : '';
        }
      default:
        return '';
    }
  }

  @HostListener('focusout', ['$event.target.value'])
  @HostListener('click', ['$event.target.value'])
  @HostListener('window:keydown.enter', ['$event.target.value'])
  change() {
    const str = this.transform(this.elementRef.nativeElement.value);
    this.renderer.setProperty(this.elementRef.nativeElement, 'value', str); //safely modifying native element value
    if (this.control) {
      //checks if NgControl present (used for FormControl)
      this.control.control.setValue(str);
    }
  }

  check(old, result): boolean {
    if (old !== result) {
      this.toastr.error('', 'Unsafe input detected!');
      return false;
    }
    return true;
  }
}
