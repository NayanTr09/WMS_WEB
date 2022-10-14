import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { ShopifyService } from '../shopify.service';

@Component({
  selector: 'app-add-widget-pdp',
  templateUrl: './add-widget-pdp.component.html',
  styleUrls: ['./add-widget-pdp.component.scss'],
})
export class AddWidgetPdpComponent implements OnInit, OnDestroy {
  private sink = new Subscription();
  enableProductWidget = true;
  error: string;
  shopName: string;
  productName: string;
  previewUrl: string;
  sampleCode = '<div class="shiprocket_pincode--wrapper1"></div>';

  constructor(
    private router: Router,
    private arouter: ActivatedRoute,
    private toastr: ToastrService,
    private shopifyService: ShopifyService
  ) {}

  ngOnInit(): void {
    this.getShopName();
    this.initChecks();
  }

  getShopName(): void {
    this.sink.add(
      this.arouter.queryParams.subscribe((params) => {
        this.shopName = params['shopName'];
      })
    );
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
      this.enableProductWidget = this.shopifyService?.availableStyle?.style?.product_page_snippet;
      this.setPreviewUrl();
    } else {
      this.getPreviousStyles();
    }
  }

  checkIfAppInstalled(): void {
    this.sink.add(
      this.shopifyService.checkAppInstalled(this.shopName).subscribe((resp) => {
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
        this.enableProductWidget = resp?.style?.product_page_snippet;
        this.setPreviewUrl();
      }, console.error)
    );
  }

  /*
   * This link gives products list of the store so that we can make preview link for it
   */
  setPreviewUrl(): void {
    this.sink.add(
      this.shopifyService.fetchPreviewLink(this.shopName).subscribe((resp) => {
        if (resp.length) {
          this.productName = resp[1]['handle'];
          this.updatePreviewUrl();
        }
      }, console.error)
    );
  }

  onSubmit() {
    if (this.enableProductWidget) {
      this.error = '';
      //if checked make request to add snippet
      this.sink.add(
        this.shopifyService.integrateSnippet(this.shopName).subscribe(
          () => {
            this.router.navigate(['add-widget-on-cart'], {
              queryParams: { shopName: this.shopName },
            });
          },
          (error) => {
            this.enableProductWidget = false;
            this.updatePreviewUrl();
            this.error = error?.error?.msg;
            this.toastr.error(this.error, 'Error');
          }
        )
      );
    } else {
      this.router.navigate(['add-widget-on-cart'], {
        queryParams: { shopName: this.shopName },
      });
    }
  }

  updatePreviewUrl(): void {
    this.previewUrl =
      `https://${this.shopName}/products/` +
      this.productName +
      `?showPreview=${this.enableProductWidget}`;
  }

  onPrevious(): void {
    this.router.navigate(['shopify', 'widget-styles'], {
      queryParams: { shopName: this.shopName },
    });
  }

  setShowCode(event: Event): void {
    const target = event.target as HTMLInputElement;

    if (target.checked) {
      this.enableProductWidget = true;
      this.updatePreviewUrl();
    } else {
      this.enableProductWidget = false;
      this.updatePreviewUrl();
      this.error = '';

      //remove snippet if added previously
      this.sink.add(
        this.shopifyService
          .removeSnippet(this.shopName)
          .subscribe((x) => x, console.error)
      );
    }
  }

  ngOnDestroy(): void {
    this.sink.unsubscribe();
  }
}
