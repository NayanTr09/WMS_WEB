import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { EndpointFCS, FcsService } from 'src/app/services/http/fcs.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-asn-calendar',
  templateUrl: './asn-calendar.component.html',
  styleUrls: ['./asn-calendar.component.scss'],
})
export class AsnCalendarComponent implements OnInit {
  @Input() asnId: number;
  @Output() slotsEmitter = new EventEmitter();
  @Input() scheduledDate: Date;
  @Input() scheduledSlot;
  @Input() scheduledTime;

  // api data for asn
  api_data: {};
  calendar_attendance_data: {} = {};
  minDate: Date;
  year: number;
  month: number;
  date: Number;
  days: number[] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  months: string[] = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  dayn: number;
  arr: any[] = [];
  prevButtonDisabled: boolean = true;
  nextButtonDisabled: boolean = false;
  showSlots: boolean = false;
  slotsList: any[] = [];
  selectedDate: String = '';
  lastSelectedDate: number = -1;
  lastSelectedColor: String = '';

  constructor(private fcs: FcsService, private toastr: ToastrService) {}
  ngOnChanges(): void {
    if (this.asnId !== undefined) {
      this.getASNAppointmentsData();
    }
  }
  ngOnInit(): void {}

  // get asn data
  getASNAppointmentsData() {
    this.fcs
      .getAsnAppointments(EndpointFCS.availableAsnAppointments + this.asnId)
      .subscribe((res) => {
        this.api_data = res;
        // if(res.length<=0){
        //   this.toas
        // }
        if (res.length == 0) {
          this.toastr.warning('No slots available Currently');
        }
        this.minDate = this.getMinimumDate();
        this.year = this.minDate.getFullYear();
        this.month = this.minDate.getMonth();
        this.date = this.minDate.getDate();
        for (let key of Object.keys(this.api_data)) {
          let da = new Date(key);
          let [tempDate, tempMonth, tempYear] = [
            da.getDate(),
            da.getMonth(),
            da.getFullYear(),
          ];
          if (!(tempYear in this.calendar_attendance_data)) {
            this.calendar_attendance_data[tempYear] = {};
          }
          if (!(tempMonth in this.calendar_attendance_data[tempYear])) {
            this.calendar_attendance_data[tempYear][tempMonth] = {};
          }

          this.calendar_attendance_data[tempYear][tempMonth][tempDate] = {
            bg: ' bg-green',
            slots: this.api_data[key]['slots'],
          };
        }
        this.renderCalendar();

        // for selecting existing date
        if (this.scheduledDate) {
          let tempDate = new Date(this.scheduledDate);
          let tempMonth = tempDate.getMonth();
          // to make this.month same as tempMonth
          if (tempMonth < this.month) {
            while (tempMonth < this.month) {
              this.handleMonthChange(-1);
            }
          } else if (tempMonth > this.month) {
            while (tempMonth > this.month) {
              this.handleMonthChange(1);
            }
          }
          // selecting the date
          let y = tempDate.getFullYear();
          let m = tempDate.getMonth();
          let d = tempDate.getDate();
          let slots = this.calendar_attendance_data[y][m][d];
          this.handleSlots(slots['slots'], {
            background: slots['bg'] || 'bg-red',
            date: d,
          });
        }
      });
  }

  // get minimum Date -> returns the minimum date from data
  getMinimumDate(): Date {
    var data = this.api_data;
    let minTime: number = null;
    for (let dates in data) {
      let time = new Date(dates).getTime();
      if (minTime === null) {
        minTime = time;
      }
      minTime = Math.min(time, minTime);
    }
    let minDate = minTime ? new Date(minTime) : new Date();
    return minDate;
    // let minDate = new Date(minTime);
    // return minDate;
  }

  // renders/re-renders the calendar on change of month
  renderCalendar() {
    this.arr = [];

    this.dayn = this.dayNumber(1, this.month + 1, this.year) - 1;
    if (this.dayn < 0) {
      this.dayn = 6;
    }

    for (let i = 1; i <= this.dayn; i++) {
      this.arr.push({ date: '', background: '' });
    }
    let total_days = this.days[this.month];
    if (this.month == 1) {
      if (this.isLeapYear(this.year)) {
        total_days = 29;
      }
    }
    for (let i = 1; i <= total_days; i++) {
      let bg = this.calendar_attendance_data[this.year];
      if (bg !== undefined) {
        bg = bg[this.month];
      }
      this.arr.push({
        date: i,
        background:
          bg === undefined
            ? 'bg-red'
            : bg[i] === undefined
            ? 'bg-red'
            : bg[i]['bg'],
        slots:
          bg === undefined ? [] : bg[i] === undefined ? [] : bg[i]['slots'],
      });
    }
  }

  // returns the day number for the particular date month year
  dayNumber(day: number, month: number, year: number): number {
    let t: number[] = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
    if (month < 3) year = year - 1;
    return (year + year / 4 - year / 100 + year / 400 + t[month - 1] + day) % 7;
  }

  // checks if the year is leap year
  isLeapYear(year: number): boolean {
    return (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
  }

  // change month action = 1 for next month, -1 for previous month
  handleMonthChange(action: number) {
    let currMonth = new Date().getMonth();
    this.month += action;
    if (this.month === -1) {
      // previous year
      this.year -= 1;
      this.month = 11;
    } else if (this.month === 12) {
      // next year
      this.year += 1;
      this.month = 0;
    }
    this.prevButtonDisabled = this.month === currMonth;
    this.nextButtonDisabled = this.month > currMonth + 1;
    this.renderCalendar();
  }

  //
  handleSlots(data: any, date) {
    this.showSlots = true;
    this.slotsList = [];
    for (let d of Object.keys(data)) {
      // this.slotsList.push(data[d]['timings'])
      this.slotsList.push({
        slot_id: data[d]['slot_id'],
        timing: data[d]['timings'],
        slotAvailable: data[d]['slotAvailable'],
      });
    }
    if (this.slotsList.length == 0) {
      this.showSlots = false;
    }
    let m = this.month + 1;
    const mm = m < 10 ? '0' + m++ : m++;
    const dd = date.date < 10 ? '0' + date.date : date.date;
    this.selectedDate = this.year + '-' + mm + '-' + dd;

    this.slotsEmitter.emit({
      showSlots: this.showSlots,
      slotsList: this.slotsList,
      selectedDate: this.selectedDate,
    });
    if (this.lastSelectedDate !== -1) {
      this.arr[this.lastSelectedDate - 1][
        'background'
      ] = this.lastSelectedColor;
    }
    let dateNew = Math.floor(
      parseInt(this.selectedDate.split('-')[2]) + this.dayn
    );

    if (this.arr[dateNew - 1]['background'] !== 'bg-red') {
      this.lastSelectedColor = this.arr[dateNew - 1]['background'];
      this.arr[dateNew - 1]['background'] = 'bg-selected';
      this.lastSelectedDate = dateNew;
    }
  }
}
