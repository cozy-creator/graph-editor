import {
  EdgeType,
  InputDef,
  InputHandle,
  NodeDefinition,
  NodeState,
  NodeStateConfig,
  WidgetState
} from '../types.ts';
import { CONVERTABLE_WIDGET_TYPES, WIDGET_TYPES } from '../config/constants.ts';
import { Node } from 'reactflow';
import { useFlowStore } from '../../store/flow.ts';
import { createValueControlWidget, isSeedWidget } from './widgets.ts';

export function computeInitialNodeState(
  def: NodeDefinition,
  widgetValues: Record<string, any>,
  config: NodeStateConfig
) {
  const { display_name: name, inputs, outputs } = def;
  const state: NodeState = {
    name,
    inputs: [],
    outputs: [],
    widgets: {},
    config: {
      ...config,
      isOutputNode: def.output_node
    }
  };

  inputs.forEach((input) => {
    const isWidget = isWidgetInput(input.type);
    if (isWidget) {
      const widget = { ...widgetStateFromDef(input, widgetValues) };
      state.widgets[input.name] = widget;

      if (isSeedWidget(input)) {
        // const afterGenWidget = createValueControlWidget({ widget });
        // state.widgets[input.name] = {
        //   type: 'GROUP',
        //   name: input.name,
        //   widgets: [widget, afterGenWidget]
        // };

        const afterGenWidget = createValueControlWidget({ widget });

        widget.linkedWidgets = [afterGenWidget.name];
        state.widgets[afterGenWidget.name] = afterGenWidget;
      }
    } else {
      if (input.type === 'IMAGE') {
        if (input.imageUpload) {
          // TODO: add image upload widget
        }

        const data = { name: 'image', type: 'IMAGE' } as const;
        state.widgets['image'] = {
          ...data,
          serialize: false,
          definition: data
        };
      }

      state.inputs.push({
        name: input.name,
        type: input.type,
        isHighlighted: false,
        optional: input.optional
      });
    }
  });

  outputs.forEach((output) => {
    state.outputs.push({
      name: output.name,
      type: output.type,
      isHighlighted: false
    });
  });

  return state;
}

export function widgetStateFromDef(def: InputDef, values: Record<string, any>): WidgetState {
  const state = { name: def.name, optional: def.optional };
  const value = values[def.name];

  switch (def.type) {
    case 'BOOLEAN':
      return {
        ...state,
        type: def.type,
        value: value ?? def.defaultValue
      };

    case 'INT':
      return {
        ...state,
        type: def.type,
        value: value ?? def.defaultValue
      };

    case 'FLOAT':
      return {
        ...state,
        type: def.type,
        value: value ?? def.defaultValue
      };

    case 'STRING':
      return {
        ...state,
        type: def.type,
        value: value ?? def.defaultValue
      };

    case 'ENUM':
      let firstOptionValue;
      if (typeof def.options === 'function') {
        firstOptionValue = def.options()[0];
      } else {
        firstOptionValue = def.options[0];
      }

      return {
        ...state,
        type: def.type,
        value: value ?? def.defaultValue ?? firstOptionValue
      };

    case 'IMAGE':
      return {
        ...state,
        type: def.type,
        value: value ?? def.defaultValue
      };

    case 'VIDEO':
      return {
        ...state,
        type: def.type,
        value: value ?? def.defaultValue ?? {}
      };

    default:
      throw new Error(`Unsupported input type: ${(def as InputDef).type}`);
  }
}

export const isWidgetInput = (type: EdgeType) => WIDGET_TYPES.includes(type);

const isConvertableWidget = (widget: WidgetState) => CONVERTABLE_WIDGET_TYPES.includes(widget.type);

export function hideNodeWidget(node: Node<NodeState>, name: string) {
  const widget = node.data.widgets[name];
  if (!widget) {
    throw new Error(`Widget ${name} not found in Node "${node.id}"`);
  }

  // already hidden?
  if (widget.hidden) return;

  const { updateWidgetState } = useFlowStore.getState();
  updateWidgetState({
    name,
    nodeId: node.id,
    data: { hidden: true }
  });

  console.log(useFlowStore.getState().nodes);
}

export function showNodeWidget(node: Node<NodeState>, name: string) {
  const widget = node.data.widgets[name];
  if (!widget) {
    throw new Error(`Widget ${name} not found in Node "${node.id}"`);
  }

  // not already hidden?
  if (!widget.hidden) return;

  const { updateWidgetState } = useFlowStore.getState();
  updateWidgetState({
    name,
    nodeId: node.id,
    data: { hidden: false }
  });
}

export function convertNodeWidgetToInput(node: Node<NodeState>, name: string) {
  if (!node.type) return;

  const widget = node.data.widgets[name];
  if (!widget) {
    throw new Error(`Widget ${name} not found in Node "${node.id}"`);
  }

  if (!isConvertableWidget(widget)) {
    throw new Error(`Widget ${widget.type} cannot be converted to input`);
  }

  const { nodeDefs } = useFlowStore.getState();
  const definition = nodeDefs[node.type]?.inputs.find((input) => input.name === name);
  if (!definition) {
    throw new Error(`No definition found for widget ${widget.type} in ${node.type}`);
  }

  return {
    type: '*',
    name: widget.name,
    optional: widget.optional,
    widget: { ...widget, definition }
  } as InputHandle;
}

export function convertNodeInputToWidget(node: Node<NodeState>, slot: number) {
  if (!node.type) return;

  const input = node.data.inputs[slot];
  if (!input) {
    throw new Error(`Input Slot ${slot} not found in Node "${node.id}"`);
  }

  const { nodes } = useFlowStore.getState();

  let widget;
  if (input.primitiveNodeId) {
    const node = nodes.find((node) => node.id === input.primitiveNodeId);
    if (node) {
      widget = node.data.widgets[input.name];
    }
  }

  if (!widget && input.widget) {
    widget = input.widget;
  } else {
    throw new Error(`Input Slot ${slot} does not contain a widget or a primitive node`);
  }

  return widget;
}

interface ExchangeInputForWidgetArgs {
  inputSlot: number;
  sourceNode: Node<NodeState>;
  targetNode: Node<NodeState>;
}

export function exchangeInputForWidget({
  inputSlot,
  sourceNode,
  targetNode
}: ExchangeInputForWidgetArgs) {
  const { updateNodeState } = useFlowStore.getState();
  const widget = convertNodeInputToWidget(sourceNode, inputSlot);
  if (!widget) return;

  sourceNode.data.inputs = sourceNode.data.inputs.map((input) => {
    if (input.name === widget.name) {
      return {
        ...input,
        type: widget.type,
        primitiveNodeId: targetNode.id
      };
    }

    return input;
  });

  // hide widget from source node (or should we remove it?)
  updateNodeState(sourceNode.id, sourceNode.data);

  // add widget to target node
  const output = { name: widget.type, type: widget.type };
  updateNodeState(targetNode.id, {
    widgets: {
      [widget.name]: {
        ...widget,
        hidden: false
      }
    },
    outputs: [output]
  });
}

export function removeNodeInput(node: Node<NodeState>, slot: number) {
  const { updateNodeState } = useFlowStore.getState();
  node.data.inputs = node.data.inputs.filter((_, i) => i !== slot);
  updateNodeState(node.id, node.data);
}

export function addWidgetToPrimitiveNode(
  primitiveNodeId: string,
  updateNodeState: (nodeId: string, newState: Partial<NodeState>) => void,
  { nodeId, widgetName }: { nodeId: string; widgetName: string }
) {
  const { nodeDefs, nodes } = useFlowStore.getState();
  const primitive = nodes.find((node) => node.id === primitiveNodeId);
  if (primitive?.type !== 'PrimitiveNode') return;

  const node = nodes.find((node) => node.id === nodeId);
  if (!node) return;

  const widget = node.data.widgets[widgetName];
  if (!widget) return;

  const definition = nodeDefs[node.type!]?.inputs?.find((input) => input.name == widget.name);

  const output = {
    name: widget.type,
    type: '*'
  } as const;

  updateNodeState(primitive.id, {
    outputs: [output],
    widgets: {
      [widget.name]: {
        ...structuredClone(widget),
        definition
      }
    }
  });

  return {
    type: widget.type
  };
}

export function isWidgetHandleId(id: string) {
  return id.split('::')[1] === 'widget';
}