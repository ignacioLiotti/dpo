'use client';

import { motion } from 'framer-motion';

interface StatsProps {
  totalMachines: number;
  inUseCount: number;
  availableCount: number;
  maintenanceCount: number;
}

export function DashboardStats({ totalMachines, inUseCount, availableCount, maintenanceCount }: StatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-4 rounded-lg shadow"
      >
        <p className="text-sm text-muted-foreground">Total Machines</p>
        <p className="text-2xl font-semibold">{totalMachines}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-4 rounded-lg shadow"
      >
        <p className="text-sm text-muted-foreground">In Use</p>
        <p className="text-2xl font-semibold">{inUseCount}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white p-4 rounded-lg shadow"
      >
        <p className="text-sm text-muted-foreground">Available</p>
        <p className="text-2xl font-semibold">{availableCount}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white p-4 rounded-lg shadow"
      >
        <p className="text-sm text-muted-foreground">Maintenance</p>
        <p className="text-2xl font-semibold">{maintenanceCount}</p>
      </motion.div>
    </div>
  );
} 