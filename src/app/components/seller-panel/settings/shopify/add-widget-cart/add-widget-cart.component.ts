import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { ShopifyService } from '../shopify.service';

@Component({
  selector: 'app-add-widget-cart',
  templateUrl: './add-widget-cart.component.html',
  styleUrls: ['./add-widget-cart.component.scss'],
})
export class AddWidgetCartComponent implements OnInit, OnDestroy {
  private sink = new Subscription();
  enableCartWidget = true;
  error: string;
  shopName: string;
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
    this.updatePreviewUrl();

    console.log('Shop name', this.shopName);
  }

  getShopName(): void {
    this.sink.add(
      this.arouter.queryParams.subscribe((params) => {
        console.log('params', params);
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
      this.enableCartWidget = this.shopifyService.availableStyle.style.cart_page_snippet;
    } else {
      this.getPreviousStyles();
    }
  }

  updatePreviewUrl(): void {
    this.previewUrl = `https://${this.shopName}/cart?showPreview=${this.enableCartWidget}`;
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
        this.enableCartWidget = resp.style.cart_page_snippet;
      }, console.error)
    );
  }

  onSubmit(): void {
    if (!this.enableCartWidget) {
      this.router.navigate(['/settings']);
      return;
    }

    this.error = '';
    this.sink.add(
      this.shopifyService.addSnippetToCart(this.shopName).subscribe(
        () => {
          this.router.navigate(['/settings']);
        },
        (error) => {
          console.error(error);
          this.enableCartWidget = false;
          this.error = error.error.msg;
          this.toastr.error(this.error, 'Error');
        }
      )
    );
  }

  onPrevious(): void {
    this.router.navigate(['shopify', 'add-widget-on-pdp'], {
      queryParamsHandling: 'preserve',
    });
  }

  setShowCode(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.error = '';

    if (target.checked) {
      this.enableCartWidget = true;
      this.updatePreviewUrl();
    } else {
      this.enableCartWidget = false;
      this.updatePreviewUrl();

      //remove snippet
      this.sink.add(
        this.shopifyService
          .removeSnippetFromCart(this.shopName)
          .subscribe((x) => x, console.error)
      );
    }
  }

  ngOnDestroy(): void {
    this.sink.unsubscribe();
  }
}
