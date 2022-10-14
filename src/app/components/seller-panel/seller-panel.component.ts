import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { SvgEnum } from 'src/app/enum';
import { AuthService } from 'src/app/services/auth/auth.service';
import { LoaderService } from 'src/app/services/loader.service';

@Component({
  selector: 'app-seller-panel',
  templateUrl: './seller-panel.component.html',
  styleUrls: ['./seller-panel.component.scss'],
})
export class SellerPanelComponent implements OnInit {
  constructor(
    private authService: AuthService,
    public loader: LoaderService,
    private iconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer
  ) {
    this.registerCustomIcons();
  }

  isLoggedIn$: Observable<boolean>; // {1}
  sideNavIsOpen = false;

  ngOnInit(): void {
    this.isLoggedIn$ = this.authService.isLoggedIn;
  }

  registerCustomIcons(): void {
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

  accordionToggledHandler(accOrdionToggled: boolean) {
    this.sideNavIsOpen = true;
  }

  handleMouseEnter() {
    if (!this.sideNavIsOpen) {
      this.sideNavIsOpen = true;
    }
  }

  handleMouseLeave() {
    if (this.sideNavIsOpen) {
      this.sideNavIsOpen = false;
    }
  }

  close() {
    this.handleMouseLeave();
  }

  getImageSrc(): string {
    if (this.sideNavIsOpen) {
      return 'assets:menuclose';
    }

    return 'assets:menuopen';
  }

  onLogout() {
    this.authService.logout(); // {3}
  }
}
