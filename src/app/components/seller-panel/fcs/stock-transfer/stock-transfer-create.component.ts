import { EndpointFCS, FcsService } from '../../../../services/http/fcs.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { SubSink } from 'subsink';
import { ActivatedRoute, Router } from '@angular/router';

export enum FormStatus {
  Saving = 'Saving..',
  Saved = 'Autosaved few seconds ago',
  Idle = '',
}

@Component({
  selector: 'app-stock-transfer-create',
  templateUrl: './stock-transfer-create.component.html',
  styleUrls: ['./stock-transfer-create.component.scss'],
})
export class StockTransferCreateComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  stockTransferData: { id: number; stock_transfer_id: string };
  isAwbAvailable = null;
  steps = ['Shipping', 'Add Products', 'Stock Transfer'];
  position: number;
  dataDump: any;
  warehouseCode: number;
  isB2BEnabled: boolean;

  constructor(
    public fcsService: FcsService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkB2BEnabled();
    this.isB2BEnabled = false;
    this.route.queryParams.subscribe((qp) => {
      const { id, stock_transfer_id, status } = qp;
      if (status > 0) {
        this.stockTransferData = { id, stock_transfer_id };
        this.position = 3;
        this.updateAwbStatus(status);
      } else {
        this.subs.sink = this.getAutosave().subscribe((success) => {
          const { complete_section = 0, data } = success;
          const { stockTransferData } = data ?? {};
          this.stockTransferData = stockTransferData;
          this.position = +complete_section + 1;
        });
      }
    });
  }

  changePosition(direction: string): void {
    if (direction === 'next') {
      this.position++;
    } else {
      this.position--;
    }
  }

  checkB2BEnabled(): void {
    this.fcsService.requestToEndpoint(EndpointFCS.b2b_enabled).subscribe(
      (resp) => {
        const { is_b2b_enable } = resp?.data;
        this.isB2BEnabled = is_b2b_enable;
        if (!is_b2b_enable) {
          this.router.navigate(['fcs/asn']);
        }
      },
      (error: any) => {
        //this.navLinks = navLinks;
      }
    );
  }

  updateAwbStatus(status): void {
    this.isAwbAvailable = status;
  }

  postAutosave(dump, sectionName): Observable<any> {
    const payload = { section: sectionName, data: dump };
    return this.fcsService.postToEndpint(
      EndpointFCS.stock_transfer_autosave_post,
      payload
    );
  }

  tiggerPostSave(evt): void {
    const entry = Object.entries(evt);
    const [name, dump] = entry[0];
    this.postAutosave(dump, name).subscribe(
      (success) => {
        const { data, complete_section } = success;
        const { asnData, shipping } = data;
        this.stockTransferData = this.stockTransferData ?? asnData;
        this.warehouseCode = shipping?.fromLocation;
        this.dataDump = data;
        this.position = +complete_section + 1;
      },
      (onError) => {
        console.log(onError);
      }
    );
  }

  getAutosave(): Observable<any> {
    return this.fcsService.requestToEndpoint(
      EndpointFCS.stock_transfer_autosave_get
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
