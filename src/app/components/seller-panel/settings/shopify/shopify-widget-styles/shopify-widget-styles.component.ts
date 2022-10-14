import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { IAvailableStyle } from '../shopify.model';
import { ShopifyService } from '../shopify.service';

@Component({
  selector: 'app-shopify-widget-styles',
  templateUrl: './shopify-widget-styles.component.html',
  styleUrls: ['../shopify.component.scss'],
})
export class ShopifyWidgetStylesComponent implements OnInit, OnDestroy {
  private sink = new Subscription();
  buttonColor: string;
  buttonText: string;
  shopName: string;

  constructor(
    private router: Router,
    private arouter: ActivatedRoute,
    private shopifyService: ShopifyService
  ) {}

  ngOnInit(): void {
    this.getShopName();
    this.initChecks();
  }

  initChecks(): void {
    if (!this.shopifyService.appStatus) {
      this.checkIfAppInstalled();
      return;
    }

    if (!this.shopifyService?.appStatus?.success) {
      alert('Please install the app first');
      this.router.navigate(['shopify']);
      return;
    }

    if (this.shopifyService.availableStyle) {
      this.buttonColor = this.shopifyService?.availableStyle?.style?.buttonStyle;
      this.buttonText = this.shopifyService?.availableStyle?.style?.textColor;
    } else {
      this.getPreviousStyles();
    }
  }

  getShopName(): void {
    this.sink.add(
      this.arouter.queryParams.subscribe((params) => {
        this.shopName = params['shopName'];
      })
    );
  }

  get companyId(): number {
    const srfUser = localStorage.getItem('srf_user') || '{}';
    const parsedUser = JSON.parse(srfUser);
    return parsedUser['company_id'];
  }

  checkIfAppInstalled(): void {
    this.sink.add(
      this.shopifyService.checkAppInstalled(this.shopName).subscribe((resp) => {
        this.shopifyService.appStatus = resp;
        if (!resp.success) {
          alert('Please install the app first');
          this.router.navigate(['shopify']);
          return;
        }

        this.getPreviousStyles();
      }, console.error)
    );
  }

  getPreviousStyles(): void {
    this.sink.add(
      this.shopifyService.fetchStyles(this.shopName).subscribe((resp) => {
        this.shopifyService.availableStyle = resp;
        this.buttonColor = resp.style.buttonStyle;
        this.buttonText = resp.style.textColor;
      }, console.error)
    );
  }

  handleButtonColorChange(color: string): void {
    this.buttonColor = color;
  }

  handleButtonTextChange(color: string): void {
    this.buttonText = color;
  }

  onSubmit(): void {
    const style = this.shopifyService.availableStyle.style;
    style.buttonStyle = this.buttonColor;
    style.textColor = this.buttonText;
    style.company_id = style?.company_id || this.companyId.toString();

    //on submit save these styles to database
    this.sink.add(
      this.shopifyService.updateStyles(style).subscribe(() => {
        this.router.navigate(['/shopify', 'add-widget-on-pdp'], {
          queryParamsHandling: 'preserve',
        });
      }, console.error)
    );
  }

  ngOnDestroy(): void {
    this.sink.unsubscribe();
  }
}
