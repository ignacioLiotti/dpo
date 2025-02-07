'use client';

import React from 'react';
import { FaGlobe, FaPhoneAlt, FaTv, FaWifi, FaCogs, FaArrowRight, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import Tooltip from './Tooltip';

interface Step {
  status: string;
  tooltip: string;
}

interface ServiceStatus {
  status: string;
  tooltip?: string;
  value?: string;
}

interface ServiceData {
  name: string;
  wan: ServiceStatus;
  dsLiteIMS: ServiceStatus;
  tunnel: {
    steps: Step[];
    summary: string;
  };
  aftrIMS: ServiceStatus;
}

interface ServiceCardProps {
  service: ServiceData;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  const {
    name,
    wan,
    dsLiteIMS,
    tunnel,
    aftrIMS,
  } = service;

  const getServiceIcon = (serviceName: string) => {
    switch (serviceName.toLowerCase()) {
      case 'web':
        return <FaGlobe className="text-3xl" />;
      case 'voice':
        return <FaPhoneAlt className="text-3xl" />;
      case 'video':
        return <FaTv className="text-3xl" />;
      default:
        return <FaCogs className="text-3xl" />;
    }
  };

  const statusColor = (status: string) => {
    return status === "Connected" || status === "Configured"
      ? "text-green-500"
      : "text-red-500";
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 transition-transform hover:scale-105">
      <div className="flex items-center space-x-4 mb-3">
        <div>{getServiceIcon(name)}</div>
        <h2 className="text-xl font-semibold">{name}</h2>
      </div>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <FaWifi />
          <span className="font-medium">WAN Setup:</span>
          <span className={statusColor(wan.status)}>
            {wan.status}
          </span>
          {wan.tooltip && (
            <Tooltip text={wan.tooltip}>
              <FaCogs className="text-gray-400" />
            </Tooltip>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <FaCogs />
          <span className="font-medium">DS-Lite/IMS:</span>
          <span className={statusColor(dsLiteIMS.status)}>
            {dsLiteIMS.status}
          </span>
          {dsLiteIMS.tooltip && (
            <Tooltip text={dsLiteIMS.tooltip}>
              <FaCogs className="text-gray-400" />
            </Tooltip>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="font-medium">Tunnel:</span>
          <div className="flex items-center space-x-1">
            {tunnel.steps.map((step, idx) => (
              <Tooltip key={idx} text={step.tooltip}>
                <span>
                  {step.status === "Connected" ? (
                    <FaCheck className="text-green-500" />
                  ) : step.status === "Error" || step.status === "Failed" ? (
                    <FaExclamationTriangle className="text-red-500" />
                  ) : (
                    <FaArrowRight className="text-gray-500" />
                  )}
                </span>
              </Tooltip>
            ))}
          </div>
          <span className="ml-2 text-sm">{tunnel.summary}</span>
        </div>
        <div className="flex items-center space-x-2">
          <FaCogs />
          <span className="font-medium">AFTR/IMS:</span>
          <span className={statusColor(aftrIMS.status)}>
            {aftrIMS.status}
          </span>
          {aftrIMS.value && (
            <span className="text-sm text-gray-500">
              {aftrIMS.value}
            </span>
          )}
          {aftrIMS.tooltip && (
            <Tooltip text={aftrIMS.tooltip}>
              <FaCogs className="text-gray-400" />
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
};

const sampleData: ServiceData[] = [
  {
    name: "Web",
    wan: {
      status: "Connected",
      tooltip: "IP: 192.168.1.2",
    },
    dsLiteIMS: {
      status: "Configured",
      tooltip: "IMS operational. IP: 10.0.0.2",
    },
    tunnel: {
      steps: [
        { status: "Connected", tooltip: "Step 1 passed" },
        { status: "Connected", tooltip: "Step 2 passed" },
        { status: "Connected", tooltip: "Step 3 passed" },
      ],
      summary: "Connected",
    },
    aftrIMS: {
      status: "Connected",
      value: "RegID: 5321",
      tooltip: "AFTR enabled and operational",
    },
  },
  {
    name: "Voice",
    wan: {
      status: "No IP Address",
      tooltip: "WAN not detected",
    },
    dsLiteIMS: {
      status: "No IP Address",
      tooltip: "No DS-Lite config",
    },
    tunnel: {
      steps: [
        { status: "Connected", tooltip: "Step 1 passed" },
        { status: "Failed", tooltip: "Failed at step 2" },
        { status: "Error", tooltip: "Error in step 3" },
      ],
      summary: "Errors detected",
    },
    aftrIMS: {
      status: "Failed",
      value: "",
      tooltip: "Registration failed",
    },
  },
  {
    name: "Video",
    wan: {
      status: "Connected",
      tooltip: "IP: 192.168.1.5",
    },
    dsLiteIMS: {
      status: "Configured",
      tooltip: "IMS operational. IP: 10.0.0.5",
    },
    tunnel: {
      steps: [
        { status: "Connected", tooltip: "Step 1 passed" },
        { status: "Connected", tooltip: "Step 2 passed" },
        { status: "Connected", tooltip: "Step 3 passed" },
      ],
      summary: "Connected",
    },
    aftrIMS: {
      status: "Connected",
      value: "RegID: 9876",
      tooltip: "AFTR functioning normally",
    },
  },
];

export default function Page() {
  const [services] = React.useState<ServiceData[]>(sampleData);
  const [filter, setFilter] = React.useState("");

  const filteredServices = services.filter((service) =>
    service.wan.status.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-center">
          Service Monitoring Dashboard
        </h1>
      </header>
      <div className="mb-4 flex justify-end">
        <input
          type="text"
          placeholder="Filter WAN status..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring focus:border-blue-300"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service, idx) => (
          <ServiceCard key={idx} service={service} />
        ))}
      </div>
    </div>
  );
}
