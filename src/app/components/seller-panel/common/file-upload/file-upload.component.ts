import {
  Component,
  Input,
  HostListener,
  ElementRef,
  OnChanges,
} from '@angular/core';
import {
  NG_VALUE_ACCESSOR,
  FormControl,
  ControlValueAccessor,
} from '@angular/forms';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: FileUploadComponent,
      multi: true,
    },
  ],
})
export class FileUploadComponent implements ControlValueAccessor, OnChanges {
  @Input() progress;
  @Input() type;
  @Input() accept: string;
  @Input() label: string;
  @Input() defaultFilename: string;

  onChange: Function;
  file: File | null = null;
  selectedFile: string;

  @HostListener('change', ['$event.target.files']) emitFiles(event: FileList) {
    const file = event && event.item(0);
    this.onChange(file);
    this.file = file;
  }

  constructor(private host: ElementRef<HTMLInputElement>) {
    this.selectedFile = 'Choose File To Upload';
  }

  ngOnChanges(): void {
    console.log('this.defaultFilename :>> ', this.defaultFilename);
    if (this.defaultFilename) {
      this.selectedFile = this.defaultFilename;
    }
  }

  writeValue(value: null) {
    this.host.nativeElement.value = '';
    this.file = null;
  }

  registerOnChange(fn: Function) {
    this.onChange = fn;
  }

  registerOnTouched(fn: Function) {}

  getFileName($event) {
    this.selectedFile = $event.target.files[0]?.name;
    if ($event.target.files.length > 1) {
      this.selectedFile +=
        ' +' +
        ($event.target.files.length - 1) +
        ' file' +
        ($event.target.files.length - 1 > 1 ? 's' : '');
    }
  }
}

export function requiredFileType(type: Array<string>) {
  return function (control: FormControl) {
    const file = control.value;
    if (file) {
      const extension = file.name?.split('.')[1].toLowerCase();
      //console.log(file.name);
      if (!type.includes(extension?.toLowerCase())) {
        return {
          requiredFileType: true,
        };
      }

      return null;
    }

    return null;
  };
}
