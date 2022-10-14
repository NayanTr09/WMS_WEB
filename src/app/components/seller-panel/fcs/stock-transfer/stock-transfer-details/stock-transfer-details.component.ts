import { Router } from '@angular/router';
import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Input,
  Output,
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { debounceTime, tap } from 'rxjs/operators';
import { EndpointFCS, FcsService } from 'src/app/services/http/fcs.service';
import { SubSink } from 'subsink';
import { FormStatus } from '../stock-transfer-create.component';

@Component({
  selector: 'app-stock-transfer-details',
  templateUrl: './stock-transfer-details.component.html',
  styleUrls: ['./stock-transfer-details.component.scss'],
})
export class StockTransferDetailsComponent implements OnInit, OnDestroy {
  @Input() stData;
  @Output() selectionChange = new EventEmitter();
  private subs = new SubSink();
  selectProducts: FormGroup;
  formStatus: string;
  stockTransferData: any;
  stock_info: {
    from_warehouse: string;
    from_type: string;
    to_type: string;
    status: number;
  };

  constructor(
    private fb: FormBuilder,
    private fcsService: FcsService,
    private toastr: ToastrService,
    private router: Router
  ) {
    this.stock_info = {
      from_warehouse: '',
      from_type: '',
      to_type: '',
      status: 0,
    };
  }

  ngOnInit(): void {
    this.selectProducts = this.fb.group({
      products: this.fb.array([]),
      //mrpCheck: [false],
      //barcodesCheck: [false],
    });
    if (!this.stData) {
      this.initSelectProducts();
    }
  }

  ngOnChanges(): void {
    if (this.stData) {
      this.stockTransferData = this.stData;
      //this.getCourierList();
      //this.getShippingDetails();
      this.getStockTransferDetails();
    }
  }

  get getProducts(): FormArray {
    return this.selectProducts.get('products') as FormArray;
  }

  initSelectProducts(): void {
    this.subs.sink = this.getAutosave().subscribe((success) => {
      const { stockTransferDetails, stockTransferData } = success?.data;
      this.stockTransferData = stockTransferData;
      this.getStockTransferDetails();
      // if (stockTransferDetails) {
      // }
    });
  }

  getAutosave(): Observable<any> {
    return this.fcsService.requestToEndpoint(
      EndpointFCS.stock_transfer_autosave_get
    );
  }

  onClickPrev(): void {
    this.selectionChange.emit('previous');
  }

  getStockTransferDetails(): void {
    const srfUser = localStorage.getItem('srf_user');
    const { company_id } = JSON.parse(srfUser) ?? {};
    const payload = {
      seller_id: company_id,
      stock_transfer_id: this.stockTransferData?.id,
    };
    const endpoint = 'stock-transfer/get-stock-transfer-details';

    this.subs.sink = this.fcsService
      .requestToEndpoint(endpoint, payload)
      .subscribe(
        (onSuccess) => {
          this.stock_info = onSuccess.info;
          this.fillProductDetails(onSuccess.data);
        },
        (onErr) => console.error('onErr ', onErr)
      );
  }

  fillProductDetails(data: any[]): void {
    const allIds = this.getProducts.value.map((dta) => dta.id);
    data.forEach((barcodeData) => {
      if (!allIds.includes(barcodeData.id)) {
        this.getProducts.controls.push(this.fb.group({ ...barcodeData }));
      }
    });
  }

  removeItem(idx: number): void {
    this.getProducts.removeAt(idx);
  }

  onClickSubmit(evt): void {
    evt.preventDefault();
    //const { barcodes } = this.selectProducts.value;

    //const skus = barcodes.map((b) => ({ sku: b.sku }));
    const payload = {
      //skus,
      stock_transfer: this.stockTransferData?.stock_transfer,
      //generate_mrp_label: +mrpCheck,
      //generate_barcode_label: +barcodesCheck,
    };

    this.subs.sink = this.fcsService
      .postToEndpint(EndpointFCS.stock_transfer_save, payload)
      .subscribe(
        (success) => {
          //this.selectionChange.emit('next');
          this.toastr.success(
            'Stock Transfer request has been generated!',
            'Success'
          );
          this.router.navigate(['/fcs/stock-transfer']);
        },
        (onErr) => {
          this.toastr.error(onErr.error.message, 'Error');
          console.error(onErr);
        }
      );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
