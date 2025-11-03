import { BrowserModule } from '@angular/platform-browser';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'; // 新增CUSTOM_ELEMENTS_SCHEMA
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { GeometryComponent } from './sections/geometry/geometry.component';
import { AtlasComponent } from './sections/atlas/atlas.component';
import { LHCbComponent } from './sections/lhcb/lhcb.component';
import { VPToggleComponent } from './sections/lhcb/vp-toggle/vp-toggle.component';
import { CMSComponent } from './sections/cms/cms.component';
import { TrackmlComponent } from './sections/trackml/trackml.component';
import { CepcComponent } from './sections/cepc/cepc.component';
import { TaoComponent } from './sections/tao/tao.component';
import { PhoenixUIModule } from 'phoenix-ui-components'; // 已正确导入
import { RouterModule, Routes } from '@angular/router';
import { PlaygroundComponent } from './sections/playground/playground.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { environment } from '../environments/environment';

let routes: Routes;
if (environment?.singleEvent) {
  routes = [{ path: '', component: AtlasComponent }];
} else {
  routes = [
    { path: '', component: HomeComponent },
    { path: 'home', component: HomeComponent },
    { path: 'geometry', component: GeometryComponent },
    { path: 'atlas', component: AtlasComponent },
    { path: 'lhcb', component: LHCbComponent },
    { path: 'cms', component: CMSComponent },
    { path: 'trackml', component: TrackmlComponent },
    { path: 'playground', component: PlaygroundComponent },
    { path: 'cepc', component: CepcComponent },
    { path: 'tao', component: TaoComponent },
  ];
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    GeometryComponent,
    AtlasComponent,
    LHCbComponent,
    VPToggleComponent,
    CMSComponent,
    TrackmlComponent,
    PlaygroundComponent,
    CepcComponent,
    TaoComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    RouterModule.forRoot(routes, {
      useHash: environment?.singleEvent ? false : true,
    }),
    BrowserAnimationsModule,
    PhoenixUIModule, // 已正确导入，会注册phoenix-*组件
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // 新增：允许Web Component，解决“未识别元素”错误
  bootstrap: [AppComponent],
})
export class AppModule { }