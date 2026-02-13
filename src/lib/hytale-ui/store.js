import { create } from 'zustand';
import { HytaleUISerializer } from './parser';

const INITIAL_DOC = {
  imports: { C: "Common.ui" },
  variables: {
    WindowWidth: 400,
    HeaderStyle: {
      __type: "LabelStyle",
      FontSize: 20,
      TextColor: "#FFFFFF",
      HorizontalAlignment: "Center"
    }
  },
  root: {
    type: "Group",
    id: "Root",
    properties: { LayoutMode: "Center" },
    children: [
      {
        type: "$C.@Container",
        id: "MyWindow",
        properties: {
          Anchor: { Width: "@WindowWidth", Height: 300 },
          "@CloseButton": true
        },
        children: [
          {
            type: "Label",
            id: "Title",
            properties: { Text: "MY SETTINGS" },
            children: []
          },
          {
            type: "Group",
            id: "Content",
            properties: {
                LayoutMode: "Top",
                "@ContentPadding": { Full: 10 }
            },
            children: [
                {
                    type: "Label",
                    id: "StatusLabel",
                    properties: {
                        Style: "@HeaderStyle",
                        Text: "Status: OK",
                        Anchor: { Height: 30, Left: 0, Right: 0 }
                    },
                    children: []
                }
            ]
          }
        ]
      }
    ]
  }
};

const MAX_HISTORY = 50;
const DEBOUNCE_MS = 500;

// Helper to get an element's selectable identifier
export function getElementKey(el) {
  return el.id || el.__uid || null;
}

// Helper to find an element by ID or __uid in the tree
function findElement(node, key) {
  if (!node || !key) return null;
  if (node.id === key || node.__uid === key) return node;
  for (const child of node.children || []) {
    const found = findElement(child, key);
    if (found) return found;
  }
  return null;
}

// Debounce timer reference (module-level, outside zustand)
let _debounceTimer = null;

export const useEditorStore = create((set, get) => ({
  doc: INITIAL_DOC,
  selectedIds: ["Root"],
  expandedIds: new Set(["Root"]),
  gridSettings: { visible: false, size: 20, snap: false },
  errors: [],

  // --- History ---
  _undoStack: [],
  _redoStack: [],
  _lastSnapshot: null, // snapshot taken before the first debounced edit in a batch

  _pushUndoImmediate: () => {
    const { doc, selectedIds, _undoStack } = get();
    const snapshot = { doc: JSON.parse(JSON.stringify(doc)), selectedIds: [...selectedIds] };
    const newStack = [..._undoStack, snapshot];
    if (newStack.length > MAX_HISTORY) newStack.shift();
    set({ _undoStack: newStack, _redoStack: [] });
  },

  _pushUndoDebounced: () => {
    const { _lastSnapshot, _undoStack } = get();

    if (!_lastSnapshot) {
      const { doc, selectedIds } = get();
      set({ _lastSnapshot: { doc: JSON.parse(JSON.stringify(doc)), selectedIds: [...selectedIds] } });
    }

    if (_debounceTimer) clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(() => {
      const { _lastSnapshot: snap, _undoStack: stack } = get();
      if (snap) {
        const newStack = [...stack, snap];
        if (newStack.length > MAX_HISTORY) newStack.shift();
        set({ _undoStack: newStack, _redoStack: [], _lastSnapshot: null });
      }
    }, DEBOUNCE_MS);
  },

  undo: () => {
    if (_debounceTimer) {
      clearTimeout(_debounceTimer);
      _debounceTimer = null;
    }
    const { _lastSnapshot, _undoStack, _redoStack, doc, selectedIds } = get();
    let stack = _undoStack;
    if (_lastSnapshot) {
      stack = [...stack, _lastSnapshot];
      if (stack.length > MAX_HISTORY) stack.shift();
    }
    if (stack.length === 0) return;
    const prev = stack[stack.length - 1];
    const currentSnapshot = { doc: JSON.parse(JSON.stringify(doc)), selectedIds: [...selectedIds] };
    set({
      doc: prev.doc,
      selectedIds: prev.selectedIds || [],
      _undoStack: stack.slice(0, -1),
      _redoStack: [..._redoStack, currentSnapshot],
      _lastSnapshot: null,
    });
  },

  redo: () => {
    const { _undoStack, _redoStack, doc, selectedIds } = get();
    if (_redoStack.length === 0) return;
    const next = _redoStack[_redoStack.length - 1];
    const currentSnapshot = { doc: JSON.parse(JSON.stringify(doc)), selectedIds: [...selectedIds] };
    set({
      doc: next.doc,
      selectedIds: next.selectedIds || [],
      _undoStack: [..._undoStack, currentSnapshot],
      _redoStack: _redoStack.slice(0, -1),
    });
  },

  setSelectedIds: (ids) => set({ selectedIds: Array.isArray(ids) ? ids : (ids ? [ids] : []) }),
  
  toggleSelectedId: (id, multi) => set(state => {
    if (!multi) return { selectedIds: [id] };
    const newSelected = new Set(state.selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    return { selectedIds: Array.from(newSelected) };
  }),

  toggleExpandedId: (id) => set(state => {
    const newExpanded = new Set(state.expandedIds);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    return { expandedIds: newExpanded };
  }),

  setGridSettings: (settings) => set(state => ({
    gridSettings: { ...state.gridSettings, ...settings }
  })),

  setFullDoc: (newDoc) => {
    get()._pushUndoImmediate();
    const rootKey = getElementKey(newDoc.root);
    set({
      doc: newDoc,
      selectedIds: rootKey ? [rootKey] : [],
      expandedIds: new Set(rootKey ? [rootKey] : []),
    });
  },

  loadHytaleData: () => {
    console.log("Loading Hytale data...");
  },

  updateElement: (key, updates) => {
    get()._pushUndoDebounced();
    set(state => {
      const newDoc = JSON.parse(JSON.stringify(state.doc));
      const el = findElement(newDoc.root, key);
      let newSelectedIds = [...state.selectedIds];
      let newExpandedIds = new Set(state.expandedIds);

      if (el) {
        const oldKey = getElementKey(el);
        
        if (updates.properties) {
          el.properties = { ...el.properties, ...updates.properties };
          const rest = { ...updates };
          delete rest.properties;
          Object.assign(el, rest);
        } else {
          Object.assign(el, updates);
        }

        const newKey = getElementKey(el);

        // If the identifier changed, migrate selection and expansion state
        if (oldKey !== newKey) {
          newSelectedIds = newSelectedIds.map(id => id === oldKey ? newKey : id);
          if (newExpandedIds.has(oldKey)) {
            newExpandedIds.delete(oldKey);
            newExpandedIds.add(newKey);
          }
        }
      }
      return { doc: newDoc, selectedIds: newSelectedIds, expandedIds: newExpandedIds };
    });
  },

  addElement: (parentKey, elementData) => {
    const type = typeof elementData === 'string' ? elementData : elementData.type;
    const newId = `${type.replace(/[^a-zA-Z]/g, '')}_${Math.random().toString(36).substr(2, 5)}`;

    get()._pushUndoImmediate();
    set(state => {
      const newDoc = JSON.parse(JSON.stringify(state.doc));
      const parent = findElement(newDoc.root, parentKey);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push({
          type,
          id: newId,
          properties: typeof elementData === 'object' ? { ...elementData.properties } : {},
          children: typeof elementData === 'object' && elementData.children ? [...elementData.children] : [],
        });
      }
      return { doc: newDoc, selectedIds: [newId] };
    });
  },

  deleteElement: (key) => {
    if (key === "Root") return;
    const keysToDelete = Array.isArray(key) ? key : [key];
    if (keysToDelete.includes("Root")) return;

    get()._pushUndoImmediate();
    set(state => {
      const newDoc = JSON.parse(JSON.stringify(state.doc));
      const removeNodes = (node) => {
        if (!node.children) return;
        node.children = node.children.filter(c => !keysToDelete.includes(getElementKey(c)));
        node.children.forEach(removeNodes);
      };
      removeNodes(newDoc.root);
      return { doc: newDoc, selectedIds: [getElementKey(newDoc.root)] };
    });
  },

  serialize: () => HytaleUISerializer.serialize(get().doc),
}));
