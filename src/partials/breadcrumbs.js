import $ from 'jquery';
import {computedFrom} from 'aurelia-framework';
import {inject, bindable} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {UserStateStorage, NavigationHistory} from 'periscope-framework';

@inject(Router, NavigationHistory, UserStateStorage)
export class Breadcrumbs {

  constructor(router, navigationHistory, userStateStorage){
    this._router = router;
    this._navigationHistory = navigationHistory;
    this._userStateStorage = userStateStorage;
  }



  get history(){
    var nH = this._navigationHistory.items;
    var result = [];

    for (let i = 0; i < nH.length; i++) {
      result.push(nH[i]);
      if (nH[i].dashboardName === this._router.currentRouteItem.dashboardName)
        break;
    }
    //$('[data-toggle="tooltip"]').tooltip();
    return result;
  }


  navigate(routeItem){
    this._router.navigate(routeItem.url);
  }

}
