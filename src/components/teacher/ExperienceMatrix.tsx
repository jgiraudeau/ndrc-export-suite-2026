"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { TRANSVERSAL_REFERENTIAL, type TransversalBlock } from "@/data/transversal-referential";

interface ExperienceMatrixProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function ExperienceMatrix({ selectedIds, onChange }: ExperienceMatrixProps) {
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({
    "E4.CIBLER": true,
    "E5.WP": true
  });

  const toggleBlock = (id: string) => {
    setExpandedBlocks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleItem = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
      {TRANSVERSAL_REFERENTIAL.map((block) => {
        const isExpanded = expandedBlocks[block.id];
        const selectedInBlock = block.items.filter(i => selectedIds.includes(i.id)).length;

        return (
          <div key={block.id} className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
            <button
              type="button"
              onClick={() => toggleBlock(block.id)}
              className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-black text-white",
                  block.items[0]?.block === "E4" ? "bg-blue-500" : 
                  block.items[0]?.block === "E5" ? "bg-purple-500" : "bg-pink-500"
                )}>
                  {block.items[0]?.block}
                </div>
                <span className="font-bold text-slate-700 text-sm">{block.label}</span>
                {selectedInBlock > 0 && (
                  <span className="ml-2 w-5 h-5 flex items-center justify-center bg-purple-600 text-white text-[10px] font-black rounded-full">
                    {selectedInBlock}
                  </span>
                )}
              </div>
              {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </button>

            {isExpanded && (
              <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                {block.items.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleItem(item.id)}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-xl border text-left transition-all",
                        isSelected 
                          ? "border-purple-200 bg-purple-50 text-purple-700 font-medium" 
                          : "border-slate-50 bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      <div className={cn(
                        "mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all",
                        isSelected ? "bg-purple-600 border-purple-600" : "border-slate-300"
                      )}>
                        {isSelected && <Check size={10} className="text-white" />}
                      </div>
                      <span className="text-[11px] leading-tight">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
