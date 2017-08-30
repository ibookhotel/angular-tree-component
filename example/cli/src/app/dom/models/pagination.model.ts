import {ChildModel} from './child.model';

export interface PaginationModel {
  nodeId: any;
  nodeName: any;
  currentPage: number;
  totalRecords: number;
  loadedRecords: number;
  totalPages: number;
  recordsPerPage: number;
  visitedPages: number[];
  isLoading: boolean;
  oneFifth?: number;
  childNodes: ChildModel[];
  triggerElement?: ChildModel;
}
