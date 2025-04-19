'use client'
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, File, KanbanSquare, LayoutGrid, Plus, X, BarChart4, FolderKanban } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Import shadcn components
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from '@/components/ui/use-toast';
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

// TypeScript interfaces
interface Project {
  id: number;
  name: string;
  status: 'completed' | 'in-progress' | 'to-do';
  completion: number;
  dueDate: string;
  assignee: string;
  priority: 'high' | 'medium' | 'low';
}

interface FileItem {
  id: number;
  name: string;
  size: string;
  lastModified: string;
  owner: string;
}

interface Task {
  id: number;
  name: string;
  status: 'completed' | 'in-progress' | 'to-do';
  startDate: string;
  dueDate: string;
  assignee: string;
  project: string;
  dependencies?: number[];  // Array of task IDs that this task depends on
}

const ProjectManagementApp = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editStartDate, setEditStartDate] = useState<Date | undefined>(undefined);
  const [editEndDate, setEditEndDate] = useState<Date | undefined>(undefined);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskProject, setNewTaskProject] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [kanbanProjectFilter, setKanbanProjectFilter] = useState<string>('all');
  const [kanbanUserFilter, setKanbanUserFilter] = useState<string>('all');
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, name: 'Wireframe Página Principal', status: 'completed', startDate: '2025-03-15', dueDate: '2025-03-20', assignee: 'Alex Smith', project: 'Rediseño de Sitio Web' },
    { id: 2, name: 'Configuración Sistema de Diseño', status: 'in-progress', startDate: '2025-03-29', dueDate: '2025-04-05', assignee: 'Taylor Wong', project: 'Rediseño de Sitio Web', dependencies: [1] },
    { id: 3, name: 'Diseño Esquema Base de Datos', status: 'to-do', startDate: '2025-04-08', dueDate: '2025-04-12', assignee: 'Jordan Lee', project: 'Desarrollo de App Móvil' },
    { id: 4, name: 'Realizar Entrevistas de Usuario', status: 'in-progress', startDate: '2025-03-28', dueDate: '2025-04-02', assignee: 'Morgan Chen', project: 'Investigación de Usuarios' },
    { id: 5, name: 'Auditoría de Contenido', status: 'completed', startDate: '2025-03-12', dueDate: '2025-03-18', assignee: 'Riley Johnson', project: 'Estrategia de Contenido' },
    { id: 6, name: 'Pruebas Responsivas', status: 'to-do', startDate: '2025-04-05', dueDate: '2025-04-10', assignee: 'Alex Smith', project: 'Rediseño de Sitio Web', dependencies: [2] },
    { id: 7, name: 'Integración de API', status: 'to-do', startDate: '2025-04-18', dueDate: '2025-04-25', assignee: 'Jordan Lee', project: 'Desarrollo de App Móvil', dependencies: [3] },
    { id: 8, name: 'Optimización SEO', status: 'to-do', startDate: '2025-04-28', dueDate: '2025-05-05', assignee: 'Taylor Wong', project: 'Rediseño de Sitio Web', dependencies: [6] },
  ]);
  const nextTaskId = useRef(9);

  // Translated mock data
  const projects: Project[] = [
    { id: 1, name: 'Rediseño de Sitio Web', status: 'in-progress', completion: 65, dueDate: '2025-04-15', assignee: 'Alex Smith', priority: 'high' },
    { id: 2, name: 'Desarrollo de App Móvil', status: 'to-do', completion: 20, dueDate: '2025-05-10', assignee: 'Jordan Lee', priority: 'medium' },
    { id: 3, name: 'Estrategia de Contenido', status: 'completed', completion: 100, dueDate: '2025-03-25', assignee: 'Taylor Wong', priority: 'low' },
    { id: 4, name: 'Investigación de Usuarios', status: 'in-progress', completion: 45, dueDate: '2025-04-05', assignee: 'Morgan Chen', priority: 'high' },
    { id: 5, name: 'Campaña de Marketing', status: 'to-do', completion: 0, dueDate: '2025-05-20', assignee: 'Riley Johnson', priority: 'medium' },
  ];

  const files: FileItem[] = [
    { id: 1, name: 'Resumen del Proyecto.pdf', size: '2.4 MB', lastModified: '2025-03-15', owner: 'Alex Smith' },
    { id: 2, name: 'Recursos de Diseño.zip', size: '15.7 MB', lastModified: '2025-03-20', owner: 'Taylor Wong' },
    { id: 3, name: 'Notas de Reunión.docx', size: '1.2 MB', lastModified: '2025-03-22', owner: 'Jordan Lee' },
    { id: 4, name: 'Resultados de Investigación.xlsx', size: '3.5 MB', lastModified: '2025-03-25', owner: 'Morgan Chen' },
    { id: 5, name: 'Plan de Marketing.pptx', size: '8.3 MB', lastModified: '2025-03-28', owner: 'Riley Johnson' },
  ];

  // List of team members for new task assignment
  const teamMembers = ['Alex Smith', 'Taylor Wong', 'Jordan Lee', 'Morgan Chen', 'Riley Johnson'];

  // Helper function to get project names
  const projectNames = projects.map(project => project.name);

  // Add a new task
  const handleAddTask = useCallback(() => {
    if (!newTaskName.trim() || !newTaskProject || !newTaskAssignee || selectedDay === null) {
      // Show error toast
      // toast({
      //   title: "Error",
      //   description: "Por favor complete todos los campos",
      //   variant: "destructive",
      // });
      return;
    }

    const endDateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`;

    // Create a startDate 3 days before dueDate
    const startDate = new Date(endDateStr);
    startDate.setDate(startDate.getDate() - 3);
    const startDateStr = startDate.toISOString().split('T')[0];

    const newTask: Task = {
      id: nextTaskId.current,
      name: newTaskName,
      status: 'to-do',
      startDate: startDateStr,
      dueDate: endDateStr,
      assignee: newTaskAssignee,
      project: newTaskProject
    };

    setTasks(prevTasks => [...prevTasks, newTask]);
    nextTaskId.current += 1;

    // Reset form
    setNewTaskName('');
    setNewTaskProject('');
    setNewTaskAssignee('');
    setIsAddTaskDialogOpen(false);

    // Show success toast
    // toast({
    //   title: "Tarea añadida",
    //   description: `Nueva tarea "${newTaskName}" para el ${endDateStr}`,
    // });
  }, [newTaskName, newTaskProject, newTaskAssignee, selectedDay, currentYear, currentMonth]);

  // Update a task's status
  const updateTaskStatus = useCallback((taskId: number, newStatus: 'completed' | 'in-progress' | 'to-do') => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
  }, []);

  // Helper functions
  const getStatusColor = (status: 'completed' | 'in-progress' | 'to-do'): string => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'to-do': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  // Helper functions
  const getPriorityColor = (priority: 'high' | 'medium' | 'low'): string => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Spanish translations for priority
  const priorityMap: Record<string, string> = {
    'high': 'Alta',
    'medium': 'Media',
    'low': 'Baja'
  };

  // Spanish translations for status
  const statusMap: Record<string, string> = {
    'completed': 'Completado',
    'in-progress': 'En Progreso',
    'to-do': 'Por Hacer'
  };

  // Calendar view helpers
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month, 1).getDay();
  };

  // Spanish translations
  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const handlePreviousMonth = useCallback(() => {
    setCurrentMonth(prevMonth => {
      if (prevMonth === 0) {
        setCurrentYear(prevYear => prevYear - 1);
        return 11;
      } else {
        return prevMonth - 1;
      }
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth(prevMonth => {
      if (prevMonth === 11) {
        setCurrentYear(prevYear => prevYear + 1);
        return 0;
      } else {
        return prevMonth + 1;
      }
    });
  }, []);

  const getTasksForDate = useCallback((day: number): Task[] => {
    const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return tasks.filter(task => task.dueDate === dateStr);
  }, [currentYear, currentMonth, tasks]);

  // Update a task
  const handleUpdateTask = useCallback(() => {
    if (!editingTask || !editStartDate || !editEndDate) return;

    const startDateStr = format(editStartDate, 'yyyy-MM-dd');
    const endDateStr = format(editEndDate, 'yyyy-MM-dd');

    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === editingTask.id
          ? { ...task, startDate: startDateStr, dueDate: endDateStr }
          : task
      )
    );

    setIsEditTaskDialogOpen(false);
    setEditingTask(null);
    setEditStartDate(undefined);
    setEditEndDate(undefined);

    // Show success toast
    // toast({
    //   title: "Tarea actualizada",
    //   description: `Se han actualizado las fechas de la tarea "${editingTask.name}"`,
    // });
  }, [editingTask, editStartDate, editEndDate]);

  // Open edit dialog for a task
  const openEditTaskDialog = (task: Task) => {
    setEditingTask(task);
    setEditStartDate(new Date(task.startDate));
    setEditEndDate(new Date(task.dueDate));
    setIsEditTaskDialogOpen(true);
  };

  // Render functions for each view
  const renderSummaryView = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-6">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Proyectos</CardTitle>
          </CardHeader>
          <CardContent>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold"
            >
              {projects.length}
            </motion.div>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Tareas Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl font-bold"
            >
              {tasks.filter(t => t.status !== 'completed').length}
            </motion.div>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Tasa de Finalización</CardTitle>
          </CardHeader>
          <CardContent>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold"
            >
              {Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)}%
            </motion.div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Resumen de Proyectos</CardTitle>
          <CardDescription>Estado actual de todos los proyectos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col space-y-3"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">{project.name}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>Fecha límite: {project.dueDate}</span>
                      <span>•</span>
                      <span>Asignado a: {project.assignee}</span>
                    </div>
                  </div>
                  <Badge className={getPriorityColor(project.priority)}>
                    {priorityMap[project.priority]}
                  </Badge>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${project.completion}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full ${getStatusColor(project.status)}`}
                  ></motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Próximas Fechas Límite</CardTitle>
          <CardDescription>Tareas pendientes en los próximos 7 días</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {tasks
              .filter(task => {
                const today = new Date();
                const dueDate = new Date(task.dueDate);
                const diffTime = Number(dueDate) - Number(today);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays >= 0 && diffDays <= 7 && task.status !== 'completed';
              })
              .sort((a, b) => Number(new Date(a.dueDate)) - Number(new Date(b.dueDate)))
              .map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div>
                    <h3 className="font-semibold">{task.name}</h3>
                    <div className="text-sm text-gray-500">{task.project}</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-sm">{task.dueDate}</div>
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{task.assignee.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                  </div>
                </motion.div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render Kanban view with drag and drop
  const renderKanbanView = () => {
    // Apply filters to tasks
    const filteredTasks = tasks.filter(task => {
      const matchesProject = kanbanProjectFilter === 'all' || task.project === kanbanProjectFilter;
      const matchesUser = kanbanUserFilter === 'all' || task.assignee === kanbanUserFilter;
      return matchesProject && matchesUser;
    });

    // Group filtered tasks by status
    const todoTasks = filteredTasks.filter(task => task.status === 'to-do');
    const inProgressTasks = filteredTasks.filter(task => task.status === 'in-progress');
    const completedTasks = filteredTasks.filter(task => task.status === 'completed');

    const handleDragStart = (e: React.DragEvent, taskId: number) => {
      e.dataTransfer.setData('taskId', taskId.toString());
      e.dataTransfer.effectAllowed = 'move';

      // Para mejor UX, podemos añadir una clase al elemento que se está arrastrando
      if (e.currentTarget instanceof HTMLElement) {
        setTimeout(() => {
          e.currentTarget.classList.add('opacity-50');
        }, 0);
      }
    };

    const handleDragEnd = (e: React.DragEvent) => {
      // Restaurar el estilo cuando finaliza el arrastre
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.classList.remove('opacity-50');
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.classList.add('bg-gray-50');
      }
    };

    const handleDragLeave = (e: React.DragEvent) => {
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.classList.remove('bg-gray-50');
      }
    };

    const handleDrop = (e: React.DragEvent, newStatus: 'to-do' | 'in-progress' | 'completed') => {
      e.preventDefault();
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.classList.remove('bg-gray-50');
      }

      const taskId = e.dataTransfer.getData('taskId');
      if (taskId) {
        updateTaskStatus(parseInt(taskId), newStatus);

        // Añadir efecto visual de éxito
        const targetColumn = e.currentTarget;
        if (targetColumn instanceof HTMLElement) {
          targetColumn.classList.add('bg-green-50');
          setTimeout(() => {
            targetColumn.classList.remove('bg-green-50');
          }, 300);
        }
      }
    };

    const TaskItem = ({ task }: { task: Task }) => (
      <div
        key={task.id}
        className="cursor-grab touch-none"
        draggable
        onDragStart={(e) => handleDragStart(e, task.id)}
        onDragEnd={handleDragEnd}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.02 }}
        >
          <Card className="shadow-sm border border-transparent hover:border-gray-200">
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-sm font-semibold">{task.name}</CardTitle>
              <CardDescription className="text-xs">{task.project}</CardDescription>
            </CardHeader>
            <CardFooter className="p-3 pt-1 flex justify-between items-center">
              <div className="text-xs text-gray-500">{task.dueDate}</div>
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">{task.assignee.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    );

    const KanbanColumn = ({ title, tasks, status }: { title: string, tasks: Task[], status: 'to-do' | 'in-progress' | 'completed' }) => {
      // Color de fondo según estado
      const getHeaderBgColor = () => {
        switch (status) {
          case 'to-do': return 'bg-gray-100';
          case 'in-progress': return 'bg-blue-50';
          case 'completed': return 'bg-green-50';
        }
      };

      return (
        <Card
          className="shadow-md flex flex-col h-[650px] transition-all"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, status)}
        >
          <CardHeader className={getHeaderBgColor()}>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">{title}</CardTitle>
              <div className="px-3 py-1 rounded-full bg-white text-sm font-medium">
                {tasks.length}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 flex-1 overflow-y-auto">
            <div className="space-y-3 min-h-[20px]">
              {tasks.length === 0 ? (
                <div className="h-20 border-2 border-dashed border-gray-200 rounded-md flex items-center justify-center text-gray-400 text-sm">
                  Arrastra tareas aquí
                </div>
              ) : (
                tasks.map(task => <TaskItem key={task.id} task={task} />)
              )}
            </div>
          </CardContent>
        </Card>
      );
    };

    // El mensaje de ayuda sólo se muestra la primera vez
    const [showKanbanHelp, setShowKanbanHelp] = useState(true);

    return (
      <div className="space-y-4">
        {showKanbanHelp && (
          <Alert className="bg-blue-50 mb-4">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start">
                <div className="flex-1">
                  <AlertTitle>¿Cómo usar el Kanban?</AlertTitle>
                  <AlertDescription>
                    Arrastra y suelta las tarjetas entre columnas para cambiar su estado. Las tareas se actualizarán automáticamente.
                  </AlertDescription>
                </div>
                <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setShowKanbanHelp(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </Alert>
        )}

        {/* Filter controls */}
        <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
          <h3 className="font-medium text-gray-700 mb-3">Filtrar Tareas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="project-filter" className="text-sm font-medium text-gray-700">
                Por Proyecto
              </label>
              <Select
                value={kanbanProjectFilter}
                onValueChange={setKanbanProjectFilter}
              >
                <SelectTrigger id="project-filter" className="w-full">
                  <SelectValue placeholder="Todos los proyectos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los proyectos</SelectItem>
                  {projectNames.map(project => (
                    <SelectItem key={project} value={project}>{project}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="user-filter" className="text-sm font-medium text-gray-700">
                Por Usuario
              </label>
              <Select
                value={kanbanUserFilter}
                onValueChange={setKanbanUserFilter}
              >
                <SelectTrigger id="user-filter" className="w-full">
                  <SelectValue placeholder="Todos los usuarios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los usuarios</SelectItem>
                  {teamMembers.map(member => (
                    <SelectItem key={member} value={member}>{member}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active filters display and reset button */}
          {(kanbanProjectFilter !== 'all' || kanbanUserFilter !== 'all') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 pt-3 border-t flex flex-wrap items-center gap-2"
            >
              <span className="text-sm text-gray-500">Filtros activos:</span>
              {kanbanProjectFilter !== 'all' && (
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 flex items-center gap-1"
                >
                  Proyecto: {kanbanProjectFilter}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => setKanbanProjectFilter('all')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {kanbanUserFilter !== 'all' && (
                <Badge
                  variant="outline"
                  className="bg-purple-50 text-purple-700 flex items-center gap-1"
                >
                  Usuario: {kanbanUserFilter}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => setKanbanUserFilter('all')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-xs"
                onClick={() => {
                  setKanbanProjectFilter('all');
                  setKanbanUserFilter('all');
                }}
              >
                Limpiar todos
              </Button>
            </motion.div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-6 h-full">
          <KanbanColumn title="Por Hacer" tasks={todoTasks} status="to-do" />
          <KanbanColumn title="En Progreso" tasks={inProgressTasks} status="in-progress" />
          <KanbanColumn title="Completado" tasks={completedTasks} status="completed" />
        </div>

        {filteredTasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-8 mt-4"
          >
            <div className="mx-auto w-16 h-16 mb-4 text-gray-400">
              <FolderKanban size={64} />
            </div>
            <h3 className="text-xl font-medium text-gray-700 mb-2">No hay tareas que coincidan con los filtros</h3>
            <p className="text-gray-500 mb-4">Prueba a cambiar tus criterios de filtrado para ver más tareas</p>
            <Button
              variant="outline"
              onClick={() => {
                setKanbanProjectFilter('all');
                setKanbanUserFilter('all');
              }}
            >
              Mostrar todas las tareas
            </Button>
          </motion.div>
        )}
      </div>
    );
  };

  // Calendar view with ability to add tasks
  const renderCalendarView = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);

    // Create array for calendar days
    const calendarDays: (number | null)[] = [];

    // Add empty cells for days before the start of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(day);
    }

    const handleDayClick = (day: number) => {
      setSelectedDay(day);
      setIsAddTaskDialogOpen(true);
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-6">
          <motion.h2
            key={`${monthNames[currentMonth]}-${currentYear}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold"
          >
            {monthNames[currentMonth]} {currentYear}
          </motion.h2>
          <div className="flex space-x-2">
            <Button onClick={handlePreviousMonth} variant="outline" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button onClick={handleNextMonth} variant="outline" size="icon">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-3">
          {daysOfWeek.map(day => (
            <div key={day} className="text-center font-semibold p-2 text-gray-600">{day}</div>
          ))}

          {calendarDays.map((day, index) => (
            <motion.div
              key={`day-${index}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.01 }}
              className={`min-h-32 border rounded-md p-2 ${day ? 'bg-white hover:shadow-md transition-shadow' : 'bg-gray-50'
                }`}
            >
              {day && (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold">{day}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 rounded-full"
                      onClick={() => handleDayClick(day)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {getTasksForDate(day).map(task => (
                      <div
                        key={task.id}
                        className={`text-xs p-1.5 rounded flex items-center justify-between ${getStatusColor(task.status)} text-white cursor-pointer hover:brightness-110 transition-all`}
                        title={`${task.name}\nProyecto: ${task.project}\nAsignado a: ${task.assignee}\nEstado: ${statusMap[task.status]}`}
                        onClick={() => openEditTaskDialog(task)}
                      >
                        <span className="truncate flex-1 pr-1">{task.name}</span>
                        <span className="h-2 w-2 rounded-full bg-white opacity-80"></span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>

        {/* Dialog for adding a new task */}
        <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Añadir Tarea</DialogTitle>
              <DialogDescription>
                Añadir nueva tarea para el {selectedDay} de {monthNames[currentMonth]} de {currentYear}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="taskName" className="text-sm font-medium">Nombre de la tarea</label>
                <Input
                  id="taskName"
                  placeholder="Escriba el nombre de la tarea"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="project" className="text-sm font-medium">Proyecto</label>
                <Select value={newTaskProject} onValueChange={setNewTaskProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectNames.map(project => (
                      <SelectItem key={project} value={project}>{project}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="assignee" className="text-sm font-medium">Asignar a</label>
                <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar persona" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map(member => (
                      <SelectItem key={member} value={member}>{member}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddTaskDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleAddTask}>
                Añadir Tarea
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  const renderFilesView = () => (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Archivos del Proyecto</CardTitle>
        <CardDescription>Todos los documentos y recursos subidos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {files.map((file, index) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-all"
            >
              <div className="flex items-center space-x-4">
                <File className="h-6 w-6 text-blue-500" />
                <div>
                  <h3 className="font-medium">{file.name}</h3>
                  <div className="text-sm text-gray-500">
                    {file.size} • Última modificación: {file.lastModified}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">{file.owner}</span>
                <Button variant="outline" size="sm">
                  Descargar
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // Render Gantt chart view
  const renderGanttView = () => {
    // Sort tasks by start date
    const sortedTasks = [...tasks].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    // Group tasks by project
    const tasksByProject: Record<string, Task[]> = {};
    sortedTasks.forEach(task => {
      if (!tasksByProject[task.project]) {
        tasksByProject[task.project] = [];
      }
      tasksByProject[task.project].push(task);
    });

    // Get earliest and latest dates for timeline calculation
    const earliestDate = new Date(sortedTasks[0]?.startDate || new Date());
    const latestDate = new Date(sortedTasks[sortedTasks.length - 1]?.dueDate || new Date());

    // Add buffer days
    earliestDate.setDate(earliestDate.getDate() - 3);
    latestDate.setDate(latestDate.getDate() + 3);

    // Calculate total days in timeline
    const totalDays = Math.ceil((latestDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24));

    // Generate date labels for the header (every 7 days)
    const dateLabels: string[] = [];
    for (let i = 0; i <= totalDays; i += 7) {
      const date = new Date(earliestDate);
      date.setDate(date.getDate() + i);
      dateLabels.push(`${date.getDate()}/${date.getMonth() + 1}`);
    }

    // Helper to calculate position and width for task bars
    const getTaskBarStyle = (task: Task) => {
      const startDateObj = new Date(task.startDate);
      const dueDateObj = new Date(task.dueDate);

      const daysSinceStart = Math.floor((startDateObj.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24));
      const taskDuration = Math.ceil((dueDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const positionPercent = (daysSinceStart / totalDays) * 100;
      const widthPercent = (taskDuration / totalDays) * 100;

      return {
        left: `${positionPercent}%`,
        width: `${widthPercent}%`,
      };
    };

    // Calculate task duration in days
    const getTaskDuration = (task: Task) => {
      const startDate = new Date(task.startDate);
      const dueDate = new Date(task.dueDate);
      return Math.ceil((dueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    };

    // Helper to get task row position by task ID
    const [taskPositions, setTaskPositions] = useState<Record<number, { top: number, left: number, right: number }>>({});

    // Reference for the container to get positions
    const ganttContainerRef = useRef<HTMLDivElement>(null);

    // Function to calculate task positions for drawing dependency lines
    const updateTaskPositions = useCallback(() => {
      if (!ganttContainerRef.current) return;

      const newPositions: Record<number, { top: number, left: number, right: number }> = {};
      const containerRect = ganttContainerRef.current.getBoundingClientRect();

      tasks.forEach(task => {
        const taskElement = ganttContainerRef.current?.querySelector(`[data-task-id="${task.id}"]`);
        if (taskElement) {
          const rect = taskElement.getBoundingClientRect();

          newPositions[task.id] = {
            top: rect.top - containerRect.top + rect.height / 2,
            left: rect.left - containerRect.left,
            right: rect.right - containerRect.left
          };
        }
      });

      setTaskPositions(newPositions);
    }, [tasks]);

    // Update positions when component mounts or tasks change
    useEffect(() => {
      // Small delay to ensure DOM is updated
      const timer = setTimeout(() => {
        updateTaskPositions();
      }, 500);

      return () => clearTimeout(timer);
    }, [updateTaskPositions, activeTab]);

    // Draw dependency lines between tasks
    const renderDependencyLines = () => {
      const lines: React.ReactNode[] = [];

      tasks.forEach(task => {
        if (task.dependencies?.length) {
          task.dependencies.forEach(dependencyId => {
            const dependentTask = taskPositions[task.id];
            const dependencyTask = taskPositions[dependencyId];

            if (dependentTask && dependencyTask) {
              // Calculate path points
              const startX = dependencyTask.right;
              const startY = dependencyTask.top;
              const endX = dependentTask.left;
              const endY = dependentTask.top;
              const midX = startX + (endX - startX) / 2;

              // Create SVG path
              const path = `M ${startX} ${startY} 
                           L ${midX} ${startY} 
                           L ${midX} ${endY} 
                           L ${endX} ${endY}`;

              lines.push(
                <path
                  key={`${dependencyId}-${task.id}`}
                  d={path}
                  fill="none"
                  stroke="#888"
                  strokeWidth="1.5"
                  strokeDasharray="4"
                  markerEnd="url(#arrowhead)"
                />
              );
            }
          });
        }
      });

      return (
        <svg
          className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="6"
              markerHeight="4"
              refX="6"
              refY="2"
              orient="auto"
            >
              <polygon points="0 0, 6 2, 0 4" fill="#888" />
            </marker>
          </defs>
          {lines}
        </svg>
      );
    };

    return (
      <div className="space-y-4">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Diagrama de Gantt</CardTitle>
            <CardDescription>Vista cronológica de las tareas del proyecto</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <div className="min-w-[800px] relative" ref={ganttContainerRef}>
              {/* Timeline header */}
              <div className="flex border-b h-16">
                <div className="w-1/4 min-w-48 p-4 font-semibold border-r">Proyecto / Tarea</div>
                <div className="w-3/4 flex relative">
                  {/* Date labels */}
                  {dateLabels.map((label, index) => (
                    <div
                      key={`date-${index}`}
                      className="absolute text-xs text-gray-500 font-medium"
                      style={{ left: `${(index * 7 / totalDays) * 100}%` }}
                    >
                      {label}
                    </div>
                  ))}

                  {/* Vertical grid lines */}
                  {dateLabels.map((_, index) => (
                    <div
                      key={`grid-${index}`}
                      className="absolute h-full border-l border-gray-200"
                      style={{ left: `${(index * 7 / totalDays) * 100}%` }}
                    />
                  ))}

                  {/* Today marker */}
                  <div
                    className="absolute h-full border-l-2 border-red-500 z-10"
                    style={{
                      left: `${(Math.floor((new Date().getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24)) / totalDays) * 100}%`
                    }}
                  >
                    <div className="bg-red-500 text-white text-xs px-1 py-0.5 rounded absolute -top-3 -translate-x-1/2">
                      Hoy
                    </div>
                  </div>
                </div>
              </div>

              {/* Dependency lines */}
              {renderDependencyLines()}

              {/* Projects and tasks */}
              {Object.entries(tasksByProject).map(([projectName, projectTasks], projectIndex) => (
                <React.Fragment key={projectName}>
                  {/* Project row */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: projectIndex * 0.1 }}
                    className="flex border-b bg-gray-50"
                  >
                    <div className="w-1/4 min-w-48 p-4 font-semibold">
                      {projectName}
                    </div>
                    <div className="w-3/4 p-4 relative">
                      {/* Project completion bar */}
                      <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{
                            width: `${(projectTasks.filter(t => t.status === 'completed').length / projectTasks.length) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Task rows */}
                  {projectTasks.map((task, taskIndex) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (projectIndex * 0.1) + (taskIndex * 0.05) }}
                      className="flex border-b hover:bg-gray-50"
                    >
                      <div className="w-1/4 min-w-48 p-3 pl-8 flex items-center">
                        <div className="truncate">
                          <div className="font-medium text-sm">{task.name}</div>
                          <div className="flex items-center space-x-2">
                            <div className="text-xs text-gray-500">{task.assignee}</div>
                            <Badge variant="outline" className="text-xs">
                              {getTaskDuration(task)} días
                            </Badge>
                            {task.dependencies?.length ? (
                              <Badge variant="outline" className="text-xs bg-blue-50">
                                {task.dependencies.length} depend.
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <div className="w-3/4 py-3 px-4 relative">
                        {/* Task bar */}
                        <motion.div
                          data-task-id={task.id}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className={`absolute h-6 rounded px-2 flex items-center text-white text-xs ${getStatusColor(task.status)} cursor-pointer hover:brightness-110`}
                          style={{
                            ...getTaskBarStyle(task),
                            transformOrigin: 'left',
                          }}
                          onClick={() => openEditTaskDialog(task)}
                        >
                          <div className="truncate">{task.name}</div>
                        </motion.div>

                        {/* Start date marker */}
                        <div
                          className="absolute h-10 w-0.5 bg-gray-500 z-10"
                          style={{
                            left: `${(Math.floor((new Date(task.startDate).getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24)) / totalDays) * 100}%`,
                            top: '0.2rem'
                          }}
                        >
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 whitespace-nowrap mb-1 text-xs">
                            {task.startDate.split('-').reverse().join('/')}
                          </div>
                        </div>

                        {/* Due date marker */}
                        <div
                          className="absolute h-10 w-0.5 bg-black z-10"
                          style={{
                            left: `${(Math.floor((new Date(task.dueDate).getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24)) / totalDays) * 100}%`,
                            top: '0.2rem'
                          }}
                        >
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 whitespace-nowrap mt-1 text-xs">
                            {task.dueDate.split('-').reverse().join('/')}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>

        <Alert className="bg-blue-50">
          <div className="flex items-start">
            <div className="flex-1">
              <AlertTitle>Información del Diagrama</AlertTitle>
              <AlertDescription>
                El diagrama muestra las tareas organizadas por proyecto. Cada barra representa la duración de la tarea desde su fecha de inicio hasta su fecha de vencimiento. Las líneas punteadas indican dependencias entre tareas.
              </AlertDescription>
            </div>
          </div>
        </Alert>
      </div>
    );
  };

  // Render Project Overview
  const renderProjectOverview = () => {
    // Calculate project statistics
    const projectStats = projects.map(project => {
      const projectTasks = tasks.filter(task => task.project === project.name);
      const completedTasks = projectTasks.filter(task => task.status === 'completed').length;
      const inProgressTasks = projectTasks.filter(task => task.status === 'in-progress').length;
      const todoTasks = projectTasks.filter(task => task.status === 'to-do').length;
      const totalTasks = projectTasks.length;

      const startDates = projectTasks.map(task => new Date(task.startDate));
      const dueDates = projectTasks.map(task => new Date(task.dueDate));

      // Find project start and end dates based on tasks
      const projectStartDate = startDates.length > 0 ? new Date(Math.min(...startDates.map(d => d.getTime()))) : null;
      const projectEndDate = dueDates.length > 0 ? new Date(Math.max(...dueDates.map(d => d.getTime()))) : null;

      // Calculate project duration in days
      const projectDuration = projectStartDate && projectEndDate
        ? Math.ceil((projectEndDate.getTime() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        : 0;

      // Calculate overall project progress
      const taskWeights = projectTasks.map(task => {
        switch (task.status) {
          case 'completed': return 1;
          case 'in-progress': return 0.5;
          default: return 0;
        }
      });

      const weightedProgress = taskWeights.reduce((sum: number, weight) => sum + weight, 0);
      const progress = totalTasks > 0 ? Math.round((weightedProgress / totalTasks) * 100) : 0;

      return {
        ...project,
        taskCount: {
          total: totalTasks,
          completed: completedTasks,
          inProgress: inProgressTasks,
          todo: todoTasks
        },
        startDate: projectStartDate,
        endDate: projectEndDate,
        duration: projectDuration,
        progress
      };
    });

    // Calculate total completion across all projects
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const overallCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calculate upcoming deadlines
    const today = new Date();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(today.getDate() + 7);

    const upcomingDeadlines = tasks
      .filter(task => {
        const dueDate = new Date(task.dueDate);
        return task.status !== 'completed' && dueDate >= today && dueDate <= oneWeekFromNow;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return (
      <div className="space-y-6">
        {/* Overall progress */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Progreso General</CardTitle>
            <CardDescription>Resumen de todos los proyectos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">{overallCompletion}%</h3>
                  <p className="text-gray-500">Completado</p>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{projects.length}</h3>
                  <p className="text-gray-500">Proyectos Activos</p>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{totalTasks}</h3>
                  <p className="text-gray-500">Tareas Totales</p>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{completedTasks}</h3>
                  <p className="text-gray-500">Tareas Completadas</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Progreso Total</span>
                  <span className="text-sm font-medium">{overallCompletion}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${overallCompletion}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-blue-500"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects breakdown */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Desglose de Proyectos</CardTitle>
            <CardDescription>Información detallada por proyecto</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {projectStats.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg">{project.name}</h3>
                      <div className="flex items-center text-sm text-gray-500">
                        <span>Responsable: {project.assignee}</span>
                        <span className="mx-2">•</span>
                        {project.startDate && project.endDate && (
                          <span>
                            {format(project.startDate, 'dd/MM/yyyy')} - {format(project.endDate, 'dd/MM/yyyy')}
                            {project.duration > 0 && ` (${project.duration} días)`}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge className={getPriorityColor(project.priority)}>
                      {priorityMap[project.priority]}
                    </Badge>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1 text-sm">
                      <span>Progreso: {project.progress}%</span>
                      <div className="flex space-x-3">
                        <Badge variant="outline" className="bg-gray-100">
                          {project.taskCount.todo} por hacer
                        </Badge>
                        <Badge variant="outline" className="bg-blue-100">
                          {project.taskCount.inProgress} en progreso
                        </Badge>
                        <Badge variant="outline" className="bg-green-100">
                          {project.taskCount.completed} completadas
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${project.progress}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-full ${getStatusColor(project.status)}`}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming deadlines */}
        {upcomingDeadlines.length > 0 && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Fechas Límite Próximas</CardTitle>
              <CardDescription>Tareas con fechas de entrega en los próximos 7 días</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingDeadlines.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div>
                      <h3 className="font-semibold">{task.name}</h3>
                      <div className="text-sm text-gray-500">{task.project}</div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm font-medium">
                        {format(new Date(task.dueDate), 'dd/MM/yyyy')}
                      </div>
                      <Badge className={`${task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {statusMap[task.status]}
                      </Badge>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{task.assignee.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Task Edit Dialog Component
  const TaskEditDialog = () => (
    <Dialog open={isEditTaskDialogOpen} onOpenChange={setIsEditTaskDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Fechas de Tarea</DialogTitle>
          <DialogDescription>
            {editingTask ? `Modificar fechas para: ${editingTask.name}` : 'Seleccione una tarea para editar'}
          </DialogDescription>
        </DialogHeader>

        {editingTask && (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="startDate" className="text-sm font-medium">Fecha de inicio</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start text-left font-normal w-full"
                    id="startDate"
                  >
                    {editStartDate ? (
                      format(editStartDate, 'PPP', { locale: es })
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={editStartDate}
                    onSelect={setEditStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <label htmlFor="endDate" className="text-sm font-medium">Fecha de finalización</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start text-left font-normal w-full"
                    id="endDate"
                  >
                    {editEndDate ? (
                      format(editEndDate, 'PPP', { locale: es })
                    ) : (
                      <span>Seleccionar fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={editEndDate}
                    onSelect={setEditEndDate}
                    initialFocus
                    disabled={(date) => {
                      if (!editStartDate) return false;
                      // Disable dates before start date
                      return date < new Date(editStartDate);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsEditTaskDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleUpdateTask}
            disabled={!editingTask || !editStartDate || !editEndDate}
          >
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="container mx-auto p-6 max-w-full">
      {/* Task edit dialog component */}
      <TaskEditDialog />

      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Gestor de Proyectos</h1>
        <Alert className="bg-blue-50 border-blue-200">
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center">
              <div className="flex-1">
                <AlertTitle className="text-lg">¡Bienvenido de nuevo!</AlertTitle>
                <AlertDescription className="flex flex-wrap gap-2 items-center mt-1">
                  <span>Tienes</span>
                  <Badge variant="outline" className="text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md text-sm font-semibold">
                    <motion.span
                      key={tasks.filter(t => t.status !== 'completed').length}
                      initial={{ scale: 1.5 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 10 }}
                    >
                      {tasks.filter(t => t.status !== 'completed').length}
                    </motion.span>
                  </Badge>
                  <span>tareas pendientes y</span>
                  <Badge variant="outline" className="text-green-700 bg-green-100 px-2 py-0.5 rounded-md text-sm font-semibold">
                    <motion.span
                      key={projects.filter(p => p.status !== 'completed').length}
                      initial={{ scale: 1.5 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 10 }}
                    >
                      {projects.filter(p => p.status !== 'completed').length}
                    </motion.span>
                  </Badge>
                  <span>proyectos activos.</span>
                </AlertDescription>
              </div>
              <div className="text-blue-500 hidden md:block">
                <Calendar className="h-8 w-8" />
              </div>
            </div>
          </motion.div>
        </Alert>
      </header>

      <div className="mb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 w-full justify-start">
            <TabsTrigger value="summary" className="flex items-center space-x-2 text-base py-2 px-4">
              <LayoutGrid className="h-5 w-5" />
              <span>Resumen</span>
            </TabsTrigger>
            <TabsTrigger value="project-overview" className="flex items-center space-x-2 text-base py-2 px-4">
              <FolderKanban className="h-5 w-5" />
              <span>Proyectos</span>
            </TabsTrigger>
            <TabsTrigger value="kanban" className="flex items-center space-x-2 text-base py-2 px-4">
              <KanbanSquare className="h-5 w-5" />
              <span>Kanban</span>
            </TabsTrigger>
            <TabsTrigger value="gantt" className="flex items-center space-x-2 text-base py-2 px-4">
              <BarChart4 className="h-5 w-5" />
              <span>Gantt</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center space-x-2 text-base py-2 px-4">
              <Calendar className="h-5 w-5" />
              <span>Calendario</span>
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center space-x-2 text-base py-2 px-4">
              <File className="h-5 w-5" />
              <span>Archivos</span>
            </TabsTrigger>
          </TabsList>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <TabsContent value="summary">
              {renderSummaryView()}
            </TabsContent>
            <TabsContent value="project-overview">
              {renderProjectOverview()}
            </TabsContent>
            <TabsContent value="kanban">
              {renderKanbanView()}
            </TabsContent>
            <TabsContent value="gantt">
              {renderGanttView()}
            </TabsContent>
            <TabsContent value="calendar">
              {renderCalendarView()}
            </TabsContent>
            <TabsContent value="files">
              {renderFilesView()}
            </TabsContent>
          </motion.div>
        </Tabs>
      </div>
    </div>
  );
};

export default ProjectManagementApp;