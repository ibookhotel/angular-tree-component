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
  public configVirtualRoot = true;  // Initialise only once

  /*
   * Pagination Models collection per parent tree node
   * Created for each parent node
   */
  private paginationTreeModels: PaginationModel[] = [];
  private activePaginationTreeModelId = 0;
  private recordsPerPage = 150;
  private firstRootId = 2;

  /**
   * Tree View Component Options
   */
  public options: ITreeOptions = {

    getChildren: (node: TreeNode) => {
      // this.getData(node.data.id, this.pagination.currentPage);
      console.log('Get children');
    },
    actionMapping: {
      mouse: {
        click: (tree, node, $event) => {
          TREE_ACTIONS.SELECT(tree, node, $event);
          // this.activeNodeParentId = node.data.id;
          // this.activeNode = node.data;
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
  // @ViewChild('ul') ulModelRef;

  private timerTick = 10;
  public debug = true;

  constructor(private dataService: TreeRestService) {
  }

  /*
    * Get data from Rest API
    * Initialize Events
    */
  ngOnInit() {

    this.treeModelRef.initialized.subscribe((r) => {
      console.log('Tree initialized');
      this._initializePaginationModel(this.firstRootId);
    });

    this.treeModelRef.toggleExpanded.subscribe((event) => {
      console.log('Node expanded', event.node.data.id);
      this._initializePaginationModel(event.node.data.id);
    });
  }

  /*
   * Get margin top of virtual scroll
   * Must be on After View Init
   */
  ngAfterViewInit() {
  }

  private _ngAfterViewInit() {
    const timer = Observable.timer(0, this.timerTick);
    setTimeout(() => {
      timer.subscribe(t => {
        this._treeConfiguration();
      });
    }, 1);
  }

  private _treeConfiguration() {
    const length = this.paginationTreeModels.length;

    for (let i = 0; i < length; i++) {
      const virtualModel = this._configureVirtualModel();
      this._configVirtualMeasure(this.paginationTreeModels[i], virtualModel);
    }
  }

  /*
   * Pagination model per parent or root node node
   */
  private _initializePaginationModel(parentNodeId) {
    if (!this._paginationModelExist(parentNodeId)) {
      this.paginationTreeModels.push(this._createPaginationModel(parentNodeId));
      this._fetchData(this.paginationTreeModels[this.paginationTreeModels.length - 1]);
    }
  }

  /**
   * Create pagination model for one parent node
   */
  private _createPaginationModel(parentNodeId) {
    const paginationModel: PaginationModel = {
      nodeId: parentNodeId,
      nodeName: 'Test name',
      currentPage: 1,
      totalRecords: -1,
      totalPages: -1,
      recordsPerPage: this.recordsPerPage,
      visitedPages: [],
      childNodes: [],
      lastChildNodeId: -1,
      isLoading: true
    };
    return paginationModel;
  }

  /**
   * Check if pagination model exists
   * @return Boolean
   */
  private _paginationModelExist(parentNodeId) {

    const length = this.paginationTreeModels.length;

    for (let i = 0; i < length; i++) {
      if (this.paginationTreeModels[i].nodeId === parentNodeId) {
        return true;
      }
    }
    return false;
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
      model.childNodes = model.childNodes.concat(result.items);

      /*
       * Find id of 1/4 of total results
       */
      model.oneThird = Math.floor(result.items.length / 5);
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
        this._ngAfterViewInit();  // Add timer to measure pagination and virtual model

        setTimeout(() => {
          this.treeModelRef.treeModel.focusDrillDown();
          this.treeModelRef.treeModel.focusDrillDown();
        }, 300);

      } else {
        this.addChildNodes(this.nodeModel, model.nodeId, result.items);
      }

    });

  }

  private _configureVirtualModel() {
    /*
     * TreeModel root node used to get real height of one tree node
     * We are calculating how many nodes can fit into panel
     */
    const rootNode = this.treeModelRef.treeModel.getFirstRoot();

    /*
     * Check if tree root is initialised
     */
    // if (!rootNode) {
    //   return false;
    // }

    /*
     * 1. Node height
     * 2. Panel Height: Bootstrap panel height can be set in css or dynamically. It will always be updated here
     */
    const virtualModel: VirtualModel = {
      nodeHeight: rootNode.height - 10, // 10 px difference exist, check what it is
      panelHeight: this.treeModelRef.treeModel.virtualScroll.viewportHeight,
    };

    /*
     * 3. Get num of visible nodes that can fit in viewport and round to upper
     */
    virtualModel.noOfVisibleNodes = Math.ceil(virtualModel.panelHeight / virtualModel.nodeHeight);

    return virtualModel;
  }

  private _configVirtualMeasure(model: PaginationModel, virtualModel: VirtualModel) {

    /*
     * Get scroll top of virtual scroll
     */
    // virtualModel.yBlocks = this.treeModelRef.viewportComponent.virtualScroll.yBlocks;
    // virtualModel.y = this.treeModelRef.viewportComponent.virtualScroll.y;
    virtualModel.scrollTop = this.treeModelRef.viewportComponent.virtualScroll.viewport.scrollTop;

    /*
     * Find visible node indexes from - to
     */
    virtualModel.indexFrom = Math.ceil(virtualModel.scrollTop / virtualModel.nodeHeight);
    virtualModel.currentPage = Math.ceil(virtualModel.indexFrom / virtualModel.noOfVisibleNodes) + 1; // page starts from 1

    /*
     * Load more nodes
     */
    // const model = this.paginationModels[0];

    /*
     * Find index for last visible node in viewport in nodes[]
     * This enables us to see weather id is or was visible inside viewport
     */
    const idsOfVisible = this._idsOfVisible(virtualModel.indexFrom, virtualModel.noOfVisibleNodes, model);
    // console.log('idsOfVisible: ', idsOfVisible);
    const lastViewportVisibleId = idsOfVisible[idsOfVisible.length - 1];
    const indexOfNode = this._findIndex(lastViewportVisibleId, model);
    // console.log('indexOfNode: ', indexOfNode);

    // setting index from 0 enables us to check if node passed viewport or visible inside it
    const indexFrom = 0;

    if (this._isOrWasVisible(indexFrom, indexOfNode, model)) {
      this._loadMoreNodes(model);
    }

    // if (this.debug) {
    //   this._debug(virtualModel);
    // }
  }

  /*
   * 1. Check if node is visible inside virtual scroll viewport
   * TODO: Should be refactored to get real height of each node
   */
  private _idsOfVisible(from, noOfVisibleNodes, model: PaginationModel) {

    let ids = [];

    // console.log('--------------');
    const nodes = model.childNodes;
    const limit = from + noOfVisibleNodes;

    for (let i = from; i < limit; i++) {

      /*
       * Due to calculation of margin top in virtual scroll
       * It might be undefined
       */

      if (nodes[i]) {
        // if (this.debug) {
        //   console.log(nodes[i].name);
        // }
        ids.push(nodes[i].id);
      }
    }

    return ids;
  }

  /**
   * 1. Find index of node inside childNodes array
   */
  private _findIndex(nodeId, model) {

    const nodes = model.childNodes;

    for (let i = 0; i < nodes.length; i++) {

      /*
       * Due to calculation of margin top in virtual scroll
       * It might be undefined
       */
      if (nodes[i]) {
        // if (this.debug) {
        //   console.log(nodes[i].name);
        // }
        if (nodes[i].id === nodeId) {
          return i;
        }
      }
    }

    return -1;
  }

  /*
   * 3. Check if node is or was visible inside virtual scroll viewport
   */
  private _isOrWasVisible(from, noOfVisibleNodes, model: PaginationModel) {

    // console.log('--------------');
    const nodes = model.childNodes;
    const limit = from + noOfVisibleNodes;

    for (let i = from; i < limit; i++) {

      /*
       * Due to calculation of margin top in virtual scroll
       * It might be undefined
       */
      if (nodes[i]) {
        // if (this.debug) {
        //   console.log(nodes[i].name);
        // }
        if (nodes[i].id === model.lastChildNodeId) {
          return true;
        }
      }
    }

    return false;
  }

  /*
   * Load more nodes
   */
  private _loadMoreNodes(model: PaginationModel) {

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
    return model.childNodes.length < model.totalRecords;
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

    if (parentId === this.firstRootId) {
      this.treeModelRef.treeModel.nodes = this.treeModelRef.treeModel.nodes.concat(childNodes);
    } else {
      this.nodeModel = this.setChildNodesIfAny(nodeModel, parentId, childNodes);
    }

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
