import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { stringify } from 'querystring';
import { Observable } from 'rxjs';
import { debounceTime, tap } from 'rxjs/operators';
import { EndpointFCS, FcsService } from 'src/app/services/http/fcs.service';
import { SubSink } from 'subsink';
import { MatDialog } from '@angular/material/dialog';
import { FormStatus } from '../asn-create.component';

@Component({
  selector: 'app-asn-slots',
  templateUrl: './asn-slots.component.html',
  styleUrls: ['./asn-slots.component.scss'],
})
export class AsnSlotsComponent implements OnInit {
  @Output() selectionChange = new EventEmitter();
  @ViewChild('confirmDialog') confirmDialog: TemplateRef<HTMLDialogElement>;

  private subs = new SubSink();
  formStatus: FormStatus;
  asnData: any;
  public asnId: any;
  showSlots: true;
  slotsList: [];
  selectedDateData: String = 'Please select a date to check availability';
  selectedDate: String = '';

  objectKeys = Object.keys;
  isB2BEnabled: boolean;
  isBulk: boolean = false;
  skuLeft: number = 0;
  skuLeftcolcount: number;
  productsData: [];

  selectedSlot: any = '';

  constructor(
    private fb: FormBuilder,
    private fcsService: FcsService,
    private toastr: ToastrService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.initAsnSlots();
  }

  initAsnSlots(): void {
    this.subs.sink = this.getAutosave().subscribe((success) => {
      const { boxConfig, asnData } = success?.data;
      this.isBulk = success.is_bulk;
      this.skuLeft = success.skus_left;
      this.asnData = this.asnData ?? asnData;
      this.asnId = this.asnData['id'];
      this.productsData = success.data.addProducts.products;
    });
  }

  getAutosave(): Observable<any> {
    return this.fcsService.requestToEndpoint(EndpointFCS.autosave_get);
  }

  postAutosave(dump, sectionName): Observable<any> {
    const payload = { section: sectionName, data: dump };
    return this.fcsService.postToEndpint(EndpointFCS.autosave_post, payload);
  }
  onClickPrev(): void {
    if (this.isBulk) {
      this.toastr.warning('This a BUlk ASN cannot go to previous Stage');
    } else {
      this.selectionChange.emit('previous');
    }
  }
  onClickDraft(): void {
    this.dialog.closeAll();
    this.toastr.success('ASN saved as Draft');
    this.router.navigate(['/fcs/asn']);
  }
  postAsnSlots(): Observable<any> | boolean {
    let hasError = false;
    const skus = this.productsData;
    const asn = this.asnData.asn;
    const date = this.selectedDate;
    const slot_id = this.selectedSlot;
    const payload = {
      asn,
      date,
      slot_id,
      skus,
    };

    if (hasError) {
      this.toastr.error('Units and box count mismatched', 'Error');
      return false;
    }
    // Do a post request
    const endpoint = 'warehouse/book-asn-slot';
    return this.fcsService.postToEndpint(endpoint, payload);
  }
  onClickSubmit(evt): void {
    evt.preventDefault();
    this.dialog.closeAll();

    if (this.selectedDate === undefined || this.selectedDate == '') {
      this.toastr.warning('please Select a date and slot');
      return;
    } else if (this.selectedSlot == '') {
      this.toastr.warning('please Select a slot');
      return;
    }
    const asnSlots = this.postAsnSlots();
    if (typeof asnSlots !== 'boolean') {
      this.subs.sink = asnSlots.subscribe(
        (success) => {
          const { asn, asn_id: id, shipping_status, status, message } = success;
          if (!status && message) {
            this.toastr.error(message, 'Error', {
              enableHtml: true,
            });
            return;
          }

          this.router.navigate(['/fcs/create-asn'], {
            queryParams: { id, asn, shipping_status },
          });
        },
        (onErr) => {
          this.toastr.error(onErr.message, 'Error');
        }
      );
    }
  }
  onClickNext(evt): void {
    evt.preventDefault();
    if (this.selectedDate === undefined || this.selectedDate == '') {
      this.toastr.warning('please Select a date and slot');
      return;
    } else if (this.selectedSlot == '') {
      this.toastr.warning('please Select a slot');
      return;
    }
    const skus = this.productsData;
    const asn = this.asnData.asn;
    const date = this.selectedDate;
    const slot_id = this.selectedSlot;

    const draftData = {
      slot_date: date,
      slot_id,
    };
    let grn_expected_date;
    this.subs.sink = this.postAutosave(draftData, 'Appointment').subscribe(
      (success) => {
        this.formStatus = FormStatus.Saved;
        grn_expected_date = success.grn_expected_date;
        const payload = {
          asn,
          date,
          slot_id,
          skus,
          grn_expected_date,
        };
        this.dialog.open(this.confirmDialog, {
          width: '40%',
          data: payload,
          panelClass: 'br-10',
          // disableClose: true,
          autoFocus: true,
        });
      }
    );
  }
  setSlotsData(event: any) {
    this.showSlots = event.showSlots;
    this.slotsList = event.slotsList;
    this.selectedDateData = 'No slots available for ' + event.selectedDate;
    this.selectedDate = event.selectedDate;
  }

  handleSlotChange(event: any) {
    this.selectedSlot = event.value;
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
