'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';

// A simple Prisma schema parser.
function parsePrismaSchema(schemaString) {
  // List of common scalar types in Prisma.
  const scalarTypes = [
    'String',
    'Int',
    'Float',
    'Boolean',
    'DateTime',
    'Json'
  ];

  const nodes = [];
  const relationships = [];

  // Regex to capture content of each model block.
  // Matches "model <Name> { ... }"
  const modelRegex = /model\s+(\w+)\s*\{([\s\S]*?)\}/g;
  let match;
  while ((match = modelRegex.exec(schemaString)) !== null) {
    const modelName = match[1];
    const body = match[2];

    // Split body by newline and trim.
    const lines = body
      .split('\n')
      .map((line) => line.trim())
      .filter(
        (line) =>
          line &&
          !line.startsWith('//') &&
          !line.startsWith('@@') &&
          !line.startsWith('generator') &&
          !line.startsWith('datasource')
      );

    const fields = [];
    lines.forEach((line) => {
      // Regex to split the field line into: name, type and attributes.
      const fieldRegex = /^(\w+)\s+([\w\[\]?]+)(.*)$/;
      const fieldMatch = fieldRegex.exec(line);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        let fieldType = fieldMatch[2];
        const rest = fieldMatch[3].trim();

        // Check for optional (trailing ?)
        let isOptional = false;
        if (fieldType.endsWith('?')) {
          isOptional = true;
          fieldType = fieldType.slice(0, -1);
        }

        // Check if field is an array (list)
        let isArray = false;
        if (fieldType.endsWith('[]')) {
          isArray = true;
          fieldType = fieldType.slice(0, -2);
        }

        const field = {
          name: fieldName,
          type: fieldType,
          optional: isOptional,
          array: isArray,
          attributes: rest
        };

        fields.push(field);

        // Simple heuristic for relationship:
        if (!scalarTypes.includes(fieldType)) {
          relationships.push({
            from: modelName,
            via: fieldName,
            to: fieldType,
            type: isArray ? 'one-to-many' : 'one-to-one'
          });
        }
      }
    });

    nodes.push({ name: modelName, fields });
  }

  return { nodes, relationships };
}

// A Schema Node component with drag handle.
const SchemaNode = ({ title, fields, position, onDrag }) => {
  const nodeRef = useRef(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const nodeStartPos = useRef({ x: 0, y: 0 });

  // Handler for mouse move while dragging.
  const handleMouseMove = useCallback(
    (e) => {
      const dx = e.clientX - dragStartPos.current.x;
      const dy = e.clientY - dragStartPos.current.y;
      const newPos = {
        x: nodeStartPos.current.x + dx,
        y: nodeStartPos.current.y + dy
      };
      onDrag(newPos);
    },
    [onDrag]
  );

  // Handler for mouse up to stop dragging.
  const handleMouseUp = useCallback(() => {
    // Remove event listeners when drag ends.
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const handleMouseDown = (e) => {
    // Record starting positions.
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    nodeStartPos.current = { ...position };
    // Attach event listeners.
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    // Prevent text selection while dragging.
    e.preventDefault();
  };

  return (
    <div
      ref={nodeRef}
      className="absolute bg-white rounded-lg shadow-lg border-2 border-blue-200"
      style={{
        left: position.x,
        top: position.y,
        width: '220px',
        height: '300px',
        overflowY: 'auto'
      }}
    >
      {/* Drag Handle */}
      <div
        onMouseDown={handleMouseDown}
        className="bg-blue-500 text-white rounded-t-lg p-2 cursor-move flex justify-between items-center"
        style={{ userSelect: 'none' }} // Prevent text selection during drag
      >
        <h3 className="text-lg font-bold">{title}</h3>
        {/* Optional: Add an icon to indicate draggable area */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M4 10a1 1 0 112 0 1 1 0 01-2 0zm5 0a1 1 0 112 0 1 1 0 01-2 0zm5 0a1 1 0 112 0 1 1 0 01-2 0z" />
        </svg>
      </div>
      {/* Node Content */}
      <div className="p-4 text-sm">
        {fields.map((field, index) => (
          <div
            key={index}
            className="py-1 border-b border-gray-100 last:border-b-0"
          >
            <div className="flex justify-between">
              <span className="font-medium">{field.name}</span>
              <span className="text-gray-600">{field.type}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SchemaVisualization = () => {
  const [schemaText, setSchemaText] = useState('Loading schema...');
  const [parsedData, setParsedData] = useState({
    nodes: [],
    relationships: []
  });
  const [nodePositions, setNodePositions] = useState({});
  const [containerOffset, setContainerOffset] = useState(null);
  const [hideIsolatedNodes, setHideIsolatedNodes] = useState(false);
  const containerRef = useRef(null);

  // Fetch schema on mount.
  useEffect(() => {
    fetch('/api/schema')
      .then((res) => res.json())
      .then((data) => {
        setSchemaText(data.schema);
      })
      .catch((error) => {
        console.error('Error fetching schema:', error);
        setSchemaText('Error loading schema');
      });
  }, []);

  // Parse schema and calculate grid positions.
  useEffect(() => {
    if (
      schemaText &&
      schemaText !== 'Loading schema...' &&
      schemaText !== 'Error loading schema'
    ) {
      const result = parsePrismaSchema(schemaText);
      const containerWidth =
        (containerRef.current && containerRef.current.clientWidth) ||
        window.innerWidth;
      const nodeWidth = 220; // same as in SchemaNode.
      const nodeHeight = 300;
      const spacingX = 50;
      const spacingY = 50;
      const maxPerRow = Math.floor(
        (containerWidth - spacingX) / (nodeWidth + spacingX)
      );
      const positions = {};
      result.nodes.forEach((node, index) => {
        const row = Math.floor(index / maxPerRow);
        const col = index % maxPerRow;
        positions[node.name] = {
          x: spacingX + col * (nodeWidth + spacingX),
          y: spacingY + row * (nodeHeight + spacingY)
        };
      });
      setParsedData(result);
      setNodePositions(positions);
    }
  }, [schemaText, containerOffset]);

  useEffect(() => {
    const updateContainerOffset = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerOffset({ x: rect.x, y: rect.y });
      }
    };

    updateContainerOffset();
    window.addEventListener('resize', updateContainerOffset);
    return () =>
      window.removeEventListener('resize', updateContainerOffset);
  }, []);

  const updatePosition = (nodeName, newPos) => {
    setNodePositions((prev) => ({
      ...prev,
      [nodeName]: newPos
    }));
  };

  // Helper to determine which nodes are isolated.
  const getFilteredNodes = () => {
    if (!hideIsolatedNodes) return parsedData.nodes;
    const connectedNodes = new Set();
    parsedData.relationships.forEach((rel) => {
      connectedNodes.add(rel.from);
      connectedNodes.add(rel.to);
    });
    return parsedData.nodes.filter((node) => connectedNodes.has(node.name));
  };

  const drawRelationshipLines = () => {
    if (!containerOffset) return null;
    // Only draw if all nodes have measured positions.
    if (
      Object.keys(nodePositions).length !== parsedData.nodes.length
    )
      return null;
    return parsedData.relationships.map((rel, index) => {
      // Only draw if both nodes are visible.
      if (!(rel.from in nodePositions) || !(rel.to in nodePositions))
        return null;
      const from = nodePositions[rel.from];
      const to = nodePositions[rel.to];
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      const curve = `M ${from.x + 110} ${from.y} Q ${midX + 110} ${from.y} ${midX + 110} ${midY} T ${to.x + 110} ${to.y}`;
      return (
        <g key={index}>
          <path
            id={`path-${index}`}
            d={curve}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            className="opacity-50"
          />
          <text>
            <textPath
              href={`#path-${index}`}
              startOffset="50%"
              className="text-sm fill-gray-600"
              textAnchor="middle"
            >
              {rel.via ? rel.via : rel.type}
            </textPath>
          </text>
          <path
            d={`M ${to.x + 110 - 5} ${to.y - 5} L ${to.x + 110
              } ${to.y} L ${to.x + 110 - 5} ${to.y + 5}`}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
          />
        </g>
      );
    });
  };

  // Get filtered nodes for rendering.
  const filteredNodes = getFilteredNodes();

  return (
    <div className="relative" style={{ height: '100vh' }}>
      <div className="p-4">
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            className="form-checkbox"
            checked={hideIsolatedNodes}
            onChange={(e) => setHideIsolatedNodes(e.target.checked)}
          />
          <span className="ml-2">Hide nodes with no relationships</span>
        </label>
      </div>
      <div
        ref={containerRef}
        className="relative w-full h-full bg-gray-50 overflow-hidden"
      >
        <svg
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        >
          {drawRelationshipLines()}
        </svg>
        {filteredNodes.map((node) => (
          <SchemaNode
            key={node.name}
            title={node.name}
            fields={node.fields}
            position={nodePositions[node.name] || { x: 0, y: 0 }}
            onDrag={(newPos) => updatePosition(node.name, newPos)}
          />
        ))}
      </div>
    </div>
  );
};

export default SchemaVisualization;
