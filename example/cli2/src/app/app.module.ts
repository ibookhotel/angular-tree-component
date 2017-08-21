import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {TreeModule} from '../../../../lib/angular-tree-component';
import {Router, Route, RouterModule} from '@angular/router';

import {AppComponent} from './app.component';
import {BasicTreeComponent} from './basictree/basictree.component';
import {FullTreeComponent} from './fulltree/fulltree.component';
import {TemplatesComponent} from './templates/templates.component';
import {FilterComponent} from './filter/filter.component';
import {VirtualComponent} from './virtual/virtual.component';

const routes: Route[] = [
  {
    path: '',
    component: FullTreeComponent
  },
  {
    path: 'basic',
    component: BasicTreeComponent
  },
  {
    path: 'templates',
    component: TemplatesComponent
  },
  {
    path: 'filter',
    component: FilterComponent
  },
  {
    path: 'virtual',
    component: VirtualComponent
  }
];

@NgModule({
  declarations: [
    AppComponent,
    BasicTreeComponent,
    FullTreeComponent,
    TemplatesComponent,
    FilterComponent,
    VirtualComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    TreeModule,
    RouterModule.forRoot(routes, {useHash: true})
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
