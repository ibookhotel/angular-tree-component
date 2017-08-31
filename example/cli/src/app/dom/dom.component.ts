import {AfterViewInit, Component, HostListener, Inject, OnInit, ViewChild} from '@angular/core';
import {TreeRestService} from './services/treerest.service';
import {TreeViewData} from './models/treeview-data.model';
import {PaginationModel} from './models/pagination.model';
import {ITreeOptions, TREE_ACTIONS, TreeComponent, TreeNode} from 'angular-tree-component';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';
import {reaction} from 'mobx';
import {ChildModel} from './models/child.model';
import {DOCUMENT} from '@angular/platform-browser';

@Component({
  selector: 'app-basictree',
  templateUrl: './dom.component.html',
  styles: [],
  providers: [TreeRestService]
})
export class DomComponent implements OnInit, AfterViewInit {

  /*
   * Models
   */
  private models: PaginationModel[] = [];
  public nodes: TreeViewData[] = [];

  /*
   * Options
   */
  public options: ITreeOptions = {

    getChildren: (node: TreeNode) => {
      // console.log('Get children');
    },
    actionMapping: {
      mouse: {
        click: (tree, node, $event) => {
          TREE_ACTIONS.SELECT(tree, node, $event);
          this.selectedName = node.data.name;
          if (node.data.hasChildren && !node.isCollapsed) {
            this.activeModelNodeId = node.data.id;
            if (this.debug) {
              console.log(node);
            }
          }
        },
        dblClick: (tree, node, $event) => {
          if (!node.hasChildren) {
            alert('Open ' + node.data.name);
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
    animateSpeed: 200,
    animateAcceleration: 3,
    displayField: 'name',
    scrollOnSelect: false
  };

  /*
   * Initial settings
   */
  private timerTick = 10;
  private recordsPerPage = 150;
  private firstRootId = 0;
  private configRoot = true;  // Initialise only once
  private debug = false;

  protected activeModelNodeId = null;
  protected selectedName = '';
  protected loadedRecords = 0;
  protected totalRecords = 0;
  protected itemString = 'item';  // or items
  protected isLoading = true;
  private domIds: any = [];

  /*
   * Dom references
   */
  @ViewChild('tree') treeEl: TreeComponent;

  constructor(private dataService: TreeRestService) {
    this.activeModelNodeId = this.firstRootId;
  }

  ngOnInit() {
    // Tree initialized
    this.treeEl.initialized.subscribe((r) => {
      this._makeModel(this.firstRootId);
    });

    // Node expanded
    this.treeEl.toggleExpanded.subscribe((event) => {
      if (!event.node.isCollapsed) {
        this._makeModel(event.node.data.id);
        this.activeModelNodeId = event.node.data.id;
        if (this.debug) {
          console.log(event.node);
        }
      }
    });


    /*
     * Mutation Observer solution
     */
    //   /* 1) Create a MutationObserver object*/
    //  const observer = new MutationObserver(
    //     function(mutations) {
    //       console.log('mutations');
    //     }),
    //   /* 2) Create a config object */
    //   config = {childList: true};
    //
    // /* 3) Glue'em all */
    // observer.observe(msg, config);


    /*
     * Dom solution
     */
    const container = document.getElementsByTagName('tree-viewport')[0];
    container.addEventListener('scroll', () => {

      const treeNodes = document.getElementsByClassName('tree-node');

      for (let i = 0; i < treeNodes.length; i++) {
        if (this.domIds.indexOf(treeNodes[i].id) === -1) {
          console.log(treeNodes[i].id);
          this.domIds.push(treeNodes[i].id);
        }
      }

      for (let i = 0; i < this.models.length; i++) {
        if (this.domIds.indexOf(String('n-' + this.models[i].triggerElement.data.id)) !== -1) {
          this._loadNodes(this.models[i]);
        }
      }

      this._activeModel(this.activeModelNodeId);  // Update model preview
    });


    /*
     * Timer solution
     */
    // const timer = Observable.timer(0, this.timerTick);
    // timer.subscribe(t => {
    //
    //
    //   const treeNodes = document.getElementsByClassName('tree-node');
    //
    //   for (let i = 0; i < treeNodes.length; i++) {
    //     if (this.domIds.indexOf(treeNodes[i].id) === -1) {
    //       console.log(treeNodes[i].id);
    //       this.domIds.push(treeNodes[i].id);
    //     }
    //   }
    //
    //   for (let i = 0; i < this.models.length; i++) {
    //     if (this.models[i].triggerElement.data != null) {
    //       if (this.domIds.indexOf(String('n-' + this.models[i].triggerElement.data.id)) !== -1) {
    //         this._loadNodes(this.models[i]);
    //       }
    //     }
    //   }
    //
    //   this._activeModel(this.activeModelNodeId);  // Update model preview
    //
    // });


  }

  ngAfterViewInit() {
    // const timer = Observable.timer(0, this.timerTick);
    // setTimeout(() => {
    //   timer.subscribe(t => {
    //     for (let i = 0; i < this.models.length; i++) {
    //       if (this.debug) {
    //         console.group('Model ' + this.models[i].nodeId);
    //       }
    //       this._triggers(this.models[i]);
    //       if (this.debug) {
    //         console.log(this.models[i]);
    //         console.groupEnd();
    //       }
    //     }
    //     this._activeModel(this.activeModelNodeId);  // Update model preview
    //   });
    // }, 1);

    // this.treeEl.treeModel.viewportNodes

  }

  /*
   * Calculation for loading more models
   * Note: padding to #panel should be set to 0 for pixel precise calculation
   */
  private _triggers(model: PaginationModel) {


    if (model.triggerElement == null) {   // model not initialized yet
      return false;
    }

    if (this.debug) {
      // console.log('Active Model Id: ', this.activeModelNodeId);
    }

    /*
     * Handle virtual root
     */
    if (model.nodeId === this.firstRootId) {
      this._triggerRoot(model);
      return false;
    }

    /*
     * Get DOM references: trigger, parent node and panel
     */
    const triggerId = 'n-' + String(model.triggerElement.data.id);
    const nodeId = 'n-' + String(model.nodeId);
    const triggerElement = document.getElementById(triggerId);
    const nodeElement = document.getElementById(nodeId);
    const panel = document.getElementById('panel');

    if (this.debug) {
      console.log('triggerElement: ', triggerElement);
    }

    /*
     * Trigger element is null when node is collapsed
     */

    if (nodeElement == null || triggerElement == null) {
      return false;
    }

    /*
     * Get position of parent and trigger node
     */
    const panelRect = panel.getBoundingClientRect(),
      triggerRect = triggerElement.getBoundingClientRect(),
      nodeRect = nodeElement.getBoundingClientRect(),
      triggerOffset = triggerRect.top - panelRect.bottom,
      nodeOffset = nodeRect.top - panelRect.top,
      nodeHeight = nodeRect.height;

    /*
     * Load more nodes
      * 1. If trigger element in or passed viewport
      * 2. Parent node is visible in viewport
     */

    // console.log(offsetTrigger, offsetNode);

    if (nodeOffset + nodeHeight > 0) {  // parent node offset
      if (triggerOffset <= 0) {         // trigger element scroll offset
        this._loadNodes(model);
      }
    }
  }

  /*
   * Calculation for loading more root models
   * Note: padding to #panel should be set to 0 for pixel precise calculation
   */
  private _triggerRoot(model: PaginationModel) {

    /*
      * Get DOM references: trigger, parent node and panel
      */
    const triggerId = 'n-' + String(model.triggerElement.data.id);
    const triggerElement = document.getElementById(triggerId);
    const panel = document.getElementById('panel');

    /*
     * Trigger element is null when node is collapsed
     */
    if (triggerElement == null) {
      return false;
    }

    /*
     * Get position of parent and trigger node
     */
    const panelRect = panel.getBoundingClientRect(),
      triggerRect = triggerElement.getBoundingClientRect(),
      triggerOffset = triggerRect.top - panelRect.bottom;

    /*
     * Load more nodes
      * 1. If trigger element in or passed viewport
     */

    if (this.debug) {
      console.log('triggerElement: ', triggerElement, triggerOffset);
    }

    if (triggerOffset <= 0) {
      this._loadNodes(model);
    }
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
      totalRecords: 0,
      loadedRecords: 0,
      totalPages: 1,
      recordsPerPage: this.recordsPerPage,
      visitedPages: [],
      childNodes: [],
      isLoading: true,
      nodeElement: document.getElementById('n-' + nodeId)
    };
  }

  /*
   * Fetch data
   */
  private _data(model: PaginationModel) {

    this.dataService.paginate(model.nodeId, model.currentPage, model.recordsPerPage).then((result) => {

      /*
       * Populate paging model
       */
      model.isLoading = false;
      this.activeModelNodeId = model.nodeId;
      this._activeModel(this.activeModelNodeId);  // Update model preview
      model.totalRecords = result.total;
      model.loadedRecords += result.items.length;
      model.totalPages = Math.ceil(model.totalRecords / model.recordsPerPage);  // round to upper
      model.visitedPages.push(model.currentPage);
      model.oneFifth = Math.floor(result.items.length / 4);

      reaction(() => {  // 1. Initialize or update tree
          if (this.configRoot) {
            this.configRoot = false;
            this.nodes = result.items;
            setTimeout(() => {
              this.treeEl.treeModel.focusDrillDown();
              this.treeEl.treeModel.focusDrillDown();
            }, 300);

          } else {
            this.addChildNodes(this.nodes, model.nodeId, result.items);
          }
        }, () => {  // Create Child Models
          // time for tree model to be updated
          setTimeout(() => {
            this._child(result.items, model, model.oneFifth);
          }, 300);
        }, {compareStructural: true, fireImmediately: true}
      );
    });
  }

  /*
   * Make child DOM elements and data
   */
  private _child(items: TreeViewData[], model: PaginationModel, triggerIndex) {
    for (let i = 0; i < items.length; i++) {
      const el = document.getElementById('n-' + items[i].id);
      const child: ChildModel = {
        el: el,
        scrollTop: el != null ? el.scrollTop : -1,
        data: items[i]
      };
      model.childNodes.push(child);

      // Add model trigger element
      // Based on element position in scroll we are triggering load more option
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

  /*
   * Append tree model with new nodes
   */
  addChildNodes(nodes, parentId, childNodes) {
    if (parentId === this.firstRootId) {
      this.nodes = this.nodes.concat(childNodes);
    } else {
      this.nodes = this.setChildNodesIfAny(nodes, parentId, childNodes);
    }
    this.treeEl.treeModel.update();
  }

  /*
   * Recursively go trough tree model
   */
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

  /*
   * Find active model
   * @return String
   */
  protected _activeModel(nodeId) {

    if (nodeId == null) {   // model not initialized yet
      return false;
    }

    this.models.forEach(model => {
      if (model.nodeId === nodeId) {
        this.loadedRecords = model.loadedRecords;
        this.totalRecords = model.totalRecords;
        this.itemString = model.totalRecords > 1 ? 'items' : 'item';
        this.isLoading = model.isLoading;
      }
    });
  }

  protected numberWithCommas(n) {
    return n.toLocaleString(
      undefined, // use a string like 'en-US' to override browser locale
      {minimumFractionDigits: 0}
    );
  }
}
