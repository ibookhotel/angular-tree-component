import {
  Component, Input, ViewEncapsulation, OnInit, OnDestroy
} from '@angular/core';
import { reaction, autorun } from 'mobx';
import { observable, computed, action } from 'mobx-angular';
import { TreeVirtualScroll } from '../models/tree-virtual-scroll.model';
import { TreeNode } from '../models/tree-node.model';
import { TreeModel } from '../models/tree.model';

@Component({
  selector: 'tree-node-collection',
  encapsulation: ViewEncapsulation.None,
  template: `
    <ng-container *mobxAutorun>
      <div
        [style.margin-top]="marginTop">
        <tree-node
          *ngFor="let node of viewportNodes; let i = index; trackBy: trackNode"
          [node]="node"
          [index]="i"
          [templates]="templates">
        </tree-node>
      </div>
    </ng-container>
  `
})
export class TreeNodeCollectionComponent implements OnInit, OnDestroy {
  @Input()
  get nodes() { return this._nodes; }
  set nodes(nodes) { this.setNodes(nodes); }

  @Input() treeModel: TreeModel;

  @observable _nodes;
  private virtualScroll: TreeVirtualScroll; // Cannot inject this, because we might be inside treeNodeTemplateFull
  @Input() templates;

  @observable viewportNodes: TreeNode[];

  /*
   * TODO: Check logic
   */
  @computed get marginTop(): string {
    const firstNode = this.viewportNodes && this.viewportNodes.length && this.viewportNodes[0];
    const relativePosition = firstNode ? firstNode.position - firstNode.parent.position - firstNode.parent.getSelfHeight() : 0;

    return `${relativePosition}px`;
  }

  _dispose = [];

  @action setNodes(nodes) {
    this._nodes = nodes;
  }

    /*
     * TODO: Check logic, here is done set of property "viewportNodes"
     */
  ngOnInit() {
    this.virtualScroll = this.treeModel.virtualScroll;
    this._dispose = [
      // return node indexes so we can compare structurally,
      reaction(() => {
        console.log('Virtual Scroll Viewport DOM changed. TreeNodeCollectionComponent ngOnInit, reaction method', this.virtualScroll.getViewportNodes(this.nodes));
        return this.virtualScroll.getViewportNodes(this.nodes).map(n => n.index);
      }, (nodeIndexes) => {
          console.log('Virtual react second method call. Node index', nodeIndexes);
          this.viewportNodes = nodeIndexes.map((i) => this.nodes[i]);
        }, { compareStructural: true, fireImmediately: true }
      ),
      reaction(() => this.nodes, (nodes) => {
        this.viewportNodes = this.virtualScroll.getViewportNodes(nodes);
        console.log('ngOnInit, reaction method', this.virtualScroll.getViewportNodes(nodes));
      })
    ];
  }

  ngOnDestroy() {
    this._dispose.forEach(d => d());
  }

  trackNode(index, node) {
    return node.id;
  }

}
