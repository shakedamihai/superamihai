import React, { useState } from 'react';
import Collapsible from 'react-collapsible';

const PantryCheckView = () => {
    const [activeId, setActiveId] = useState(null);

    const handleDragStart = (id) => {
        setActiveId(id);
    };

    const handleDragEnd = () => {
        setActiveId(null);
    };

    return (
        <div>
            {/* Assuming departments is an array of your department data */}
            {departments.map(department => (
                <Collapsible
                    key={department.id}
                    open={activeId === department.id}
                    onDragStart={() => handleDragStart(department.id)}
                    onDragEnd={handleDragEnd}
                >
                    <div>{department.name}</div>
                    {/* Other department content here */}
                </Collapsible>
            ))}
        </div>
    );
};

export default PantryCheckView;