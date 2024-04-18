import {
  AddValueControlInput,
  EnumInputData,
  InputData,
  InputDef,
  IntInputDef,
  NodeData,
  UpdateInputData
} from '../types.ts';
import { controlAfterGenerateDef } from '../config/constants.ts';
import { Node } from 'reactflow';

export function createValueControlInputs(args: AddValueControlInput) {
  const widgets: Record<string, InputData> = {};
  const { input, options = {}, defaultValue } = args;
  const name = options.controlAfterGenerateName ?? 'control_after_generate';

  widgets[name] = {
    name,
    type: 'ENUM',
    serialize: true,
    valueControl: true,
    value: defaultValue ?? 'randomize',
    definition: controlAfterGenerateDef
  } as EnumInputData;

  const isEnumInput = input.type === 'ENUM';
  if (isEnumInput && options.addFilterList !== false) {
    widgets['control_filter_list'] = {
      value: '',
      type: 'STRING',
      serialize: false,
      name: 'control_filter_list'
    };
  }

  return widgets;
}

export function createValueControlInput(data: AddValueControlInput) {
  const widgets = createValueControlInputs(data);
  return widgets[Object.keys(widgets)[0]];
}

export function isSeedInput(widget: InputData | InputDef) {
  return widget.type === 'INT' && widget.name === 'seed';
}

export function applyInputControl(node: Node<NodeData>, updater: UpdateInputData) {
  const {
    data: { inputs }
  } = node;
  for (const name in widgets) {
    const widget = widgets[name];
    if (!widget.linkedInputs || !('value' in widget)) continue;

    for (const link of widget.linkedInputs) {
      const linkedInput = widgets[link];
      if (!linkedInput || linkedInput.type !== 'ENUM') continue;

      if (linkedInput.valueControl) {
        let value = Number(widget.value);
        if (isNaN(value)) continue;

        let {
          min = 0,
          step = 1,
          max = 1125899906842624
        } = (widget.definition as IntInputDef) ?? {};

        max = Math.min(1125899906842624, max);
        min = Math.max(-1125899906842624, min);

        let range = (max - min) / step;
        switch (linkedInput.value) {
          case 'increment':
            value += step;
            break;
          case 'decrement':
            value -= step;
            break;
          case 'randomize':
            value = Math.floor(Math.random() * range) * step + min;
            break;
        }

        if (value < min) value = min;
        if (value > max) value = max;

        updater({ nodeId: node.id, name, data: { value } });
      }
    }
  }
}
