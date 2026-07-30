import React, { useState } from 'react';
import { RoadIncident, SeverityLevel } from '../../../types';
import { ShieldAlert, Search, Filter, CheckCircle2, UserCheck, Eye, RefreshCw, AlertOctagon } from 'lucide-react';

interface TrafficIncidentCenterProps {
  incidents: RoadIncident[];
  onResolveIncident: (id: string) => void;
  onSelectIncident: (inc: RoadIncident) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const TrafficIncidentCenter: React.FC<TrafficIncidentCenterProps> = ({
  incidents,
  onResolveIncident,
  onSelectIncident,
  searchQuery,
  setSearchQuery,
}) => {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredIncidents = incidents.filter((inc) => {
    if (typeFilter !== 'all' && inc.type !== typeFilter) return false;
    if (severityFilter !== 'all' && inc.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && inc.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        inc.title.toLowerCase().includes(q) ||
        inc.locationName.toLowerCase().includes(q) ||
        inc.type.toLowerCase().includes(q) ||
        inc.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-md border border-gray-200 dark:border-slate-800 p-3 flex flex-col justify-between shadow-2xs space-y-3 text-xs text-gray-900 dark:text-slate-100">
      {/* Table Header & Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2.5 pb-2 border-b border-gray-100 dark:border-slate-800">
        <div className="font-bold text-gray-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" /> Traffic Incident Command Register & Patrol Dispatch
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:flex-initial min-w-[140px]">
            <Search className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 absolute left-2 top-2" />
            <input
              type="text"
              placeholder="Search corridor or incident..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 pr-2 py-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-[11px] text-gray-900 dark:text-slate-100 w-full sm:w-44 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
            />
          </div>

          <div className="grid grid-cols-3 sm:flex items-center gap-2 w-full sm:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded px-2 py-1 text-[11px] text-gray-800 dark:text-slate-200"
            >
              <option value="all">All Types</option>
              <option value="congestion">Congestion</option>
              <option value="accident">Accident</option>
              <option value="closure">Road Closure</option>
              <option value="construction">Construction</option>
              <option value="transit_delay">Transit Delay</option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded px-2 py-1 text-[11px] text-gray-800 dark:text-slate-200"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="major">Major</option>
              <option value="minor">Minor</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded px-2 py-1 text-[11px] text-gray-800 dark:text-slate-200"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Incident Table */}
      <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
        <table className="w-full text-left border-collapse min-w-[650px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-800/60 text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase border-b border-gray-200 dark:border-slate-700">
              <th className="p-2">ID</th>
              <th className="p-2">Severity</th>
              <th className="p-2">Incident Title</th>
              <th className="p-2">Location</th>
              <th className="p-2">Assigned Unit</th>
              <th className="p-2">Status</th>
              <th className="p-2">Est. Clearance</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-[11px]">
            {filteredIncidents.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-4 text-center text-gray-500 dark:text-slate-400 font-medium">
                  No road incidents match the selected filter criteria.
                </td>
              </tr>
            ) : (
              filteredIncidents.map((inc, index) => (
                <tr key={inc.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-500/10 transition-colors">
                  <td className="p-2 font-mono text-[10px] text-gray-500 dark:text-slate-400 font-bold">{inc.id}</td>
                  <td className="p-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${
                        inc.severity === 'critical'
                          ? 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30'
                          : inc.severity === 'major'
                          ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
                          : 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30'
                      }`}
                    >
                      {inc.severity}
                    </span>
                  </td>
                  <td className="p-2 font-bold text-gray-900 dark:text-slate-100">{inc.title}</td>
                  <td className="p-2 text-gray-600 dark:text-slate-300 truncate max-w-[150px]">{inc.locationName}</td>
                  <td className="p-2 text-gray-700 dark:text-slate-300 font-medium">
                    <span className="flex items-center gap-1 text-[10px]">
                      <UserCheck className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                      {index % 2 === 0 ? 'Highway Patrol Unit 4' : 'LTA First Response'}
                    </span>
                  </td>
                  <td className="p-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        inc.status === 'resolved'
                          ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400'
                          : 'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-400'
                      }`}
                    >
                      {inc.status}
                    </span>
                  </td>
                  <td className="p-2 font-mono text-gray-600 dark:text-slate-400">{inc.estimatedResolution}</td>
                  <td className="p-2 text-right space-x-1.5 shrink-0">
                    <button
                      onClick={() => onSelectIncident(inc)}
                      className="px-2 py-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 rounded text-[10px] font-bold transition-colors inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3 text-blue-600 dark:text-blue-400" /> Inspect
                    </button>

                    {inc.status !== 'resolved' ? (
                      <button
                        onClick={() => onResolveIncident(inc.id)}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition-colors"
                      >
                        Resolve
                      </button>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">Cleared</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};