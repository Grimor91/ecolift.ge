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
import { AdminLoginComponent } from './admin-login/admin-login.component';
import { adminGuard } from './shop/admin.guard';

const routes: Routes = [
  {path:'', component:HomeComponent},
  {path:'cardpassenger', component:CardpassengerComponent},
  {path:'panoramic', component:PanoramaComponent},
  {path:'Dumbwaiters', component:DumbwaitersComponent},
  {path:'escolator', component:EscalatorsComponent},
  {path:'tailormade', component:TailormodeComponent},
  {path:'aboutus', component:AboutusComponent},
  {path: 'lifts', component:LiftsComponent},
  {path: 'admin/login', component:AdminLoginComponent},
  {path: 'admin', component:AdminpanelComponent, canActivate:[adminGuard]},
  {path: 'adminpanel', redirectTo:'admin'},
  {path: 'parts', component:PartsComponent},
  {path: 'parts/:id', component:PartDetailComponent},
  {path: 'cart', component:CartComponent},
  {path: 'resources', component:ResourcesComponent}
  
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
  anchorScrolling: 'enabled',
  scrollPositionRestoration: 'enabled'
})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
