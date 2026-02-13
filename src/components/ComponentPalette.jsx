import React from 'react';
import { Box, Type, MousePointer2, Layout, Square, Hash, AlignLeft, CheckSquare, List, Minus, SeparatorHorizontal, Heading } from 'lucide-react';

const PALETTE_ITEMS = [
    // Containers
    { label: 'Container', type: '$C.@Container', icon: Layout, desc: 'Window with title & close btn', category: 'Container' },
    { label: 'Decorated', type: '$C.@DecoratedContainer', icon: Layout, desc: 'Decorated border container', category: 'Container' },
    { label: 'Panel', type: '$C.@Panel', icon: Square, desc: 'Simple bordered panel', category: 'Container' },
    { label: 'Overlay', type: '$C.@PageOverlay', icon: Square, desc: 'Semi-transparent overlay', category: 'Container' },

    // Buttons
    { label: 'Button', type: '$C.@TextButton', icon: MousePointer2, desc: 'Primary button (blue)', category: 'Button' },
    { label: 'Secondary', type: '$C.@SecondaryTextButton', icon: MousePointer2, desc: 'Secondary button (gray)', category: 'Button' },
    { label: 'Cancel', type: '$C.@CancelTextButton', icon: MousePointer2, desc: 'Destructive button (red)', category: 'Button' },

    // Input
    { label: 'Text Field', type: '$C.@TextField', icon: Type, desc: 'Text input field', category: 'Input' },
    { label: 'Number Field', type: '$C.@NumberField', icon: Hash, desc: 'Numeric input field', category: 'Input' },
    { label: 'Dropdown', type: '$C.@DropdownBox', icon: List, desc: 'Dropdown selector', category: 'Input' },
    { label: 'Checkbox', type: '$C.@CheckBoxWithLabel', icon: CheckSquare, desc: 'Checkbox with label', category: 'Input' },

    // Layout
    { label: 'Group', type: 'Group', icon: Box, desc: 'Layout container', category: 'Layout' },
    { label: 'Label', type: 'Label', icon: Type, desc: 'Text display element', category: 'Layout' },
    { label: 'Separator', type: '$C.@ContentSeparator', icon: Minus, desc: 'Horizontal line', category: 'Layout' },
    { label: 'V-Separator', type: '$C.@VerticalSeparator', icon: SeparatorHorizontal, desc: 'Vertical line', category: 'Layout' },

    // Text
    { label: 'Title', type: '$C.@Title', icon: Heading, desc: 'Styled title text', category: 'Text' },
    { label: 'Subtitle', type: '$C.@Subtitle', icon: AlignLeft, desc: 'Styled subtitle text', category: 'Text' },
];

const CATEGORIES = ['Container', 'Button', 'Input', 'Layout', 'Text'];

export const ComponentPalette = ({ onItemClick }) => {
    const handleDragStart = (e, item) => {
        e.dataTransfer.setData('hytale/type', item.type);
        if (item.defaultProps) {
            e.dataTransfer.setData('hytale/props', JSON.stringify(item.defaultProps));
        }
    };

    return (
        <div className="space-y-4">
            {CATEGORIES.map(category => {
                const items = PALETTE_ITEMS.filter(i => i.category === category);
                return (
                    <div key={category}>
                        <div className="text-[9px] font-black uppercase tracking-[0.15em] text-hytale-muted/50 mb-2 px-1">{category}</div>
                        <div className="grid grid-cols-2 gap-1.5">
                            {items.map((item) => (
                                <div
                                    key={item.type + item.label}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, item)}
                                    onClick={() => onItemClick(item.type, item.defaultProps)}
                                    className="flex flex-col items-center justify-center p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-hytale-accent/50 rounded cursor-grab active:cursor-grabbing transition-all group"
                                >
                                    <item.icon className="w-5 h-5 text-hytale-muted group-hover:text-hytale-accent mb-1.5" />
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-hytale-text">{item.label}</span>
                                    <span className="text-[7px] text-hytale-muted/50 text-center mt-0.5 leading-tight">{item.desc}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
