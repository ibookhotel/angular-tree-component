export interface PaginationModel {
  nodeId: any;
  currentPage: number;
  totalRecords: number;
  totalPages: number;
  recordsPerPage: number;
  visitedPages: number[];
  lastChildNodeId: number;
  oneThird?: number;
  isLoading: boolean;
}
