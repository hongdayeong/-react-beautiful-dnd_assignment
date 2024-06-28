import React, { useState } from "react";
import ReactDOM from "react-dom";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const getColumnItems = (colId, count) =>
  Array.from({ length: count }, (v, k) => k).map((k) => ({
    id: `item-${colId}-${k}`,
    content: `item ${colId}-${k}`,
    isInvalid: false,
  }));

const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removedItem] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removedItem);
  return result;
};

const grid = 8;

const getItemStyle = (isDragging, isSelected, isInvalid, draggableStyle) => ({
  userSelect: "none",
  padding: grid * 2,
  margin: `0 0 ${grid}px 0`,
  background: isInvalid ? "#ff0000" : isSelected ? "#90EE90" : isDragging ? "#90EE90" : "#FFB6C1",
  borderRadius: "8px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  textAlign: "center",
  ...draggableStyle,
});

const getListStyle = (isDraggingOver) => ({
  background: isDraggingOver ? "lightblue" : "#E6E6FA",
  padding: grid,
  width: 250,
  width: "100%",
  maxWidth: "1280",
  margin: "0 auto",
});

const App = () => {
  const [columns, setColumns] = useState({
    col1: getColumnItems("col1", 10),
    col2: getColumnItems("col2", 10),
    col3: getColumnItems("col3", 10),
    col4: getColumnItems("col4", 10),
  });

  const [draggingItemId, setDraggingItemId] = useState(null);
  const [isInvalidMove, setIsInvalidMove] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState([]);

  const onDragStart = (start) => {
    setDraggingItemId(start.draggableId);
  };

  const onDragUpdate = (update) => {
    const { destination, source, draggableId } = update;

    if (!destination) {
      setIsInvalidMove(false);
      return;
    }

    const sourceColId = source.droppableId;
    const destColId = destination.droppableId;
    const destItems = Array.from(columns[destColId]);
    const movedItem = columns[sourceColId][source.index];
    let invalidMove = false;

    if (sourceColId === "col1" && destColId === "col3") {
      invalidMove = true;
    }

    if (
      parseInt(movedItem.id.split("-")[2], 10) % 2 === 0 &&
      destination.index < destItems.length &&
      parseInt(destItems[destination.index].id.split("-")[2], 10) % 2 === 0
    ) {
      invalidMove = true;
    }

    setIsInvalidMove(invalidMove);

    if (draggableId && !selectedItemIds.includes(draggableId)) {
      setSelectedItemIds([draggableId]);
    }
  };

  const onDragEnd = (result) => {
    const { source, destination } = result;

    if (!destination || isInvalidMove) {
      setSelectedItemIds([]);
      setDraggingItemId(null);
      setIsInvalidMove(false);
      return;
    }

    const sourceColId = source.droppableId;
    const destColId = destination.droppableId;
    const sourceItems = Array.from(columns[sourceColId]);
    const destItems = Array.from(columns[destColId]);

    if (sourceColId === destColId) {
      const reorderedItems = reorder(columns[sourceColId], source.index, destination.index);

      setColumns({
        ...columns,
        [sourceColId]: reorderedItems,
      });
    } else {
      const movedItems = [];
      const removedItems = [];

      selectedItemIds.forEach((id) => {
        const index = sourceItems.findIndex((item) => item.id === id);
        const [removedItem] = sourceItems.splice(index, 1);
        movedItems.push(removedItem);
        removedItems.push(index);
      });

      destItems.splice(destination.index, 0, ...movedItems);

      setColumns({
        ...columns,
        [sourceColId]: sourceItems,
        [destColId]: destItems,
      });
    }

    setSelectedItemIds([]);
    setDraggingItemId(null);
    setIsInvalidMove(false);
  };

  const toggleSelection = (itemId) => {
    const selectedIndex = selectedItemIds.indexOf(itemId);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedItemIds, itemId);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedItemIds.slice(1));
    } else if (selectedIndex === selectedItemIds.length - 1) {
      newSelected = newSelected.concat(selectedItemIds.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedItemIds.slice(0, selectedIndex),
        selectedItemIds.slice(selectedIndex + 1)
      );
    }

    setSelectedItemIds(newSelected);
  };

  return (
    <DragDropContext onDragStart={onDragStart} onDragUpdate={onDragUpdate} onDragEnd={onDragEnd}>
      <div style={{ display: "flex" }}>
        {Object.keys(columns).map((columnId) => (
          <Droppable key={columnId} droppableId={columnId}>
            {(provided, snapshot) => (
              <div ref={provided.innerRef} {...provided.droppableProps} style={getListStyle(snapshot.isDraggingOver)}>
                {columns[columnId].map((item, index) => (
                  <Draggable
                    key={item.id}
                    draggableId={item.id}
                    index={index}
                    isDragDisabled={selectedItemIds.length > 0 && !selectedItemIds.includes(item.id)}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={getItemStyle(
                          snapshot.isDragging,
                          selectedItemIds.includes(item.id),
                          isInvalidMove && selectedItemIds.includes(item.id),
                          provided.draggableProps.style
                        )}
                        onClick={(e) => {
                          if (e.ctrlKey || e.metaKey) {
                            toggleSelection(item.id);
                          } else {
                            setSelectedItemIds([item.id]);
                          }
                        }}
                      >
                        {item.content}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
