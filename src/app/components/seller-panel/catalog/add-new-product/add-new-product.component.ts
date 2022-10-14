import { Location } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { DownloadService } from 'src/app/services/http/download.service';
import { HttpService } from 'src/app/services/http/http.service';
import { SubSink } from 'subsink';
import { AlertEnum } from '../../common/alertEnums';

@Component({
  selector: 'app-add-new-product',
  templateUrl: './add-new-product.component.html',
  styleUrls: ['./add-new-product.component.scss'],
})
export class AddNewProductComponent implements OnInit, OnDestroy {
  @ViewChild('responseDialog') responseDialog: TemplateRef<HTMLDialogElement>;
  private subs = new SubSink();
  isAddNewProduct: boolean;
  canNavigate = false;

  constructor(
    private location: Location,
    private router: Router,
    private download: DownloadService,
    private http: HttpService,
    private toastr: ToastrService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.isAddNewProduct = this.location.path().includes('add-new-product');
  }

  downloadSampleCsv(path: string, filename: string): void {
    this.subs.sink = this.download.getCSVFileContent(path, {}).subscribe(
      (data: any) => {
        try {
          const resp = JSON.parse(data);
          const { download_url } = resp;
          this.download.downloadDataWithUrl(download_url, filename);
        } catch (error) {
          const blob = new Blob([data], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          this.download.downloadDataWithUrl(url, filename);
        }
      },
      (onErr) => {
        this.toastr.error('Error while downloading file');
        console.error(onErr);
      }
    );
  }

  checkErrors(id: string): void {
    if (!id) {
      this.toastr.error('Unable to proceed');
      return;
    }

    this.subs.sink = this.http
      .getWithParams(`errors/${id}/check`, { is_web: 1 })
      .subscribe(
        (resp: any) => {
          this.canNavigate = true;
          const { errors, status, message } = resp.data;
          if (status === 1 || status === 0) {
            status === 0
              ? this.toastr.show(AlertEnum.waitingForQueue)
              : this.toastr.show(AlertEnum.processing);

            setTimeout(() => {
              this.checkErrors(id);
            }, 3000);
            return;
          }
          const dialogData = { ...resp.data } ?? {};
          dialogData.errorUrl = null;

          if (message) {
            this.toastr.warning(message);
          }

          if (errors) {
            this.canNavigate = false;
            dialogData.errorUrl = `errors/${id}/download?is_web=1`;
          }

          if (status < 3) {
            this.openDialog(dialogData);
          }
        },
        (err) => {
          console.error(err);
        }
      );
  }

  uploadProductsList(file: FormData): void {
    const endpt = 'products/import';
    this.subs.sink = this.http.post(endpt, file).subscribe(
      (success: any) => {
        const { id } = success;
        this.checkErrors(id);
      },
      (onErr) => {
        console.error(onErr);
        this.toastr.error(onErr?.error?.message);
      }
    );
  }

  uploadMappingList(file: FormData): void {
    const endpt = 'listings/import';
    this.subs.sink = this.http.post(endpt, file).subscribe(
      (success: any) => {
        const { id } = success;
        this.checkErrors(id);
      },
      (onErr) => {
        console.error(onErr);
        const { status_code } = onErr?.error;

        if (status_code === 500) {
          const msg =
            'Error in reading file data! Please check that the column names are same as that in the sample file provided.';
          this.toastr.warning(msg);
        } else {
          this.toastr.error(onErr?.error?.message);
        }
      }
    );
  }

  onFileSelect(evt): void {
    const file = evt.target.files[0];
    evt.target.value = null;

    if (file.type !== 'text/csv') {
      this.toastr.error('Invalid file type!');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    if (this.isAddNewProduct) {
      this.uploadProductsList(formData);
    } else {
      this.uploadMappingList(formData);
    }
  }

  goBack(): void {
    this.location.back();
  }

  openDialog(data): void {
    this.dialog.open(this.responseDialog, {
      panelClass: 'br-10',
      width: '30%',
      data,
      disableClose: true,
      autoFocus: true,
    });
  }

  onClickFinish(): void {
    this.router.navigate(['fcs/products']);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
