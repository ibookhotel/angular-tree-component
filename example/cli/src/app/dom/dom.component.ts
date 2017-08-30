import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {TreeRestService} from './services/treerest.service';
import {TreeViewData} from './models/treeview-data.model';
import {PaginationModel} from './models/pagination.model';
import {ITreeOptions, TREE_ACTIONS, TreeComponent, TreeNode} from 'angular-tree-component';
import {Observable} from 'rxjs/Observable';
import 'rxjs/Rx';
import {reaction} from 'mobx';
import {ChildModel} from './models/child.model';

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
      console.log('Get children');
    },
    actionMapping: {
      mouse: {
        click: (tree, node, $event) => {
          TREE_ACTIONS.SELECT(tree, node, $event);
          this.activeModelId = node.data.id;
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
    useVirtualScroll: false,
    nodeHeight: 30,
    dropSlotHeight: 3,
    animateExpand: true,
    animateSpeed: 130,
    animateAcceleration: 3,
    displayField: 'name'
  };

  /*
   * Initial settings
   */
  private timerTick = 100;
  public debug = true;
  private activeModelId = 0;
  private recordsPerPage = 150;
  private firstRootId = 0;
  public configRoot = true;  // Initialise only once

  /*
   * Dom references
   */
  @ViewChild('tree') treeEl: TreeComponent;

  constructor(private dataService: TreeRestService) {
  }

  ngOnInit() {
    // Tree initialized
    this.treeEl.initialized.subscribe((r) => {
      this._makeModel(this.firstRootId);
    });

    // Node expanded
    this.treeEl.toggleExpanded.subscribe((event) => {
      this._makeModel(event.node.data.id);
      this.activeModelId = event.node.data.id;
    });
  }

  ngAfterViewInit() {
    const timer = Observable.timer(0, this.timerTick);
    setTimeout(() => {
      timer.subscribe(t => {
        for (let i = 0; i < this.models.length; i++) {
          this._triggers(this.models[i]);
        }
      });
    }, 1);
  }

  /*
   * Calculation for loading more models
   */
  private _triggers(model: PaginationModel) {
    if (model.triggerElement == null) {
      return false;
    }

    /*
     * Get DOM references: trigger, parent node and panel
     */
    const idTrigger = 'n-' + String(model.triggerElement.data.id);
    const idNode = 'n-' + String(model.nodeId);
    const triggerElement = document.getElementById(idTrigger);
    const nodeElement = document.getElementById(idNode);
    const panel = document.getElementById('panel');

    if (nodeElement == null || triggerElement == null) {
      return false;
    }

    /*
     * Get position of parent and trigger node
     */
    const panelRect = panel.getBoundingClientRect(),
      elemRectTrigger = triggerElement.getBoundingClientRect(),
      elemRectNode = nodeElement.getBoundingClientRect(),
      offsetTrigger = elemRectTrigger.top - panelRect.bottom,
      offsetNode = elemRectNode.top - panelRect.top,
      offsetNodeH = elemRectNode.height;

    /*
     * Load more nodes
      * 1. If trigger element in or passed viewport
      * 2. Parent node is visible in viewport
     */
    if (offsetNode + offsetNodeH > 0) {
      if (offsetTrigger <= 0) {
        this._loadNodes(model);
      }
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
      totalRecords: -1,
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

      model.isLoading = false;
      model.totalRecords = result.total;
      model.totalPages = Math.ceil(model.totalRecords / model.recordsPerPage);  // round to upper
      model.visitedPages.push(model.currentPage);
      model.oneFifth = Math.floor(result.items.length / 5);

      reaction(() => {  // 1. Initialize or update tree
          if (this.configRoot) {
            this.configRoot = false;
            this.nodes = result.items;
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
}
