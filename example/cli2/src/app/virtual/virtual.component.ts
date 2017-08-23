import {Component, ViewChild} from '@angular/core';
import {TreeRestService} from './services/treerest.service';
import {TreeViewData} from './models/treeview-data.model';
import {PaginationModel} from './models/pagination.model';
import {ITreeOptions, TREE_ACTIONS, TreeComponent, TreeNode} from 'angular-tree-component';
import {Observable} from 'rxjs/Observable';


@Component({
  selector: 'app-basictree',
  templateUrl: './virtual.component.html',
  styles: [],
  providers: [TreeRestService]
})
export class VirtualComponent {

  /*
   * Page titles
   */
  public title = 'ARIM Tree View Component';
  public subTitle = 'UX driven developemtn of Tree View Component for ARIM Framework';

  /*
   * Tree View Component Model
   */
  public nodeModel: TreeViewData[] = [];
  public activeNodeParentId = 0;  // Root parent id is set to 0 on Rest API
  public activeNode = {id: 1, name: '0001'};  // Active node

  /*
   * Bootstrap pagination model
   */
  public pagination: PaginationModel = {
    totalItems: 0,
    currentPage: 1,
    smallNumPages: 0,
    maxSize: 7
  };

  /**
   * Tree View Component Options
   */
  public options: ITreeOptions = {

    getChildren: (node: TreeNode) => {
      this.getData(node.data.id, this.pagination.currentPage);
    },
    actionMapping: {
      mouse: {
        click: (tree, node, $event) => {
          TREE_ACTIONS.SELECT(tree, node, $event);
          this.activeNodeParentId = node.data.id;
          this.activeNode = node.data;
          this.pagination.currentPage = 1;
        },
        dblClick: (tree, node, $event) => {
          if (!node.hasChildren) {
            // alert('Open ' + node.data.name);
          }
        },
        contextMenu: (tree, node, $event) => {
          TREE_ACTIONS.SELECT(tree, node, $event);
          $event.preventDefault();
        }
      }
    },
    allowDrag: (node) => {
      return true;
    },
    allowDrop: (node) => {
      return true;
    },
    useVirtualScroll: true,
    nodeHeight: 30,
    dropSlotHeight: 3,
    animateExpand: true,
    animateSpeed: 90,
    animateAcceleration: 2,
    displayField: 'name'
  };

  /*
  * Reference to Tree Model
  */
  @ViewChild('tree') treeModelRef: TreeComponent;


  /*
   * Reference to Tree Model
   */
  // @ViewChild(VirtualComponent)
  // private tree: VirtualComponent;

  constructor(private dataService: TreeRestService) {
  }

  /*
    * Get data from Rest API
    */
  ngOnInit() {
    this.getData(this.activeNodeParentId, this.pagination.currentPage);

    const timer = Observable.timer(2000, 3000);
    timer.subscribe(t => {
      console.log(this.treeModelRef);
    });
  }

  /*
   * Only this method communicates with dataService
   */
  getData(parentId, curPage) {

    /*
     * Set activeNodeParentId
     */
    this.activeNodeParentId = parentId;

    /*
     * Get data from API
     */
    this.dataService.paginate(parentId, curPage).then((results) => {
      // this._listData(results.items);

      /*
       * 1. Set model first time for root tree or
       * 2. Add child nodes from server into Tree Model
       */
      if (parentId === 0) {
        this.nodeModel = results.items;
      } else {
        this.addChildNodes(this.nodeModel, parentId, results.items);
      }

      this.pagination.totalItems = results.total;

    });
  }

  /*
   * Console log nodes
   */
  private _listData(nodes) {
    for (let i = 0; i < nodes.length; i++) {
      console.log(nodes[i]);
    }
  }

  public pageChanged(event: any): void {
    this.getData(this.activeNodeParentId, event.page);
    console.log('pageChanged event: -----------------–', event.page);
  }

  addChildNodes(nodeModel, parentId, childNodes) {
    const updatedModel = this.setChildNodesIfAny(nodeModel, parentId, childNodes);
    this.nodeModel = updatedModel;
    this.treeModelRef.treeModel.update();
  }

  /*
   * Set child nodes from Rest API into TreeModel
   */
  setChildNodesIfAny(treeNodeModel, id, newNodes) {

    treeNodeModel.forEach((node) => {

      /**
       * Check if this is searched element
       */
      if (node.id === id) {

        /**
         * Set or append nodes to children attribute
         */
        if (node.children == null) {
          node.children = newNodes;
        } else {
          // node.children = node.children.concat(newNodes);
          node.children = newNodes;
        }

        return treeNodeModel;
      }

      /**
       * Traverse trough children element recursively
       */
      if (node.children != null) {
        node.children = this.setChildNodesIfAny(node.children, id, newNodes);
      }

    });

    return treeNodeModel;

  }

  public setPage(pageNo: number): void {
    this.pagination.currentPage = pageNo;
  }

  /**
   * Context Menu Alert
   */
  showMessage(m) {
    // alert(m);
  };

  onEvent(e) {
    TREE_ACTIONS.SELECT(e.tree, e.node, e);
    this.activeNodeParentId = e.node.data.id;
    this.activeNode = e.node.data;
    this.pagination.currentPage = 1;
  }

  prev() {
    if (this.pagination.currentPage > 1) {
      this.pagination.currentPage--;
      this.getData(this.activeNodeParentId, this.pagination.currentPage);
    }
  }

  next() {
    if (this.pagination.currentPage < Math.ceil(this.pagination.totalItems / 10)) { // 10 is itemsPerPage
      this.pagination.currentPage++;
      this.getData(this.activeNodeParentId, this.pagination.currentPage);
    }
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
