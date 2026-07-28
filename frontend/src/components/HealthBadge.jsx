import React, { useState, useEffect } from 'react';
import { checkHealthApi } from '../services/api';

const HealthBadge = () => {
  const [health, setHealth] = useState({ status: 'CHECKING', services: {} });

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const data = await checkHealthApi();
        setHealth(data);
      } catch (err) {
        setHealth({ status: 'DOWN', services: {} });
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const isDbConnected = health.status === 'UP' || health.status === 'DEGRADED';
  const dbStatusText = health.services?.database === 'healthy' ? 'DB Connected' : 'DB Disconnected';

  return (
    <div
      className="flex items-center space-x-2 bg-slate-900/60 border border-slate-800 rounded-full px-3 py-1 text-xs"
      title={`Database: ${health.services?.database || 'checking'} | Queue: ${health.services?.redis || 'checking'}`}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
            isDbConnected ? 'bg-emerald-400 opacity-75' : 'bg-rose-400 opacity-75'
          }`}
        ></span>
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            isDbConnected ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        ></span>
      </span>
      <span className="text-slate-300 font-medium">
        System Status:{' '}
        <strong className={isDbConnected ? 'text-emerald-400' : 'text-rose-400'}>
          {isDbConnected ? dbStatusText : 'Offline'}
        </strong>
      </span>
    </div>
  );
};

export default HealthBadge;
