import {Component, OnInit, ViewChild} from '@angular/core';
import {TreeRestService} from './services/treerest.service';
import {TreeViewData} from './models/treeview-data.model';
import {PaginationModel} from './models/pagination.model';
import {ITreeOptions, TREE_ACTIONS, TreeComponent, TreeNode} from 'angular-tree-component';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';
import {VirtualModel} from './models/virtual.model';
import {reaction, autorun} from 'mobx';
import {ChildModel} from './models/child.model';

// import {inView} from 'in-view/src';

@Component({
  selector: 'app-basictree',
  templateUrl: './dom.component.html',
  styles: [],
  providers: [TreeRestService]
})
export class DomComponent implements OnInit {

  /*
   * Models
   */
  private models: PaginationModel[] = [];
  public nodes: TreeViewData[] = [];


  /*
   * Options
   */
  public options: ITreeOptions = {
    animateExpand: true,
  };

  /*
   * Initial settings
   */
  private timerTick = 2000;
  public debug = true;
  private activePaginationTreeModelId = 0;
  private recordsPerPage = 10;
  private firstRootId = 0;
  public configRoot = true;  // Initialise only once

  /*
   * Dom references
   */
  @ViewChild('tree') treeEl: TreeComponent;

  constructor(private dataService: TreeRestService) {
    const timer = Observable.timer(0, this.timerTick);
    setTimeout(() => {
      timer.subscribe(t => {

        for (let i = 0; i < this.models.length; i++) {
          this._triggers(this.models[i]);
        }


      });
    }, 1);

    // for (let i = 0; i < this.models.length; i++) {
    //   this._triggers(this.models[i]);
    // }

  }

  private _triggers(model: PaginationModel) {

    if (model.triggerElement == null) {
      return false;
    }

    console.group('Model node ' + model.nodeId);
    // console.log(model.triggerElement.el);
    this._isDom(model.triggerElement.el, model);
    console.groupEnd();

  }

  private _isDom(element, model: PaginationModel) {
    const options = {offset: {top: 0, right: 0, bottom: 0, left: 0}, threshold: 0};
    const inViewport = this._inViewport(element, options);  // Check why is el needed
    console.log(inViewport);
    // if (inViewport) {
    //   this._loadNodes(model);
    // }
  }

  private _isScrolledIntoView(el) {
    const elemTop = el.getBoundingClientRect().top;
    const elemBottom = el.getBoundingClientRect().bottom;

    const isVisible = (elemTop >= 0) && (elemBottom <= window.innerHeight);
    return isVisible;
  }

  private _inViewport(element, options) {

    const {top, right, bottom, left, width, height} = element.getBoundingClientRect();
    // const top = element.getBoundingClientRect().top;

    const intersection = {
      t: bottom,
      r: window.innerWidth - left,
      b: window.innerHeight - top,
      l: right
    };

    // console.log(top, right, bottom, left, width, height);
    console.log(element, top, right, bottom, left, width, height);
    console.log(intersection);
    console.log('offsetTop: ', element.offsetTop);

    const threshold = {
      x: options.threshold * width,
      y: options.threshold * height
    };
    //
    return intersection.t > (options.offset.top + threshold.y)
      && intersection.r > (options.offset.right + threshold.x)
      && intersection.b > (options.offset.bottom + threshold.y)
      && intersection.l > (options.offset.left + threshold.x);

  }

  ngOnInit() {
    // Tree initialized
    this.treeEl.initialized.subscribe((r) => {
      this._makeModel(this.firstRootId);
    });

    // Node expanded
    this.treeEl.toggleExpanded.subscribe((event) => {
      this._makeModel(event.node.data.id);
    });
  }

  /*
   * Make Model
   */
  private _makeModel(nodeId) {
    if (!this._modelExist(nodeId)) {
      this.models.push(this._model(nodeId));
      this._data(this.models[this.models.length - 1]);
    }
  }

  /**
   * Model
   * @return PaginationModel
   */
  private _model(nodeId) {
    return {
      nodeId: nodeId,
      currentPage: 1,
      totalRecords: -1,
      totalPages: -1,
      recordsPerPage: this.recordsPerPage,
      visitedPages: [],
      childNodes: [],
      isLoading: true
    };
  }

  /*
   * Fetch data
   */
  private _data(model: PaginationModel) {

    this.dataService.paginate(model.nodeId, model.currentPage, model.recordsPerPage).then((result) => {

      model.isLoading = false;
      model.totalRecords = result.total;
      model.totalPages = Math.ceil(model.totalRecords / model.recordsPerPage);  // round to upper
      model.visitedPages.push(model.currentPage);
      model.oneThird = Math.floor(result.items.length / 5);

      reaction(() => {  // 1. Initialize or update tree
          if (this.configRoot) {
            this.configRoot = false;
            this.nodes = result.items;
            // this._ngAfterViewInit();  // Add timer to measure pagination and virtual model

            setTimeout(() => {
              // this.treeEl.treeModel.focusDrillDown();
              // this.treeEl.treeModel.focusDrillDown();
            }, 300);

          } else {
            this.addChildNodes(this.nodes, model.nodeId, result.items);
          }

        }, () => {  // Create Child Models
          // time for tree model to be updated
          setTimeout(() => {
            this._child(result.items, model, model.oneThird);
          }, 300);
        }, {compareStructural: true, fireImmediately: true}
      );


    });

  }

  private _child(items: TreeViewData[], model: PaginationModel, triggerIndex) {
    for (let i = 0; i < items.length; i++) {
      const el = document.getElementById('n-' + items[i].id);
      const child: ChildModel = {
        el: el,
        scrollTop: el != null ? el.scrollTop : -1,
        data: items[i]
      };
      model.childNodes.push(child);

      // Add model trigger element to monitor
      // Based on this element position in scroll we are triggering load more option
      if (i === triggerIndex) {
        model.triggerElement = child;
      }

    }
  }

  /**
   * Check if model exists
   * @return Boolean
   */
  private _modelExist(nodeId) {
    for (let i = 0; i < this.models.length; i++) {
      if (this.models[i].nodeId === nodeId) {
        return true;
      }
    }
    return false;
  }

  /*
  * Load more nodes
  */
  private _loadNodes(model: PaginationModel) {

    // console.log('_hasMoreNodes: ', this._hasMoreNodes(model));
    // console.log('isLoading: ', model.isLoading);

    if (this._hasNodes(model) && !model.isLoading) {

      const notVisited = model.visitedPages.indexOf(model.currentPage + 1) === -1;
      if (notVisited) {
        model.isLoading = true;
        model.currentPage++;
        this._data(model);
      }
    }
  }

  /*
   * Check if there is more records to laod
   * @return Boolean
   */
  private _hasNodes(model: PaginationModel) {
    return model.childNodes.length < model.totalRecords;
  }

  // private _ngAfterViewInit() {
  //   const timer = Observable.timer(0, this.timerTick);
  //   setTimeout(() => {
  //     timer.subscribe(t => {
  //       this._treeConfiguration();
  //     });
  //   }, 1);
  // }
  //
  // private _treeConfiguration() {
  //   const length = this.paginationTreeModels.length;
  //
  //   for (let i = 0; i < length; i++) {
  //     const virtualModel = this._configureVirtualModel();
  //     this._configVirtualMeasure(this.paginationTreeModels[i], virtualModel);
  //   }
  // }

  // private _configureVirtualModel() {
  //   /*
  //    * TreeModel root node used to get real height of one tree node
  //    * We are calculating how many nodes can fit into panel
  //    */
  //   const rootNode = this.treeEl.treeModel.getFirstRoot();
  //
  //   /*
  //    * Check if tree root is initialised
  //    */
  //   // if (!rootNode) {
  //   //   return false;
  //   // }
  //
  //   /*
  //    * 1. Node height
  //    * 2. Panel Height: Bootstrap panel height can be set in css or dynamically. It will always be updated here
  //    */
  //   const virtualModel: VirtualModel = {
  //     nodeHeight: rootNode.height - 10, // 10 px difference exist, check what it is
  //     panelHeight: this.treeEl.treeModel.virtualScroll.viewportHeight,
  //   };
  //
  //   /*
  //    * 3. Get num of visible nodes that can fit in viewport and round to upper
  //    */
  //   virtualModel.noOfVisibleNodes = Math.ceil(virtualModel.panelHeight / virtualModel.nodeHeight);
  //
  //   return virtualModel;
  // }

  // private _configVirtualMeasure(model: PaginationModel, virtualModel: VirtualModel) {
  //
  //   /*
  //    * Get scroll top of virtual scroll
  //    */
  //   // virtualModel.yBlocks = this.treeEl.viewportComponent.virtualScroll.yBlocks;
  //   // virtualModel.y = this.treeEl.viewportComponent.virtualScroll.y;
  //   virtualModel.scrollTop = this.treeEl.viewportComponent.virtualScroll.viewport.scrollTop;
  //
  //   /*
  //    * Find visible node indexes from - to
  //    */
  //   virtualModel.indexFrom = Math.ceil(virtualModel.scrollTop / virtualModel.nodeHeight);
  //   virtualModel.currentPage = Math.ceil(virtualModel.indexFrom / virtualModel.noOfVisibleNodes) + 1; // page starts from 1
  //
  //   /*
  //    * Load more nodes
  //    */
  //   // const model = this.paginationModels[0];
  //
  //   /*
  //    * Find index for last visible node in viewport in nodes[]
  //    * This enables us to see weather id is or was visible inside viewport
  //    */
  //   const idsOfVisible = this._idsOfVisible(virtualModel.indexFrom, virtualModel.noOfVisibleNodes, model);
  //   // console.log('idsOfVisible: ', idsOfVisible);
  //   const lastViewportVisibleId = idsOfVisible[idsOfVisible.length - 1];
  //   const indexOfNode = this._findIndex(lastViewportVisibleId, model);
  //   // console.log('indexOfNode: ', indexOfNode);
  //
  //   // setting index from 0 enables us to check if node passed viewport or visible inside it
  //   const indexFrom = 0;
  //
  //   if (this._isOrWasVisible(indexFrom, indexOfNode, model)) {
  //     this._loadMoreNodes(model);
  //   }
  //
  //   // if (this.debug) {
  //   //   this._debug(virtualModel);
  //   // }
  // }

  /*
   * 1. Check if node is visible inside virtual scroll viewport
   * TODO: Should be refactored to get real height of each node
   */
  // private _idsOfVisible(from, noOfVisibleNodes, model: PaginationModel) {
  //
  //   let ids = [];
  //
  //   // console.log('--------------');
  //   const nodes = model.childNodes;
  //   const limit = from + noOfVisibleNodes;
  //
  //   for (let i = from; i < limit; i++) {
  //
  //     /*
  //      * Due to calculation of margin top in virtual scroll
  //      * It might be undefined
  //      */
  //
  //     if (nodes[i]) {
  //       // if (this.debug) {
  //       //   console.log(nodes[i].name);
  //       // }
  //       ids.push(nodes[i].id);
  //     }
  //   }
  //
  //   return ids;
  // }

  /**
   * 1. Find index of node inside childNodes array
   */
  // private _findIndex(nodeId, model) {
  //
  //   const nodes = model.childNodes;
  //
  //   for (let i = 0; i < nodes.length; i++) {
  //
  //     /*
  //      * Due to calculation of margin top in virtual scroll
  //      * It might be undefined
  //      */
  //     if (nodes[i]) {
  //       // if (this.debug) {
  //       //   console.log(nodes[i].name);
  //       // }
  //       if (nodes[i].id === nodeId) {
  //         return i;
  //       }
  //     }
  //   }
  //
  //   return -1;
  // }

  /*
   * 3. Check if node is or was visible inside virtual scroll viewport
   */
  // private _isOrWasVisible(from, noOfVisibleNodes, model: PaginationModel) {
  //
  //   // console.log('--------------');
  //   const nodes = model.childNodes;
  //   const limit = from + noOfVisibleNodes;
  //
  //   for (let i = from; i < limit; i++) {
  //
  //     /*
  //      * Due to calculation of margin top in virtual scroll
  //      * It might be undefined
  //      */
  //     if (nodes[i]) {
  //       // if (this.debug) {
  //       //   console.log(nodes[i].name);
  //       // }
  //       if (nodes[i].id === model.triggerElement) {
  //         return true;
  //       }
  //     }
  //   }
  //
  //   return false;
  // }

  addChildNodes(nodes, parentId, childNodes) {

    if (parentId === this.firstRootId) {
      this.nodes = this.nodes.concat(childNodes);
    } else {
      this.nodes = this.setChildNodesIfAny(nodes, parentId, childNodes);
    }

    this.treeEl.treeModel.update();
  }

  setChildNodesIfAny(nodes, id, newNodes) {

    nodes.forEach((node) => {

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
        }

        return nodes;
      }

      /**
       * Traverse trough children element recursively
       */
      if (node.children != null) {
        node.children = this.setChildNodesIfAny(node.children, id, newNodes);
      }

    });

    return nodes;

  }
}
