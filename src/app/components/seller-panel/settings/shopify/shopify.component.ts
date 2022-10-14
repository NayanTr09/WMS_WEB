import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSelect } from '@angular/material/select';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { IStoreUrl } from './shopify.model';
import { ShopifyService } from './shopify.service';

@Component({
  selector: 'app-shopify',
  templateUrl: './shopify.component.html',
  styleUrls: ['./shopify.component.scss'],
})
export class ShopifyComponent implements OnInit, OnDestroy {
  private sink = new Subscription();
  selectedStore: string;
  isInstalled = false;
  storeUrls: IStoreUrl[] = [];

  constructor(private router: Router, private shopifyService: ShopifyService) {}

  ngOnInit(): void {
    this.getShopifyStores();
  }

  getShopifyStores(): void {
    this.sink.add(
      this.shopifyService.fetchStoreList().subscribe((resp) => {
        if (resp.success) {
          this.storeUrls = resp.data;
        }
      }, console.error)
    );
  }

  onChange(event: MatSelect): void {
    const value = event.value;
    const store = this.shopifyService.getHostname(value);

    this.sink.add(
      this.shopifyService
        .checkAppInstalled(store)
        .subscribe((data: { success: boolean }) => {
          this.isInstalled = data.success;
        }, console.error)
    );
  }

  onNext(): void {
    this.router.navigate(['/shopify', 'widget-styles'], {
      queryParams: {
        shopName: this.shopifyService.getHostname(this.selectedStore),
      },
    });
  }

  onSubmit(): void {
    const store = this.shopifyService.getHostname(this.selectedStore);
    const qsObj = {
      client_id: this.shopifyService.clientId,
      scope: this.shopifyService.scope,
      state: 'nonce',
      redirect_uri: this.shopifyService.redirectUri,
    };
    const qs = new URLSearchParams(qsObj).toString();
    const baseUrl = `https://${store}/admin/oauth/authorize`;
    const nav_url = `${baseUrl}?${qs}`;

    this.router.navigate([]).then(() => {
      window.open(nav_url, '_self');
    });
  }

  onPrevious(): void {
    this.router.navigate(['settings', 'fulfillment']);
  }

  ngOnDestroy(): void {
    this.sink.unsubscribe();
  }
}
