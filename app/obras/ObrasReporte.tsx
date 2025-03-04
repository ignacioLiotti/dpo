import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { Obra } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TabsTrigger } from '@/components/ui/tabs';
import { TabsList } from '@/components/ui/tabs';
import { ObraTimeline } from '@/components/ui/ObraTimeline';

// FolderTabs component for the folder-style tabs
interface TabItem {
  id: string;
  count: string;
  label: string;
  content: React.ReactNode;
}

interface FolderTabsProps {
  tabs: TabItem[];
  className?: string;
}

const FolderTabs: React.FC<FolderTabsProps> = ({ tabs, className }) => {
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0); // 0: idle, 1: size, 2: color, 3: position
  const [clickedTabId, setClickedTabId] = useState<string | null>(null);

  // Reorder tabs so that the active tab is first
  const orderedTabs = [...tabs].sort((a, b) => {
    if (a.id === activeTabId) return -1;
    if (b.id === activeTabId) return 1;
    return 0;
  });

  const handleTabClick = (tabId: string) => {
    if (tabId !== activeTabId && !isAnimating) {
      setIsAnimating(true);
      setClickedTabId(tabId);

      // Phase 1: Size change
      setAnimationPhase(1);

      // Phase 2: Color change after 200ms
      setTimeout(() => {
        setAnimationPhase(2);
      }, 200);

      // Phase 3: Position change after 400ms
      setTimeout(() => {
        setAnimationPhase(3);
      }, 250);

      // Complete animation and update active tab after 600ms
      setTimeout(() => {
        setActiveTabId(tabId);
        setAnimationPhase(0);
        setIsAnimating(false);
        setClickedTabId(null);
      }, 300);
    }
  };

  // Get tab styles based on animation phase
  const getTabStyles = (tab: TabItem, index: number) => {
    const isActive = tab.id === activeTabId;
    const isClicked = tab.id === clickedTabId;
    const isFormerActive = isAnimating && isActive && clickedTabId !== null;
    const totalTabs = tabs.length;

    // Calculate inactive tab width based on number of tabs
    const inactiveWidth = `${(50 / (totalTabs - 1)).toFixed(2)}%`;

    // Base container class (outer div)
    let containerClass = isActive
      ? "bg-containerHollowBackground rounded-t-lg"
      : index === 1
        ? "bg-white"
        : "bg-containerHollowBackground";

    // Width values for animation - active is always 50%, inactive is distributed
    let width = isActive ? "50%" : inactiveWidth;

    // Inner div background class
    let innerBgClass = isActive
      ? "bg-white rounded-t-lg"
      : index === 1
        ? "bg-containerHollowBackground rounded-bl-lg"
        : "";

    // Text color
    let textColor = isActive ? "#1f2937" : "#9ca3af"; // text-gray-800 vs text-gray-400

    // Background color for animation
    let bgColor = isActive ? "rgb(255, 255, 255)" : index === 1 ? "hsl(230deg 37.5% 93.86%)" : "transparent";

    // Animation phase adjustments
    if (animationPhase >= 1) {
      // Phase 1: Size change
      if (isClicked) {
        width = "50%"; // Clicked tab grows
      } else if (isFormerActive) {
        width = inactiveWidth; // Active tab shrinks to new inactive width
      }
    }

    if (animationPhase >= 2) {
      // Phase 2: Color change
      if (isClicked) {
        textColor = "#1f2937"; // text-gray-800
        bgColor = "rgb(255, 255, 255)"; // bg-white
        innerBgClass = "bg-white rounded-t-lg";
      } else if (isFormerActive) {
        textColor = "#9ca3af"; // text-gray-400
        bgColor = "hsl(230deg 37.5% 93.86%)"; // bg-containerHollowBackground
        if (index === 0) {
          innerBgClass = "";
        }
      }
    }

    return {
      containerClass,
      width,
      innerBgClass,
      innerClass: `text-start p-2 px-4 cursor-pointer ${innerBgClass}`,
      textColor,
      bgColor
    };
  };

  return (
    <div className={className + " h-full flex flex-col flex-1"}>
      <CardHeader className="p-0 bg-containerHollowBackground rounded-t-lg overflow-hidden">
        {/* Parent container that orchestrates the overall layout animation */}
        <motion.div
          className="flex justify-start"
          layout // This enables automatic layout animation for all children
          transition={{ duration: 0.2 }}
        >
          {orderedTabs.map((tab, index) => {
            const styles = getTabStyles(tab, index);

            return (
              /* Tab container - handles width and position animations */
              <motion.div
                key={tab.id}
                className={styles.containerClass}
                style={{ width: "25%" }} // Initial width
                animate={{
                  width: styles.width // Animates the width change (25% -> 50% or 50% -> 25%)
                }}
                onClick={() => handleTabClick(tab.id)}
                whileTap={!isAnimating ? { scale: 0.98 } : {}}
                layout="position" // Enables smooth position animation when tabs reorder
                transition={{
                  layout: { duration: 0.2, type: "spring", bounce: 0 }, // Controls the position change animation
                  width: { duration: 0.2, type: "spring", bounce: 0 }, // Controls the width change animation
                  default: { duration: 0.2, type: "spring", bounce: 0 }
                }}
              >
                {/* Inner container - handles background color and border radius animations */}
                <motion.div
                  className={cn("text-start p-2 px-4 cursor-pointer flex flex-col justify-center items-start h-full", styles.innerClass)}
                  initial={false}
                  layout="preserve-aspect" // Maintains aspect ratio during layout changes
                  animate={{
                    backgroundColor: styles.bgColor, // Animates background color changes
                    borderTopLeftRadius: styles.innerBgClass.includes("rounded-t-lg") ? 8 : 0,
                    borderTopRightRadius: styles.innerBgClass.includes("rounded-t-lg") ? 8 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Count text - handles text color animation */}
                  <motion.p
                    className="text-3xl font-bold"
                    layout="preserve-aspect"
                    animate={{
                      color: styles.textColor // Animates text color from gray-400 to gray-800 or vice versa
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    {tab.count}
                  </motion.p>
                  {/* Label text - maintains position during animations */}
                  <motion.p
                    className="text-xs text-gray-500 line-clamp-2 text-ellipsis"
                    layout="preserve-aspect"
                  >
                    {tab.label}
                  </motion.p>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-0 bg-white rounded-b-lg flex flex-col flex-1">
        {/* Content container - handles content switching animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTabId}
            initial={{ opacity: 0, y: 10 }} // Start from below and transparent
            animate={{ opacity: 1, y: 0 }} // Animate to normal position and visible
            exit={{ opacity: 0, y: -10 }} // Exit by moving up and fading out
            transition={{ duration: 0.2, delay: 0.1 }} // Delay to wait for tab animations to complete
          >
            {tabs.find(tab => tab.id === activeTabId)?.content}
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </div>
  );
};

const DPODashboard = ({ filteredObras }: { filteredObras: Obra[] }) => {
  // Define the tab content for the "Obras en Ejecución" section
  const obrasEnEjecucionTabs = [
    {
      id: "basicas",
      count: "04",
      label: "BASICAS",
      content: (
        <div className="space-y-1 text-xs">
          <div className="flex justify-between  pt-1">
            <span className="font-medium">140-1903/07</span>
            <span>1158 - Comisión Celíaca Gpo 11C - NACIONAL</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">124-1903/27</span>
            <span>1880 - Subestación TransforMON - Formosa</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">140-1903/08</span>
            <span>1158 - Comisión Celíaca Gpo 11C - NACIONAL</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">140-1903/09</span>
            <span>1158 - Comisión Celíaca Gpo 11C - NACIONAL</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">140-1903/10</span>
            <span>2293 - Centro San Nicolás - Prov. Buenos Aires LD1</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">140-1903/11</span>
            <span>2293 - Centro San Nicolás - Prov. Buenos Aires LD1</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">140-1903/12</span>
            <span>1158 - Administración NACIONAL</span>
          </div>
        </div>
      )
    },
    {
      id: "en-proceso",
      count: "18",
      label: "EN PROCESO",
      content: (
        <div className="space-y-1 text-xs">
          <div className="flex justify-between pt-1">
            <span className="font-medium">140-1903/13</span>
            <span>1158 - Proceso Celíaca Gpo 11C - NACIONAL</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">140-2003/14</span>
            <span>1880 - Subestación TransforMON - Formosa</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">140-2475/06</span>
            <span>1158 - Proceso Celíaca Gpo 11C - NACIONAL</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">140-2003/16</span>
            <span>1158 - Proceso Celíaca Gpo 11C - NACIONAL</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">140-2003/17</span>
            <span>2293 - Centro San Nicolás - Prov. Buenos Aires LD1</span>
          </div>
        </div>
      )
    },
    {
      id: "finalizadas",
      count: "05",
      label: "FINALIZADAS",
      content: (
        <div className="space-y-1 text-xs">
          <div className="flex justify-between pt-1">
            <span className="font-medium">149-0091-LPU23</span>
            <span>1158 - Finalizada Celíaca Gpo 11C - NACIONAL</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">140-1694/06</span>
            <span>1880 - Subestación TransforMON - Formosa</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">140-0115/07</span>
            <span>1158 - Finalizada Celíaca Gpo 11C - NACIONAL</span>
          </div>
        </div>
      )
    }
  ];

  // Define the tab content for "Obras en Prefinanciamiento"
  const obrasPrefinanciamientoTabs = [
    {
      id: "elevados",
      count: "43",
      label: "ELEVADOS",
      content: (
        <div className="space-y-1 text-xs">
          <div className="flex justify-between pt-1">
            <span className="font-medium">140-2003/18</span>
            <span>1158 - Avance Cat Celíaca - NACIONAL</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">140-2003/19</span>
            <span>1880 - Subestación El Fogón - Formosa - Subalterna D1</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">140-2003/20</span>
            <span>1158 - Avance Cat Celíaca - NACIONAL</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">140-4423/06</span>
            <span>1158 - Avance Cat Celíaca - NACIONAL</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">140-0230/07</span>
            <span>1158 - Avance Cat Celíaca - NACIONAL</span>
          </div>
        </div>
      )
    },
    {
      id: "proceso",
      count: "12",
      label: "EN PROCESO",
      content: (
        <div className="space-y-1 text-xs">
          <div className="flex justify-between  pt-1">
            <span className="font-medium">149-0042/10</span>
            <span>1158 - Proceso Prefinanciamiento - NACIONAL</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">149-0085/11</span>
            <span>1880 - Subestación El Fogón - Formosa</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">149-0085/12</span>
            <span>1880 - Subestación El Fogón - Formosa</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">149-0085/01</span>
            <span>1880 - Subestación El Fogón - Formosa</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">149-0085/02</span>
            <span>1880 - Subestación El Fogón - Formosa</span>
          </div>
        </div>
      )
    }
  ];

  // Define the tab content for "Obras en Proyecto"
  const obrasProyectoTabs = [
    {
      id: "proceso",
      count: "03",
      label: "EN PROCESO",
      content: (
        <div className="space-y-1 text-xs">
          <div className="flex justify-betweenpt-1">
            <span className="font-medium">119-0068/01</span>
            <span>1880 - Subestación El Fogón - Formosa - Subalterna D1</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">149-0222/02</span>
            <span>2293 - Centro San Nicolás - Prov. Buenos Aires LD1</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">149-0222/03</span>
            <span>2293 - Centro San Nicolás - Prov. Buenos Aires LD1</span>
          </div>
        </div>
      )
    },
    {
      id: "elevar",
      count: "03",
      label: "A ELEVAR",
      content: (
        <div className="space-y-1 text-xs">
          <div className="flex justify-between pt-1">
            <span className="font-medium">149-0099/04</span>
            <span>1158 - Comisión Celíaca Gpo 11C - NACIONAL</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">149-0099/05</span>
            <span>1158 - Comisión Celíaca Gpo 11C - NACIONAL</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">149-0099/06</span>
            <span>1158 - Comisión Celíaca Gpo 11C - NACIONAL</span>
          </div>

        </div>
      )
    },
    {
      id: "retraso",
      count: "03",
      label: "RETRASO",
      content: (
        <div className="space-y-1 text-xs">
          <div className="flex justify-between pt-1">
            <span className="font-medium">120-0089/07</span>
            <span>1880 - Subestación El Fogón - Formosa - Subalterna D1</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">149-0099/07</span>
            <span>1158 - Comisión Celíaca Gpo 11C - NACIONAL</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">149-0099/08</span>
            <span>1158 - Comisión Celíaca Gpo 11C - NACIONAL</span>
          </div>
        </div>
      )
    },
    {
      id: "carpeta",
      count: "12",
      label: "CARPETA",
      content: (
        <div className="space-y-1 text-xs">
          <div className="flex justify-between pt-1">
            <span className="font-medium">149-0001/09</span>
            <span>2293 - Centro San Nicolás - Prov. Buenos Aires LD1</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">149-0099/09</span>
            <span>1158 - Comisión Celíaca Gpo 11C - NACIONAL</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">149-0099/10</span>
            <span>1158 - Comisión Celíaca Gpo 11C - NACIONAL</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">149-0099/11</span>
            <span>1158 - Comisión Celíaca Gpo 11C - NACIONAL</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">149-0099/12</span>
            <span>1158 - Comisión Celíaca Gpo 11C - NACIONAL</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">149-0099/13</span>
            <span>1158 - Comisión Celíaca Gpo 11C - NACIONAL</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">149-0099/14</span>
            <span>1158 - Comisión Celíaca Gpo 11C - NACIONAL</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">149-0099/15</span>
            <span>1158 - Comisión Celíaca Gpo 11C - NACIONAL</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">149-0099/16</span>
            <span>1158 - Comisión Celíaca Gpo 11C - NACIONAL</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">149-0099/17</span>
            <span>1158 - Comisión Celíaca Gpo 11C - NACIONAL</span>
          </div>
        </div>
      )
    }
  ];

  // Define the tab content for "Obras en Proceso Licitatorio"
  const obrasLicitatorioTabs = [
    {
      id: "licitar",
      count: "03",
      label: "LICITAR",
      content: (
        <div className="space-y-1 text-xs">
          <div className="flex justify-between pt-1">
            <span className="font-medium">149-0044/01</span>
            <span>1158 - Avance Cat Celíaca - NACIONAL</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">149-0045/02</span>
            <span>1880 - Subestación El Fogón - Formosa - Subalterna D1</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">149-1045/02</span>
            <span>1880 - Subestación El Fogón - Formosa - Subalterna D1</span>
          </div>
        </div>
      )
    },
    {
      id: "adjudicar",
      count: "02",
      label: "ADJUDICAR",
      content: (
        <div className="space-y-1 text-xs">
          <div className="flex justify-between pt-1">
            <span className="font-medium">149-0050-CPO23</span>
            <span>2293 - Centro San Nicolás - Prov. Buenos Aires LD1</span>
          </div>
          <div className="flex justify-between border-t pt-1">
            <span className="font-medium">149-0050/02</span>
            <span>1880 - Subestación El Fogón - Formosa - Subalterna D1</span>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className=" min-h-screen bg-containerBackground grid grid-cols-12 gap-4 -mx-8 px-4 -mt-4">
      {/* Header */}
      <header className="bg-white flex items-center justify-start border-b col-span-12 -mx-4 px-8 pr-24">
        <div className="flex items-start space-x-2 w-1/4">
          <div>
            <h1 className="font-bold text-4xl text-gray-800 flex items-center gap-4">DPO
              <Separator className=" bg-gray-400 h-8 w-1" orientation="vertical" />
              <span className="text-lg text-gray-500">Dirección</span>
            </h1>
            <p className="text-lg text-gray-500 w-2/3">Dirección de Planificación y Obras</p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <TabsList>
                <TabsTrigger value="reporte">Reporte</TabsTrigger>
                <TabsTrigger value="estadisticas">Tabla</TabsTrigger>
                <TabsTrigger value="obras">Graficos</TabsTrigger>
              </TabsList>
            </motion.div>
          </div>
        </div>

        <div className="flex items-start justify-between w-full">
          <div className="flex flex-col items-start pr-8 mr-8">
            <span className="text-xl font-medium uppercase text-gray-500"><b className="text-primary">OBRAS </b> VIGENTES</span>
            <span className="text-8xl font-bold text-gray-800">106</span>
          </div>

          <div className="flex space-x-10">
            <Separator className=" bg-gray-300 h-24" orientation="vertical" />

            <div>
              <p className="text-xl font-medium text-start uppercase text-gray-500"><b className="text-primary">CERTIFICADOS</b> EMITIDOS</p>
              <div className="grid grid-cols-3 gap-8 mt-1">
                <div className="flex flex-col items-start">
                  <span className="text-2xl font-bold ">03
                    <span className="text-sm font-light text-gray-500">/28</span>
                  </span>
                  <span className="text-xs font-semibold">OBRA BÁSICA</span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-2xl font-bold ">14
                    <span className="text-sm font-light text-gray-500">/25</span>
                  </span>
                  <span className="text-xs font-semibold">REDETERM.</span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-2xl font-bold ">02
                    <span className="text-sm font-light text-gray-500">/05</span>
                  </span>
                  <span className="text-xs font-semibold">ADICIONALES</span>
                </div>
              </div>
            </div>

            <Separator className=" bg-gray-300 h-24" orientation="vertical" />

            <div className="flex flex-col items-start">
              <p className="text-xl font-medium text-start uppercase text-gray-500"><b className="text-primary">AÑO </b> 2025</p>
              <div className="grid grid-cols-4 gap-8 mt-1">
                <div className="flex flex-col items-start">
                  <span className="text-2xl font-bold text-gray-800">35</span>
                  <span className="text-xs font-semibold text-start flex flex-col justify-center items-start">LICITACIONES
                    <span className="text-gray-500 font-light text-center">PUBLICADAS</span>
                  </span>
                </div>
                <div className="flex flex-col items-start ">
                  <span className="text-2xl font-bold text-gray-800">25</span>
                  <span className="text-xs font-semibold text-center flex flex-col justify-center items-start">PLIEGOS
                    <span className="text-gray-500 font-light text-center"> ELEVADOS</span>
                  </span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-2xl font-bold text-gray-800">32</span>
                  <span className="text-xs font-semibold text-center flex flex-col justify-center items-start">CONTRATOS
                    <span className="text-gray-500 font-light text-center"> FIRMADOS</span>
                  </span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-2xl font-bold text-gray-800">32</span>
                  <span className="text-xs font-semibold text-center flex flex-col justify-center items-start">OBRAS
                    <span className="text-gray-500 font-light text-center"> ENTREGADAS</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Timeline Section */}

      <div className=" w-64 col-span-2 row-span-2  ">
        <div className=" gap-4 mb-4 row-span-1 max-h-[400px] ">
          <ObraTimeline obras={filteredObras} />
        </div>
        <div className="flex flex-col gap-4 mb-4 row-span-2">
          {/* Card 1 */}
          <Card className="row-span-1 flex flex-col border-0 shadow-sm">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-gray-500">CERTIFICACIÓN MENSUAL</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 pt-0">
              <p className="text-2xl font-bold">$ 205.365.896</p>
              <p className="text-xs text-gray-500">ENERO 2025</p>
            </CardContent>
          </Card>

          {/* Card 3 */}
          <Card className="row-span-1 border-0 shadow-sm">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-gray-500">INVERSIÓN TOTAL AUTORIZADA</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 pt-0">
              <p className="text-2xl font-bold">$ 6.705.365.896</p>
              <p className="text-xs text-gray-500">EJECUCIÓN DEL PRESUPUESTO</p>
            </CardContent>
          </Card>

          {/* Card 4 */}
          <Card className="row-span-1 border-0 shadow-sm">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-medium text-gray-500">FONDOS SOLICITADOS</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 pt-0">
              <p className="text-2xl font-bold">$ 4.205.645.698</p>
              <p className="text-xs text-gray-500">ENERO A FEBRERO 2025</p>
            </CardContent>
          </Card>
        </div>
      </div>


      {/* Main Content */}
      <div className="col-span-10 px-2">


        <div className="flex flex-col gap-4">
          {/* Obras en Ejecución */}
          <div className="flex gap-4 items-stretch">

            <div className="w-1/2 flex flex-col flex-1">
              <CardTitle className="text-lg font-medium text-gray-500">OBRAS EN EJECUCIÓN</CardTitle>
              <Card className="border-none shadow-none bg-containerBackground flex flex-col flex-1">
                <FolderTabs tabs={obrasEnEjecucionTabs} />
              </Card>
            </div>

            {/* Obras en Prefinanciamiento */}
            <div className="w-1/2 flex flex-col flex-1">
              <CardTitle className="text-lg font-medium text-gray-500">OBRAS EN PREFINANCIAMIENTO</CardTitle>
              <Card className="border-none shadow-none bg-containerBackground flex flex-col flex-1">
                <FolderTabs tabs={obrasPrefinanciamientoTabs} />
              </Card>
            </div>
          </div>

          {/* Main dashboard content */}
          <div className="flex gap-4">
            {/* Obras en Proyecto */}
            <div className="w-1/2 flex flex-col flex-1">
              <CardTitle className="text-lg font-medium text-gray-500">OBRAS EN PROYECTO</CardTitle>
              <Card className="border-none shadow-none bg-containerBackground flex flex-col flex-1">
                <FolderTabs tabs={obrasProyectoTabs} />
              </Card>
            </div>

            {/* Obras en Proceso Licitatorio */}
            <div className="w-1/2 flex flex-col flex-1">
              <CardTitle className="text-lg font-medium text-gray-500">OBRAS EN PROCESO LICITATORIO</CardTitle>
              <Card className="border-none shadow-none bg-containerBackground flex flex-col flex-1">
                <FolderTabs tabs={obrasLicitatorioTabs} />
              </Card>

              {/* Provision section */}
            </div>
          </div>
          <CardTitle className="text-lg font-medium text-gray-500">PROVISION DE OBRAS</CardTitle>
          <Card className="border-none shadow-none w-1/2">
            <CardHeader className="pb-2 pt-3 px-4">
            </CardHeader>
            <CardContent className="px-4 pb-3 pt-0">
              <div className="flex justify-between items-center">
                <div className="text-center pr-8">
                  <p className="text-3xl font-bold text-gray-800">03</p>
                  <p className="text-xs text-gray-500">OBRAS</p>
                </div>
                <div className="text-center border-l border-r px-12 py-2">
                  <p className="text-lg font-bold text-gray-800">$ 55.365.264,18</p>
                </div>
                <div className="text-center pl-8">
                  <p className="text-lg font-bold text-gray-800">$ 55.365.264,18</p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Footer */}

      </div>
    </div>
  );
};

export default DPODashboard;