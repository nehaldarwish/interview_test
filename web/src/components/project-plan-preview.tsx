import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "../lib/utils";

export interface Deliverable {
  title: string;
  description: string;
}

export interface Workstream {
  id: string;
  title: string;
  description: string;
  deliverables: Deliverable[];
}

export interface ProjectPlan {
  title?: string;
  workstreams: Workstream[];
}

interface ProjectPlanPreviewProps {
  plan: ProjectPlan;
}

export function ProjectPlanPreview({ plan }: ProjectPlanPreviewProps) {
  const [expandedWorkstreams, setExpandedWorkstreams] = useState<Set<string>>(
    new Set([plan.workstreams[0]?.id]) // First workstream expanded by default
  );

  const toggleWorkstream = (id: string) => {
    setExpandedWorkstreams((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getWorkstreamLetter = (index: number) => {
    return String.fromCharCode(65 + index); // A, B, C, D...
  };

  return (
    <div className="border border-border rounded-lg bg-background overflow-hidden my-4">
      {plan.title && (
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold">{plan.title}</h3>
        </div>
      )}

      <div className="divide-y divide-border">
        {plan.workstreams.map((workstream, index) => {
          const isExpanded = expandedWorkstreams.has(workstream.id);
          const letter = getWorkstreamLetter(index);

          return (
            <div key={workstream.id} className="bg-background">
              <button
                onClick={() => toggleWorkstream(workstream.id)}
                className="w-full px-6 py-4 flex items-start gap-4 hover:bg-accent/50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                  {letter}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-base mb-1">
                    {workstream.title}
                  </h4>
                  {!isExpanded && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {workstream.description}
                    </p>
                  )}
                </div>

                <div className="flex-shrink-0 ml-2">
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-6 pb-6 pt-2 space-y-6 animate-in slide-in-from-top-2 duration-200">
                  <p className="text-sm text-muted-foreground pl-14">
                    {workstream.description}
                  </p>

                  {workstream.deliverables.length > 0 && (
                    <div className="pl-14 space-y-4">
                      <h5 className="font-semibold text-sm">Deliverables</h5>
                      
                      <div className="space-y-4">
                        {workstream.deliverables.map((deliverable, idx) => (
                          <div key={idx} className="space-y-1">
                            <h6 className="font-medium text-sm flex items-start gap-2">
                              <span className="text-muted-foreground">•</span>
                              {deliverable.title}
                            </h6>
                            <p className="text-sm text-muted-foreground pl-4">
                              {deliverable.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}