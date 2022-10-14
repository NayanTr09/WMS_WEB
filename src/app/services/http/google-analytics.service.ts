import { Injectable } from '@angular/core';
import { WindowRef } from 'src/app/app/window-ref';

declare let ga: Function;
@Injectable({
  providedIn: 'root',
})
export class GoogleAnalyticsService {
  constructor(private window: WindowRef) {}
  source = '';
  // public send(eventCategory, eventAction, eventLabel){
  //   this.window.nativeWindow.ga('send', 'event', {
  //               eventCategory: eventCategory,
  //               eventAction: eventAction,
  //               eventLabel: eventLabel ? eventLabel : this.source
  //             });
  // }
  // public emitPageview(url: string) {
  //   ga(‘set’, ‘page’, url);
  //   ga(‘send’, ‘pageview’);
  // }
  public emitEvent(
    eventCategory: string,
    eventAction: string,
    eventLabel: string
  ) {
    // this.window.nativeWindow.ga('send', 'event', {
    //   eventCategory: eventCategory,
    //   eventLabel: eventLabel,
    //   eventAction: eventAction,
    // });
    this.window.nativeWindow.gtag('event', eventAction, {
      event_category: eventCategory,
      event_label: eventLabel,
    });
  }
}
