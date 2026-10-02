import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CardpassengerComponent } from './cardpassenger/cardpassenger.component';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavComponent } from './nav/nav.component';
import { SliderComponent } from './slider/slider.component';
import { MediaComponent } from './media/media.component';
import { ShowroomComponent } from './showroom/showroom.component';
import { TextaboutComponent } from './textabout/textabout.component';
import { WhyComponent } from './why/why.component';
import { MeetComponent } from './meet/meet.component';
import { FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule } from '@angular/common/http';
import { HomeComponent } from './home/home.component';
import { DumbwaitersComponent } from './dumbwaiters/dumbwaiters.component';
import { AosDirective } from './aos.directive';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { EscalatorsComponent } from './escalators/escalators.component';
import {
  TranslateModule,
  TranslateLoader,
  TranslatePipe,
} from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PanoramaComponent } from './panorama/panorama.component';
import { TailormodeComponent } from './tailormode/tailormode.component';
import { GoogleMapsModule } from '@angular/google-maps';
import { AboutusComponent } from './aboutus/aboutus.component';
import { OwlComponent } from './owl/owl.component';
import { ServiceComponent } from './service/service.component';
import { LiftsComponent } from './lifts/lifts.component';
import { AdminpanelComponent } from './adminpanel/adminpanel.component';
import { PartsComponent } from './parts/parts.component';
import { ResourcesComponent } from './resources/resources.component';
import { PartDetailComponent } from './part-detail/part-detail.component';
import { CartComponent } from './cart/cart.component';
import { ServiceRequestComponent } from './service-request/service-request.component';
import { QuoteRequestComponent } from './quote-request/quote-request.component';
import { AdminLoginComponent } from './admin-login/admin-login.component';
import { NewsComponent } from './news/news.component';
import { LocalizedPipe } from './shop/localized.pipe';
import { AuthInterceptor } from './shop/auth.interceptor';
// The query string makes browsers fetch fresh translations after a deploy
// instead of reusing a cached copy; bump it whenever the JSON files change.
const TRANSLATIONS_VERSION = '2026-09-30';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n-v2/', `.json?v=${TRANSLATIONS_VERSION}`);
}

@NgModule({
  declarations: [
    AppComponent,
    NavComponent,
    SliderComponent,
    MediaComponent,
    ShowroomComponent,
    TextaboutComponent,
    WhyComponent,
    MeetComponent,
    CardpassengerComponent,
    HomeComponent,

    DumbwaitersComponent,
    AosDirective,
    EscalatorsComponent,
    PanoramaComponent,
    TailormodeComponent,
    AboutusComponent,
    OwlComponent,
    ServiceComponent,
    LiftsComponent,
    AdminpanelComponent,
    PartsComponent,
    PartDetailComponent,
    CartComponent,
    ServiceRequestComponent,
    QuoteRequestComponent,
    AdminLoginComponent,
    NewsComponent,
    LocalizedPipe,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    GoogleMapsModule,
    BrowserAnimationsModule,
    CarouselModule,
    ResourcesComponent,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  exports: [AosDirective],
  providers: [TranslatePipe, { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }],
  bootstrap: [AppComponent],
})
export class AppModule {}
