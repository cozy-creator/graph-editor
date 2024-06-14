import {
  ComponentType,
  type MouseEvent as ReactMouseEvent,
  ReactNode,
  SetStateAction
} from 'react';
import {
  ConnectionLineType,
  Edge,
  EdgeProps,
  Node,
  NodeProps,
  XYPosition,
  Viewport
} from 'reactflow';

export type EdgeType =
  | 'BOOLEAN'
  | 'INT'
  | 'FLOAT'
  | 'STRING'
  | 'MODEL'
  | 'CONDITIONING'
  | 'LATENT'
  | 'VAE'
  | 'IMAGE'
  | 'CLIP'
  | 'CLIP_VISION'
  | 'CLIP_VISION_OUTPUT'
  | 'STYLE_MODEL'
  | 'CONTROL_NET'
  | 'UPSCALE_MODEL'
  | 'SAMPLER'
  | 'SIGMAS'
  | 'PHOTOMAKER'
  | 'MASK'
  | 'VIDEO'
  | 'ENUM'
  | 'TAESD'
  | '*'
  | 'GROUP'
  | 'FILEPICKER';

// =========== Output Definition ===========
// Note that outputs do not hold any state; on the client we either
//
// 1. precompute the outputs, i.e., A-Primitive[string] -> B[string], we take the
// string from A-Primitive and pass it into B, then remove A-Primitive from the graph.
//
// 2. or the outputs will be computed by the Comfy-Gen-Server, i.e.,
// A[conditioning] -> B[conditioning], the A-node will compute conditioning (CLIP text
// encode), and then pass it as an input into B-node (K-sampler).

// =========== Entire Node State ===========
// This is the 'data' type stored inside a node instance

export type NodeData = {
  display_name: string;
  inputs: Record<string, InputData>;
  outputs: Record<string, OutputData>;
};

// =========== Node Types ===========
// Node-definitions are converted into React components, and then registered with
// ReactFlow as a 'NodeType'.

export type NodeType = ComponentType<NodeProps<NodeData>>;

export type NodeTypes = Record<string, NodeType>;

export interface UpdateInputDataParams {
  name: string;
  nodeId: string;
  data: Partial<InputData>;
}

export interface UpdateOutputDataParams {
  name: string;
  nodeId: string;
  data: Partial<OutputData>;
}

export type UpdateInputData = (params: UpdateInputDataParams) => void;
export type UpdateOutputData = (params: UpdateOutputDataParams) => void;

export interface MenuState {
  items: IMenuType[];

  isOpen?: boolean;
  close: (event: ReactMouseEvent) => void;
}

export interface ContextMenuProps {
  id?: string;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;

  title?: string;
  items: IMenuType[];

  parentMenu: MenuState | null;
  currentSubmenu: MenuState | null;

  reset?: () => void;

  [key: string]: any;
}

// These are node-types that are built into React Flow
// We currently do not allow them to be instantiated, but we could add them
const defaultNodeDefs = ['default', 'input', 'output', 'group'];

export interface ComfyError extends Error {
  details: string;
  fileName?: string;
  node_id?: number;
  node_type?: string;
  class_type?: string;
  traceback?: string[];
  errors?: ComfyError[];
  exception_message?: string;
  dependent_outputs?: any[];
  extra_info?: {
    [x: string]: any;
  };
}

export type EdgeComponents = Record<string, ComponentType<EdgeProps>>;

export interface IMenuType {
  label: string;
  isOpen?: boolean;
  disabled?: boolean;
  hasSubMenu: boolean;
  subMenu: IMenuType[] | null;
  data: Record<string, any> | null | string;
  onClick?: (event: ReactMouseEvent) => void;
}

export type KeyboardHandler = (event?: KeyboardEvent) => void;

export interface SettingsLookup {
  id: string;
  name: string;
  render: (i: number) => ReactNode;
  onChange?: (...arg: any[]) => void;
}

export interface ThemeConfig {
  id: string;
  name: string;
  colors: {
    types: {
      VAE: string;
      CLIP: string;
      MASK: string;
      MODEL: string;
      IMAGE: string;
      LATENT: string;
      DEFAULT: string;
      CLIP_VISION: string;
      CONTROL_NET: string;
      STYLE_MODEL: string;
      CONDITIONING: string;
      CLIP_VISION_OUTPUT: string;
      [x: string]: string;
    };
    appearance: {
      NODE_BG_COLOR: string;
      NODE_TEXT_SIZE: number;
      NODE_TEXT_COLOR: string;
      NODE_TITLE_COLOR: string;
      NODE_SELECTED_TITLE_COLOR: string;
      NODE_DEFAULT_BOX_COLOR: string;
      NODE_BOX_OUTLINE_COLOR: string;

      WIDGET_BG_COLOR: string;
      WIDGET_TEXT_COLOR: string;
      WIDGET_OUTLINE_COLOR: string;
      WIDGET_SECONDARY_TEXT_COLOR: string;

      EDGE_COLOR: string;
      CONNECTING_EDGE_COLOR: string;
    };
    CSSVariables: { [x: string]: string };
  };
}

export interface LogEntry {
  type: string;
  source: string;
  message: any[];
  timestamp: Date;
}

export interface AddValueControlInput {
  input: InputData;
  defaultValue?: string;
  options?: {
    addFilterList?: boolean;
    controlAfterGenerateName?: string;
  };
}

export type MessageType = 'status' | 'progress' | 'executing' | 'executed';

export interface ComfyStatusMessage {
  type: 'status';
  data: {
    sid?: string;
    status: { [key: string]: any };
  };
}

export interface ComfyProgressMessage {
  type: 'progress';
  data: {
    max: number;
    node: string;
    value: number;
    prompt_id: string;
  };
}

export interface ComfyExecutingMessage {
  type: 'executing';
  data: {
    prompt_id?: string;
    node: string | null;
  };
}

export interface ComfyExecutedMessage {
  type: 'executed';
  data: {
    node: string;
    prompt_id: string;
    output: { [key: string]: any };
  };
}

export type ComfyWsMessage =
  | ComfyStatusMessage
  | ComfyProgressMessage
  | ComfyExecutingMessage
  | ComfyExecutedMessage;

export interface WorkflowAPI {
  [key: string]: {
    inputs: Record<string, string | number | boolean | [string, number]>;
    class_type: string;
    _meta: {
      title: string;
    };
  };
}

export interface ViewFileArgs {
  type: string;
  filename: string;
  subfolder?: string;
}

export type HandleType = 'input' | 'output';

export interface HandleEdge {
  handleId: string;
  edgeType: EdgeType;
  handleType: HandleType;
}

export type OnContextMenu = (
  event: ReactMouseEvent | MouseEvent | Event,
  data?: (IMenuType | null)[],
  title?: string
) => void;

export type OnNodeContextMenu = (event: ReactMouseEvent, node: Node) => void;

export interface HandleOnConnectEndParams {
  isUpdatingEdge: boolean;
  nodeDefs: NodeDefinitions;
  onContextMenu: OnContextMenu;
  currentHandleEdge: HandleEdge | null;

  setCurrentHandleEdge: (edge: HandleEdge | null) => void;
  setNodes: (nodes: Node[]) => void;
}

export interface HandleOnConnectStartParams {
  setCurrentConnectionLineType: (type: ConnectionLineType) => void;
  setCurrentHandleEdge: (edge: HandleEdge | null) => void;
  setNodes: (nodes: Node[]) => void;
  nodes: Node[];
}

export interface ValidateConnectionParams {
  getNodes: () => Node[];
  getEdges: () => Edge[];
}

export interface HandleEdgeUpdateStartParams {
  setEdges: (edges: SetStateAction<Edge[]>) => void;
  setIsUpdatingEdge: (value: boolean) => void;
  updateOutputData: UpdateOutputData;
  updateInputData: UpdateInputData;
}

export interface HandleEdgeUpdateParams {
  setEdges: (edges: SetStateAction<Edge[]>) => void;
  setIsUpdatingEdge: (value: boolean) => void;
}

export interface HandleEdgeUpdateEndParams {
  setIsUpdatingEdge: (value: boolean) => void;
}

export interface ExecutionState {
  id?: string; // as the runID
  output: Record<string, any>;
  currentNodeId: string | null;
  progress: { value: number; max: number } | null;
}

export type WorkflowOutput = [string, string];
export type WorkflowInput = string | number | boolean | [string, string];

interface WorkflowData {
  type: string;
  inputs: { [name: string]: WorkflowInput };

  // do we need outputs?
  outputs: { [name: string]: WorkflowOutput };
}

export interface Workflow {
  [id: string]: WorkflowData;
}

// ======== New definitions =========

export interface SerializedGraph {
  nodes: Node[];
  edges: Edge[];
  viewport?: Viewport;
}

export interface HandleDef {
  readonly display_name: string;
  readonly edge_type: EdgeType;
  readonly widgets?: WidgetDef[];
  readonly optional?: boolean; // assumed false if undefined
  // readonly serialize?: boolean; // assumed true if undefined
}

export interface WidgetDef {
  readonly display_name: string;
  readonly widget_type: string; // namespaced component like core_extension_1.BoolToggle
  readonly props: Record<string, any>;
}

export type NodeDefinition = Readonly<{
  display_name: string;
  description: string;
  category: string;
  input_handles: HandleDef[];
  output_handles: HandleDef[];
  widgets: WidgetDef[];
}>;

// The key is the name of the node-type
export type NodeDefinitions = Record<string, NodeDefinition>;

// Do we need this???????
export interface AddNodeParams {
  type: string;
  width?: number;
  position: XYPosition;
  defaultValues?: Record<string, any>;
}