import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {TreeRestService} from './services/treerest.service';
import {TreeViewData} from './models/treeview-data.model';
import {PaginationModel} from './models/pagination.model';
import {ITreeOptions, TREE_ACTIONS, TreeComponent, TreeNode} from 'angular-tree-component';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';
import {VirtualModel} from './models/virtual.model';

@Component({
  selector: 'app-basictree',
  templateUrl: './virtual.component.html',
  styles: [],
  providers: [TreeRestService]
})
export class VirtualComponent implements OnInit, AfterViewInit {

  /*
   * Page titles
   */
  public title = 'ARIM Tree View Component';
  public subTitle = 'UX driven developemtn of Tree View Component for ARIM Framework';

  /*
   * Tree View Component Model
   */
  public nodeModel: TreeViewData[] = [];
  public activeNodeParentId = 2;  // Root parent id is set to 0 on Rest API
  public configVirtualRoot = true;  // Initialise only once
  public activeNode = {id: 1, name: '0001'};  // Active node

  /*
   * Pagination Models collection per parent tree node
   * Created for each parent node
   */
  private paginationModels: PaginationModel[] = [];
  private recordsPerPage = 150;

  /**
   * Tree View Component Options
   */
  public options: ITreeOptions = {

    getChildren: (node: TreeNode) => {
      // this.getData(node.data.id, this.pagination.currentPage);
    },
    actionMapping: {
      mouse: {
        click: (tree, node, $event) => {
          TREE_ACTIONS.SELECT(tree, node, $event);
          this.activeNodeParentId = node.data.id;
          this.activeNode = node.data;
          // this.pagination.currentPage = 1;
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
    useVirtualScroll: false,
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
  @ViewChild('ul') ulModelRef;

  /*
   * Reference to bootstrap panel which holds tree component
   * This is used to calculate visible node inside viewport
   */
  private timerTick = 10;

  public dataSet;
  public debug = false;

  constructor(private dataService: TreeRestService) {
    // this.dataSet = this._makeDataSet(100);
  }

  /*
    * Get data from Rest API
    */
  ngOnInit() {
    this._createPaginationModel();
  }

  /*
   * Get margin top of virtual scroll
   * Must be on After View Init
   */
  ngAfterViewInit() {
    const timer = Observable.timer(0, this.timerTick);
    setTimeout(() => {
      timer.subscribe(t => {
        this._configVirtualMeasure();
        // this._configVirtualMeasureFake();
      });
    }, 1);
  }

  /*
   * Pagination model per node
   */
  private _createPaginationModel() {

    const pagination: PaginationModel = {
      nodeId: 2,
      currentPage: 1,
      totalRecords: -1,
      totalPages: -1,
      recordsPerPage: this.recordsPerPage,
      visitedPages: [],
      lastChildNodeId: -1,
      isLoading: true
    };

    this.paginationModels.push(pagination);
    this._fetchData(this.paginationModels[0]);
  }

  /*
   * Fetch data
   */
  private _fetchData(model: PaginationModel) {

    this.dataService.paginate(model.nodeId, model.currentPage, model.recordsPerPage).then((result) => {

      model.isLoading = false;
      model.totalRecords = result.total;
      model.totalPages = Math.ceil(model.totalRecords / model.recordsPerPage);  // round to upper
      model.visitedPages.push(model.currentPage);

      /*
       * Find id 1/3 of total results
       */
      model.oneThird = Math.floor(result.items.length / 3);

      model.lastChildNodeId = result.items[result.items.length - 1].id;
      model.lastChildNodeId = result.items[0].id;
      model.lastChildNodeId = result.items[model.oneThird].id;

      console.log('Data service result: ', result);
      console.log('Pagination model: ', model);

      /*
       * 1. Set model first time for root tree or
       * 2. Add child nodes from server into Tree Model
       */
      if (this.configVirtualRoot) {
        this.configVirtualRoot = false;
        this.nodeModel = result.items;
      } else {
        this.addChildNodes(this.nodeModel, model.nodeId, result.items);
      }

    });

  }

  /*
   * Load more nodes
   */
  private _loadMoreNodes() {

    const model: PaginationModel = this.paginationModels[0];

    // console.log('_hasMoreNodes: ', this._hasMoreNodes(model));
    // console.log('isLoading: ', model.isLoading);

    if (this._hasMoreNodes(model) && !model.isLoading) {

      const notVisited = model.visitedPages.indexOf(model.currentPage + 1) === -1;
      if (notVisited) {
        model.isLoading = true;
        model.currentPage++;
        this._fetchData(model);
      }
    }
  }

  /*
   * Check if there is more records to laod
   * @return Boolean
   */
  private _hasMoreNodes(model: PaginationModel) {
    const noOfNodes = this.treeModelRef.treeModel.nodes.length;
    return noOfNodes < model.totalRecords;
  }

  private _configVirtualMeasure() {

    /*
     * TreeModel root node used to get real height of one tree node
     * We are calculating how many nodes can fit into panel
     */
    const rootNode = this.treeModelRef.treeModel.getFirstRoot();

    /*
     * Check if tree root is initialised
     */
    if (!rootNode) {
      return false;
    }

    /*
     * Node height
     */
    const virtualModel: VirtualModel = {
      nodeHeight: rootNode.height - 10 // 10 px difference exist, check what it is
    };

    /*
     * Bootstrap panel height can be set in css or dynamically
     * It will always be updated here
     */
    virtualModel.panelHeight = this.treeModelRef.treeModel.virtualScroll.viewportHeight;
    // console.log('panelHeight: ', virtualModel.panelHeight);

    /*
     *  Get num of visible nodes in viewport round to upper
     */
    virtualModel.noOfVisibleNodes = Math.ceil(virtualModel.panelHeight / virtualModel.nodeHeight);
    // virtualModel.noOfVisibleNodes = virtualModel.panelHeight / virtualModel.nodeHeight;

    /*
     * Get scroll top of virtual scroll
     */
    virtualModel.yBlocks = this.treeModelRef.viewportComponent.virtualScroll.yBlocks;
    virtualModel.y = this.treeModelRef.viewportComponent.virtualScroll.y;
    virtualModel.scrollTop = this.treeModelRef.viewportComponent.virtualScroll.viewport.scrollTop;

    /*
     * Find visible node indexes from - to
     */
    virtualModel.indexFrom = Math.ceil(virtualModel.scrollTop / virtualModel.nodeHeight);
    virtualModel.currentPage = Math.ceil(virtualModel.indexFrom / virtualModel.noOfVisibleNodes) + 1; // page starts from 1

    /*
     * Load more nodes
     */
    const model = this.paginationModels[0];

    /*
     * Find index for last visible node in viewport in nodes[]
     * This enables us to see weather id is or was visible inside viewport
     */
    const idsOfVisible = this._idsOfVisible(virtualModel.indexFrom, virtualModel.noOfVisibleNodes);
    const lastViewportVisibleId = idsOfVisible[idsOfVisible.length - 1];
    const indexOfNode = this._findIndex(lastViewportVisibleId);
    // console.log('indexOfNode: ', indexOfNode);

    // setting index from 0 enables us to check if node passed viewport or visible inside it
    const indexFrom = 0;

    if (this._isVisible(indexFrom, indexOfNode, model.lastChildNodeId)) {
      this._loadMoreNodes();
    }

    if (this.debug) {
      this._debug(virtualModel);
    }
  }

  private _configVirtualMeasureFake() {

    /*
     * Node height
     */
    const virtualModel: VirtualModel = {
      nodeHeight: 26
    };

    /*
     * Bootstrap panel height can be set in css or dynamically
     * It will always be updated here
     */
    virtualModel.panelHeight = 26;

    /*
     *  Get num of visible nodes in viewport round to upper
     */
    virtualModel.noOfVisibleNodes = Math.ceil(virtualModel.panelHeight / virtualModel.nodeHeight);
    // virtualModel.noOfVisibleNodes = virtualModel.panelHeight / virtualModel.nodeHeight;

    /*
     * Get scroll top of virtual scroll
     */
    virtualModel.scrollTop = this.ulModelRef.nativeElement.getBoundingClientRect().top;
    virtualModel.scrollTop -= 173;
    if (virtualModel.scrollTop !== 0) {
      virtualModel.scrollTop *= -1;
    }
    console.log(virtualModel.scrollTop);

    /*
     * Find visible node indexes from - to
     */
    virtualModel.indexFrom = Math.ceil(virtualModel.scrollTop / virtualModel.nodeHeight);
    virtualModel.currentPage = Math.ceil(virtualModel.indexFrom / virtualModel.noOfVisibleNodes) + 1; // page starts from 1

    /*
     * Load more nodes
     */
    const model = this.paginationModels[0];
    if (this._isVisibleFake(virtualModel.indexFrom, virtualModel.noOfVisibleNodes, -1)) {
      // this._loadMoreNodes();
    }

    this._debug(virtualModel);
  }

  /*
    * Debug
    */
  private _debug(virtualModel) {
    console.log('--------------');
    for (const i in virtualModel) {
      if (virtualModel.hasOwnProperty(i)) {
        if (i !== 'nodeHeight' && i !== 'panelHeight') {
          console.log(i, virtualModel[i]);
        }
      }
    }
  }

  /*
   * Check if node is visible inside virtual scroll viewport
   */
  private _isVisible(from, noOfVisibleNodes, nodeId) {

    // console.log('--------------');
    const nodes = this.treeModelRef.treeModel.nodes;
    const limit = from + noOfVisibleNodes;

    for (let i = from; i < limit; i++) {

      /*
       * Due to calculation of margin top in virtual scroll
       * It might be undefined
       */
      if (nodes[i]) {
        if (this.debug) {
          console.log(nodes[i].name);
        }
        if (nodes[i].id === nodeId) {
          return true;
        }
      }
    }

    return false;
  }

  /*
   * Check if node is visible inside virtual scroll viewport
   */
  private _idsOfVisible(from, noOfVisibleNodes) {

    let ids = [];

    // console.log('--------------');
    const nodes = this.treeModelRef.treeModel.nodes;
    const limit = from + noOfVisibleNodes;

    for (let i = from; i < limit; i++) {

      /*
       * Due to calculation of margin top in virtual scroll
       * It might be undefined
       */
      if (nodes[i]) {
        ids.push(nodes[i].id);
      }
    }

    return ids;
  }

  private _findIndex(nodeId) {

    const nodes = this.treeModelRef.treeModel.nodes;

    for (let i = 0; i < nodes.length; i++) {

      /*
       * Due to calculation of margin top in virtual scroll
       * It might be undefined
       */
      if (nodes[i]) {
        if (this.debug) {
          console.log(nodes[i].name);
        }
        if (nodes[i].id === nodeId) {
          return i;
        }
      }
    }

    return -1;
  }

  /*
   * Check if node is visible inside virtual scroll viewport
   */
  private _isVisibleFake(from, noOfVisibleNodes, nodeId) {

    // console.log('--------------');
    const nodes = this.dataSet;
    const limit = from + noOfVisibleNodes;

    for (let i = from; i < limit; i++) {

      /*
       * Due to calculation of margin top in virtual scroll
       * It might be undefined
       */
      if (nodes[i]) {
        console.log(nodes[i].name);
        // if (nodes[i].id === nodeId) {
        //   return true;
        // }
      }
    }

    return false;
  }


  /*
   * Console log nodes
   */
  private _listData(nodes) {
    for (let i = 0; i < nodes.length; i++) {
      console.log(nodes[i]);
    }
  }

  /*
   * Pagination changed
   */
  public pageChanged(event: any): void {
    // const model = this.paginationModels[0];
    // model.currentPage = event.page;
    // const notVisited = model.visitedPages.indexOf(model.currentPage) === -1;
    // if (notVisited) {
    // this._fetchData(model);
    // }
  }

  addChildNodes(nodeModel, parentId, childNodes) {
    // const updatedModel = this.setChildNodesIfAny(nodeModel, parentId, childNodes);

    this.treeModelRef.treeModel.nodes = this.treeModelRef.treeModel.nodes.concat(childNodes);

    // this.nodeModel = updatedModel;
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
          node.children = node.children.concat(newNodes);
          // node.children = newNodes;
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

// public setPage(pageNo: number): void {
//   this.pagination.currentPage = pageNo;
// }

  /**
   * Context Menu Alert
   */
  showMessage(m) {
    // alert(m);
  }
  ;

// onEvent(e) {
//   TREE_ACTIONS.SELECT(e.tree, e.node, e);
//   this.activeNodeParentId = e.node.data.id;
//   this.activeNode = e.node.data;
//   this.pagination.currentPage = 1;
// }

// prev() {
//   if (this.pagination.currentPage > 1) {
//     this.pagination.currentPage--;
//     this.getData(this.activeNodeParentId, this.pagination.currentPage);
//   }
// }

// next() {
//   if (this.pagination.currentPage < Math.ceil(this.pagination.totalRecords / this.pagination.recordsPerPage)) { // 10 is itemsPerPage
//     this.pagination.currentPage++;
//     this.getData(this.activeNodeParentId, this.pagination.currentPage);
//   }
// }

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
