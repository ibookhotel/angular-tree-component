import {Injectable} from '@angular/core';
import {
  Headers,
  Http, RequestOptions,
} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';
import {TreeViewData} from '../models/treeview-data.model';

@Injectable()
export class TreeRestService {

  /*
   * Number of child nodes to fetch per API request
   */
  private limit = 10;

  /*
   * For API paging
   * calculated based on curPage and limit
   */
  private offset = 0;

  /*
   * Http Request options
   */
  private headers;
  private options;

  /*
   * Set request headers
   */
  constructor(private http: Http) {
    this.headers = new Headers({'Content-Type': 'application/json'});
    this.options = new RequestOptions({headers: this.headers});
  }

  /*
   * Calculate offset
   */
  getOffset(curPage) {
    return (curPage - 1) * this.limit;
  }

  /*
   * Build pagination url
   */
  paginate(parentId: number, curPage?: number) {

    if (curPage == null) {
      curPage = 0;
    }

    let endpoint = 'http://acuta-rest.local.bildhosting.me/contextual-data';
    // let endpoint = 'http://localhost:6634/contextual-data';
    endpoint += '?parentId=' + parentId + '&limit=' + this.limit + '&offset=' + this.getOffset(curPage);
    return this.getNodes(endpoint);
  }

  /*
   * Get notes from API
   */
  getNodes(url: string) {
    console.log(url);
    return this.http.get(url)
      .map((response) => {
        if (response.ok) {
          return response.json();
          // return response.json().items as TreeViewData[];
        } else {
          return this.logError(response);
        }
      }).toPromise();
  }

  /*
   * Log error
   */
  private logError(error: any) {
    try {
      error = error.json();
      console.error(error.error);
    } catch (e) {
      console.error(error);
    }

    return Observable.throw(error);
  }
}
