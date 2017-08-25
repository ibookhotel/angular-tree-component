import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {TreeRestService} from './services/treerest.service';
import {TreeViewData} from './models/treeview-data.model';
import {PaginationModel} from './models/pagination.model';
import {ITreeOptions, TREE_ACTIONS, TreeComponent, TreeNode} from 'angular-tree-component';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';


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
   * Bootstrap pagination model
   */
  public pagination: PaginationModel = {
    totalItems: 0,
    currentPage: 1,
    smallNumPages: 0,
    maxSize: 7,
    loadedPages: []
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
   * Reference to bootstrap panel which holds tree component
   * This is used to calculate visible node inside viewport
   */
  private panelHeight: number;
  private nodeHeight: number;
  private rootNode: TreeNode;
  private noOfVisibleNodes: number;
  private marginTopVirtual: number;
  private timerTick = 10;

  constructor(private dataService: TreeRestService) {
  }

  /*
    * Get data from Rest API
    */
  ngOnInit() {
    this.getData(this.activeNodeParentId, this.pagination.currentPage);
  }

  /*
   * Get margin top of virtual scroll
   * Must be on After View Init
   */
  ngAfterViewInit() {
    const timer = Observable.timer(0, this.timerTick);
    setTimeout(() => {
      timer.subscribe(t => {
        this._configTreeMeasure();
      });
    }, 1);
  }

  private _configTreeMeasure() {

    /*
     * Check if tree root is initialised
     */
    if (!this.treeModelRef.treeModel.getFirstRoot()) {
      return false;
    }

    /*
     * Bootstrap panel height can be set in css or dynamically
     * It will always be updated here
     */
    this.panelHeight = this.treeModelRef.treeModel.virtualScroll.viewportHeight;

    /*
     * TreeModel root node used to get real height of one tree node
     * So we can calculate how many nodes can fit into panel
     */
    this.rootNode = this.treeModelRef.treeModel.getFirstRoot();

    /*
     * Node height
     */
    this.nodeHeight = this.rootNode.height - 10; // 10 px difference exist, check what it is

    /*
     *  Get num of visible nodes in viewport
     */
    this.noOfVisibleNodes = Math.ceil(this.panelHeight / this.nodeHeight);
    // this.noOfVisibleNodes = this.panelHeight / this.nodeHeight;

    /*
     * Get margin top of virtual scroll
     */
    const b = this.treeModelRef.viewportComponent.virtualScroll.yBlocks;
    const y = this.treeModelRef.viewportComponent.virtualScroll.y;
    const s = this.treeModelRef.viewportComponent.virtualScroll.viewport.scrollTop;
    this.marginTopVirtual = s;

    /*
     * Find visible node indexes from - to
     */
    const indexFrom = Math.ceil(this.marginTopVirtual / this.nodeHeight);
    const curPage = Math.ceil(indexFrom / this.noOfVisibleNodes) + 1; // page starts from 1
    // console.log('curPage: ', curPage);
    this._loadVirtualNodes(curPage, this.noOfVisibleNodes);

    this._printVisible(indexFrom, this.noOfVisibleNodes);

    // this._debug(curPage, indexFrom);
  }

  /*
    * Debug
    */
  private _debug(curPage, indexFrom) {

    console.log('--------------');

    console.log('rootNode height: ', this.nodeHeight);
    console.log('Panel height: ', this.panelHeight);
    // console.log('No.of Visible Nodes: ', this.noOfVisibleNodes);
    // console.log('Margin Top Virtual: ', this.marginTopVirtual);
    console.log('indexFrom: ', indexFrom);
    console.log('curPage: ', curPage);
    // console.log('yBlocks: ', b);
    // console.log('y: ', y);
    // console.log('s: ', s);

    // console.log('------ Pagination -----');
    // console.log(this.pagination);

  }

  private _loadVirtualNodes(curPage, noOfVisibleNodes) {
    const nodes = this.treeModelRef.treeModel.nodes;

    if (nodes.length < this.pagination.totalItems) {

      const element = this.pagination.currentPage;
      const elemExist = this.pagination.loadedPages.indexOf(element) === -1;

      // console.log('elemExist: ', !elemExist);
      // console.log('loadedPages: ', this.pagination.loadedPages);
      // console.log('element: ', element);

      /**
       * Caching of loaded pages
       */
      if (elemExist) {
        this.pagination.currentPage++;
        this.pagination.loadedPages.push(this.pagination.currentPage);
        this.getData(this.activeNodeParentId, this.pagination.currentPage);
      }
    }
  }

  private _printVisible(from, noOfVisibleNodes) {

    console.log('--------------');

    const nodes = this.treeModelRef.treeModel.nodes;

    const limit = from + noOfVisibleNodes;

    for (let i = from; i < limit; i++) {

      /*
       * Due to calculation of margin top in virtual scroll
       * It might be undefined
       */
      if (nodes[i]) {
        console.log(nodes[i].name);
      }
    }
  }


  /*
   * Only this method communicates with dataService
   */
  getData(parentId, curPage) {

    /*
     * Set activeNodeParentId when caled from getChildren method
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
      if (this.configVirtualRoot) {
        this.configVirtualRoot = false;
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
