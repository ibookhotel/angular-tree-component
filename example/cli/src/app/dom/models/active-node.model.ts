export interface ActiveNodeData {
  id: number;
  name: string;
  type: string;
  encode: boolean;
  decode: string;
  parentId: number;
  hasChildren: boolean;
  isExpanded: boolean;
  curPage: number;
}
