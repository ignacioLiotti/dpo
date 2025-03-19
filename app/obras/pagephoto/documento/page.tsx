// "use client";

// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import { Separator } from "@/components/ui/separator";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { PrinterIcon } from "lucide-react";
// import Image from "next/image";
// import { useEffect, useRef, useState } from "react";
// import html2canvas from "html2canvas";

// export default function DocumentoPage() {

//   return (
//     <div className="bg-background min-h-screen w-full">
//       <div
//         className=" mx-auto bg-card rounded-lg shadow-sm overflow-hidden"
//       >
//         <div className="relative w-full h-[280px] overflow-hidden">
//           {/* Use regular img tag for better html2canvas compatibility */}
//           <Image
//             src={"/imagen.png"}
//             width={1100}
//             height={280}
//             alt="DPO Dashboard"
//             className="w-full h-full object-cover "
//             crossOrigin="anonymous"
//           />
//         </div>

//         <div className="px-8 pb-8">
//           <header className="py-8 text-center">
//             <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">
//               PROPUESTA DE DESARROLLO DE SOFTWARE PARA LA DIRECCIÓN DE PLANIFICACIÓN Y OBRAS (DPO)
//             </h1>
//             {/* <p className="text-muted-foreground italic">Preparado por: [Nombre de la Empresa]</p> */}
//             <p className="text-muted-foreground italic">Preparado para: Dirección de Planificación y Obras (DPO)</p>
//           </header>

//           <section className="mb-8">
//             <h2 className="text-xl font-semibold tracking-tight mb-4 pb-2 border-b border-border">
//               1. Análisis de Situación / Propuesta
//             </h2>
//             <p className="text-muted-foreground mb-4 text-justify">
//               La Dirección de Planificación y Obras (DPO) enfrenta desafíos en la administración y ejecución de sus proyectos debido a la falta de un sistema centralizado y automatizado. Actualmente, la gestión de obras, certificaciones y expedientes requiere procesos manuales que prolongan la gestión y retrasan la toma de decisiones, aumentando la posibilidad de errores y la dificultad en la trazabilidad de la información.
//             </p>
//             <p className="text-muted-foreground mb-4 text-justify">
//               En este documento se presenta una solución que contempla la creación de un software web modular, centralizado y automatizado. El objetivo de esta herramienta es optimizar y agilizar los procesos administrativos y operativos de la DPO.
//             </p>
//             <p className="text-muted-foreground mb-4 text-justify">
//               La solución permitirá la implementación gradual de módulos específicos que tendrán en cuenta las necesidades de cada área, mejorando la eficiencia y la transparencia en la gestión de proyectos.
//             </p>
//           </section>

//           <section className="mb-8 mt-80">
//             <h2 className="text-xl font-semibold tracking-tight mb-4 pb-2 border-b border-border">
//               2. Objetivos del Software
//             </h2>
//             <p className="text-muted-foreground mb-4">La implementación de este software tiene como objetivo los siguientes puntos:</p>
//             <ul className="list-disc pl-6 mb-4 space-y-2 text-muted-foreground">
//               <li>Automatización de procesos administrativos, reduciendo la carga operativa manual</li>
//               <li>Centralización de la información para mejorar la trazabilidad y acceso a datos clave</li>
//               <li>Optimización de tiempos de respuesta en la gestión de obras, certificaciones y expedientes</li>
//               <li>Reducción de errores administrativos mediante validaciones y alertas automatizadas</li>
//               <li>Implementación modular que permite adaptar y expandir la solución según las necesidades de la DPO</li>
//               <li>Mejoras en la experiencia de usuario (UX) y diseño de interfaz (UI) para simplificar procesos y reducir la carga operativa</li>
//             </ul>
//             <p className="text-muted-foreground mb-4 text-justify">
//               La <strong>digitalización de los procesos administrativos</strong> permitirá agilizar la gestión diaria de la DPO, eliminando tareas manuales innecesarias y asegurando un flujo de trabajo más eficiente.
//               <strong>La centralización de la información facilitará la trazabilidad y el acceso a datos clave</strong>, evitando la dispersión y pérdida de documentos.
//               Con un sistema optimizado, <strong>los tiempos de respuesta se reducirán</strong>, permitiendo una ejecución más rápida y efectiva de obras, certificaciones y expedientes.
//               <strong>La automatización de validaciones y alertas minimizará errores humanos</strong>, asegurando que la información ingresada sea precisa y evitando problemas administrativos.
//               <strong>La implementación modular brindará flexibilidad</strong>, permitiendo adaptar la solución a las necesidades de la DPO en distintas etapas y asegurando una transición progresiva y ordenada.
//               Finalmente, <strong>un diseño intuitivo y optimizado mejorará la experiencia de los usuarios</strong>, facilitando el uso del sistema y reduciendo la carga operativa, lo que contribuirá a un entorno de trabajo más eficiente y productivo.
//             </p>
//           </section>

//           <section className="mb-8 mt-[50rem]">
//             <h2 className="text-xl font-semibold tracking-tight mb-4 pb-2 border-b border-border">
//               3. Módulos del Sistema
//             </h2>
//             <p className="text-muted-foreground mb-6 text-justify">
//               La propuesta contempla el desarrollo de un software estructurado en módulos acumulables, cada uno diseñado para atender necesidades específicas dentro de la DPO. Los módulos iniciales son:
//             </p>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
//               <div className="transition-transform duration-300 hover:-translate-y-1">
//                 <Card className="h-full border-l-4 border-l-primary/50">
//                   <div className="p-3">
//                     <h3 className="text-lg font-semibold border-b border-border pb-3 mb-3">Módulo I - OBRAS</h3>
//                     <p className="text-muted-foreground">Sistema con datos de todas las obras en las que interviene la DPO. Incluye documentación, certificaciones y procesos administrativos.</p>
//                   </div>
//                 </Card>
//               </div>

//               <div className="transition-transform duration-300 hover:-translate-y-1">
//                 <Card className="h-full border-l-4 border-l-primary/50">
//                   <div className="p-3">
//                     <h3 className="text-lg font-semibold border-b border-border pb-3 mb-3">Módulo II - EXPEDIENTES</h3>
//                     <p className="text-muted-foreground">Administración digital de expedientes con trazabilidad y control documental.</p>
//                   </div>
//                 </Card>
//               </div>

//               <div className="transition-transform duration-300 hover:-translate-y-1">
//                 <Card className="h-full border-l-4 border-l-primary/50">
//                   <div className="p-3">
//                     <h3 className="text-lg font-semibold border-b border-border pb-3 mb-3">Módulo III - DASHBOARD DE SEGUIMIENTO</h3>
//                     <p className="text-muted-foreground">Panel de control con estados de los procesos, plazos y generación de reportes en tiempo real.</p>
//                   </div>
//                 </Card>
//               </div>

//               <div className="transition-transform duration-300 hover:-translate-y-1">
//                 <Card className="h-full border-l-4 border-l-primary/50">
//                   <div className="p-3">
//                     <h3 className="text-lg font-semibold border-b border-border pb-3 mb-3">Módulo IV - OBRAS (Departamento)</h3>
//                     <p className="text-muted-foreground">Seguimiento del proceso constructivo de una obra desde la firma del contrato hasta su recepción definitiva.</p>
//                   </div>
//                 </Card>
//               </div>

//               <div className="transition-transform duration-300 hover:-translate-y-1">
//                 <Card className="h-full border-l-4 border-l-primary/50">
//                   <div className="p-3">
//                     <h3 className="text-lg font-semibold border-b border-border pb-3 mb-3">Módulo V - CERTIFICADOS</h3>
//                     <p className="text-muted-foreground">Confección y gestión de certificados de obra, evitando errores y optimizando tiempos de emisión.</p>
//                   </div>
//                 </Card>
//               </div>

//               <div className="transition-transform duration-300 hover:-translate-y-1">
//                 <Card className="h-full border-l-4 border-l-primary/50">
//                   <div className="p-3">
//                     <h3 className="text-lg font-semibold border-b border-border pb-3 mb-3">Módulo VI - PROYECTO</h3>
//                     <p className="text-muted-foreground">Seguimiento del proceso proyectual de obras, permitiendo visualizar avances y prioridades.</p>
//                   </div>
//                 </Card>
//               </div>
//             </div>

//             <p className="text-muted-foreground">Cada módulo puede ser implementado de manera individual, permitiendo una adopción progresiva y adaptable a las prioridades de la DPO.</p>
//           </section>

//           <section className="mb-8 mt-[50rem]">
//             <h2 className="text-xl font-semibold tracking-tight mb-4 pb-2 border-b border-border">
//               4. Beneficios de la Implementación
//             </h2>
//             <p className="text-muted-foreground mb-6">A continuación, se comparan las ventajas de la solución propuesta con las limitaciones de un software enlatado:</p>

//             <div className="rounded-lg overflow-hidden border border-border mb-6">
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead className="w-[200px]">Característica</TableHead>
//                     <TableHead>Plataforma Personalizada</TableHead>
//                     <TableHead>Software Enlatado</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   <TableRow>
//                     <TableCell className="font-medium">Adaptación a necesidades</TableCell>
//                     <TableCell>Totalmente ajustable a los procesos de la DPO, con posibilidad de modificaciones y mejoras.</TableCell>
//                     <TableCell>No permite cambios, los usuarios deben adaptarse al software.</TableCell>
//                   </TableRow>
//                   <TableRow>
//                     <TableCell className="font-medium">Implementación Modular</TableCell>
//                     <TableCell>Se pueden agregar módulos según la evolución de las necesidades de la DPO.</TableCell>
//                     <TableCell>Sistema cerrado con funcionalidades predeterminadas.</TableCell>
//                   </TableRow>
//                   <TableRow>
//                     <TableCell className="font-medium">Integraciones</TableCell>
//                     <TableCell>Compatible con otros sistemas internos y bases de datos.</TableCell>
//                     <TableCell>Limitado a integraciones predefinidas por el proveedor.</TableCell>
//                   </TableRow>
//                   <TableRow>
//                     <TableCell className="font-medium">Escalabilidad</TableCell>
//                     <TableCell>Puede evolucionar con la DPO, incorporando nuevos procesos y optimizaciones.</TableCell>
//                     <TableCell>No permite modificaciones sin costos adicionales elevados.</TableCell>
//                   </TableRow>
//                   <TableRow>
//                     <TableCell className="font-medium">Control de datos</TableCell>
//                     <TableCell>La DPO mantiene control total sobre su información y seguridad.</TableCell>
//                     <TableCell>Dependencia del proveedor para la gestión y almacenamiento de datos.</TableCell>
//                   </TableRow>
//                 </TableBody>
//               </Table>
//             </div>
//           </section>

//           <section className="mb-8">
//             <h2 className="text-xl font-semibold tracking-tight mb-4 pb-2 border-b border-border">
//               5. ¿Por qué Nosotros?
//             </h2>
//             <p className="text-muted-foreground mb-4">Nuestra propuesta se distingue por ofrecer:</p>
//             <ul className="list-disc pl-6 mb-4 space-y-2 text-muted-foreground">
//               <li><span className="font-semibold">Experiencia en el sector:</span> Contamos con un equipo altamente capacitado con experiencia en soluciones tecnológicas para la administración de proyectos de obra pública.</li>
//               <li><span className="font-semibold">Solución personalizada:</span> A diferencia de los sistemas enlatados, nuestro software se adapta a los procesos específicos de la DPO, asegurando eficiencia y flexibilidad.</li>
//               <li><span className="font-semibold">Escalabilidad:</span> Diseñamos una plataforma modular que permite su crecimiento y evolución de acuerdo con las necesidades futuras de la DPO.</li>
//               <li><span className="font-semibold">Enfoque en la optimización de procesos:</span> No solo digitalizamos la información, sino que optimizamos los flujos de trabajo para mejorar la productividad y la toma de decisiones.</li>
//               <li><span className="font-semibold">Soporte técnico especializado:</span> Proporcionamos acompañamiento continuo para garantizar el correcto funcionamiento del sistema y la capacitación del personal.</li>
//             </ul>
//             <p className="text-muted-foreground">Nuestro compromiso es proporcionar una solución tecnológica eficiente, adaptable y orientada a maximizar los beneficios operativos de la DPO.</p>
//           </section>

//           <section className="mb-8 mt-[10rem]">
//             <h2 className="text-xl font-semibold tracking-tight mb-4 pb-2 border-b border-border">
//               6. Equipo de Desarrollo
//             </h2>
//             <p className="text-muted-foreground mb-4">Para la ejecución de este proyecto, se cuenta con un equipo especializado en el desarrollo e implementación de software, compuesto por:</p>
//             <ul className="list-disc pl-6 mb-4 space-y-2 text-muted-foreground">
//               <li><span className="font-semibold">Gerente de proyecto</span> – Ingeniero en software con experiencia en liderazgo de proyectos tecnológicos.</li>
//               <li><span className="font-semibold">Consultor de Procesos</span> – Especialista en la operativa y gestión de la DPO para garantizar la correcta digitalización de procesos.</li>
//               <li><span className="font-semibold">Ingeniero de Software (Backend)</span> – Responsable del diseño de la arquitectura de datos, lógica de negocio del sistema y ciberseguridad.</li>
//               <li><span className="font-semibold">Ingeniero de Software (Frontend)</span> – Encargado de la interfaz de usuario y la experiencia interactiva de la plataforma.</li>
//               <li><span className="font-semibold">Diseñador web</span> – Responsable del diseño visual y la usabilidad del sistema.</li>
//               <li><span className="font-semibold">Analista de Datos</span> – Asegura la integración y análisis de datos para la generación de reportes y dashboards.</li>
//             </ul>
//           </section>

//           <section className="mb-8 ">
//             <h2 className="text-xl font-semibold tracking-tight mb-4 pb-2 border-b border-border">
//               7. Plan de Pagos y Desarrollo por Fases
//             </h2>
//             <p className="text-muted-foreground mb-4">Cada fase contempla:</p>
//             <ul className="list-disc pl-6 mb-6 space-y-2 text-muted-foreground">
//               <li>Desarrollo y pruebas de los módulos correspondientes.</li>
//               <li>Capacitación a los usuarios clave dentro de la DPO.</li>
//               <li>Integración con sistemas existentes (según necesidades).</li>
//               <li>Ajustes y optimización basados en retroalimentación inicial.</li>
//             </ul>

//             <p className="text-muted-foreground mb-6">Para asegurar una implementación eficiente y una inversión escalonada, se propone un plan de pagos en fases basado en la entrega de módulos funcionales:</p>

//             <div className="rounded-lg overflow-hidden border border-border mb-6">
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead>Fase</TableHead>
//                     <TableHead>Módulo(s) a Implementar</TableHead>
//                     <TableHead>Plazo Estimado</TableHead>
//                     <TableHead>Costo</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   <TableRow>
//                     <TableCell className="font-medium">1</TableCell>
//                     <TableCell>Módulo I y II</TableCell>
//                     <TableCell>3 meses</TableCell>
//                     <TableCell>$40.000.000 pesos </TableCell>
//                   </TableRow>
//                   <TableRow>
//                     <TableCell className="font-medium">2</TableCell>
//                     <TableCell>Módulo III</TableCell>
//                     <TableCell>2 meses</TableCell>
//                     <TableCell>$20.000.000 pesos</TableCell>
//                   </TableRow>
//                   <TableRow>
//                     <TableCell className="font-medium">3</TableCell>
//                     <TableCell>Módulo IV y V</TableCell>
//                     <TableCell>2 meses</TableCell>
//                     <TableCell>$20.000.000 pesos</TableCell>
//                   </TableRow>
//                   <TableRow>
//                     <TableCell className="font-medium">4</TableCell>
//                     <TableCell>Módulo VI</TableCell>
//                     <TableCell>1 mes</TableCell>
//                     <TableCell>$10.000.000 pesos</TableCell>
//                   </TableRow>
//                 </TableBody>
//               </Table>
//             </div>
//           </section>

//           <section className="mb-8 mt-[10rem]">
//             <h2 className="text-xl font-semibold tracking-tight mb-4 pb-2 border-b border-border">
//               8. Mantenimiento y Soporte Técnico
//             </h2>
//             <p className="text-muted-foreground mb-4 text-justify">
//               Una vez entregado el proyecto en su totalidad, se ofrecerá un servicio de mantenimiento y soporte técnico mensual, garantizando la estabilidad, seguridad y actualización continua del software.
//             </p>

//             <h3 className="text-lg font-semibold mb-3">Costos durante el desarrollo</h3>
//             <p className="text-foreground mb-2">
//               Durante la fase de desarrollo, los costos de mantenimiento están <span className="font-bold">incluidos en el precio del proyecto</span>, cubriendo:
//             </p>
//             <div className="flex justify-start gap-6 mb-2 flex-wrap">
//               <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">Servidores de desarrollo</span>
//               <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">Bases de datos</span>
//               <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">Almacenamiento</span>
//               <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">Despliegue continuo</span>
//             </div>
//             <p className="text-sm text-muted-foreground text-justify">
//               No se aplicarán cargos adicionales de mantenimiento durante el ciclo de desarrollo del proyecto.
//             </p>

//             <h3 className="text-lg font-semibold mb-3">Alcance del mantenimiento mensual</h3>
//             <p className="text-muted-foreground mb-3">El servicio de mantenimiento incluye:</p>
//             <ul className="list-disc pl-6 mb-6 space-y-2 text-muted-foreground">
//               <li><span className="font-semibold">Actualización de seguridad:</span> Implementación de parches y mejoras de seguridad para proteger los datos de la DPO.</li>
//               <li><span className="font-semibold">Soporte técnico:</span> Atención a consultas y problemas técnicos que puedan surgir en el uso diario del software.</li>
//               <li><span className="font-semibold">Copias de seguridad:</span> Realización de backups periódicos para asegurar la integridad de la información.</li>
//               <li><span className="font-semibold">Compatibilidad y mejoras:</span> Adaptación del software a cambios en el entorno tecnológico o normativas aplicables.</li>
//             </ul>

//             <h3 className="text-lg font-semibold mb-3">Horas de mantenimiento y operación</h3>
//             <p className="text-muted-foreground mb-4 text-justify">
//               El servicio de mantenimiento incluirá horas semanales dedicadas a la supervisión, soporte técnico y optimización del sistema, que se definirán según las necesidades operativas.
//             </p>
//             <p className="text-muted-foreground mb-4 text-justify">
//               Adicionalmente, el costo mensual cubrirá los gastos operativos asociados a la infraestructura necesaria para el funcionamiento de la aplicación, incluyendo:
//             </p>

//             <div className="flex justify-start gap-6 mb-2 flex-wrap font-bold">
//               <p className="text-muted-foreground">Servidores</p>
//               <p className="text-muted-foreground">Base de datos</p>
//               <p className="text-muted-foreground">Almacenamiento</p>
//               <p className="text-muted-foreground">Transferencia de datos</p>
//             </div>

//             <p className="text-muted-foreground mb-6 text-justify">
//               Estos costos pueden variar dependiendo del uso que haga la DPO del sistema, lo que será monitoreado y ajustado conforme a las necesidades operativas.
//             </p>

//             <h3 className="text-lg font-semibold mb-3 mt-[30rem]">Costo del mantenimiento mensual</h3>
//             <div className="bg-primary/5 p-6 rounded-lg border border-primary/20 mb-6">
//               <p className="text-foreground font-semibold text-center text-lg mb-2">
//                 El precio del servicio de mantenimiento será discutido y acordado tras la entrega completa del proyecto
//               </p>
//               <p className="text-sm text-muted-foreground text-center">
//                 <span className="font-medium">Nota importante:</span> Las tarifas de mantenimiento se establecerán <span className="italic">después de la entrega total del proyecto</span> y la aceptación por parte del usuario, basándose en las necesidades operativas reales del sistema.
//               </p>
//             </div>

//             <h3 className="text-lg font-semibold mb-3">Nuevas funcionalidades y desarrollos adicionales</h3>
//             <p className="text-muted-foreground mb-4 text-justify">
//               Cualquier nuevo desarrollo que no esté contemplado dentro del mantenimiento estándar, como la implementación de nuevas funcionalidades, módulos adicionales o cambios sustanciales, será cotizado por separado según los requerimientos específicos del cliente.
//             </p>
//             <p className="text-muted-foreground text-justify">
//               Este enfoque garantiza que la DPO pueda operar con un sistema actualizado, eficiente y seguro, sin preocupaciones por problemas técnicos o pérdidas de datos, asegurando una operación continua y sin interrupciones, con una estructura de costos transparente y adaptada a sus necesidades reales.
//             </p>
//           </section>
//         </div>
//       </div>

//       <style jsx global>{`
//         @media print {
//           .fixed {
//             display: none;
//           }
//           body {
//             background-color: white;
//           }
//         }
//       `}</style>
//     </div>
//   );
// }