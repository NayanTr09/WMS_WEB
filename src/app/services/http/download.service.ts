import { environment } from './../../../environments/environment';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, SkipSelf } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class DownloadService {
  constructor(private httpRequest: HttpClient, public toastr: ToastrService) {}

  getCSVFileContent(url, requestData) {
    const headers = new HttpHeaders().set(
      'Content-Type',
      'text/plain; charset=utf-8'
    );

    return this.httpRequest.get(`${environment.apiURL}${url}`, {
      params: requestData,
      headers,
      responseType: 'text',
    });
  }

  exportRequest(url, requestData, type = 'get') {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    if (type == 'get') {
      return this.httpRequest.get(`${environment.apiURL}${url}`, {
        params: requestData,
        headers,
      });
    } else if (type == 'post') {
      return this.httpRequest.post(`${environment.apiURL}${url}`, requestData);
    }
  }

  downloadReportById(id) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    let url = 'reports/download-report/' + id;

    this.httpRequest
      .get(`${environment.apiURL}${url}`, {
        headers,
      })
      .subscribe(
        (data: any) => {
          if (data.success == true) {
            this.downloadDataWithUrl(data.url);
          } else {
            this.toastr.error('Invalid Request', 'ERROR');
          }
        },
        (error) => {
          //console.log("SOMENTHING WENT WRONG!");
          this.toastr.error(
            'SOMENTHING WENT WRONG, Unable to donwload file',
            'ERROR'
          );
        }
      );
  }

  downloadStream(data, filename: string): void | boolean {
    if (!data) {
      return false;
    }

    const element = document.createElement('a');
    element.setAttribute(
      'href',
      'data:application/octet-stream;base64,' + data
    );
    element.setAttribute('download', filename);
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  downloadDataWithUrl(url, filename = '', target = '_self'): void {
    if (!url) {
      return;
    }

    if (!filename) {
      filename = url.substr(url.lastIndexOf('/') + 1);
    }

    const link = document.createElement('a');
    link.download = filename;
    link.setAttribute('target', target);
    // Construct the uri
    link.href = url;
    document.body.appendChild(link);
    link.click();
    // Cleanup the DOM
    document.body.removeChild(link);
    // delete link;
  }
}
