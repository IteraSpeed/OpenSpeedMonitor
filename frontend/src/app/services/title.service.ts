import {Injectable} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Title} from '@angular/platform-browser';
import {Subscription} from 'rxjs';
import {filter, map} from 'rxjs/operators';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class TitleService {

  private static APP_TITLE = 'OpenSpeedMonitor';

  constructor(private router: Router,
              private activatedRoute: ActivatedRoute,
              private translateService: TranslateService,
              private titleService: Title) {
  }

  initRouteEventListener(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        let child = this.activatedRoute.firstChild;
        while (child.firstChild) {
          child = child.firstChild;
        }
        if (child.snapshot.data['title']) {
          return child.snapshot.data['title'];
        }
        return TitleService.APP_TITLE;
      })
    ).subscribe((title: string) => {
      this.setDocumentTitle(title);
    });
  }

  private setDocumentTitle(title: string): void {
    if (title === TitleService.APP_TITLE) {
      this.titleService.setTitle(TitleService.APP_TITLE);
    } else {
      this.setTranslatedTitle(title);
    }
  }

  private setTranslatedTitle(titleKeyToTranslate: string): void {
    const titleSubscription: Subscription = this.translateService
      .stream(titleKeyToTranslate)
      .subscribe((title: string) => {
        if (title !== titleKeyToTranslate) {
          this.titleService.setTitle(title);
          if (titleSubscription) {
            titleSubscription.unsubscribe();
          }
        }
      });
  }
}
