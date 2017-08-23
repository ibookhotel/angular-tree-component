import {
    Component, Input, ViewEncapsulation, OnInit, OnDestroy
} from '@angular/core';
import {reaction, autorun} from 'mobx';
import {observable, computed, action} from 'mobx-angular';
import {TreeVirtualScroll} from '../models/tree-virtual-scroll.model';
import {TreeNode} from '../models/tree-node.model';
import {TreeModel} from '../models/tree.model';

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
    get nodes() {
        return this._nodes;
    }

    set nodes(nodes) {
        this.setNodes(nodes);
    }

    get fakeNodes() {
        return this._nodes;
    }

    set fakeNodes(nodes) {
        this.setFakeNodes(nodes);
    }

    @Input() treeModel: TreeModel;

    @observable _nodes;
    @observable _fakeNodes;
    private virtualScroll: TreeVirtualScroll; // Cannot inject this, because we might be inside treeNodeTemplateFull
    @Input() templates;

    @observable viewportNodes: TreeNode[];

    /*
     * TODO: Check logic
     */
    @computed
    get marginTop(): string {
        const firstNode = this.viewportNodes && this.viewportNodes.length && this.viewportNodes[0];
        const relativePosition = firstNode ? firstNode.position - firstNode.parent.position - firstNode.parent.getSelfHeight() : 0;

        return `${relativePosition}px`;
    }

    _dispose = [];

    @action
    setNodes(nodes) {
        // console.log('setNodes', nodes);
        this._nodes = nodes;
    }

    @action
    setFakeNodes(nodes) {
        // console.log('setNodes', nodes);
        this._fakeNodes = nodes;
    }

    offset = 0;
    limit = 50;


    /*
     * TODO: Check logic, here is done set of property "viewportNodes"
     */
    ngOnInit() {
        this.virtualScroll = this.treeModel.virtualScroll;
        this._dispose = [
            // return node indexes so we can compare structurally,
            /*
             * Reaction 1. method
             *  - create array of indexes based on scroll position in viewport (it using filter method to convert array to nodeModel)
             *  - return that index
             */
            reaction(() => {

                    const vNodes = this.nodes;
                    const vFakeNodes = this.fakeNodes;

                    const vScrollNodes = this.virtualScroll.getViewportNodes(this.nodes).map(n => n.index);
                    const vScrollNodesFake = this._makeFakeNodeArray((this.offset * 10), this.limit);

                    // const visibleNodes = vScrollNodesFake.filter((node) => !node.isHidden);

                    console.log('reaction method 1', vScrollNodes);
                    // console.log('TreeNodeCollectionComponent ngOnInit, reaction method 1', this._makeDataSet(20));

                    // return ;
                    return vScrollNodesFake;
                },
                /*
                 * Reaction 2. method
                 * - Method create nodeModel array
                 * - set viewport nodes
                 */
                (nodeIndexes) => {

                    // console.log('ngOnInit, reaction method 2', nodeIndexes);

                    const fakeNodes = this._makeFakeNodeDataSet((this.offset++ * 10), this.limit);
                    this.fakeNodes = fakeNodes;

                    // const vViewportNodes = nodeIndexes.map((i) => this.nodes[i]);
                    const vFakeViewportNodes = nodeIndexes.map((i) => new TreeNode(fakeNodes[i], this.treeModel.getFirstRoot(), this.treeModel, i));
                    // console.log('vViewportNodes: ', vViewportNodes);
                    console.log('vViewportNodes: ', vFakeViewportNodes);
                    console.log('---------------');
                    // console.log('vFakeViewportNodes: ', vFakeViewportNodes);
                    this.viewportNodes = vFakeViewportNodes;

                }, {compareStructural: true, fireImmediately: true}
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

    /*
     * For react method 1.
     */
    private _makeFakeNodeArray(start = 0, count) {
        const dataSet = [];

        for (let i = 0; i < count; i++, start++) {
            dataSet[i] = start;
        }
        return dataSet;
    }

    /*
     * For react method 2.
     */
    private _makeFakeNodeDataSet(start = 0, count) {
        const dataSet = [];
        const fCount = count + start;

        for (let i = start; i < fCount; i++, start++) {
            dataSet[i] = ({
                id: start,
                name: 'fake ' + start
            });
        }
        return dataSet;
    }
}
