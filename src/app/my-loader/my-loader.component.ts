import { AfterViewInit, ChangeDetectorRef, Input } from '@angular/core';
import { Component } from '@angular/core';
import { LoaderService } from '../services/loader.service';

@Component({
  selector: 'app-my-loader',
  templateUrl: './my-loader.component.html',
  styleUrls: ['./my-loader.component.scss'],
})
export class MyLoaderComponent implements AfterViewInit {
  @Input() message = 'Please wait...';
  loading: boolean;

  constructor(
    private LoaderService: LoaderService,
    private cd: ChangeDetectorRef
  ) {}

  ngAfterViewInit() {
    setTimeout(() => {
      this.LoaderService.isLoading.subscribe((v) => {
        this.cd.detectChanges();
        this.loading = v;
      });
    }, 0);
  }
}
