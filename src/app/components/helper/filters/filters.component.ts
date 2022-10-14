import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  IterableDiffers,
  ChangeDetectorRef,
  DoCheck,
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDatepicker } from '@angular/material/datepicker';
import { MatMenuTrigger } from '@angular/material/menu';
import { AuthService } from 'src/app/services/auth/auth.service';
import * as moment from 'moment';
import { debounceTime, filter } from 'rxjs/operators';
import { GoogleAnalyticsService } from 'src/app/services/http/google-analytics.service';

export declare type CASE = 'uppercase' | 'lowercase' | 'titlecase';
interface FieldValues {
  start?: string;
  end?: string;
  value?: string;
}
interface PopulatedData {
  name: string;
  value: any;
  is_disabled?: boolean;
  case?: CASE;
}

/**
 * Ankit Choubey
 * Title : Filters for any listing page
 * Description: Filter with text, drop down and date field.
 *  just add selector and pass object in input variable
 *  on your html with required input and output method.
 */

export interface CustomFilters {
  label: string; //Label of Field
  name?: string;
  field_name?: string;
  tag_name?: string;
  type: string; // DOM element type
  main_filter?: number; // main text field
  placeholder?: string;
  field_values?: FieldValues;
  bool_value?: boolean;
  data?: PopulatedData[]; // data to populate the element like select,
  multiple?: boolean;
  isDefault?: boolean;
  hasSelectAll?: boolean;
}

interface tag {
  name?: string;
  field?: string;
  is_removeable?: boolean;
}

@Component({
  selector: 'app-filters',
  templateUrl: './filters.component.html',
  styleUrls: ['./filters.component.scss'],
})
export class FiltersComponent implements OnInit, DoCheck {
  @Input() filter_information: CustomFilters;
  @Output() filtersEvent: EventEmitter<any> = new EventEmitter();

  filterForm: FormGroup;
  tagList: tag[];
  filterList: any[];
  mainFilter: any[];
  mFilterName: any;
  filter_array: string[];
  iterableDiffer: any;
  field_value: any[];
  previous_filter_array: any[];
  dateActive: string;
  //totalCount : number;
  isTabOpen: boolean;
  isCheckedDone: boolean = false;
  //formcounter:number;
  today = new Date();

  @ViewChild('picker') datePicker: MatDatepicker<Date>;
  @ViewChild('dateMenuTrigger') dateMenuTrigger: MatMenuTrigger;

  constructor(
    public authService: AuthService,
    private formBuilder: FormBuilder,
    private iterableDiffers: IterableDiffers,
    private cd: ChangeDetectorRef,
    public ga: GoogleAnalyticsService
  ) {
    this.tagList = [];
    this.mFilterName = {};
    this.filterList = [];
    this.mainFilter = [];
    this.field_value = [];
    this.previous_filter_array = [];
    this.isTabOpen = false;
    this.dateActive = '';
    this.iterableDiffer = iterableDiffers.find([]).create(null);
  }

  ngOnInit(): void {
    this.filter_array = Object.keys(this.filter_information);

    let k = 0;
    const fc = {
      date_range: null,
      date: null,
    };

    for (const fa of this.filter_array) {
      const filterInformation = this.filter_information[fa];
      if (filterInformation.name === 'Date') {
        delete fc.date;
        if (filterInformation.type === 'date_range') {
          this.filterList[fa] = {
            start: '',
            end: '',
          };

          const start = filterInformation?.field_values?.start ?? '';
          const end = filterInformation?.field_values?.end ?? '';

          fc.date_range = new FormGroup({
            start: new FormControl(moment(new Date(start))),
            end: new FormControl(moment(new Date(end))),
          });

          this.dateActive = this.getDateFilterText(start, end);
        } else if (filterInformation.type === 'date') {
          delete fc.date_range;
          this.filterList[fa] = {
            cut_off_date: '',
          };

          const cut_off_date =
            filterInformation?.field_values?.cut_off_date ?? '';

          fc.date = new FormGroup({
            cut_off_date: new FormControl(moment(new Date(cut_off_date))),
          });
        }
      } else if (filterInformation.type === 'switch') {
        fc[fa] = new FormControl(filterInformation.bool_value);
      } else if (this.filter_information[fa].main_filter != 1) {
        this.filterList[fa] = '';
        this.field_value[fa] = [];
        let value =
          this.filter_information[fa].type != 'select' &&
          this.filter_information[fa].field_values.value
            ? this.filter_information[fa].field_values.value
            : '';
        fc[fa] = new FormControl(value);
      } else {
        if (Object.keys(this.mFilterName).length == 0) {
          let key = fa;
          let value = this.filter_information[fa].field_values.value
            ? this.filter_information[fa].field_values.value
            : '';
          for (let mfa of this.filter_array) {
            if (
              this.filter_information[mfa].main_filter == 1 &&
              this.filter_information[mfa].field_values.value
            ) {
              value = this.filter_information[mfa].field_values.value;
              key = mfa;
            }
          }
          this.mFilterName = this.filter_information[key];
          this.mFilterName.name = key;

          fc[key] = new FormControl(value);
        }
        this.mainFilter[k] = fa;
        k++;
      }
    }

    this.filterForm = this.formBuilder.group(fc);

    this.filterForm.valueChanges.pipe(debounceTime(300)).subscribe((data) => {
      if (!this.isTabOpen) {
        this.setFilters();
      }
    });

    //FILTER TAGS CREATED
    let i = 0;
    let isDateRange = false;
    for (let fa of this.filter_array) {
      if (this.filter_information[fa].name == 'Date') {
        isDateRange = true;

        if (
          this.filter_information[fa].field_values.start == undefined ||
          this.filter_information[fa].field_values.start == '' ||
          this.filter_information[fa].field_values.end == undefined ||
          this.filter_information[fa].field_values.end == ''
        ) {
          continue;
        }
      } else {
        if (!this.filter_information[fa].field_values.value) {
          continue;
        }

        if (this.filter_information[fa].type == 'select') {
          this.field_value[fa] = [];

          if (
            this.previous_filter_array[fa] &&
            this.previous_filter_array[fa].length
          ) {
            let selected = [];
            let k = 0;
            let tagnames = [];
            let val = this.filter_information[fa].field_values.value;
            if (val instanceof Array) {
              for (let v of val) {
                this.filter_information[fa].data.map((item) => {
                  if (item.value == v) {
                    selected[k] = item;
                    tagnames[k] = item.name;
                    k++;
                  }
                });
              }
            } else {
              this.filter_information[fa].data.map((item) => {
                if (item.value == val) {
                  selected = item;
                  tagnames = item.name;
                }
              });
            }

            this.filterForm.controls[fa].setValue(selected);
          }
        }
      }
      i++;
    }

    // SET DEFAULT DATE
    if (this.filter_information['date'].type === 'date_range') {
      const dateRange = this.filterForm.controls.date_range.value;
      const isStartInvalid = dateRange?.start?.toString() === 'Invalid date';
      const isEndInvalid = dateRange?.end?.toString() === 'Invalid date';

      if (
        isDateRange &&
        isStartInvalid &&
        isEndInvalid &&
        this.isLocationOnHold
      ) {
        this.setDate('', 'last_3months');
        return;
      }

      if (isDateRange && isStartInvalid && isEndInvalid) {
        this.setDate('', 'all');
      }
    } else {
      const date = this.filterForm.controls.date.value;
      if (date?.cut_off_date?.toString() === 'Invalid date') {
        this.setDate('', 'single');
      }
    }
  }

  get isLocationOnHold(): boolean {
    return window.location.pathname.includes('onhold');
  }

  parentMatTab() {
    this.isTabOpen = true;
  }

  setMainFilter(filter: any, name) {
    this.isTabOpen = true;
    this.mFilterName = filter;
    this.mFilterName.name = name;
    for (let mf of this.mainFilter) {
      if (mf != name) {
        this.filterForm.removeControl(mf);
      }
    }
    this.filterForm.addControl(name, new FormControl(''));
    this.filterForm.updateValueAndValidity();
  }

  getDateFilterText(start, end) {
    if (!start || !end) {
      return '';
    }

    let dt = this.authService.getUserData();

    start = moment(new Date(start)).format('YYYY-MM-DD').toString();
    end = moment(new Date(end)).format('YYYY-MM-DD').toString();

    let created_date = moment(dt.created_at.date)
      .format('YYYY-MM-DD')
      .toString(); // "02/22/2016"

    if (
      moment(created_date).isSame(start) &&
      moment(moment().format('YYYY-MM-DD').toString()).isSame(end)
    ) {
      return 'all';
    } else if (
      moment(moment().format('YYYY-MM-DD').toString()).isSame(start) &&
      moment(moment().format('YYYY-MM-DD').toString()).isSame(end)
    ) {
      return 'today';
    } else if (
      moment(
        moment().subtract(1, 'days').format('YYYY-MM-DD').toString()
      ).isSame(start) &&
      moment(
        moment().subtract(1, 'days').format('YYYY-MM-DD').toString()
      ).isSame(end)
    ) {
      return 'Yesterday';
    } else if (
      moment(
        moment().subtract(6, 'days').format('YYYY-MM-DD').toString()
      ).isSame(start) &&
      moment(moment().format('YYYY-MM-DD').toString()).isSame(end)
    ) {
      return 'last_7days';
    } else if (
      moment(
        moment().subtract(29, 'days').format('YYYY-MM-DD').toString()
      ).isSame(start) &&
      moment(moment().format('YYYY-MM-DD').toString()).isSame(end)
    ) {
      return 'last_30days';
    } else if (
      moment(moment().startOf('month').format('YYYY-MM-DD').toString()).isSame(
        start
      ) &&
      moment(moment().endOf('month').format('YYYY-MM-DD').toString()).isSame(
        end
      )
    ) {
      return 'this_month';
    } else if (
      moment(
        moment()
          .subtract(1, 'month')
          .startOf('month')
          .format('YYYY-MM-DD')
          .toString()
      ).isSame(start) &&
      moment(
        moment()
          .subtract(1, 'month')
          .endOf('month')
          .format('YYYY-MM-DD')
          .toString()
      ).isSame(end)
    ) {
      return 'last_month';
    } else if (
      moment(
        moment()
          .subtract(3, 'month')
          .startOf('month')
          .format('YYYY-MM-DD')
          .toString()
      ).isSame(start) &&
      moment(moment().format('YYYY-MM-DD').toString()).isSame(end)
    ) {
      return 'last_3months';
    } else {
      return 'custom_range';
    }
  }

  setDate($event?, option?): void {
    let start: any;
    let end: any;
    let cut_off_date: any;
    this.ga.emitEvent('Filters', 'Clicked on Search by Date Range', '');
    switch (option) {
      case 'all':
        const dt = this.authService.getUserData();
        start = moment(dt.created_at.date);
        end = moment();
        break;
      case 'today':
        start = moment();
        end = moment();
        break;
      case 'Yesterday':
        start = moment().subtract(1, 'days');
        end = moment().subtract(1, 'days');
        break;
      case 'last_7days':
        start = moment().subtract(6, 'days');
        end = moment();
        break;
      case 'last_30days':
        start = moment().subtract(29, 'days');
        end = moment();
        break;
      case 'this_month':
        start = moment().startOf('month');
        end = moment().endOf('month');
        break;
      case 'last_month':
        start = moment().subtract(1, 'month').startOf('month');
        end = moment().subtract(1, 'month').endOf('month');
        break;
      case 'last_3months':
        start = moment().subtract(3, 'month').startOf('month');
        end = moment();
        break;
      case 'custom_range':
        this.datePicker.open();
        break;
      case 'single':
        cut_off_date = moment();
        break;
    }

    this.dateActive = option;
    if (!cut_off_date) {
      this.filterForm.controls.date_range.patchValue({
        start,
        end,
      });
    } else {
      this.filterForm.controls.date.patchValue({
        cut_off_date,
      });
    }

    if ($event) {
      this.dateMenuTrigger.closeMenu();
    }
  }

  remove(tag) {
    const index = this.tagList.indexOf(tag);
    let field = this.tagList[index].field;

    if (index >= 0) {
      this.tagList.splice(index, 1);
      this.isTabOpen = false;
      this.filterForm.controls[field].setValue('');

      //this.setFilters();
    }
  }

  checkForNone(filterName, $event): void {
    const { multiple, data } = this.filter_information[filterName];
    const { value: options } = $event;
    const fc = this.filterForm.controls[filterName];
    // console.log('$event :>> ', options);

    if (multiple && options) {
      for (const option of options) {
        if (option.name === 'none') {
          fc.setValue('');
          $event.source.close();
          break;
        }
      }
    }
  }

  onClickSelectAll(filterName): void {
    const fc = this.filterForm.controls[filterName];
    const { data } = this.filter_information[filterName];

    if (fc.value.length >= data.length) {
      fc.setValue('');
    } else {
      fc.setValue([...fc.value, ...data]);
    }
  }

  isAllSelected(filterName): boolean {
    const controlLen = this.filterForm.controls[filterName]?.value?.length;
    const dataLen = this.filter_information[filterName]?.data?.length;
    const addSelectAll = 1;
    return controlLen === dataLen + addSelectAll;
  }

  selectTriggerValue(filterName): string {
    const fc = this.filterForm.controls[filterName];
    if (fc.value.length) {
      if (fc.value[0].name === 'all') {
        return fc.value[1].name;
      } else {
        return fc.value[0].name;
      }
    }

    return '';
  }

  // ngOnChanges(changes: SimpleChanges) {
  //   // console.log('ngOnchanges');
  //   this.filter_array = Object.keys(this.filter_information);
  //   for (const propName in changes) {
  //     const chng = changes[propName];
  //     const cur = chng.currentValue;

  //     if (propName == 'filter_information' && Object.keys(cur).length) {
  //       for (let fa of this.filter_array) {
  //         if (this.filter_information[fa].type == 'select') {
  //           this.previous_filter_array[fa] = this.filter_information[fa].data;
  //         }
  //       }
  //     }
  //   }
  // }

  setFilters(): void {
    let i = 0;
    this.tagList = [];

    for (const fa of this.filter_array) {
      const filterInformation = this.filter_information[fa];
      if (filterInformation.name === 'Date') {
        if (filterInformation.type === 'date_range') {
          const start = this.filterForm.controls.date_range
            .get('start')
            .value?.format('YYYY-MMM-DD')
            .toString();

          const end = this.filterForm.controls.date_range
            .get('end')
            .value?.format('YYYY-MMM-DD')
            .toString();

          // this.setDefaultDate();
          if (!start || !end) {
            this.setDate(null, 'all');
          }
          const dateRangeData = {
            field: fa,
            is_removeable: false,
            name: `${filterInformation.name}: ${this.formatDate(
              start
            )} - ${this.formatDate(end)}`,
          };
          this.tagList.push(dateRangeData);
          this.filterList[fa] = {
            start,
            end,
          };
        } else if (filterInformation.type === 'date') {
          const cut_off_date = this.filterForm.controls.date
            .get('cut_off_date')
            .value?.format('YYYY-MMM-DD')
            .toString();

          if (!cut_off_date) {
            this.setDate(null, 'all');
          }
          const dateRangeData = {
            field: fa,
            is_removeable: false,
            name: `${filterInformation.name}: ${cut_off_date}`,
          };
          this.tagList.push(dateRangeData);
          // console.log('taglist:', this.tagList);
          this.filterList[fa] = cut_off_date;
        }

        // const dateRangeData = {
        //   field: fa,
        //   is_removeable: false,
        //   name: `${filterInformation.name}: ${start} - ${end}`,
        // };

        // this.tagList.push(dateRangeData);
        // this.filterList[fa] = {
        //   start,
        //   end,
        // };
      } else if (filterInformation.type === 'switch') {
        const form = this.filterForm.get(fa);
        this.filterList[fa] = form.value;
        const switchTag = {
          field: fa,
          is_removeable: this.filter_information[fa].isDefault || false,
          name:
            this.filter_information[fa].tag_name ||
            this.filter_information[fa].name,
        };
        setTimeout(() => {
          if (form.value) {
            this.tagList.push(switchTag);
            // this.tagList.sort((a, b) => +a.is_removeable - +b.is_removeable);
          }
        });
      } else {
        let form = this.filterForm.get(fa);

        if (
          form == null ||
          !form.value ||
          (this.filter_information[fa].type == 'select' &&
            !this.filter_information[fa].multiple &&
            !form.value.value)
        ) {
          this.filterList[fa] = '';
          continue;
        }
        this.filterList[fa] = form.value;

        this.tagList[i] = {};
        this.tagList[i].field = fa;
        if (
          this.filter_information[fa].type == 'select' &&
          this.filter_information[fa].multiple
        ) {
          let names = '';
          let values = [];
          let len = form.value.length;

          if (!len) {
            this.filterForm.controls[fa].patchValue([
              this.filter_information[fa].data[0],
            ]);
          }

          // for (let i = 0; i < len; i++) {
          //   names +=
          //     len > 1
          //       ? len == i + 1
          //         ? form.value[i].name
          //         : form.value[i].name + ', '
          //       : form.value[i].name;
          //   values[i] = form.value[i].value;
          // }
          names = form.value
            .map((val) => val.name)
            .filter((val) => val !== 'all')
            .join(', ');

          values = form.value.map((x) => x.value);

          this.tagList[
            i
          ].name = `${this.filter_information[fa].name} : ${names}`;
          this.filterList[fa] = values.toString();
        } else if (this.filter_information[fa].type == 'select') {
          this.tagList[
            i
          ].name = `${this.filter_information[fa].name} : ${form.value.name}`;
          this.filterList[fa] = form.value.value;
        } else {
          //console.log("else filter tags ",this.filter_information[fa]);
          const name = this.filter_information[fa].tag_name
            ? this.filter_information[fa].tag_name
            : this.filter_information[fa].name;
          this.tagList[i].name = `${name} : ${form.value}`;
        }
        this.tagList[i].is_removeable = this.filter_information[fa].isDefault
          ? false
          : true;
      }
      i++;
    }

    this.isTabOpen = false;
    this.filtersEvent.emit({ filters: this.filterList });
  }

  formatDate(date: string): string {
    return moment(date).format('DD-MMM-YYYY');
  }

  ngDoCheck() {
    if (!this.isCheckedDone) {
      let isNotEmpty = true;
      for (let fa of this.filter_array) {
        if (
          !this.filter_information[fa].data.length &&
          this.filter_information[fa].type == 'select'
        ) {
          isNotEmpty = false;
          break;
        }
      }
      //console.log("is empty ",isEmpty);
      if (isNotEmpty) {
        this.isCheckedDone = true;
      }
    }
    //console.log("isCheckedDone ",this.isCheckedDone);

    if (!this.isCheckedDone) {
      return;
    }

    let changes: any;
    //let filter_array = Object.keys(this.filter_information);
    //let index = 0;
    for (let fa of this.filter_array) {
      if (this.filter_information[fa].type == 'select') {
        changes = this.iterableDiffer.diff(this.filter_information[fa].data);
        // console.log(fa,this.filter_information[fa].data);
        if (changes) {
          this.previous_filter_array[fa] = this.filter_information[fa].data;
          let v = this.filter_information[fa].field_values.value;
          if (isNaN(v) == false) {
            v = v.toString();
          }
          if (v != undefined && v.length && this.field_value[fa].length == 0) {
            //console.log("if v is not undefined then is ",v);
            let selected = [];
            let k = 0;
            let tagnames = [];
            //if()
            let cv = v.split`,`.map((x) => x);
            if (cv.length > 1) {
              v = cv;
            }

            if (this.filter_information[fa].multiple) {
              if (!(v instanceof Array)) {
                v = [v];
              }

              for (let i of v) {
                this.filter_information[fa].data.map((item) => {
                  if (item.value == i) {
                    selected[k] = item;
                    tagnames[k] = item.name;
                    k++;
                  }
                });
              }
            } else {
              this.filter_information[fa].data.map((item) => {
                if (item.value == v) {
                  selected = item;
                  tagnames = item.name;
                }
              });
            }
            this.field_value[fa] = selected;
            this.filterForm.controls[fa].setValue(this.field_value[fa]);
          }
        }
      }
    }
  }
}
