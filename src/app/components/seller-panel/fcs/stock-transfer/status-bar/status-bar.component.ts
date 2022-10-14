import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-asn-status-bar',
  templateUrl: './status-bar.component.html',
  styleUrls: ['./status-bar.component.scss'],
})
export class StatusBarComponent implements OnInit {
  @Input() position: number;
  @Input() steps: any[];

  constructor() {}

  ngOnInit(): void {}
}
