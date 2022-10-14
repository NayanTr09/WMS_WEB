import { ToastrService } from 'ngx-toastr';
import { DownloadService } from './../../../../services/http/download.service';
import { MatDialog } from '@angular/material/dialog';
import { Directive, Input, HostListener, ElementRef } from '@angular/core';
import { DownloadPopupComponent } from '../download-popup/download-popup.component';
import { AuthService } from './../../../../services/auth/auth.service';
//import { saveAs } from 'file-saver';

@Directive({
  selector: '[appDownload]',
})
export class DownloadDirective {
  @Input('download_url') url: string;
  @Input('name') filename?: string;
  @Input('reponseType') rType?: string;
  @Input('requestData') requestData: any;
  @Input('method') method: any;
  @Input('type_name') type_name: string;

  constructor(
    public downloadService: DownloadService,
    public toastr: ToastrService,
    public dialog: MatDialog,
    public auth: AuthService
  ) {
    //el.nativeElement.style.backgroundColor = 'yellow';
    //console.log()
    //this.requestData = {};
  }

  @HostListener('click') onClick() {
    console.log('host lisnter event');
    if (this.rType == 'export') {
      this.exportRequest();
    } else {
      this.downloadFile();
    }
  }

  downloadFile() {
    //console.log(this.url);
    //console.log(this.url);
    //console.log(this.filename);
    //this.el.nativeElement.style.backgroundColor = color;
    //console.log("request DATA");
    //console.log(this.requestData);

    if (this.url == undefined || this.url == '') {
      //console.log('no url passed');
      return;
    }

    if (this.filename == undefined || this.filename == '') {
      this.filename = 'download.csv';
    }

    this.downloadService
      .getCSVFileContent(this.url, this.requestData)
      .subscribe(
        (data: any) => {
          //console.log(typeof data);
          //console.log(this.rType);
          if (this.rType == 'url') {
            data = JSON.parse(data);
          }

          if (!data.download_url) {
            let blob = new Blob([data], { type: 'text/csv' });
            //FileSaver.saveAs(blob, "data.txt");

            let link = document.createElement('a');
            if (link.download !== undefined) {
              // feature detection
              // Browsers that support HTML5 download attribute
              var url = URL.createObjectURL(blob);
              link.setAttribute('href', url);
              link.setAttribute('download', this.filename);
              link.style.visibility = 'hidden';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          } else {
            //console.log('url');
            let url = data.download_url;
            let targetBlankFiles = ['manifests', 'label', 'pod'];
            if (!url) {
              return;
            }
            let link = document.createElement('a');
            link.download = this.filename;
            // console.log(filename);
            targetBlankFiles.includes(this.filename)
              ? (link.target = '_blank')
              : '';
            // Construct the uri
            link.href = url;
            document.body.appendChild(link);
            link.click();
            // Cleanup the DOM
            document.body.removeChild(link);
          }
        },
        (error) => {
          //console.log("SOMENTHING WENT WRONG!");
          this.toastr.error(
            'SOMENTHING WENT WRONG,Unable to donwload the sample file',
            'ERROR'
          );
        }
      );

    /*AppService.get(url)
    .then(function (res) {
        $scope.isPreloader = false;
        if (res.data.download_url) {
            AppService.downloadDataWithUrl(res.data.download_url, fileName)
        } else {
            var blob = new Blob([res.data], { type: 'text/csv' });
            var link = document.createElement("a");
            if (link.download !== undefined) { // feature detection
                // Browsers that support HTML5 download attribute
                var url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", fileName);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
    })
    .catch(function (error) {
        $scope.isPreloader = false;
        AppService.isAuth(error.data);
    })*/
  }

  exportRequest() {
    //console.log(this.url);
    //console.log(this.url);
    //console.log(this.filename);
    //this.el.nativeElement.style.backgroundColor = color;
    //console.log("request DATA");
    //console.log(this.requestData);

    if (this.url == undefined || this.url == '') {
      //console.log('no url passed');
      return;
    }

    this.downloadService
      .exportRequest(this.url, this.requestData, this.method)
      .subscribe(
        (data: any) => {
          //console.log(typeof data);
          //console.log(data);
          if (
            typeof data == 'object' &&
            'is_background_downloading' in data &&
            data.is_background_downloading
          ) {
            this.openPopup();
            return;
          }

          if (!data.download_url) {
            let blob = new Blob([data], { type: 'text/csv' });
            //FileSaver.saveAs(blob, "data.txt");

            let link = document.createElement('a');
            if (link.download !== undefined) {
              // feature detection
              // Browsers that support HTML5 download attribute
              var url = URL.createObjectURL(blob);
              link.setAttribute('href', url);
              link.setAttribute('download', this.filename);
              link.style.visibility = 'hidden';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          } else {
            //console.log('url');
            let url = data.download_url;
            let targetBlankFiles = ['manifests', 'label', 'pod'];
            if (!url) {
              return;
            }
            let link = document.createElement('a');
            link.download = this.filename;
            // console.log(filename);
            targetBlankFiles.includes(this.filename)
              ? (link.target = '_blank')
              : '';
            // Construct the uri
            link.href = url;
            document.body.appendChild(link);
            link.click();
            // Cleanup the DOM
            document.body.removeChild(link);
          }

          //console.log(typeof data);
          //console.log(this.rType);
          //console.log(typeof data);
          //data = JSON.parse(data);
        },
        (error) => {
          this.toastr.error(
            error.error.message ??
              'SOMENTHING WENT WRONG, Unable to download the sample file',
            'ERROR'
          );
          //console.log(error);
        }
      );
  }

  openPopup(): void {
    const commonPopupRef = this.dialog.open(DownloadPopupComponent, {
      data: {
        reportName: this.type_name,
        email: this.auth.getUserEmail(),
        endpoint: '/reports',
      },
    });

    commonPopupRef.afterClosed().subscribe((result) => {
      // when popup close, this will run
      //console.log('result :>> ', result);
    });
  }
  //  console.log(this.highlightColor);
}
