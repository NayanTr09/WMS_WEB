import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  Input,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { stringify } from 'querystring';
import { Observable } from 'rxjs';
import { debounceTime, tap } from 'rxjs/operators';
import { EndpointFCS, FcsService } from 'src/app/services/http/fcs.service';
import { SubSink } from 'subsink';
import { FormStatus } from '../asn-create.component';

@Component({
  selector: 'app-asn-reschedule',
  templateUrl: './asn-reschedule.component.html',
  styleUrls: ['./asn-reschedule.component.scss'],
})
export class AsnRescheduleComponent implements OnInit {
  @Input() asnData;
  @Input() slotDate;
  @Input() slotID: number;
  @Input() slotTimings;

  @Output() selectionChange = new EventEmitter();
  private subs = new SubSink();
  formStatus: FormStatus;
  showSlots: true;
  slotsList: [];
  selectedDateData: String = 'Please select a day to check availability';
  selectedDate: String = 'Please select a day to check availability';

  scheduledDate: any = '';
  scheduledSlot: number = 0;
  scheduledTime: any = '';

  objectKeys = Object.keys;
  selectedSlot: any = '';
  public asnId: any;

  constructor(
    private fb: FormBuilder,
    private fcsService: FcsService,
    private toastr: ToastrService,
    private router: Router,
    private arouter: ActivatedRoute
  ) {}
  ngOnChanges(): void {
    this.arouter.queryParams.subscribe((params: Params) => {
      this.scheduledDate = params['slot_date'];
      this.scheduledSlot = parseInt(params['slot_id']);
      this.scheduledTime = params['slot_timings'];
    });
    this.selectedSlot = this.scheduledSlot;
  }
  ngOnInit(): void {
    this.asnId = this.asnData['id'];
    this.initAsnSlots();
  }

  initAsnSlots(): void {}

  rescheduleAsn(): Observable<any> | boolean {
    let hasError = false;
    const asn_id = this.asnData.id;
    const date = this.selectedDate;
    const slot_id = this.selectedSlot;
    const payload = {
      asn_id,
      date,
      slot_id,
    };

    if (hasError) {
      this.toastr.error('Units and box count mismatched', 'Error');
      return false;
    }
    const endpoint = 'warehouse/reschedule-asn';
    return this.fcsService.postToEndpint(endpoint, payload);
  }
  onClickSubmit(evt): void {
    evt.preventDefault();
    if (this.selectedDate === undefined || this.selectedDate == '') {
      this.toastr.warning('please Select a date and slot');
      return;
    } else if (this.selectedSlot == '') {
      this.toastr.warning('please Select a slot');
      return;
    }

    const asnSlots = this.rescheduleAsn();
    if (typeof asnSlots !== 'boolean') {
      this.subs.sink = asnSlots.subscribe(
        (success) => {
          const { status, message } = success;
          if (!status && message) {
            this.toastr.error(message, 'Error');
            return;
          }
          if (status === 1 && message) {
            this.toastr.success(message, 'Success');
          }
          this.router.navigate(['/fcs/asn']);
        },
        (onErr) => {
          this.toastr.error(onErr.message, 'Error');
        }
      );
    }
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
