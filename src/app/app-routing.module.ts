import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CardpassengerComponent } from './cardpassenger/cardpassenger.component';
import { HomeComponent } from './home/home.component';
import { LiftsComponent } from './lifts/lifts.component';
import { DumbwaitersComponent } from './dumbwaiters/dumbwaiters.component';
import { EscalatorsComponent } from './escalators/escalators.component';
import { PanoramaComponent } from './panorama/panorama.component';
import { TailormodeComponent } from './tailormode/tailormode.component';
import { AboutusComponent } from './aboutus/aboutus.component';
import { AdminpanelComponent } from './adminpanel/adminpanel.component';
import { PartsComponent } from './parts/parts.component';
import { ResourcesComponent } from './resources/resources.component';
import { PartDetailComponent } from './part-detail/part-detail.component';
import { CartComponent } from './cart/cart.component';
import { ServiceRequestComponent } from './service-request/service-request.component';
import { QuoteRequestComponent } from './quote-request/quote-request.component';
import { NewsComponent } from './news/news.component';
import { AdminLoginComponent } from './admin-login/admin-login.component';
import { adminGuard } from './shop/admin.guard';

const routes: Routes = [
  {path:'', component:HomeComponent, data:{seo:'home'}},
  {path:'cardpassenger', component:CardpassengerComponent, data:{seo:'passenger'}},
  {path:'panoramic', component:PanoramaComponent, data:{seo:'panoramic'}},
  {path:'Dumbwaiters', component:DumbwaitersComponent, data:{seo:'dumbwaiters'}},
  {path:'escolator', component:EscalatorsComponent, data:{seo:'escalators'}},
  {path:'tailormade', component:TailormodeComponent, data:{seo:'tailormade'}},
  {path:'aboutus', component:AboutusComponent, data:{seo:'about'}},
  {path: 'lifts', component:LiftsComponent, data:{seo:'lifts'}},
  {path: 'admin/login', component:AdminLoginComponent, data:{noindex:true}},
  {path: 'admin', component:AdminpanelComponent, canActivate:[adminGuard], data:{noindex:true}},
  {path: 'adminpanel', redirectTo:'admin'},
  {path: 'parts', component:PartsComponent, data:{seo:'parts'}},
  {path: 'parts/:id', component:PartDetailComponent, data:{seo:'parts'}},
  {path: 'cart', component:CartComponent, data:{seo:'cart', noindex:true}},
  {path: 'service', component:ServiceRequestComponent, data:{seo:'service'}},
  {path: 'quote', component:QuoteRequestComponent, data:{seo:'quote'}},
  {path: 'news', component:NewsComponent, data:{seo:'news'}},
  {path: 'resources', component:ResourcesComponent, data:{seo:'resources'}}
  
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
  anchorScrolling: 'enabled',
  scrollPositionRestoration: 'enabled'
})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
