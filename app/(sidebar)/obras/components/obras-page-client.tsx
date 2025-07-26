'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { Obra } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  PlusCircle,
  Building,
  DollarSign,
  TrendingUp,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Pause,
  XCircle,
  Loader2
} from 'lucide-react';
import { ObrasDataTable } from './obras-data-table';
import { CreateObraSheet } from './create-obra-sheet';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCurrentOrganization, useAuth } from '@/app/auth';
import { getAllObrasAction } from '../actions/get-obra-action';

interface ObrasDashboardProps {
  initialObras: Obra[];
}

export function ObrasDashboard({ initialObras }: ObrasDashboardProps) {
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [obras, setObras] = useState<Obra[]>(initialObras);
  const [isLoading, setIsLoading] = useState(false);
  const { organization, organizationId } = useCurrentOrganization();
  const { isLoading: orgLoading } = useAuth();
  const hasOrganization = !!organization;

  const handleOpenCreateSheet = () => setIsCreateSheetOpen(true);
  const handleCloseCreateSheet = () => setIsCreateSheetOpen(false);

  // Fetch organization-scoped obras when organization changes
  useEffect(() => {
    const fetchObras = async () => {
      if (orgLoading) return; // Wait for organization context to load
      
      setIsLoading(true);
      try {
        const obrasData = await getAllObrasAction(organizationId || undefined);
        setObras(obrasData || []);
      } catch (error) {
        console.error('Error fetching obras:', error);
        setObras([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchObras();
  }, [organizationId, orgLoading]);

  // Calculate dashboard metrics
  const dashboardMetrics = useMemo(() => {
    const total = obras.length;
    // TODO: Add estado field to obras table
    const enProgreso = 0; // initialObras.filter(obra => obra.estado === 'EN_EJECUCION').length;
    const completadas = 0; // initialObras.filter(obra => obra.estado === 'FINALIZADA').length;
    const pausadas = 0; // initialObras.filter(obra => obra.estado === 'SUSPENDIDA').length;
    const canceladas = 0; // initialObras.filter(obra => obra.estado === 'CANCELADA').length;

    const totalPresupuesto = obras.reduce((sum, obra) => sum + (obra.presupuesto || 0), 0);
    const totalPresupuestoOficial = 0; // TODO: Add presupuesto_oficial field to obras table

    // Obras próximas a vencer (próximos 30 días)
    const today = new Date();
    const next30Days = addDays(today, 30);
    // TODO: Add fecha_fin and estado fields to obras table
    const proximasAVencer: any[] = []; // initialObras.filter(obra => {
    //   if (!obra.fecha_fin) return false;
    //   const fechaFin = new Date(obra.fecha_fin);
    //   return isAfter(fechaFin, today) && isBefore(fechaFin, next30Days) && obra.estado === 'EN_EJECUCION';
    // });

    // Obras atrasadas - TODO: Add fecha_fin and estado fields to obras table
    const atrasadas: any[] = []; // initialObras.filter(obra => {
    //   if (!obra.fecha_fin) return false;
    //   const fechaFin = new Date(obra.fecha_fin);
    //   return isBefore(fechaFin, today) && obra.estado === 'EN_EJECUCION';
    // });

    // Obras por provincia
    const obrasPorProvincia = initialObras.reduce((acc, obra) => {
      const provincia = obra.provincia || 'Sin especificar';
      acc[provincia] = (acc[provincia] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      enProgreso,
      completadas,
      pausadas,
      canceladas,
      totalPresupuesto,
      totalPresupuestoOficial,
      proximasAVencer: proximasAVencer.length,
      atrasadas: atrasadas.length,
      obrasPorProvincia,
      obrasProximasAVencer: proximasAVencer,
      obrasAtrasadas: atrasadas
    };
  }, [obras]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'EN_EJECUCION':
        return <Clock className="w-4 h-4" />;
      case 'FINALIZADA':
        return <CheckCircle className="w-4 h-4" />;
      case 'SUSPENDIDA':
        return <Pause className="w-4 h-4" />;
      case 'CANCELADA':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Building className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EN_EJECUCION':
        return 'text-blue-600';
      case 'FINALIZADA':
        return 'text-green-600';
      case 'SUSPENDIDA':
        return 'text-yellow-600';
      case 'CANCELADA':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatEstado = (estado: string) => {
    return estado.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const completionRate = dashboardMetrics.total > 0 ? (dashboardMetrics.completadas / dashboardMetrics.total) * 100 : 0;

  return (
    <div className="container mx-auto py-6 space-y-6 bg-white/50 max-w-full overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Obras</h1>
          <p className="text-muted-foreground">
            Gestión y seguimiento de proyectos de construcción
          </p>
        </div>
        <Button onClick={handleOpenCreateSheet}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nueva Obra
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Obras</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardMetrics.total}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardMetrics.enProgreso} en progreso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Presupuesto Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboardMetrics.totalPresupuesto)}</div>
            <p className="text-xs text-muted-foreground">
              Oficial: {formatCurrency(dashboardMetrics.totalPresupuestoOficial)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Finalización</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
            <Progress value={completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{dashboardMetrics.atrasadas}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardMetrics.proximasAVencer} próximas a vencer
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Estado de las Obras</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`${getStatusColor('EN_EJECUCION')}`}>
                  {getStatusIcon('EN_EJECUCION')}
                </div>
                <span className="text-sm font-medium">En Progreso</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold">{dashboardMetrics.enProgreso}</span>
                <div className="w-20">
                  <Progress
                    value={dashboardMetrics.total > 0 ? (dashboardMetrics.enProgreso / dashboardMetrics.total) * 100 : 0}
                    className="h-2"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`${getStatusColor('FINALIZADA')}`}>
                  {getStatusIcon('FINALIZADA')}
                </div>
                <span className="text-sm font-medium">Completadas</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold">{dashboardMetrics.completadas}</span>
                <div className="w-20">
                  <Progress
                    value={dashboardMetrics.total > 0 ? (dashboardMetrics.completadas / dashboardMetrics.total) * 100 : 0}
                    className="h-2"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`${getStatusColor('SUSPENDIDA')}`}>
                  {getStatusIcon('SUSPENDIDA')}
                </div>
                <span className="text-sm font-medium">Pausadas</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold">{dashboardMetrics.pausadas}</span>
                <div className="w-20">
                  <Progress
                    value={dashboardMetrics.total > 0 ? (dashboardMetrics.pausadas / dashboardMetrics.total) * 100 : 0}
                    className="h-2"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`${getStatusColor('CANCELADA')}`}>
                  {getStatusIcon('CANCELADA')}
                </div>
                <span className="text-sm font-medium">Canceladas</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold">{dashboardMetrics.canceladas}</span>
                <div className="w-20">
                  <Progress
                    value={dashboardMetrics.total > 0 ? (dashboardMetrics.canceladas / dashboardMetrics.total) * 100 : 0}
                    className="h-2"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Distribución por Provincia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(dashboardMetrics.obrasPorProvincia)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([provincia, count]) => (
                  <div key={provincia} className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{provincia}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold">{count}</span>
                      <div className="w-16">
                        <Progress
                          value={dashboardMetrics.total > 0 ? (count / dashboardMetrics.total) * 100 : 0}
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {(dashboardMetrics.atrasadas > 0 || dashboardMetrics.proximasAVencer > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {dashboardMetrics.atrasadas > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Obras Atrasadas ({dashboardMetrics.atrasadas})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {/* TODO: Enable when fecha_fin field is added */}
                  {/* {dashboardMetrics.obrasAtrasadas.slice(0, 3).map((obra) => (
                    <div key={obra.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                      <div>
                        <p className="font-medium text-sm">{obra.obra_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Vencía: {obra.fecha_fin ? format(new Date(obra.fecha_fin), 'dd/MM/yyyy', { locale: es }) : 'N/A'}
                        </p>
                      </div>
                      <Badge variant="destructive">Atrasada</Badge>
                    </div>
                  ))} */}
                  <p className="text-sm text-muted-foreground">No hay obras atrasadas para mostrar</p>
                  {dashboardMetrics.atrasadas > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{dashboardMetrics.atrasadas - 3} más...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {dashboardMetrics.proximasAVencer > 0 && (
            <Card className="border-yellow-200">
              <CardHeader>
                <CardTitle className="text-yellow-600 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Próximas a Vencer ({dashboardMetrics.proximasAVencer})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {/* TODO: Enable when fecha_fin field is added */}
                  {/* {dashboardMetrics.obrasProximasAVencer.slice(0, 3).map((obra) => (
                    <div key={obra.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                      <div>
                        <p className="font-medium text-sm">{obra.obra_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Vence: {obra.fecha_fin ? format(new Date(obra.fecha_fin), 'dd/MM/yyyy', { locale: es }) : 'N/A'}
                        </p>
                      </div>
                      <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                        Próxima
                      </Badge>
                    </div>
                  ))} */}
                  <p className="text-sm text-muted-foreground">No hay obras próximas a vencer</p>
                  {dashboardMetrics.proximasAVencer > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{dashboardMetrics.proximasAVencer - 3} más...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Todas las Obras
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasOrganization && !orgLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Selecciona una organización para ver las obras</p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Cargando obras...</p>
            </div>
          ) : (
            <ObrasDataTable data={obras} />
          )}
        </CardContent>
      </Card>

      <CreateObraSheet
        isOpen={isCreateSheetOpen}
        onClose={handleCloseCreateSheet}
      />
    </div>
  );
} 