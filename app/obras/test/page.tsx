'use client'
import React, { useState, useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { ChromePicker } from 'react-color';
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Save, Trash2, Edit, Plus, Download, Upload, FileText, Check } from "lucide-react";

type MapSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl';

interface MapConfig {
  dimensions: {
    width: number;
    height: number;
  };
  hex: {
    radius: number;
    spacing: number;
  };
}

interface Zone {
  name: string;
  color: string;
  points: Array<{ x: number; y: number }>;
}

const sizeConfigs: Record<MapSize, MapConfig> = {
  xs: {
    dimensions: { width: 300, height: 240 },
    hex: { radius: 3, spacing: 6 }
  },
  sm: {
    dimensions: { width: 400, height: 320 },
    hex: { radius: 1.75, spacing: 4 }
  },
  base: {
    dimensions: { width: 600, height: 480 },
    hex: { radius: 1.25, spacing: 2.5 }
  },
  lg: {
    dimensions: { width: 800, height: 640 },
    hex: { radius: 1, spacing: 2 }
  },
  xl: {
    dimensions: { width: 800, height: 640 },
    hex: { radius: 0.5, spacing: 1 }
  }
};

const zones: Zone[] = [
  {
    "name": "Capital",
    "color": "#4CAF50",
    "points": [
      {
        "x": 266.99000549316406,
        "y": 113.72000122070312
      },
      {
        "x": 270.74000549316406,
        "y": 111.22000122070312
      }
    ]
  },
  {
    "name": "Capital22",
    "color": "#af4c4e",
    "points": [
      {
        "x": 275.74000549316406,
        "y": 111.22000122070312
      },
      {
        "x": 280.74000549316406,
        "y": 111.22000122070312
      }
    ]
  },
  {
    "name": "Capital33",
    "color": "#af4cac",
    "points": [
      {
        "x": 286.99000549316406,
        "y": 113.72000122070312
      },
      {
        "x": 288.24000549316406,
        "y": 121.22000122070312
      },
      {
        "x": 283.24000549316406,
        "y": 126.22000122070312
      },
      {
        "x": 273.24000549316406,
        "y": 126.22000122070312
      }
    ]
  }
]

interface CorrientesDottedMapProps {
  size?: MapSize;
  className?: string;
  highlightedZone?: string | null;
  paintMode?: boolean;
  currentZone?: Zone | null;
  onPointClick?: (x: number, y: number) => void;
  customZones?: Zone[];
}

export const CorrientesDottedMap = ({
  size = 'base',
  className,
  highlightedZone = null,
  paintMode = false,
  currentZone = null,
  onPointClick,
  customZones
}: CorrientesDottedMapProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [points, setPoints] = useState<Array<{ x: number; y: number; corners: Array<{ x: number; y: number }> }>>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number } | null>(null);
  const config = sizeConfigs[size];
  const pathData = "M252.34,171.84L251.99,170.47L252.69,168.88L253.81,165.24L253.74,164.46L253.42,163.89L252.93,163.26L252.43,162.68L252.17,161.8L252.21,161.07L252.32,160.57L252.66,159.74L253.08,158.32L253.34,157.19L253.48,155.88L253.56,154.14L253.53,152.8L253.7,152.28L255.27,148.95L255.63,148.67L256.93,148.25L257.43,147.95L260.52,144.74L260.75,144.08L262.37,137.26L262.6,136.52L263.07,132.28L263.07,131.39L262.81,128.92L262.77,128.04L262.87,127.25L263.07,126.87L263.44,126.46L264.15,126.11L264.79,126.2L265.17,126.2L265.62,126.02L266.1,125.59L266.48,124.73L266.64,124.29L266.71,123.89L266.72,123.58L266.72,123.58L266.76,122.27L267.24,120.75L267.3,120.15L267.43,118.15L267.42,117.64L267.08,114.81L266.87,114.03L266.71,113.4L266.81,112.89L268.31,111.46L268.77,111.08L269.15,110.85L269.94,110.56L270.29,110.37L271.29,109.7L271.29,109.7L272.08,109.38L272.66,109.22L273.08,109.12L273.55,109.07L276.99,108.82L279.41,108.72L282.04,108.75L283.4,108.86L286.02,109.2L287.14,109.5L287.61,109.75L287.99,110.06L288.67,110.58L289.18,110.81L292.87,111.74L294.11,111.91L294.49,111.9L294.98,112.01L295.48,112.24L296.06,112.59L296.6,112.84L297.38,113.09L298.15,113.21L298.95,113.25L299.55,112.94L300.38,112.41L300.99,112.07L301.87,111.77L302.52,111.78L302.85,111.95L303.33,112.38L304.11,113.2L304.58,113.45L305.22,113.52L305.68,113.08L305.85,112.89L306.28,112.63L306.79,112.48L307.47,112.36L308,112.37L308.51,112.45L309.04,112.64L309.34,112.91L309.52,113.46L310.2,114.37L310.89,114.93L311.26,115.13L311.85,115.13L312.21,114.84L313.49,112.77L313.6,112.37L313.55,111.89L313.61,111.17L315.86,109.58L316.68,109.45L317.3,109.41L317.82,109.46L319.1,110L319.1,110L318.52,110.42L318.27,111.03L318.14,111.48L318.12,112.2L318.3,113.02L318.99,114.37L319.36,114.98L319.72,115.45L320.85,117.99L320.99,118.39L321.18,119.13L321.31,120.59L321.36,121.59L321.48,122L322.97,124.65L323.49,125.25L325.24,126.47L325.24,126.47L325.1,126.83L324.29,127.59L323.73,127.85L323.03,128.03L322.63,128.41L322.68,128.83L323.58,129.33L324.25,129.77L324.49,130.45L323.95,131.93L323.53,131.52L323.31,131.02L321.49,130.81L320.83,130.88L320.41,131.15L318.85,133.58L318.27,135.07L317.27,136.41L315.39,138.51L313.48,139.5L313.12,139.93L313,140.64L310.99,145.05L310.73,145.53L309.14,146.01L308.11,146.67L307.74,147L307.15,147.69L306.8,148.23L306.61,148.86L306.6,149.53L305.86,151.18L303.74,153.74L301.93,155.64L299.54,158.69L298.97,159.35L298.47,159.86L297.73,160.16L296.83,160.18L296.23,160.24L295.69,160.46L295.28,160.76L294.97,161.18L294.58,162.21L294.58,162.95L294.46,164.35L294.11,164.8L291.54,167.55L290.69,168.2L290.32,168.4L289.8,168.57L289.34,168.65L288.95,169.76L289.03,170.61L288.92,171.03L288.24,172.2L286.84,173.51L285.92,174.15L284.62,175.22L284.37,175.55L284.24,175.97L284.24,177.29L284.57,177.78L285.03,178.22L285.61,179.71L285.75,180.43L285.75,180.43L285.43,180.27L284.65,179.66L284.28,179.3L283.55,178.57L282.64,177.6L282.38,177.29L282.04,176.65L281.62,175.8L281.41,175.28L280.1,172.88L278.08,170.01L277.72,169.7L276.96,169.41L271.86,168.05L271.21,167.95L270.59,168.01L269.84,168.2L268.74,168.79L268.09,169.16L266.46,169.55L265.52,169.44L264.56,169.1L263.64,169.09L261.82,170.31L261.41,170.97L259.79,171.91L259.03,171.77L258.61,171.58L258.16,171.34L257.36,171.2L256.94,171.17L254.86,171.3L253.79,171.76L253.27,171.84z";

  useEffect(() => {
    // Create a temporary SVG element to get path dimensions
    const tempSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    tempSvg.appendChild(path);
    document.body.appendChild(tempSvg);

    const bbox = path.getBBox();
    document.body.removeChild(tempSvg);

    const generateHexGrid = () => {
      const hexRadius = config.hex.radius;
      const horizontalSpacing = config.hex.spacing;
      const verticalSpacing = config.hex.spacing;
      const dotPoints = [];

      // Create SVG element for hit testing
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", String(bbox.width + bbox.x));
      svg.setAttribute("height", String(bbox.height + bbox.y));

      const provincePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      provincePath.setAttribute("d", pathData);
      svg.appendChild(provincePath);
      document.body.appendChild(svg);

      // Generate grid points
      for (let row = 0; row < bbox.height / verticalSpacing; row++) {
        const isEvenRow = row % 2 === 0;
        const xOffset = isEvenRow ? 0 : horizontalSpacing / 2;

        for (let col = 0; col < bbox.width / horizontalSpacing; col++) {
          const x = bbox.x + col * horizontalSpacing + xOffset;
          const y = bbox.y + row * verticalSpacing;

          const point = svg.createSVGPoint();
          point.x = x;
          point.y = y;

          if (provincePath.isPointInFill(point)) {
            dotPoints.push({
              x,
              y,
              corners: calculateHexCorners(x, y, hexRadius)
            });
          }
        }
      }

      document.body.removeChild(svg);
      return dotPoints;
    };

    const calculateHexCorners = (centerX: number, centerY: number, radius: number) => {
      const corners = [];
      for (let i = 0; i < 6; i++) {
        const angleDeg = 60 * i - 30;
        const angleRad = (Math.PI / 180) * angleDeg;
        corners.push({
          x: centerX + radius * Math.cos(angleRad),
          y: centerY + radius * Math.sin(angleRad)
        });
      }
      return corners;
    };

    setPoints(generateHexGrid());
    setLoading(false);
  }, [config]);

  // Major cities in Corrientes province
  const cities: Array<{ name: string; x: number; y: number; radius: number }> = [
    // { name: "Corrientes (Capital)", x: 288, y: 126, radius: 2.5 },
    // { name: "Goya", x: 267, y: 156, radius: 2 },
    // { name: "Mercedes", x: 298, y: 159, radius: 2 },
    // { name: "Curuzú Cuatiá", x: 290, y: 168, radius: 2 },
    // { name: "Santo Tomé", x: 318, y: 130, radius: 2 }
  ];

  const isPointInZone = (x: number, y: number, zone: Zone): boolean => {
    // Simple point-in-polygon check for the zone
    const point = { x, y };
    return zone.points.some(zonePoint =>
      Math.abs(point.x - zonePoint.x) < 0.5 && Math.abs(point.y - zonePoint.y) < 0.5
    );
  };

  const handlePointClick = (x: number, y: number) => {
    if (paintMode && onPointClick) {
      onPointClick(x, y);
    }
  };

  const handlePointHover = (x: number, y: number) => {
    if (paintMode) {
      setHoveredPoint({ x, y });
    }
  };

  const handlePointLeave = () => {
    setHoveredPoint(null);
  };

  if (loading) return (<Card className="p-6">
    <Skeleton className={cn("w-full")} style={{ height: config.dimensions.height }} />
  </Card>)

  // Determine which zones to use
  const activeZones = customZones || zones;

  return (
    <div
      className={cn(size === 'xs' ? 'w-40' : size === 'sm' ? 'w-60' : size === 'base' ? 'w-70' : size === 'lg' ? 'w-100' : size === 'xl' ? 'w-120' : 'w-full', className)}
      style={{ opacity: 1 }}
    >
      <svg
        ref={svgRef}
        width={config.dimensions.width}
        height={config.dimensions.height}
        viewBox="250 108 75 75"
        className={cn("bg-slate-50 w-full h-auto", paintMode && "cursor-crosshair")}
      >
        {points.map((point, index) => {
          // Check if point is in current zone being painted
          const isInCurrentZone = currentZone && currentZone.points.some(
            zonePoint => Math.abs(point.x - zonePoint.x) < 0.5 && Math.abs(point.y - zonePoint.y) < 0.5
          );

          // Check if point is being hovered
          const isHovered = hoveredPoint &&
            Math.abs(point.x - hoveredPoint.x) < 0.5 &&
            Math.abs(point.y - hoveredPoint.y) < 0.5;

          // Check if point is in any existing zone
          const matchingZone = activeZones.find(zone => isPointInZone(point.x, point.y, zone));

          // Determine fill color
          let fillColor = "#3a539b"; // Default color
          if (isInCurrentZone) {
            fillColor = currentZone.color;
          } else if (matchingZone) {
            fillColor = matchingZone.color;
          }

          // Determine opacity
          let opacity = matchingZone ?
            (highlightedZone ? (matchingZone.name === highlightedZone ? 0.9 : 0.3) : 0.8)
            : 0.8;

          // Adjust opacity for hover state
          if (isHovered && paintMode) {
            opacity = 1;
            fillColor = currentZone ? currentZone.color : "#ff9900";
          }

          // Create a safe path string
          const pathString = point.corners && point.corners.length > 0
            ? `M ${point.corners.map(c => `${c.x},${c.y}`).join(' L ')} Z`
            : '';

          return (
            <path
              key={index}
              d={pathString}
              fill={fillColor}
              opacity={isInCurrentZone ? 1 : opacity}
              style={{
                // transform: isHovered && paintMode ? 'scale(1.2)' : 'scale(1)',
                // filter: isHovered && paintMode ? 'drop-shadow(0 0 2px rgba(0,0,0,0.5))' : 'none',
                transition: 'transform 0.2s, opacity 0.2s, filter 0.2s'
              }}
              onClick={() => handlePointClick(point.x, point.y)}
              onMouseEnter={() => handlePointHover(point.x, point.y)}
              onMouseLeave={handlePointLeave}
              className={paintMode ? "hover:opacity-100 cursor-pointer" : ""}
            />
          );
        })}

        {/* Cities with animations */}
        {cities && cities.length > 0 && cities.map((city, index) => (
          <g
            key={index}
            style={{
              transform: `scale(1)`,
              opacity: 1,
              transition: 'transform 0.3s, opacity 0.3s'
            }}
          >
            <circle
              cx={city.x}
              cy={city.y}
              r={city.radius}
              fill="#ff9900"
              className="drop-shadow-md"
            />
            <text
              x={city.x + 3}
              y={city.y + 1}
              fontSize="2"
              fill="#000"
              className="font-medium"
            >
              {city.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

interface SavedPainting {
  id: string;
  name: string;
  date: string;
  zones: Zone[];
}

interface ZonePainterProps {
  onZonesGenerated?: (zones: Zone[]) => void;
}

const ZonePainter = ({ onZonesGenerated }: ZonePainterProps) => {
  const [paintedZones, setPaintedZones] = useState<Zone[]>([]);
  const [currentZone, setCurrentZone] = useState<Zone | null>(null);
  const [zoneName, setZoneName] = useState<string>("");
  const [zoneColor, setZoneColor] = useState<string>("#4CAF50");
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [showZonesDialog, setShowZonesDialog] = useState<boolean>(false);
  const [zonesJson, setZonesJson] = useState<string>("");
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [editingZoneIndex, setEditingZoneIndex] = useState<number | null>(null);

  // New state for saved paintings functionality
  const [savedPaintings, setSavedPaintings] = useState<SavedPainting[]>([]);
  const [showSavedPaintingsDialog, setShowSavedPaintingsDialog] = useState<boolean>(false);
  const [newPaintingName, setNewPaintingName] = useState<string>("");
  const [showSavePaintingDialog, setShowSavePaintingDialog] = useState<boolean>(false);
  const [confirmDeletePaintingId, setConfirmDeletePaintingId] = useState<string | null>(null);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState<boolean>(false);
  const [activePaintingId, setActivePaintingId] = useState<string | null>(null);

  // Load saved paintings from local storage on component mount
  useEffect(() => {
    const loadSavedPaintings = () => {
      const savedPaintingsJson = localStorage.getItem('savedPaintings');
      if (savedPaintingsJson) {
        try {
          const paintings = JSON.parse(savedPaintingsJson);
          setSavedPaintings(paintings);
        } catch (error) {
          console.error('Failed to parse saved paintings:', error);
        }
      }
    };

    loadSavedPaintings();
  }, []);

  // Save paintings to local storage whenever they change
  useEffect(() => {
    if (savedPaintings.length > 0) {
      localStorage.setItem('savedPaintings', JSON.stringify(savedPaintings));
    }
  }, [savedPaintings]);

  // Start painting a new zone
  const startPainting = () => {
    if (!zoneName.trim()) {
      alert("Please enter a zone name");
      return;
    }

    setCurrentZone({
      name: zoneName,
      color: zoneColor,
      points: []
    });
    setEditingZoneIndex(null);
  };

  // Start editing an existing zone
  const startEditingZone = (zoneIndex: number) => {
    const zoneToEdit = paintedZones[zoneIndex];
    setCurrentZone(zoneToEdit);
    setZoneName(zoneToEdit.name);
    setZoneColor(zoneToEdit.color);
    setEditingZoneIndex(zoneIndex);
  };

  // Finish painting the current zone
  const finishPainting = () => {
    if (currentZone && currentZone.points.length > 0) {
      let updatedZones: Zone[];

      if (editingZoneIndex !== null) {
        // Update existing zone
        updatedZones = [...paintedZones];
        updatedZones[editingZoneIndex] = currentZone;
      } else {
        // Add new zone
        updatedZones = [...paintedZones, currentZone];
      }

      setPaintedZones(updatedZones);
      setCurrentZone(null);
      setEditingZoneIndex(null);

      // Reset zone name for the next zone
      setZoneName("");

      // Show success message
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);

      // Call the callback if provided
      if (onZonesGenerated) {
        onZonesGenerated(updatedZones);
      }

      // If we have an active painting, update it
      if (activePaintingId) {
        updateActivePainting(updatedZones);
      }
    } else {
      alert("Please paint some points before finishing");
    }
  };

  // Update the active painting with new zones
  const updateActivePainting = (zones: Zone[]) => {
    if (activePaintingId) {
      const updatedPaintings = savedPaintings.map(painting =>
        painting.id === activePaintingId
          ? { ...painting, zones: [...zones] }
          : painting
      );
      setSavedPaintings(updatedPaintings);
    }
  };

  // Cancel painting the current zone
  const cancelPainting = () => {
    setCurrentZone(null);
    setEditingZoneIndex(null);
    setZoneName("");
  };

  // Handle point click when painting
  const handlePointClick = (x: number, y: number) => {
    if (currentZone) {
      // Check if point is already in the zone
      const pointExists = currentZone.points.some(
        point => Math.abs(point.x - x) < 0.5 && Math.abs(point.y - y) < 0.5
      );

      if (!pointExists) {
        setCurrentZone({
          ...currentZone,
          points: [...currentZone.points, { x, y }]
        });
      }
    }
  };

  // Show zones as JSON
  const showZonesAsJson = () => {
    const zonesData = JSON.stringify(paintedZones, null, 2);
    setZonesJson(zonesData);
    setShowZonesDialog(true);
  };

  // Copy zones to clipboard
  const copyZonesToClipboard = () => {
    navigator.clipboard.writeText(zonesJson);
  };

  // Clear all zones
  const clearAllZones = () => {
    if (confirm("Are you sure you want to clear all zones?")) {
      setPaintedZones([]);
      setCurrentZone(null);
      setEditingZoneIndex(null);
      setActivePaintingId(null);
    }
  };

  // Delete a specific zone
  const deleteZone = (index: number) => {
    const updatedZones = [...paintedZones];
    updatedZones.splice(index, 1);
    setPaintedZones(updatedZones);

    // If we have an active painting, update it
    if (activePaintingId) {
      updateActivePainting(updatedZones);
    }
  };

  // Save current painting
  const savePainting = () => {
    if (paintedZones.length === 0) {
      alert("Please create at least one zone before saving");
      return;
    }

    setNewPaintingName("");
    setShowSavePaintingDialog(true);
  };

  // Handle saving the painting with a name
  const handleSavePainting = () => {
    if (!newPaintingName.trim()) {
      alert("Please enter a name for your painting");
      return;
    }

    const newPaintingId = Date.now().toString();
    const newPainting: SavedPainting = {
      id: newPaintingId,
      name: newPaintingName,
      date: new Date().toISOString(),
      zones: [...paintedZones]
    };

    setSavedPaintings([...savedPaintings, newPainting]);
    setShowSavePaintingDialog(false);
    setActivePaintingId(newPaintingId);

    // Show success message
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Load a saved painting
  const loadPainting = (painting: SavedPainting) => {
    setPaintedZones(painting.zones);
    setShowSavedPaintingsDialog(false);
    setActivePaintingId(painting.id);
  };

  // Delete a saved painting
  const deleteSavedPainting = (id: string) => {
    setConfirmDeletePaintingId(id);
    setShowDeleteConfirmDialog(true);
  };

  // Confirm deletion of a saved painting
  const confirmDeletePainting = () => {
    if (confirmDeletePaintingId) {
      const updatedPaintings = savedPaintings.filter(p => p.id !== confirmDeletePaintingId);
      setSavedPaintings(updatedPaintings);

      // Update local storage
      if (updatedPaintings.length === 0) {
        localStorage.removeItem('savedPaintings');
      } else {
        localStorage.setItem('savedPaintings', JSON.stringify(updatedPaintings));
      }

      // If we're deleting the active painting, clear the canvas
      if (confirmDeletePaintingId === activePaintingId) {
        setPaintedZones([]);
        setActivePaintingId(null);
      }

      setConfirmDeletePaintingId(null);
      setShowDeleteConfirmDialog(false);
    }
  };

  // Get the name of the active painting
  const getActivePaintingName = () => {
    if (!activePaintingId) return null;
    const activePainting = savedPaintings.find(p => p.id === activePaintingId);
    return activePainting ? activePainting.name : null;
  };

  // Create a new painting (clear current and reset active painting)
  const createNewPainting = () => {
    if (paintedZones.length > 0 && !activePaintingId) {
      if (!confirm("You have unsaved zones. Create a new painting anyway?")) {
        return;
      }
    }

    setPaintedZones([]);
    setActivePaintingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Zone Painter</h2>

          {/* Active painting indicator */}
          {activePaintingId && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-sm">
              <span className="text-blue-700">Editing: {getActivePaintingName()}</span>
              <Check className="h-3 w-3 text-blue-500" />
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Zone creation controls */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <label htmlFor="zoneName" className="block text-sm font-medium">
                Zone Name
              </label>
              <input
                id="zoneName"
                type="text"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                className="px-3 py-2 border rounded-md"
                placeholder="Enter zone name"
                disabled={!!currentZone && editingZoneIndex === null}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Zone Color
              </label>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-md cursor-pointer border"
                  style={{ backgroundColor: zoneColor }}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                />
                {showColorPicker && (
                  <div className="absolute z-10 mt-2">
                    <div
                      className="fixed inset-0"
                      onClick={() => setShowColorPicker(false)}
                    />
                    <ChromePicker
                      color={zoneColor}
                      onChange={(color: { hex: string }) => setZoneColor(color.hex)}
                    />
                  </div>
                )}
              </div>
            </div>

            {!currentZone ? (
              <Button
                onClick={startPainting}
                disabled={!zoneName.trim()}
              >
                Start Painting
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={finishPainting}
                  variant="default"
                >
                  {editingZoneIndex !== null ? "Update Zone" : "Save Zone"}
                </Button>
                <Button
                  onClick={cancelPainting}
                  variant="destructive"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {/* Success message */}
          <AnimatePresence>
            {saveSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded"
              >
                {activePaintingId ? "Painting updated successfully!" : "Zone saved successfully!"}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Painted zones list */}
          {paintedZones.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Painted Zones</h3>
              <div className="flex flex-wrap gap-2">
                {paintedZones.map((zone, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 px-3 py-1 rounded-full text-sm group relative"
                    style={{
                      backgroundColor: `${zone.color}20`,
                      borderColor: zone.color,
                      borderWidth: 1,
                      transition: 'opacity 0.3s, transform 0.3s'
                    }}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: zone.color }}
                    />
                    <span>{zone.name} ({zone.points.length} points)</span>

                    {/* Zone actions */}
                    <div className="absolute right-0 top-0 bottom-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className="p-1 hover:bg-gray-200 rounded-full mr-1"
                              onClick={() => startEditingZone(index)}
                              disabled={!!currentZone}
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit zone</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className="p-1 hover:bg-red-200 rounded-full"
                              onClick={() => deleteZone(index)}
                              disabled={!!currentZone}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete zone</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              onClick={createNewPainting}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Painting
            </Button>

            <Button
              onClick={() => setShowSavedPaintingsDialog(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Load Paintings
            </Button>

            {paintedZones.length > 0 && (
              <>
                <Button
                  onClick={savePainting}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Painting
                </Button>

                <Button
                  onClick={showZonesAsJson}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Show JSON
                </Button>

                <Button
                  onClick={clearAllZones}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear All
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Map for painting */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">
          {currentZone ? (
            editingZoneIndex !== null ?
              `Editing: ${currentZone.name}` :
              `Painting: ${currentZone.name}`
          ) : "Map"}
        </h3>
        <CorrientesDottedMap
          size="base"
          paintMode={!!currentZone}
          currentZone={currentZone}
          onPointClick={handlePointClick}
          customZones={paintedZones}
        />
        {currentZone && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 text-sm text-gray-500"
          >
            Click on the map to add points to the zone. {currentZone.points.length} points added.
            <span className="ml-2 text-xs text-gray-400">(Using smaller brush size for precision)</span>
          </motion.p>
        )}
      </div>

      {/* Dialog for showing zones JSON */}
      <Dialog open={showZonesDialog} onOpenChange={setShowZonesDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Generated Zones</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96 text-sm">
              {zonesJson}
            </pre>
          </div>
          <DialogFooter>
            <Button onClick={copyZonesToClipboard}>
              Copy to Clipboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for saving a painting */}
      <Dialog open={showSavePaintingDialog} onOpenChange={setShowSavePaintingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Painting</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paintingName">Painting Name</Label>
              <Input
                id="paintingName"
                placeholder="Enter a name for your painting"
                value={newPaintingName}
                onChange={(e) => setNewPaintingName(e.target.value)}
              />
            </div>
            <p className="text-sm text-gray-500">
              This will save your current painting with {paintedZones.length} zones.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSavePaintingDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePainting}
              disabled={!newPaintingName.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for loading saved paintings */}
      <Dialog open={showSavedPaintingsDialog} onOpenChange={setShowSavedPaintingsDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Saved Paintings</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {savedPaintings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No saved paintings yet</p>
                <p className="text-sm text-gray-400 mt-2">
                  Create and save a painting to see it here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {savedPaintings.map((painting) => (
                  <motion.div
                    key={painting.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50",
                      activePaintingId === painting.id && "bg-blue-50 border-blue-200"
                    )}
                  >
                    <div>
                      <h4 className="font-medium">{painting.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500">
                          {new Date(painting.date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {painting.zones.length} zones
                        </p>
                      </div>
                      <div className="flex mt-2">
                        {painting.zones.map((zone, i) => (
                          <div
                            key={i}
                            className="w-3 h-3 rounded-full mr-1"
                            style={{ backgroundColor: zone.color }}
                            title={zone.name}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={activePaintingId === painting.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => loadPainting(painting)}
                        className="flex items-center gap-1"
                      >
                        <Upload className="h-3 w-3" />
                        {activePaintingId === painting.id ? "Active" : "Load"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteSavedPainting(painting.id)}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for confirming deletion */}
      <Dialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Painting</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this painting? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeletePainting}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const page = () => {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [showPainter, setShowPainter] = useState<boolean>(false);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Corrientes Map</h1>
        <Button
          onClick={() => setShowPainter(!showPainter)}
          variant={showPainter ? "secondary" : "default"}
        >
          {showPainter ? "Hide Zone Painter" : "Show Zone Painter"}
        </Button>
      </div>

      {!showPainter && (
        <>
          <div className="flex gap-4">
            {zones.map(zone => (
              <button
                key={zone.name}
                onClick={() => setSelectedZone(zone.name === selectedZone ? null : zone.name)}
                className={cn(
                  "px-4 py-2 rounded-md",
                  selectedZone === zone.name ? "bg-slate-800 text-white" : "bg-slate-200"
                )}
              >
                {zone.name}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            <CorrientesDottedMap size="xs" highlightedZone={selectedZone} />
            {/* <CorrientesDottedMap size="sm" highlightedZone={selectedZone} /> */}
            <CorrientesDottedMap size="base" highlightedZone={selectedZone} />
            {/* <CorrientesDottedMap size="lg" highlightedZone={selectedZone} /> */}
            <CorrientesDottedMap size="xl" highlightedZone={selectedZone} />
          </div>
        </>
      )}

      {showPainter && <ZonePainter />}
    </div>
  );
};

export default page;  