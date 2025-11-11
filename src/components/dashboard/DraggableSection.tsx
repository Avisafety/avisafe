import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { ReactNode } from "react";

interface DraggableSectionProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export const DraggableSection = ({ id, children, className }: DraggableSectionProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${className || ""}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-1 top-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
      >
        <GripVertical className="w-5 h-5 text-primary" />
      </div>
      {children}
    </div>
  );
};
