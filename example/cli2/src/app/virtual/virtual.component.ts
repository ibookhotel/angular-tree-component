import {Component} from '@angular/core';

@Component({
  selector: 'app-basictree',
  template: `
    <div id="tree-wrapper"><tree-root [focused]="true" [nodes]="nodes" [options]="customTemplateStringOptions"></tree-root></div>
  `,
  styles: []
})
export class VirtualComponent {
  nodes = [];
  customTemplateStringOptions = {
    nodeHeight: 23,
    useVirtualScroll: true
  };

  constructor() {
    this.nodes = this._makeDataSet(50);
  }

  private _makeDataSet(count) {
    const dataSet = [];

    for (let i = 1; i <= count; i++) {
      dataSet.push({
        id: 1,
        name: 'node ' + i
      });
    }
    return dataSet;
  }
}
