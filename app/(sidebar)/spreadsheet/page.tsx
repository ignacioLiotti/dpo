'use client'
import React, { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { ChevronDown, Copy, Trash2, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

// Context Menu Component
const ContextMenu = ({ x, y, onClose, onCopy, onPaste, onDelete, onFormat, cellValue }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[200px]"
      style={{ left: x, top: y }}
    >
      <button
        onClick={() => { onCopy(); onClose(); }}
        className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center gap-2"
      >
        <Copy className="w-4 h-4" /> Copy
      </button>
      <button
        onClick={() => { onPaste(); onClose(); }}
        className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center gap-2"
      >
        <Copy className="w-4 h-4" /> Paste
      </button>
      <button
        onClick={() => { onDelete(); onClose(); }}
        className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center gap-2"
      >
        <Trash2 className="w-4 h-4" /> Delete
      </button>
      <div className="border-t border-gray-200 my-1" />
      <button
        onClick={() => { onFormat('bold'); onClose(); }}
        className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center gap-2"
      >
        <Bold className="w-4 h-4" /> Bold
      </button>
      <button
        onClick={() => { onFormat('italic'); onClose(); }}
        className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center gap-2"
      >
        <Italic className="w-4 h-4" /> Italic
      </button>
      <button
        onClick={() => { onFormat('underline'); onClose(); }}
        className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center gap-2"
      >
        <Underline className="w-4 h-4" /> Underline
      </button>
      <div className="border-t border-gray-200 my-1" />
      <button
        onClick={() => { onFormat('align-left'); onClose(); }}
        className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center gap-2"
      >
        <AlignLeft className="w-4 h-4" /> Align Left
      </button>
      <button
        onClick={() => { onFormat('align-center'); onClose(); }}
        className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center gap-2"
      >
        <AlignCenter className="w-4 h-4" /> Align Center
      </button>
      <button
        onClick={() => { onFormat('align-right'); onClose(); }}
        className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center gap-2"
      >
        <AlignRight className="w-4 h-4" /> Align Right
      </button>
    </div>
  );
};

// Memoized cell component to prevent unnecessary re-renders
const Cell = memo(({
  rowIndex,
  colIndex,
  value,
  displayValue,
  formatting,
  isSelected,
  isEditing,
  isRanged,
  hasError,
  onCellClick,
  onCellDoubleClick,
  onCellChange,
  onKeyDown,
  onEditingChange,
  onContextMenu,
  onMouseDown,
  onMouseEnter
}) => {
  const inputRef = useRef(null);
  const key = `${rowIndex}-${colIndex}`;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const getCellStyle = () => {
    const style = {};
    if (formatting) {
      if (formatting.bold) style.fontWeight = 'bold';
      if (formatting.italic) style.fontStyle = 'italic';
      if (formatting.underline) style.textDecoration = 'underline';
      if (formatting.align) style.textAlign = formatting.align;
    }
    return style;
  };

  return (
    <td
      className={`
        border-b border-r border-gray-300 h-8 p-0 relative select-none
        ${isSelected ? 'ring-2 ring-blue-500 ring-inset' : ''}
        ${isRanged && !isSelected ? 'bg-blue-50' : ''}
        ${hasError ? 'text-red-600' : ''}
      `}
      onClick={(e) => onCellClick(rowIndex, colIndex, e)}
      onDoubleClick={() => onCellDoubleClick(rowIndex, colIndex)}
      onContextMenu={(e) => onContextMenu(e, rowIndex, colIndex)}
      onMouseDown={(e) => onMouseDown(e, rowIndex, colIndex)}
      onMouseEnter={() => onMouseEnter(rowIndex, colIndex)}
      title={hasError || ''}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={value || ''}
          onChange={(e) => onCellChange(rowIndex, colIndex, e.target.value)}
          onKeyDown={(e) => onKeyDown(e, rowIndex, colIndex)}
          className="w-full h-full px-2 text-sm border-0 outline-none"
          onBlur={() => onEditingChange(null)}
        />
      ) : (
        <div
          className="w-full h-full px-2 text-sm flex items-center cursor-cell overflow-hidden"
          style={getCellStyle()}
          tabIndex={isSelected ? 0 : -1}
          onKeyDown={(e) => onKeyDown(e, rowIndex, colIndex)}
        >
          {displayValue}
        </div>
      )}
    </td>
  );
});

Cell.displayName = 'Cell';

const Spreadsheet = ({
  defaultData = [],
  rows = 20,
  columns = 10,
  onCellChange = () => { }
}) => {
  // Generate column headers (A, B, C, ..., Z, AA, AB, ...)
  const getColumnLabel = (index) => {
    let label = '';
    let i = index;
    while (i >= 0) {
      label = String.fromCharCode(65 + (i % 26)) + label;
      i = Math.floor(i / 26) - 1;
    }
    return label;
  };

  // Parse column letter to index (A -> 0, B -> 1, etc.)
  const parseColumnIndex = (col) => {
    col = col.toUpperCase();
    let index = 0;
    for (let i = 0; i < col.length; i++) {
      index = index * 26 + (col.charCodeAt(i) - 65 + 1);
    }
    return index - 1;
  };

  // Parse cell reference (A1 -> [0, 0])
  const parseCellReference = (ref) => {
    const match = ref.toUpperCase().match(/^([A-Z]+)(\d+)$/);
    if (!match) return null;
    const col = parseColumnIndex(match[1]);
    const row = parseInt(match[2]) - 1;
    return [row, col];
  };

  // Parse range reference (A1:B2 -> [[0,0], [1,1]])
  const parseRangeReference = (range) => {
    const parts = range.split(':');
    if (parts.length !== 2) return null;
    const start = parseCellReference(parts[0]);
    const end = parseCellReference(parts[1]);
    if (!start || !end) return null;
    return [start, end];
  };

  // Initialize data with default values or empty cells
  const initializeData = () => {
    const data = {};
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const key = `${row}-${col}`;
        if (defaultData[row] && defaultData[row][col] !== undefined) {
          data[key] = defaultData[row][col];
        } else {
          data[key] = '';
        }
      }
    }
    return data;
  };

  const [cellData, setCellData] = useState(initializeData);
  const [selectedCell, setSelectedCell] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [selectedRange, setSelectedRange] = useState({ start: null, end: null });
  const [errors, setErrors] = useState({});
  const [clipboard, setClipboard] = useState({ data: {}, range: null });
  const [contextMenu, setContextMenu] = useState(null);
  const [cellFormatting, setCellFormatting] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);

  // Cache for computed values and dependencies
  const computeCache = useRef({});
  const dependencyGraph = useRef({});

  // Formula evaluation functions
  const formulaFunctions = {
    SUM: (args) => args.reduce((a, b) => a + (parseFloat(b) || 0), 0),
    AVERAGE: (args) => {
      const nums = args.filter(v => !isNaN(parseFloat(v)));
      return nums.length ? nums.reduce((a, b) => a + parseFloat(b), 0) / nums.length : 0;
    },
    MIN: (args) => {
      const nums = args.filter(v => !isNaN(parseFloat(v))).map(parseFloat);
      return nums.length ? Math.min(...nums) : 0;
    },
    MAX: (args) => {
      const nums = args.filter(v => !isNaN(parseFloat(v))).map(parseFloat);
      return nums.length ? Math.max(...nums) : 0;
    },
    COUNT: (args) => args.filter(v => v !== '' && !isNaN(parseFloat(v))).length,
    COUNTA: (args) => args.filter(v => v !== '').length,
    IF: (args) => {
      if (args.length < 2) return 0;
      const condition = args[0];
      const trueVal = args[1] || '';
      const falseVal = args[2] || '';
      return condition ? trueVal : falseVal;
    },
    CONCATENATE: (args) => args.join(''),
    ABS: (args) => Math.abs(parseFloat(args[0]) || 0),
    ROUND: (args) => {
      const num = parseFloat(args[0]) || 0;
      const decimals = parseInt(args[1]) || 0;
      return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
    }
  };

  // Extract dependencies from a formula
  const extractDependencies = (formula) => {
    const deps = new Set();

    // Extract range references
    const rangeMatches = formula.matchAll(/([A-Z]+\d+):([A-Z]+\d+)/gi);
    for (const match of rangeMatches) {
      const range = parseRangeReference(match[0]);
      if (range) {
        const [start, end] = range;
        for (let row = start[0]; row <= end[0]; row++) {
          for (let col = start[1]; col <= end[1]; col++) {
            deps.add(`${row}-${col}`);
          }
        }
      }
    }

    // Extract single cell references
    const cellMatches = formula.matchAll(/(?<![A-Z])([A-Z]+\d+)(?![A-Z0-9])/gi);
    for (const match of cellMatches) {
      const ref = parseCellReference(match[0]);
      if (ref) {
        deps.add(`${ref[0]}-${ref[1]}`);
      }
    }

    return Array.from(deps);
  };

  // Get cells that depend on a given cell
  const getDependents = (cellKey) => {
    const dependents = [];
    for (const [key, deps] of Object.entries(dependencyGraph.current)) {
      if (deps.includes(cellKey)) {
        dependents.push(key);
      }
    }
    return dependents;
  };

  // Get cell values for a range
  const getRangeValues = (range) => {
    const [start, end] = range;
    const values = [];
    for (let row = start[0]; row <= end[0]; row++) {
      for (let col = start[1]; col <= end[1]; col++) {
        const key = `${row}-${col}`;
        values.push(getCellValue(key));
      }
    }
    return values;
  };

  // Get computed value for a cell
  const getCellValue = (key) => {
    if (computeCache.current[key] !== undefined) {
      return computeCache.current[key];
    }

    const value = cellData[key];
    if (typeof value === 'string' && value.startsWith('=')) {
      try {
        const result = evaluateFormula(value, key);
        computeCache.current[key] = result;
        return result;
      } catch (e) {
        computeCache.current[key] = '#ERROR!';
        setErrors(prev => ({ ...prev, [key]: e.message }));
        return '#ERROR!';
      }
    }

    computeCache.current[key] = value;
    return value;
  };

  // Evaluate a formula
  const evaluateFormula = (formula, cellKey, visitedCells = new Set()) => {
    // Check for circular references
    if (visitedCells.has(cellKey)) {
      throw new Error('Circular reference detected');
    }
    visitedCells.add(cellKey);

    try {
      // Remove the leading '='
      formula = formula.substring(1).trim();

      // Replace cell references with values
      formula = formula.replace(/([A-Z]+\d+):([A-Z]+\d+)/gi, (match) => {
        const range = parseRangeReference(match);
        if (range) {
          const values = getRangeValues(range);
          return `[${values.map(v => isNaN(parseFloat(v)) ? `"${v}"` : v).join(',')}]`;
        }
        return match;
      });

      // Replace single cell references
      formula = formula.replace(/([A-Z]+\d+)/gi, (match) => {
        const ref = parseCellReference(match);
        if (ref) {
          const [row, col] = ref;
          const key = `${row}-${col}`;
          const value = getCellValue(key);
          return isNaN(parseFloat(value)) ? `"${value}"` : value;
        }
        return match;
      });

      // Handle functions
      formula = formula.replace(/([A-Z]+)\s*\((.*?)\)/gi, (match, funcName, args) => {
        const func = formulaFunctions[funcName.toUpperCase()];
        if (func) {
          // Parse arguments
          let argValues = [];
          try {
            // Handle array arguments from ranges
            const processedArgs = args.replace(/\[([^\]]+)\]/g, (m, arrayContent) => {
              const values = JSON.parse(`[${arrayContent}]`);
              argValues.push(...values);
              return '';
            });

            // Handle remaining arguments
            if (processedArgs.trim()) {
              const remainingArgs = processedArgs.split(',').map(arg => {
                arg = arg.trim();
                try {
                  return JSON.parse(arg);
                } catch {
                  return arg;
                }
              });
              argValues.push(...remainingArgs);
            }
          } catch (e) {
            argValues = [args];
          }

          return func(argValues);
        }
        return match;
      });

      // Evaluate the expression
      const result = Function('"use strict"; return (' + formula + ')')();
      return result;
    } catch (e) {
      throw new Error(`Invalid formula: ${e.message}`);
    }
  };

  // Invalidate cache for affected cells
  const invalidateCache = (cellKey) => {
    const toInvalidate = [cellKey];
    const invalidated = new Set();

    while (toInvalidate.length > 0) {
      const key = toInvalidate.pop();
      if (invalidated.has(key)) continue;

      invalidated.add(key);
      delete computeCache.current[key];

      // Add dependents to invalidation queue
      const dependents = getDependents(key);
      toInvalidate.push(...dependents);
    }

    return invalidated;
  };

  // Handle cell value changes
  const handleCellChange = useCallback((row, col, value) => {
    const key = `${row}-${col}`;

    // Update cell data
    setCellData(prev => ({ ...prev, [key]: value }));

    // Update dependency graph if it's a formula
    if (typeof value === 'string' && value.startsWith('=')) {
      dependencyGraph.current[key] = extractDependencies(value);
    } else {
      delete dependencyGraph.current[key];
    }

    // Invalidate cache for this cell and its dependents
    const invalidated = invalidateCache(key);

    // Clear errors for invalidated cells
    setErrors(prev => {
      const newErrors = { ...prev };
      invalidated.forEach(k => delete newErrors[k]);
      return newErrors;
    });

    onCellChange(row, col, value);
  }, [onCellChange]);

  const handleCellClick = useCallback((row, col, e) => {
    if (isDragging) return;

    const key = `${row}-${col}`;

    if (e.shiftKey && selectedCell) {
      const [startRow, startCol] = selectedCell.split('-').map(Number);
      setSelectedRange({
        start: { row: Math.min(startRow, row), col: Math.min(startCol, col) },
        end: { row: Math.max(startRow, row), col: Math.max(startCol, col) }
      });
    } else {
      setSelectedCell(key);
      setSelectedRange({ start: null, end: null });
    }
  }, [selectedCell, isDragging]);

  const handleCellDoubleClick = useCallback((row, col) => {
    const key = `${row}-${col}`;
    setEditingCell(key);
  }, []);

  const handleMouseDown = useCallback((e, row, col) => {
    if (e.button !== 0) return; // Only left click

    const key = `${row}-${col}`;
    setSelectedCell(key);
    setDragStart({ row, col });
    setIsDragging(true);
    setSelectedRange({
      start: { row, col },
      end: { row, col }
    });

    e.preventDefault();
  }, []);

  const handleMouseEnter = useCallback((row, col) => {
    if (isDragging && dragStart) {
      setSelectedRange({
        start: {
          row: Math.min(dragStart.row, row),
          col: Math.min(dragStart.col, col)
        },
        end: {
          row: Math.max(dragStart.row, row),
          col: Math.max(dragStart.col, col)
        }
      });
    }
  }, [isDragging, dragStart]);

  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
      setDragStart(null);
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleContextMenu = useCallback((e, row, col) => {
    e.preventDefault();
    const key = `${row}-${col}`;

    // Select the cell if not already selected
    if (!isInRange(row, col) && selectedCell !== key) {
      setSelectedCell(key);
      setSelectedRange({ start: null, end: null });
    }

    setContextMenu({ x: e.clientX, y: e.clientY });
  }, [selectedCell]);

  const handleCopy = useCallback(() => {
    const data = {};
    let range = null;

    if (selectedRange.start && selectedRange.end) {
      range = { ...selectedRange };
      for (let row = range.start.row; row <= range.end.row; row++) {
        for (let col = range.start.col; col <= range.end.col; col++) {
          const key = `${row}-${col}`;
          const relKey = `${row - range.start.row}-${col - range.start.col}`;
          data[relKey] = {
            value: cellData[key] || '',
            formatting: cellFormatting[key] || {}
          };
        }
      }
    } else if (selectedCell) {
      data['0-0'] = {
        value: cellData[selectedCell] || '',
        formatting: cellFormatting[selectedCell] || {}
      };
      const [row, col] = selectedCell.split('-').map(Number);
      range = { start: { row, col }, end: { row, col } };
    }

    setClipboard({ data, range });

    // Also copy to system clipboard
    const text = Object.values(data).map(cell => cell.value).join('\t');
    navigator.clipboard.writeText(text);
  }, [selectedRange, selectedCell, cellData, cellFormatting]);

  const handlePaste = useCallback(() => {
    if (!clipboard.data || Object.keys(clipboard.data).length === 0) return;

    let targetRow, targetCol;
    if (selectedCell) {
      [targetRow, targetCol] = selectedCell.split('-').map(Number);
    } else if (selectedRange.start) {
      targetRow = selectedRange.start.row;
      targetCol = selectedRange.start.col;
    } else {
      return;
    }

    const newData = { ...cellData };
    const newFormatting = { ...cellFormatting };
    const toInvalidate = new Set();

    Object.entries(clipboard.data).forEach(([relKey, cellInfo]) => {
      const [relRow, relCol] = relKey.split('-').map(Number);
      const newRow = targetRow + relRow;
      const newCol = targetCol + relCol;

      if (newRow < rows && newCol < columns) {
        const key = `${newRow}-${newCol}`;
        newData[key] = cellInfo.value;
        newFormatting[key] = cellInfo.formatting;
        toInvalidate.add(key);

        // Update dependency graph if it's a formula
        if (typeof cellInfo.value === 'string' && cellInfo.value.startsWith('=')) {
          dependencyGraph.current[key] = extractDependencies(cellInfo.value);
        } else {
          delete dependencyGraph.current[key];
        }
      }
    });

    setCellData(newData);
    setCellFormatting(newFormatting);

    // Invalidate cache for pasted cells and their dependents
    toInvalidate.forEach(key => invalidateCache(key));
  }, [clipboard, selectedCell, selectedRange, cellData, cellFormatting, rows, columns]);

  const handleDelete = useCallback(() => {
    const toDelete = [];

    if (selectedRange.start && selectedRange.end) {
      for (let row = selectedRange.start.row; row <= selectedRange.end.row; row++) {
        for (let col = selectedRange.start.col; col <= selectedRange.end.col; col++) {
          toDelete.push(`${row}-${col}`);
        }
      }
    } else if (selectedCell) {
      toDelete.push(selectedCell);
    }

    const newData = { ...cellData };
    const newFormatting = { ...cellFormatting };
    const toInvalidate = new Set();

    toDelete.forEach(key => {
      newData[key] = '';
      delete newFormatting[key];
      delete dependencyGraph.current[key];
      toInvalidate.add(key);
    });

    setCellData(newData);
    setCellFormatting(newFormatting);

    // Invalidate cache
    toInvalidate.forEach(key => invalidateCache(key));
  }, [selectedRange, selectedCell, cellData, cellFormatting]);

  const handleFormat = useCallback((format) => {
    const toFormat = [];

    if (selectedRange.start && selectedRange.end) {
      for (let row = selectedRange.start.row; row <= selectedRange.end.row; row++) {
        for (let col = selectedRange.start.col; col <= selectedRange.end.col; col++) {
          toFormat.push(`${row}-${col}`);
        }
      }
    } else if (selectedCell) {
      toFormat.push(selectedCell);
    }

    const newFormatting = { ...cellFormatting };

    toFormat.forEach(key => {
      if (!newFormatting[key]) newFormatting[key] = {};

      switch (format) {
        case 'bold':
          newFormatting[key].bold = !newFormatting[key].bold;
          break;
        case 'italic':
          newFormatting[key].italic = !newFormatting[key].italic;
          break;
        case 'underline':
          newFormatting[key].underline = !newFormatting[key].underline;
          break;
        case 'align-left':
          newFormatting[key].align = 'left';
          break;
        case 'align-center':
          newFormatting[key].align = 'center';
          break;
        case 'align-right':
          newFormatting[key].align = 'right';
          break;
      }
    });

    setCellFormatting(newFormatting);
  }, [selectedRange, selectedCell, cellFormatting]);

  const handleKeyDown = useCallback((e, row, col) => {
    const key = `${row}-${col}`;

    // Handle copy/paste
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'c':
          e.preventDefault();
          handleCopy();
          return;
        case 'v':
          e.preventDefault();
          handlePaste();
          return;
        case 'x':
          e.preventDefault();
          handleCopy();
          handleDelete();
          return;
      }
    }

    if (editingCell === key) {
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        setEditingCell(null);

        if (e.key === 'Enter') {
          const nextRow = row + 1;
          if (nextRow < rows) {
            setSelectedCell(`${nextRow}-${col}`);
          }
        } else if (e.key === 'Tab') {
          const nextCol = col + 1;
          if (nextCol < columns) {
            setSelectedCell(`${row}-${nextCol}`);
          }
        }
      } else if (e.key === 'Escape') {
        setEditingCell(null);
      }
    } else if (selectedCell === key) {
      let newRow = row;
      let newCol = col;

      switch (e.key) {
        case 'ArrowUp':
          newRow = Math.max(0, row - 1);
          break;
        case 'ArrowDown':
          newRow = Math.min(rows - 1, row + 1);
          break;
        case 'ArrowLeft':
          newCol = Math.max(0, col - 1);
          break;
        case 'ArrowRight':
          newCol = Math.min(columns - 1, col + 1);
          break;
        case 'Enter':
          setEditingCell(key);
          return;
        case 'Delete':
        case 'Backspace':
          handleDelete();
          return;
        default:
          if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            setEditingCell(key);
          }
          return;
      }

      e.preventDefault();
      setSelectedCell(`${newRow}-${newCol}`);
      setSelectedRange({ start: null, end: null });
    }
  }, [editingCell, selectedCell, rows, columns, handleCellChange, handleCopy, handlePaste, handleDelete]);

  const isInRange = (row, col) => {
    if (!selectedRange.start || !selectedRange.end) return false;
    return (
      row >= selectedRange.start.row &&
      row <= selectedRange.end.row &&
      col >= selectedRange.start.col &&
      col <= selectedRange.end.col
    );
  };

  // Build initial dependency graph
  useEffect(() => {
    const graph = {};
    Object.entries(cellData).forEach(([key, value]) => {
      if (typeof value === 'string' && value.startsWith('=')) {
        graph[key] = extractDependencies(value);
      }
    });
    dependencyGraph.current = graph;
  }, []);

  return (
    <div className="w-full h-full flex flex-col relative">
      {/* Formula bar */}
      <div className="flex items-center border-b border-gray-300 bg-gray-50 px-2 py-1">
        <div className="text-sm font-medium text-gray-700 mr-2 min-w-[60px]">
          {selectedCell ? `${getColumnLabel(parseInt(selectedCell.split('-')[1]))}${parseInt(selectedCell.split('-')[0]) + 1}` : ''}
        </div>
        <div className="flex-1 bg-white border border-gray-300 rounded px-2 py-1">
          <input
            type="text"
            value={selectedCell ? (cellData[selectedCell] || '') : ''}
            onChange={(e) => {
              if (selectedCell) {
                const [row, col] = selectedCell.split('-').map(Number);
                handleCellChange(row, col, e.target.value);
              }
            }}
            className="w-full text-sm outline-none"
            placeholder={selectedCell ? "Enter value or formula (e.g., =A1+B1)" : "Select a cell"}
          />
        </div>
      </div>

      {/* Spreadsheet grid */}
      <div className="flex-1 overflow-auto border border-gray-300 bg-white">
        <div className="inline-block min-w-full">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="sticky top-0 left-0 z-20 bg-gray-100 border-b border-r border-gray-300 w-12 h-8 text-xs font-medium text-gray-600">
                  <div className="flex items-center justify-center">
                    <ChevronDown className="w-3 h-3" />
                  </div>
                </th>
                {Array.from({ length: columns }, (_, i) => (
                  <th
                    key={i}
                    className="sticky top-0 z-10 bg-gray-100 border-b border-r border-gray-300 min-w-[100px] h-8 text-xs font-medium text-gray-700 select-none"
                  >
                    {getColumnLabel(i)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }, (_, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="sticky left-0 z-10 bg-gray-100 border-b border-r border-gray-300 w-12 h-8 text-xs font-medium text-gray-600 text-center select-none">
                    {rowIndex + 1}
                  </td>
                  {Array.from({ length: columns }, (_, colIndex) => {
                    const key = `${rowIndex}-${colIndex}`;
                    return (
                      <Cell
                        key={key}
                        rowIndex={rowIndex}
                        colIndex={colIndex}
                        value={cellData[key]}
                        displayValue={getCellValue(key)}
                        formatting={cellFormatting[key]}
                        isSelected={selectedCell === key}
                        isEditing={editingCell === key}
                        isRanged={isInRange(rowIndex, colIndex)}
                        hasError={errors[key]}
                        onCellClick={handleCellClick}
                        onCellDoubleClick={handleCellDoubleClick}
                        onCellChange={handleCellChange}
                        onKeyDown={handleKeyDown}
                        onEditingChange={setEditingCell}
                        onContextMenu={handleContextMenu}
                        onMouseDown={handleMouseDown}
                        onMouseEnter={handleMouseEnter}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onDelete={handleDelete}
          onFormat={handleFormat}
          cellValue={selectedCell ? cellData[selectedCell] : ''}
        />
      )}
    </div>
  );
};

// Example usage with formulas
const SpreadsheetExample = () => {
  const defaultData = [
    ['Item', 'Quantity', 'Price', 'Total', 'Tax (10%)', 'Final'],
    ['Laptop', '5', '999.99', '=B2*C2', '=D2*0.1', '=D2+E2'],
    ['Mouse', '12', '29.99', '=B3*C3', '=D3*0.1', '=D3+E3'],
    ['Keyboard', '8', '79.99', '=B4*C4', '=D4*0.1', '=D4+E4'],
    ['Monitor', '3', '399.99', '=B5*C5', '=D5*0.1', '=D5+E5'],
    ['', '', '', '', '', ''],
    ['Summary', '', '', '=SUM(D2:D5)', '=SUM(E2:E5)', '=SUM(F2:F5)'],
    ['', '', '', '', '', ''],
    ['Statistics', 'Values', '', '', '', ''],
    ['Average Price', '=AVERAGE(C2:C5)', '', '', '', ''],
    ['Max Price', '=MAX(C2:C5)', '', '', '', ''],
    ['Min Price', '=MIN(C2:C5)', '', '', '', ''],
    ['Item Count', '=COUNT(B2:B5)', '', '', '', '']
  ];

  const handleCellChange = (row, col, value) => {
    console.log(`Cell [${row}, ${col}] changed to:`, value);
  };

  return (
    <div className="w-full h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Advanced React Spreadsheet</h1>
        <div className="mb-6">
          <p className="text-gray-600 mb-2">
            New features added:
          </p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>Drag Selection</strong>: Click and drag to select multiple cells</li>
            <li>• <strong>Copy/Paste</strong>: Ctrl+C/Ctrl+V to copy and paste cells (including formulas and formatting)</li>
            <li>• <strong>Context Menu</strong>: Right-click for formatting options (bold, italic, underline, alignment)</li>
            <li>• <strong>Cut</strong>: Ctrl+X to cut cells</li>
            <li>• <strong>Multi-cell Operations</strong>: Apply formatting or delete multiple cells at once</li>
            <li>• <strong>Visual Formatting</strong>: See your formatting changes applied to cells</li>
          </ul>
        </div>
        <div className="flex-1 min-h-0">
          <Spreadsheet
            defaultData={defaultData}
            rows={25}
            columns={12}
            onCellChange={handleCellChange}
          />
        </div>
      </div>
    </div>
  );
};

export default SpreadsheetExample;