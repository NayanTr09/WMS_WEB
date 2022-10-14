import { Injectable, OnDestroy } from '@angular/core';
import {
  Observable,
  fromEvent,
  merge,
  Subject,
  timer,
  Subscription,
} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class IdleTimerService implements OnDestroy{
  ngOnDestroy(): void {
      this.stopTimer();
  }
  private idle: Observable<any>;
  private timer: Subscription;
  private timeOut: number;
  private idleSub: Subscription;

  public expired: Subject<boolean> = new Subject<boolean>();

  public startWatching(timeOut: number): Observable<any> {
    this.idle = merge(
      fromEvent(document, 'mousemove'),
      fromEvent(document, 'click'),
      fromEvent(document, 'mousedown'),
      fromEvent(document, 'keypress'),
      fromEvent(document, 'DOMMouseScroll'),
      fromEvent(document, 'mousewheel'),
      fromEvent(document, 'touchmove'),
      fromEvent(document, 'MSPointerMove'),
      fromEvent(window, 'mousemove'),
      fromEvent(window, 'resize')
    );

    this.timeOut = timeOut * 1000;

    this.idleSub = this.idle.subscribe((res) => {
      this.resetTimer();
    });

    this.startTimer();

    return this.expired;
  }

  private startTimer() {
    this.timer = timer(this.timeOut, this.timeOut).subscribe((res) => {
      this.expired.next(true);
    });
  }

  public resetTimer() {
    this.timer.unsubscribe();
    this.startTimer();
  }

  public stopTimer() {
    this.timer.unsubscribe();
    this.idleSub.unsubscribe();
  }
}
