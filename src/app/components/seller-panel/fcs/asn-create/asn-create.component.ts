import {
  EndpointFCS,
  FcsService,
} from './../../../../services/http/fcs.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { SubSink } from 'subsink';
import { ActivatedRoute } from '@angular/router';

export enum FormStatus {
  Saving = 'Saving..',
  Saved = 'Autosaved few seconds ago',
  Idle = '',
}

@Component({
  selector: 'app-asn-create',
  templateUrl: './asn-create.component.html',
  styleUrls: ['./asn-create.component.scss'],
})
export class AsnCreateComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  asnData: { id: number; asn: string };
  isAwbAvailable = null;
  steps = [
    'Shipping',
    'Add Products',
    'Select Barcodes',
    'Box Configration',
    'Appointment',
    'Completed',
  ];
  position: number;
  dataDump: any;
  warehouseCode: number;
  slotDate;
  slotID;
  slotTiming;

  constructor(public fcsService: FcsService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((qp) => {
      const {
        id,
        asn,
        shipping_status,
        slot_date,
        slot_timings,
        slot_id,
        Re,
      } = qp;
      if (shipping_status > 0) {
        this.asnData = { id, asn };
        this.slotDate = slot_date;
        this.slotID = slot_id;
        this.slotTiming = slot_timings;
        if (Re == 1) {
          this.steps.push('Appointment Reschedule');
          this.position = 7;
        } else {
          this.position = 6;
        }
      } else {
        this.subs.sink = this.getAutosave().subscribe((success) => {
          const { complete_section = 0, data } = success;
          const { asnData } = data ?? {};
          this.asnData = asnData;
          this.position = +complete_section + 1;
        });
      }
    });
  }

  changePosition(direction: string): void {
    if (direction === 'next') {
      ++this.position;
    } else {
      this.position--;
    }
  }

  updateAwbStatus(status): void {
    this.isAwbAvailable = status;
  }

  postAutosave(dump, sectionName): Observable<any> {
    const payload = { section: sectionName, data: dump };
    return this.fcsService.postToEndpint(EndpointFCS.autosave_post, payload);
  }

  tiggerPostSave(evt): void {
    const entry = Object.entries(evt);
    const [name, dump] = entry[0];
    this.postAutosave(dump, name).subscribe(
      (success) => {
        const { data, complete_section } = success;
        const { asnData, shipping } = data;
        this.asnData = this.asnData ?? asnData;
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
    return this.fcsService.requestToEndpoint(EndpointFCS.autosave_get);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
