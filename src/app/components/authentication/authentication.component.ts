import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

enum SvgEnum {
  logofull = 'logoFull',
}

@Component({
  selector: 'app-authentication',
  templateUrl: './authentication.component.html',
  styleUrls: ['./authentication.component.scss'],
})
export class AuthenticationComponent implements OnInit {
  constructor(
    private iconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer
  ) {
    Object.keys(SvgEnum).forEach((key) => {
      this.iconRegistry.addSvgIconInNamespace(
        'assets',
        key,
        this.domSanitizer.bypassSecurityTrustResourceUrl(
          `../../../assets/svg/${SvgEnum[key]}.svg`
        )
      );
    });
  }

  ngOnInit(): void {}
}
