export interface PaginationModel {
  nodeId: any;
  currentPage: number;
  totalRecords: number;
  totalPages: number;
  recordsPerPage: number;
  visitedPages: number[];
  isLoading: boolean;
  oneThird?: number;
  childNodes: any;
  lastChildNodeId?: number;
}
