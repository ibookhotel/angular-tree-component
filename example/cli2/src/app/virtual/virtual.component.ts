import {Component} from '@angular/core';

@Component({
  selector: 'app-basictree',
  template: `
    <div id="tree-wrapper">
      <tree-root [focused]="true" [nodes]="nodes" [options]="customTemplateStringOptions"></tree-root>
    </div>
  `,
  styles: []
})
export class VirtualComponent {
  public nodes = [];
  public customTemplateStringOptions = {
    nodeHeight: 23,
    useVirtualScroll: true
  };
  public noOfNodes = 10;  // 1.000.000 crashes browser

  constructor() {
    this.nodes = this._makeDataSet(this.noOfNodes);
  }

  private _makeDataSet(count) {
    const dataSet = [];

    for (let i = 1; i <= count; i++) {
      dataSet.push({
        id: i,
        name: 'node ' + i
      });
    }
    return dataSet;
  }
}
