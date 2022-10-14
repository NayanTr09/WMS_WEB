import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-download-popup',
  templateUrl: './download-popup.component.html',
  styleUrls: ['./download-popup.component.scss'],
})
export class DownloadPopupComponent implements OnInit {
  constructor(
    public popupRef: MatDialogRef<DownloadPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {}

  onCloseClick(): void {
    this.popupRef.close();
  }
}
