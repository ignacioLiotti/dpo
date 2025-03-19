// "use client"

// import { useEffect, useRef, useState } from "react"

// // Add type definitions for Tweakpane
// interface TweakpaneConfig {
//   explode: boolean
//   theme: string
//   x1: number
//   y1: number
//   x2: number
//   step: number
//   tx: number
//   ty: number
// }

// interface TweakpaneChangeEvent<T> {
//   value: T
// }

// interface TweakpaneBinding {
//   on: (event: string, callback: (e: any) => void) => void
//   disabled: boolean
// }

// interface Pane {
//   addBinding: (target: any, key: string, config?: any) => TweakpaneBinding
//   addFolder: (config: any) => Pane
//   on: (event: string, callback: (e: any) => void) => void
//   dispose: () => void
// }

// export default function DpoReport() {
//   const [config, setConfig] = useState<TweakpaneConfig>({
//     explode: false,
//     theme: "light",
//     x1: -20,
//     y1: 35,
//     x2: 30,
//     step: 3,
//     tx: 0.5,
//     ty: -0.5,
//   })
//   const [dialogOpen, setDialogOpen] = useState(false)
//   const paneRef = useRef<HTMLDivElement>(null)
//   const dialogRef = useRef<HTMLDialogElement>(null)

//   useEffect(() => {
//     if (typeof window === "undefined") return

//     const importTweakpane = async () => {
//       const { Pane } = await import("tweakpane")

//       if (!paneRef.current) return

//       const ctrl = new Pane({
//         title: "Config",
//         expanded: true,
//         container: paneRef.current,
//       })

//       const update = () => {
//         document.documentElement.dataset.theme = config.theme
//         document.documentElement.dataset.exploded = String(config.explode)
//         document.documentElement.style.setProperty("--tx", String(config.tx))
//         document.documentElement.style.setProperty("--ty", String(config.ty))
//         document.documentElement.style.setProperty("--x1", String(config.x1))
//         document.documentElement.style.setProperty("--y1", String(config.y1))
//         document.documentElement.style.setProperty("--x2", String(config.x2))
//         document.documentElement.style.setProperty("--step", String(config.step))
//       }

//       const sync = (event: any) => {
//         if (!document.startViewTransition || event.target.controller.view.labelElement.innerText !== "theme")
//           return update()

//         // @ts-ignore - startViewTransition is not in the types yet
//         document.startViewTransition(() => update())
//       }

//       ctrl
//         .addBinding(config, "explode", {
//           label: "explode",
//         })
//         .on("change", (e: TweakpaneChangeEvent<boolean>) => {
//           setConfig((prev) => ({ ...prev, explode: e.value }))
//         })

//       const translations = ctrl.addFolder({ title: "translations", expanded: false })
//       translations
//         .addBinding(config, "step", {
//           label: "z",
//           min: 2,
//           max: 10,
//           step: 0.1,
//         })
//         .on("change", (e: TweakpaneChangeEvent<number>) => {
//           setConfig((prev) => ({ ...prev, step: e.value }))
//         })
//       translations
//         .addBinding(config, "tx", {
//           label: "x",
//           min: -3,
//           max: 3,
//           step: 0.1,
//         })
//         .on("change", (e: TweakpaneChangeEvent<number>) => {
//           setConfig((prev) => ({ ...prev, tx: e.value }))
//         })
//       translations
//         .addBinding(config, "ty", {
//           label: "y",
//           min: -3,
//           max: 3,
//           step: 0.1,
//         })
//         .on("change", (e: TweakpaneChangeEvent<number>) => {
//           setConfig((prev) => ({ ...prev, ty: e.value }))
//         })

//       const rotations = ctrl.addFolder({ title: "rotations", expanded: false })
//       const x1 = rotations
//         .addBinding(config, "x1", {
//           label: "x1",
//           min: -360,
//           max: 360,
//           step: 1,
//         })
//         .on("change", (e: TweakpaneChangeEvent<number>) => {
//           setConfig((prev) => ({ ...prev, x1: e.value }))
//         })
//       const y1 = rotations
//         .addBinding(config, "y1", {
//           label: "y1",
//           min: -360,
//           max: 360,
//           step: 1,
//         })
//         .on("change", (e: TweakpaneChangeEvent<number>) => {
//           setConfig((prev) => ({ ...prev, y1: e.value }))
//         })
//       const x2 = rotations
//         .addBinding(config, "x2", {
//           label: "x2",
//           min: -360,
//           max: 360,
//           step: 1,
//         })
//         .on("change", (e: TweakpaneChangeEvent<number>) => {
//           setConfig((prev) => ({ ...prev, x2: e.value }))
//         })

//       ctrl
//         .addBinding(config, "theme", {
//           label: "Theme",
//           options: {
//             System: "system",
//             Light: "light",
//             Dark: "dark",
//           },
//         })
//         .on("change", (e: TweakpaneChangeEvent<string>) => {
//           setConfig((prev) => ({ ...prev, theme: e.value }))
//         })

//       ctrl.on("change", sync)
//       update()

//       // Disable rotation inputs when explode is false
//       const updateDisabled = () => {
//         x1.disabled = y1.disabled = x2.disabled = !config.explode
//       }
//       updateDisabled()

//       return () => {
//         ctrl.dispose()
//       }
//     }

//     importTweakpane()
//   }, [])

//   useEffect(() => {
//     document.documentElement.dataset.theme = config.theme
//     document.documentElement.dataset.exploded = String(config.explode)
//     document.documentElement.style.setProperty("--tx", String(config.tx))
//     document.documentElement.style.setProperty("--ty", String(config.ty))
//     document.documentElement.style.setProperty("--x1", String(config.x1))
//     document.documentElement.style.setProperty("--y1", String(config.y1))
//     document.documentElement.style.setProperty("--x2", String(config.x2))
//     document.documentElement.style.setProperty("--step", String(config.step))
//   }, [config])

//   return (
//     <>
//       <div ref={paneRef} className="fixed top-4 right-4 z-50" />
//       <div className="container space-y-6 w-full max-w-[1586px] flex flex-1 flex-col h-full mb-4 bg-white rounded-3xl shadow-[0_0_0px_5px_#bcc5e81c,_0_0_0px_2px_#dfe0e4_] px-8 pt-10 mt-40" id="main">
//         <div dir="ltr" data-orientation="horizontal" className="h-full">
//           {/* Tabs header space (the small div and hidden tab sections) */}
//           <div className="flex justify-end items-between"></div>
//           <div
//             data-state="inactive"
//             data-orientation="horizontal"
//             role="tabpanel"
//             aria-labelledby="radix-:r1s:-trigger-obras"
//             hidden
//             id="radix-:r1s:-content-obras"
//             tabIndex={0}
//             className="outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 bg-containerBackground h-full mt-0 -mx-8"
//           ></div>
//           <div
//             data-state="inactive"
//             data-orientation="horizontal"
//             role="tabpanel"
//             aria-labelledby="radix-:r1s:-trigger-estadisticas"
//             hidden
//             id="radix-:r1s:-content-estadisticas"
//             tabIndex={0}
//             className="outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 bg-containerBackground h-full mt-0 -mx-8"
//           ></div>

//           {/* Active tab content */}
//           <div
//             data-state="active"
//             data-orientation="horizontal"
//             role="tabpanel"
//             aria-labelledby="radix-:r1s:-trigger-reporte"
//             id="radix-:r1s:-content-reporte"
//             tabIndex={0}
//             className="outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 mt-0 p-0"
//             style={{ animationDuration: "0s" }}
//           >
//             <div className="min-h-screen bg-containerBackground grid grid-cols-12 gap-4 -mx-8 px-4 -mt-4">
//               {/* Header */}
//               <section className="col-span-12 -mx-4">
//                 <div className="content content--main">
//                   <header className="bg-white flex items-center justify-start border-b col-span-12 -mx-4 px-8 pr-24 pb-4">
//                     <div className="flex items-start space-x-2 w-1/4">
//                       <div>
//                         <h1 className="font-bold text-4xl text-gray-800 flex items-center gap-4">
//                           DPO
//                           <div data-orientation="vertical" role="none" className="shrink-0 bg-gray-400 h-8 w-1"></div>
//                           <span className="text-lg text-gray-500">Dirección</span>
//                         </h1>
//                         <p className="text-lg text-gray-500 w-2/3">Dirección de Planificación y Obras</p>
//                         <div style={{ opacity: 1 }}>
//                           <div
//                             role="tablist"
//                             aria-orientation="horizontal"
//                             className="inline-flex items-center justify-center rounded-lg bg-containerHollowBackground p-0.5 text-muted-foreground/70"
//                             tabIndex={0}
//                             data-orientation="horizontal"
//                             style={{ outline: "none" }}
//                           >
//                             <button
//                               type="button"
//                               role="tab"
//                               aria-selected="true"
//                               aria-controls="radix-:r1s:-content-reporte"
//                               data-state="active"
//                               id="radix-:r1s:-trigger-reporte"
//                               className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium outline-offset-2 transition-all hover:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:shadow-black/5 gap-1.5 group relative"
//                               tabIndex={-1}
//                               data-orientation="horizontal"
//                               data-radix-collection-item=""
//                             >
//                               Reporte
//                             </button>
//                             <button
//                               type="button"
//                               role="tab"
//                               aria-selected="false"
//                               aria-controls="radix-:r1s:-content-estadisticas"
//                               data-state="inactive"
//                               id="radix-:r1s:-trigger-estadisticas"
//                               className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium outline-offset-2 transition-all hover:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:shadow-black/5 gap-1.5 group relative"
//                               tabIndex={-1}
//                               data-orientation="horizontal"
//                               data-radix-collection-item=""
//                             >
//                               Tabla
//                             </button>
//                             <button
//                               type="button"
//                               role="tab"
//                               aria-selected="false"
//                               aria-controls="radix-:r1s:-content-obras"
//                               data-state="inactive"
//                               id="radix-:r1s:-trigger-obras"
//                               className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium outline-offset-2 transition-all hover:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:shadow-black/5 gap-1.5 group relative"
//                               tabIndex={-1}
//                               data-orientation="horizontal"
//                               data-radix-collection-item=""
//                             >
//                               Graficos
//                             </button>
//                             <button
//                               type="button"
//                               role="tab"
//                               aria-selected="false"
//                               aria-controls="radix-:r1s:-content-reportesSimples"
//                               data-state="inactive"
//                               id="radix-:r1s:-trigger-reportesSimples"
//                               className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium outline-offset-2 transition-all hover:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:shadow-black/5 gap-1.5 group relative"
//                               tabIndex={-1}
//                               data-orientation="horizontal"
//                               data-radix-collection-item=""
//                             >
//                               Reportes Simples
//                             </button>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                     <div className="flex items-start justify-between w-full ">
//                       <div className="flex flex-col items-start pr-8 mr-8">
//                         <span className="text-xl font-medium uppercase text-gray-500">
//                           <b className="text-primary">OBRAS </b> VIGENTES
//                         </span>
//                         <span className="text-8xl font-bold text-gray-800">106</span>
//                       </div>
//                       <div className="flex space-x-10">
//                         <div
//                           data-orientation="vertical"
//                           role="none"
//                           className="shrink-0 w-[1px] bg-gray-300 h-24"
//                         ></div>
//                         <div>
//                           <p className="text-xl font-medium text-start uppercase text-gray-500">
//                             <b className="text-primary">CERTIFICADOS</b> EMITIDOS
//                           </p>
//                           <div className="grid grid-cols-3 gap-8 mt-1">
//                             <div className="flex flex-col items-start">
//                               <span className="text-2xl font-bold ">
//                                 03
//                                 <span className="text-sm font-light text-gray-500">/28</span>
//                               </span>
//                               <span className="text-xs font-semibold">OBRA BÁSICA</span>
//                             </div>
//                             <div className="flex flex-col items-start">
//                               <span className="text-2xl font-bold ">
//                                 14
//                                 <span className="text-sm font-light text-gray-500">/25</span>
//                               </span>
//                               <span className="text-xs font-semibold">REDETERM.</span>
//                             </div>
//                             <div className="flex flex-col items-start">
//                               <span className="text-2xl font-bold ">
//                                 02
//                                 <span className="text-sm font-light text-gray-500">/05</span>
//                               </span>
//                               <span className="text-xs font-semibold">ADICIONALES</span>
//                             </div>
//                           </div>
//                         </div>
//                         <div
//                           data-orientation="vertical"
//                           role="none"
//                           className="shrink-0 w-[1px] bg-gray-300 h-24"
//                         ></div>
//                         <div className="flex flex-col items-start">
//                           <p className="text-xl font-medium text-start uppercase text-gray-500">
//                             <b className="text-primary">AÑO </b> 2025
//                           </p>
//                           <div className="grid grid-cols-4 gap-8 mt-1">
//                             <div className="flex flex-col items-start">
//                               <span className="text-2xl font-bold text-gray-800">35</span>
//                               <span className="text-xs font-semibold text-start flex flex-col justify-center items-start">
//                                 LICITACIONES
//                                 <span className="text-gray-500 font-light text-center">PUBLICADAS</span>
//                               </span>
//                             </div>
//                             <div className="flex flex-col items-start ">
//                               <span className="text-2xl font-bold text-gray-800">25</span>
//                               <span className="text-xs font-semibold text-center flex flex-col justify-center items-start">
//                                 PLIEGOS
//                                 <span className="text-gray-500 font-light text-center"> ELEVADOS</span>
//                               </span>
//                             </div>
//                             <div className="flex flex-col items-start">
//                               <span className="text-2xl font-bold text-gray-800">32</span>
//                               <span className="text-xs font-semibold text-center flex flex-col justify-center items-start">
//                                 CONTRATOS
//                                 <span className="text-gray-500 font-light text-center"> FIRMADOS</span>
//                               </span>
//                             </div>
//                             <div className="flex flex-col items-start">
//                               <span className="text-2xl font-bold text-gray-800">32</span>
//                               <span className="text-xs font-semibold text-center flex flex-col justify-center items-start">
//                                 OBRAS
//                                 <span className="text-gray-500 font-light text-center"> ENTREGADAS</span>
//                               </span>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </header>
//                 </div>

//                 <div className="layer layer--main">
//                   <div className="mover mover--nested">
//                     <div className="content content--table ">
//                       <div className="grid grid-cols-12 gap-4">
//                         {/* Left side content */}
//                         <div className="w-64 col-span-2 row-span-2">
//                           <div className="gap-4 mb-4 row-span-1 max-h-[400px] relative">
//                             <div className="rounded-2xl border bg-card text-card-foreground shadow-none h-full layer moreZ2">
//                               <div className="flex flex-col space-y-1.5 p-6 pb-2 px-4">
//                                 <h3 className="tracking-tight text-xl font-medium text-gray-800">
//                                   Cronograma de Obras
//                                 </h3>
//                               </div>
//                               <div className="p-6 overflow-y-auto h-full max-h-[300px] floating-scroll pt-0 px-4">
//                                 <div className="space-y-6">
//                                   <div className="mb-6">
//                                     <h3 className="text-sm uppercase tracking-wider font-semibold sticky top-0 bg-white/90 backdrop-blur-sm py-2 z-10">
//                                       marzo de 2025
//                                     </h3>
//                                     <div
//                                       data-slot="timeline"
//                                       className="group/timeline flex data-[orientation=horizontal]:w-full data-[orientation=horizontal]:flex-row data-[orientation=vertical]:flex-col pl-1"
//                                       data-orientation="vertical"
//                                     >
//                                       <div
//                                         data-slot="timeline-item"
//                                         className="group/timeline-item has-[+[data-completed]]:[&_[data-slot=timeline-separator]]:bg-primary relative flex flex-1 flex-col gap-0.5 group-data-[orientation=horizontal]/timeline:mt-8 group-data-[orientation=horizontal]/timeline:not-last:pe-8 group-data-[orientation=vertical]/timeline:ms-8 group-data-[orientation=vertical]/timeline:not-last:pb-12 last:pb-0"
//                                         data-completed="true"
//                                       >
//                                         <div
//                                           data-slot="timeline-separator"
//                                           className="bg-primary/10 absolute self-start group-last/timeline-item:hidden group-data-[orientation=horizontal]/timeline:-top-6 group-data-[orientation=horizontal]/timeline:h-0.5 group-data-[orientation=horizontal]/timeline:w-[calc(100%-1rem-0.25rem)] group-data-[orientation=horizontal]/timeline:-translate-y-1/2 group-data-[orientation=horizontal]/timeline:translate-x-4.5 group-data-[orientation=vertical]/timeline:-left-6 group-data-[orientation=vertical]/timeline:w-0.5 group-data-[orientation=vertical]/timeline:-translate-x-1/2 group-data-[orientation=vertical]/timeline:h-[calc(100%-1.75rem)] group-data-[orientation=vertical]/timeline:translate-y-6"
//                                           aria-hidden="true"
//                                         ></div>
//                                         <div
//                                           data-slot="timeline-indicator"
//                                           className="border-primary/20 group-data-completed/timeline-item:border-primary absolute size-5 shadow rounded-full border-2 group-data-[orientation=horizontal]/timeline:-top-6 group-data-[orientation=horizontal]/timeline:left-0 group-data-[orientation=horizontal]/timeline:-translate-y-1/2 group-data-[orientation=vertical]/timeline:top-0 group-data-[orientation=vertical]/timeline:-left-6 group-data-[orientation=vertical]/timeline:-translate-x-1/2"
//                                           aria-hidden="true"
//                                         >
//                                           <div
//                                             className="absolute inset-0 bg-black rounded-full"
//                                             style={{ transform: "none" }}
//                                           ></div>
//                                         </div>
//                                         <div data-slot="timeline-header" className="" data-state="closed">
//                                           <div className="flex items-center gap-2 ">
//                                             <time
//                                               data-slot="timeline-date"
//                                               className="block group-data-[orientation=vertical]/timeline:max-sm:h-4 text-xs font-semibold m-0 text-primary"
//                                             >
//                                               23 mar
//                                             </time>
//                                             <span className="text-xs font-medium">•</span>
//                                             <span className="text-xs font-medium text-muted-foreground">
//                                               Finalización de Obra
//                                             </span>
//                                           </div>
//                                           <h3
//                                             data-slot="timeline-title"
//                                             className="text-sm font-light line-clamp-2 text-ellipsis mb-3"
//                                           >
//                                             Direccion de Transporte Fluvial y Puertos - Iluminacion Zona Primaria
//                                           </h3>
//                                         </div>
//                                       </div>
//                                       {/* More timeline items... */}
//                                     </div>
//                                   </div>
//                                 </div>
//                               </div>
//                               <span className="w-full h-4 bg-gradient-to-t rounded-b-2xl from-background to-transparent absolute bottom-0 left-0 right-0"></span>
//                             </div>
//                           </div>

//                           <div className="flex flex-col gap-4 mb-4 row-span-2">
//                             <div className="rounded-2xl bg-card text-card-foreground row-span-1 flex flex-col border-0 shadow-sm layer moreZ2">
//                               <div className="flex flex-col space-y-1.5 p-6 pb-2 pt-3 px-4">
//                                 <h3 className="tracking-tight text-xs font-medium text-gray-500">
//                                   CERTIFICACIÓN MENSUAL
//                                 </h3>
//                               </div>
//                               <div className="p-6 px-4 pb-3 pt-0">
//                                 <p className="text-2xl font-bold">$ 205.365.896</p>
//                                 <p className="text-xs text-gray-500">ENERO 2025</p>
//                               </div>
//                             </div>
//                             <div className="rounded-2xl bg-card text-card-foreground row-span-1 border-0 shadow-sm layer moreZ2">
//                               <div className="flex flex-col space-y-1.5 p-6 pb-2 pt-3 px-4">
//                                 <h3 className="tracking-tight text-xs font-medium text-gray-500">
//                                   INVERSIÓN TOTAL AUTORIZADA
//                                 </h3>
//                               </div>
//                               <div className="p-6 px-4 pb-3 pt-0">
//                                 <p className="text-2xl font-bold">$ 6.705.365.896</p>
//                                 <p className="text-xs text-gray-500">EJECUCIÓN DEL PRESUPUESTO</p>
//                               </div>
//                             </div>
//                             <div className="rounded-2xl bg-card text-card-foreground row-span-1 border-0 shadow-sm layer moreZ1">
//                               <div className="flex flex-col space-y-1.5 p-6 pb-2 pt-3 px-4">
//                                 <h3 className="tracking-tight text-xs font-medium text-gray-500">FONDOS SOLICITADOS</h3>
//                               </div>
//                               <div className="p-6 px-4 pb-3 pt-0">
//                                 <p className="text-2xl font-bold">$ 4.205.645.698</p>
//                                 <p className="text-xs text-gray-500">ENERO A FEBRERO 2025</p>
//                               </div>
//                             </div>
//                           </div>
//                         </div>

//                         {/* Right side content */}
//                         <div className="col-span-10 px-2">
//                           <div className="flex flex-col gap-4">
//                             <div className="flex gap-4 items-stretch">
//                               {/* OBRAS EN EJECUCIÓN */}
//                               <div className="w-1/2 flex flex-col flex-1 ">
//                                 <h3 className="tracking-tight text-lg font-medium text-gray-500">OBRAS EN EJECUCIÓN</h3>
//                                 <div className="rounded-2xl border text-card-foreground border-none shadow-none bg-containerBackground flex flex-col flex-1 layer moreZ3 rounded-2xl">
//                                   <div className="undefined h-full flex flex-col flex-1">
//                                     <div className="flex flex-col space-y-1.5 p-0 bg-containerHollowBackground rounded-t-lg overflow-hidden">
//                                       <div className="flex justify-start">
//                                         <div
//                                           className="bg-containerHollowBackground rounded-t-lg"
//                                           tabIndex={0}
//                                           style={{ width: "50%" }}
//                                         >
//                                           <div
//                                             className="flex flex-col justify-center items-start h-full text-start p-2 px-4 cursor-pointer bg-white rounded-t-lg"
//                                             style={{
//                                               backgroundColor: "rgb(255, 255, 255)",
//                                               borderTopLeftRadius: 8,
//                                               borderTopRightRadius: 8,
//                                             }}
//                                           >
//                                             <p className="text-3xl font-bold" style={{ color: "rgb(31, 41, 55)" }}>
//                                               4
//                                             </p>
//                                             <p className="text-xs text-gray-500 line-clamp-2 text-ellipsis">BASICAS</p>
//                                           </div>
//                                         </div>
//                                         <div className="bg-white" tabIndex={0} style={{ width: "25%" }}>
//                                           <div
//                                             className="flex flex-col justify-center items-start h-full text-start p-2 px-4 cursor-pointer bg-containerHollowBackground rounded-bl-lg"
//                                             style={{
//                                               backgroundColor: "rgb(233, 235, 245)",
//                                               borderTopLeftRadius: 0,
//                                               borderTopRightRadius: 0,
//                                             }}
//                                           >
//                                             <p className="text-3xl font-bold" style={{ color: "rgb(156, 163, 175)" }}>
//                                               18
//                                             </p>
//                                             <p className="text-xs text-gray-500 line-clamp-2 text-ellipsis">
//                                               EN PROCESO
//                                             </p>
//                                           </div>
//                                         </div>
//                                         <div
//                                           className="bg-containerHollowBackground"
//                                           tabIndex={0}
//                                           style={{ width: "25%" }}
//                                         >
//                                           <div
//                                             className="flex flex-col justify-center items-start h-full text-start p-2 px-4 cursor-pointer"
//                                             style={{
//                                               backgroundColor: "transparent",
//                                               borderTopLeftRadius: 0,
//                                               borderTopRightRadius: 0,
//                                             }}
//                                           >
//                                             <p className="text-3xl font-bold" style={{ color: "rgb(156, 163, 175)" }}>
//                                               4
//                                             </p>
//                                             <p className="text-xs text-gray-500 line-clamp-2 text-ellipsis">
//                                               FINALIZADAS
//                                             </p>
//                                           </div>
//                                         </div>
//                                       </div>
//                                     </div>
//                                     <div className="p-6 px-4 pb-3 pt-0 bg-white rounded-b-lg flex flex-col flex-1">
//                                       <div style={{ opacity: 1 }}>
//                                         <div className="space-y-1 text-xs max-h-[200px] floating-scroll -mr-4">
//                                           <div className="flex justify-between pt-1">
//                                             <span className="font-medium">140-000143/24</span>
//                                             <span>
//                                               1284 - Teatro Oficial 'Juan de Vera' - Foyer, Pasillos, Fachada y Sala
//                                             </span>
//                                           </div>
//                                           <div className="flex justify-between pt-1 border-t">
//                                             <span className="font-medium">140-000339/24</span>
//                                             <span>1228 - Parroquia 'San Pedro' - Refaccion y Ampliacion</span>
//                                           </div>
//                                           <div className="flex justify-between pt-1 border-t">
//                                             <span className="font-medium">140-000680/24</span>
//                                             <span>1213 - Teatro Oficial 'Juan de Vera' - Sistema de Incendios</span>
//                                           </div>
//                                           <div className="flex justify-between pt-1 border-t">
//                                             <span className="font-medium">140-000768/23</span>
//                                             <span>1252 - Parroquia 'Ascensión del Señor' - Refaccion General</span>
//                                           </div>
//                                         </div>
//                                       </div>
//                                     </div>
//                                   </div>
//                                 </div>
//                               </div>

//                               {/* OBRAS EN PREFINANCIAMIENTO */}
//                               <div className="w-1/2 flex flex-col flex-1 ">
//                                 <h3 className="tracking-tight text-lg font-medium text-gray-500">
//                                   OBRAS EN PREFINANCIAMIENTO
//                                 </h3>
//                                 <div className="rounded-2xl border text-card-foreground border-none shadow-none bg-containerBackground flex flex-col flex-1 layer moreZ3 rounded-2xl">
//                                   <div className="undefined h-full flex flex-col flex-1">
//                                     <div className="flex flex-col space-y-1.5 p-0 bg-containerHollowBackground rounded-t-lg overflow-hidden">
//                                       <div className="flex justify-start">
//                                         <div
//                                           className="bg-containerHollowBackground rounded-t-lg"
//                                           tabIndex={0}
//                                           style={{ width: "50%" }}
//                                         >
//                                           <div
//                                             className="flex flex-col justify-center items-start h-full text-start p-2 px-4 cursor-pointer bg-white rounded-t-lg"
//                                             style={{
//                                               backgroundColor: "rgb(255, 255, 255)",
//                                               borderTopLeftRadius: 8,
//                                               borderTopRightRadius: 8,
//                                             }}
//                                           >
//                                             <p className="text-3xl font-bold" style={{ color: "rgb(31, 41, 55)" }}>
//                                               05
//                                             </p>
//                                             <p className="text-xs text-gray-500 line-clamp-2 text-ellipsis">ELEVADOS</p>
//                                           </div>
//                                         </div>
//                                       </div>
//                                     </div>
//                                     <div className="p-6 px-4 pb-3 pt-0 bg-white rounded-b-lg flex flex-col flex-1">
//                                       <div style={{ opacity: 1 }}>
//                                         <div className="space-y-1 text-xs">
//                                           <div className="flex justify-between pt-1">
//                                             <span className="font-medium">140-003055/23</span>
//                                             <span>1242 - Ente Regulador del Agua - Refaccion y Ampliacion</span>
//                                           </div>
//                                           <div className="flex justify-between pt-1 border-t">
//                                             <span className="font-medium">140-003076/23</span>
//                                             <span>1218 - Cuartel de Bomberos Forestales - ITU</span>
//                                           </div>
//                                           <div className="flex justify-between pt-1 border-t">
//                                             <span className="font-medium">140-003313/24</span>
//                                             <span>1290 - Lipton Football Club - Iluminacion</span>
//                                           </div>
//                                           <div className="flex justify-between pt-1 border-t">
//                                             <span className="font-medium">140-003572/24</span>
//                                             <span>1226 - Comisaria de Laguna Brava - Obra Nueva</span>
//                                           </div>
//                                           <div className="flex justify-between pt-1 border-t">
//                                             <span className="font-medium">140-004234/24</span>
//                                             <span>1291 - Direccion de Transporte Fluvial y Puertos - Iluminacion</span>
//                                           </div>
//                                         </div>
//                                       </div>
//                                     </div>
//                                   </div>
//                                 </div>
//                               </div>
//                             </div>

//                             {/* Next row of blocks */}
//                             <div className="flex gap-4 ">
//                               {/* OBRAS EN PROYECTO */}
//                               <div className="w-1/2 flex flex-col flex-1">
//                                 <h3 className="tracking-tight text-lg font-medium text-gray-500">OBRAS EN PROYECTO</h3>
//                                 <div className="rounded-2xl border text-card-foreground border-none shadow-none bg-containerBackground flex flex-col flex-1  layer moreZ2 rounded-2xl">
//                                   <div className="undefined h-full flex flex-col flex-1">
//                                     <div className="flex flex-col space-y-1.5 p-0 bg-containerHollowBackground rounded-t-lg overflow-hidden">
//                                       <div className="flex justify-start">
//                                         <div
//                                           className="bg-containerHollowBackground rounded-t-lg"
//                                           tabIndex={0}
//                                           style={{ width: "50%" }}
//                                         >
//                                           <div
//                                             className="flex flex-col justify-center items-start h-full text-start p-2 px-4 cursor-pointer bg-white rounded-t-lg"
//                                             style={{
//                                               backgroundColor: "rgb(255, 255, 255)",
//                                               borderTopLeftRadius: 8,
//                                               borderTopRightRadius: 8,
//                                             }}
//                                           >
//                                             <p className="text-3xl font-bold" style={{ color: "rgb(31, 41, 55)" }}>
//                                               03
//                                             </p>
//                                             <p className="text-xs text-gray-500 line-clamp-2 text-ellipsis">
//                                               EN PROCESO
//                                             </p>
//                                           </div>
//                                         </div>
//                                         <div className="bg-white" tabIndex={0} style={{ width: "50%" }}>
//                                           <div
//                                             className="flex flex-col justify-center items-start h-full text-start p-2 px-4 cursor-pointer bg-containerHollowBackground rounded-bl-lg"
//                                             style={{
//                                               backgroundColor: "rgb(233, 235, 245)",
//                                               borderTopLeftRadius: 0,
//                                               borderTopRightRadius: 0,
//                                             }}
//                                           >
//                                             <p className="text-3xl font-bold" style={{ color: "rgb(156, 163, 175)" }}>
//                                               03
//                                             </p>
//                                             <p className="text-xs text-gray-500 line-clamp-2 text-ellipsis">RETRASO</p>
//                                           </div>
//                                         </div>
//                                       </div>
//                                     </div>
//                                     <div className="p-6 px-4 pb-3 pt-0 bg-white rounded-b-lg flex flex-col flex-1">
//                                       <div style={{ opacity: 1 }}>
//                                         <div className="space-y-1 text-xs max-h-[200px] floating-scroll -mr-4">
//                                           <div className="flex justify-between pt-1">
//                                             <span className="font-medium">140-003055/23</span>
//                                             <span>1242 - Ente Regulador del Agua - Refaccion y Ampliacion</span>
//                                           </div>
//                                           <div className="flex justify-between pt-1 border-t">
//                                             <span className="font-medium">140-003076/23</span>
//                                             <span>1218 - Cuartel de Bomberos Forestales - ITU</span>
//                                           </div>
//                                           <div className="flex justify-between pt-1 border-t">
//                                             <span className="font-medium">140-003313/24</span>
//                                             <span>1290 - Lipton Football Club - Iluminacion</span>
//                                           </div>
//                                         </div>
//                                       </div>
//                                     </div>
//                                   </div>
//                                 </div>
//                               </div>

//                               {/* OBRAS EN PROCESO LICITATORIO */}
//                               <div className="w-1/2 flex flex-col flex-1">
//                                 <h3 className="tracking-tight text-lg font-medium text-gray-500">
//                                   OBRAS EN PROCESO LICITATORIO
//                                 </h3>
//                                 <div className="rounded-2xl border text-card-foreground border-none shadow-none bg-containerBackground flex flex-col flex-1 layer moreZ2 rounded-2xl">
//                                   <div className="undefined h-full flex flex-col flex-1">
//                                     <div className="flex flex-col space-y-1.5 p-0 bg-containerHollowBackground rounded-t-lg overflow-hidden">
//                                       <div className="flex justify-start">
//                                         <div
//                                           className="bg-containerHollowBackground rounded-t-lg"
//                                           tabIndex={0}
//                                           style={{ width: "50%" }}
//                                         >
//                                           <div
//                                             className="flex flex-col justify-center items-start h-full text-start p-2 px-4 cursor-pointer bg-white rounded-t-lg"
//                                             style={{
//                                               backgroundColor: "rgb(255, 255, 255)",
//                                               borderTopLeftRadius: 8,
//                                               borderTopRightRadius: 8,
//                                             }}
//                                           >
//                                             <p className="text-3xl font-bold" style={{ color: "rgb(31, 41, 55)" }}>
//                                               03
//                                             </p>
//                                             <p className="text-xs text-gray-500 line-clamp-2 text-ellipsis">LICITAR</p>
//                                           </div>
//                                         </div>
//                                         <div className="bg-white" tabIndex={0} style={{ width: "50%" }}>
//                                           <div
//                                             className="flex flex-col justify-center items-start h-full text-start p-2 px-4 cursor-pointer bg-containerHollowBackground rounded-bl-lg"
//                                             style={{
//                                               backgroundColor: "rgb(233, 235, 245)",
//                                               borderTopLeftRadius: 0,
//                                               borderTopRightRadius: 0,
//                                             }}
//                                           >
//                                             <p className="text-3xl font-bold" style={{ color: "rgb(156, 163, 175)" }}>
//                                               02
//                                             </p>
//                                             <p className="text-xs text-gray-500 line-clamp-2 text-ellipsis">
//                                               ADJUDICAR
//                                             </p>
//                                           </div>
//                                         </div>
//                                       </div>
//                                     </div>
//                                     <div className="p-6 px-4 pb-3 pt-0 bg-white rounded-b-lg flex flex-col flex-1">
//                                       <div style={{ opacity: 1 }}>
//                                         <div className="space-y-1 text-xs max-h-[200px] floating-scroll -mr-4">
//                                           <div className="flex justify-between pt-1">
//                                             <span className="font-medium">140-002488/24</span>
//                                             <span>1301 - Centro de Atencion para personas con Discapacidad</span>
//                                           </div>
//                                           <div className="flex justify-between pt-1 border-t">
//                                             <span className="font-medium">140-002629/24</span>
//                                             <span>1215 - Dirección de Transporte Fluvial y Puertos - Baños</span>
//                                           </div>
//                                           <div className="flex justify-between pt-1 border-t">
//                                             <span className="font-medium">140-002836/24</span>
//                                             <span>1282 - Cuartel de Bomberos Forestales - SRO</span>
//                                           </div>
//                                         </div>
//                                       </div>
//                                     </div>
//                                   </div>
//                                 </div>
//                               </div>
//                             </div>

//                             {/* PROVISION DE OBRAS */}
//                             <h3 className="tracking-tight text-lg font-medium text-gray-500">PROVISION DE OBRAS</h3>
//                             <div className="rounded-2xl border bg-card text-card-foreground border-none shadow-none w-1/2">
//                               <div className="flex flex-col space-y-1.5 p-6 pb-2 pt-3 px-4"></div>
//                               <div className="p-6 px-4 pb-3 pt-0">
//                                 <div className="flex justify-between items-center">
//                                   <div className="text-center pr-8">
//                                     <p className="text-3xl font-bold text-gray-800">03</p>
//                                     <p className="text-xs text-gray-500">OBRAS</p>
//                                   </div>
//                                   <div className="text-center border-l border-r px-12 py-2">
//                                     <p className="text-lg font-bold text-gray-800">$ 55.365.264,18</p>
//                                   </div>
//                                   <div className="text-center pl-8">
//                                     <p className="text-lg font-bold text-gray-800">$ 55.365.264,18</p>
//                                   </div>
//                                 </div>
//                               </div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="layer layer--status">
//                     <div className="layer layer--dialog">
//                       <div className="mover">
//                         <div className="content">
//                           <dialog ref={dialogRef} className="dialog">
//                             {/* Dialog content */}
//                           </dialog>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </section>
//             </div>
//           </div>
//           <div
//             data-state="inactive"
//             data-orientation="horizontal"
//             role="tabpanel"
//             aria-labelledby="radix-:r1s:-trigger-reportesSimples"
//             hidden
//             id="radix-:r1s:-content-reportesSimples"
//             tabIndex={0}
//             className="outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 mt-0 p-0"
//           ></div>
//         </div>
//       </div>
//     </>
//   )
// }

