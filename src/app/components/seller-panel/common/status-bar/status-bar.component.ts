import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-status-bar',
  templateUrl: './status-bar.component.html',
  styleUrls: ['./status-bar.component.scss'],
})
export class StatusBarComponent implements OnInit {
  @Input() code: number;
  @Input() method: string;
  availableOptions = { picked: false, packed: false, shipped: false };
  objectKeys = Object.keys;

  constructor() {}

  ngOnInit(): void {
    if (this.code >= 6) {
      this.availableOptions = { picked: true, packed: true, shipped: true };
    } else if (this.code === 4) {
      this.availableOptions = {
        ...this.availableOptions,
        picked: true,
        packed: true,
      };
    } else if (this.code <= 3) {
      this.availableOptions = { ...this.availableOptions, picked: true };
    }
  }

  isTextVisible(idx): boolean {
    if (this.code >= 6) {
      if (idx === 2) {
        return true;
      } else {
        return false;
      }
    } else if (this.code === 4) {
      if (idx === 1) {
        return true;
      } else {
        return false;
      }
    } else if (this.code <= 3) {
      if (idx === 0) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
}
