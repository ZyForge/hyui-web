import React from 'react';
import { Settings2, X, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { PropertyField } from './PropertyEditor';

export const VariableEditor = ({ variables, onUpdate, errors = [] }) => {
    const varNames = Object.keys(variables);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {varNames.length === 0 ? (
                <div className="p-8 text-center bg-black/20 rounded-xl border border-dashed border-white/5">
                    <Settings2 className="w-8 h-8 text-hytale-muted/30 mx-auto mb-3" />
                    <p className="text-xs text-hytale-muted italic uppercase tracking-widest font-bold">No global variables defined</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {varNames.map(name => {
                        const value = variables[name];
                        const varErrors = errors.filter(e => e.elementId === `@${name}`);
                        const hasError = varErrors.length > 0;

                        return (
                            <div key={name} className={clsx(
                                "group bg-black/30 border rounded-xl transition-all duration-200 overflow-hidden shadow-lg",
                                hasError ? "border-red-500/50" : "border-white/5 hover:border-white/10"
                            )}>
                                {/* Variable Header */}
                                <div className="px-4 py-2 bg-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={clsx(
                                            "w-2 h-2 rounded-full",
                                            hasError ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-hytale-accent/30"
                                        )} />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-hytale-accent truncate max-w-[150px]">
                                            @{name}
                                        </span>
                                    </div>
                                    {hasError && (
                                        <div className="flex items-center gap-1.5 text-[8px] font-black text-red-500 uppercase tracking-tighter">
                                            <AlertCircle size={10} />
                                            <span>Invalid Value</span>
                                        </div>
                                    )}
                                </div>

                                {/* Variable Value Editor */}
                                <div className="p-4 space-y-3">
                                    <div className="flex flex-col gap-1.5">
                                        <PropertyField 
                                            label="Value"
                                            value={value}
                                            onChange={(val) => onUpdate(name, val)}
                                            errors={varErrors}
                                            allErrors={errors}
                                            schema={typeof value === 'object' && value !== null && value.__type === 'LabelStyle' ? {
                                                type: 'style',
                                                subkeys: ['FontSize', 'TextColor', 'RenderUppercase', 'HorizontalAlignment', 'VerticalAlignment', 'Bold']
                                            } : null}
                                        />
                                    </div>

                                    {/* Error Messages */}
                                    {hasError && (
                                        <div className="pt-3 border-t border-red-500/20 space-y-2">
                                            {varErrors.map((err, i) => (
                                                <div key={i} className="flex items-start gap-1.5 text-[9px] text-red-400/80 font-bold italic leading-relaxed break-words whitespace-normal">
                                                    <span className="text-red-500 flex-shrink-0">•</span>
                                                    <span>{err.message}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
