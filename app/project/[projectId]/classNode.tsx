// src/components/ClassNode.tsx
import React from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Key, Link } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/src/components/ui/card";
import { ClassData } from "./types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/src/components/ui/tooltip";
import { Label } from "@/src/components/ui/label";
import { cn } from "@/src/lib/utils";

interface ClassNodeProps extends NodeProps<ClassData> {
  isHighlighted?: boolean;
}

const ClassNode: React.FC<ClassNodeProps> = ({ data, id, isHighlighted }) => {
  return (
    <TooltipProvider delayDuration={200}>
      <Card
        className={cn(
          "min-w-[200px] border-border shadow-sm hover:shadow-md transition-shadow",
          isHighlighted && "ring-2 ring-primary shadow-lg border-primary"
        )}
      >
        <CardHeader
          className={cn(
            "bg-primary text-primary-foreground p-2 rounded-t-sm",
            isHighlighted && "bg-primary/80"
          )}
        >
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold">{data.name}</h4>
            <div className="flex space-x-1">
              <Handle
                type="target"
                position={Position.Left}
                className="w-2 h-2 bg-foreground"
              />
              <Handle
                type="source"
                position={Position.Right}
                className="w-2 h-2 bg-foreground"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2">
          {data.attributes.map((attribute, index) => (
            <div
              key={`${id}-${attribute.name}-${index}`}
              className="flex items-center py-1 border-b border-border last:border-b-0 group"
            >
              <Label className="flex-grow font-mono text-sm font-normal">
                {attribute.name}
              </Label>
              <span className="text-xs text-muted-foreground mr-2 font-mono">
                {attribute.type}
              </span>
              {(attribute.is_primary || attribute.is_foreign) && (
                <div className="flex items-center space-x-1">
                  {attribute.is_primary && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Key className="h-3 w-3 text-yellow-400 hover:text-yellow-300 transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        Primary Key
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {attribute.is_foreign && attribute.foreign_key_class && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link className="h-3 w-3 text-green-500 hover:text-green-400 transition-colors" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs">
                        Foreign Key → {attribute.foreign_key_class}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              )}
              {attribute.is_foreign && (
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`fk-${attribute.name}`}
                  className="w-2 h-2 bg-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default React.memo(ClassNode);
