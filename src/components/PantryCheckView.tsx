import { DragStartEvent } from '@dnd-kit/core';
import React, { useState } from 'react';

const PantryCheckView = () => {
    const [activeId, setActiveId] = useState<string | null>(null);

    const handleDeptDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id);
    };

    const handleDeptDragEnd = (event: any) => {
        // Reset activeId to null at the start
        setActiveId(null);
        // ...other existing logic
    };

    return (
        <DndContext onDragStart={handleDeptDragStart}>
            {/* other components and logic */}
            <Collapsible open={activeId === dept.id ? false : openDepts[dept.name] !== false}> 
                {/* Collapsible content */}
            </Collapsible>
            <ChevronDown className={activeId ? 'active' : ''} />
            {/* other components and logic */}
        </DndContext>
    );
};

export default PantryCheckView;