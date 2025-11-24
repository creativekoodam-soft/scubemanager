import React, { useState, useMemo } from 'react';
import { Download, Calendar, BarChart2 } from 'lucide-react';
import { Booking, BookingStatus } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

interface ReportsProps {
  bookings: Booking[];
}

const Reports: React.FC<ReportsProps> = ({ bookings }) => {
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => b.date >= startDate && b.date <= endDate);
  }, [bookings, startDate, endDate]);

  const stats = useMemo(() => {
    return {
      total: filteredBookings.length,
      completed: filteredBookings.filter(b => b.status === BookingStatus.COMPLETED).length,
      cancelled: filteredBookings.filter(b => b.status === BookingStatus.CANCELLED).length,
      hours: filteredBookings.reduce((acc, curr) => acc + (curr.status !== BookingStatus.CANCELLED ? curr.durationHours : 0), 0)
    };
  }, [filteredBookings]);

  const chartData = useMemo(() => {
      const typeCounts: Record<string, number> = {};
      filteredBookings.forEach(b => {
          if(b.status !== BookingStatus.CANCELLED) {
              typeCounts[b.type] = (typeCounts[b.type] || 0) + 1;
          }
      });
      return Object.keys(typeCounts).map(key => ({ name: key, count: typeCounts[key] }));
  }, [filteredBookings]);


  const handleDownloadCSV = () => {
    const headers = ["Date", "Time", "Client Name", "Phone", "Type", "Duration (Hrs)", "Actual End Time", "Status"];
    const rows = filteredBookings.map(b => [
      b.date,
      b.startTime,
      b.clientName,
      b.phoneNumber || "N/A",
      b.type,
      b.durationHours,
      b.actualEndTime || "N/A",
      b.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `scube_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-purple-900/10 p-4 rounded-xl border border-purple-500/20">
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
            <div>
                <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1"><Calendar size={12} /> From</label>
                <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none [color-scheme:dark] cursor-pointer"
                />
            </div>
            <div>
                <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1"><Calendar size={12} /> To</label>
                <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 focus:outline-none [color-scheme:dark] cursor-pointer"
                />
            </div>
        </div>
        <button 
            onClick={handleDownloadCSV}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-colors font-semibold shadow-lg shadow-purple-900/20"
        >
            <Download size={18} /> Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-blue-500">
            <p className="text-gray-400 text-xs">Total Bookings</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-green-500">
            <p className="text-gray-400 text-xs">Completed</p>
            <p className="text-2xl font-bold text-white">{stats.completed}</p>
        </div>
        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-red-500">
            <p className="text-gray-400 text-xs">Cancelled</p>
            <p className="text-2xl font-bold text-white">{stats.cancelled}</p>
        </div>
        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-purple-500">
            <p className="text-gray-400 text-xs">Hours Sold</p>
            <p className="text-2xl font-bold text-white">{stats.hours}h</p>
        </div>
      </div>

      {/* Chart */}
      <div className="glass-panel p-6 rounded-xl min-h-[300px]">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart2 size={20} className="text-purple-400" /> Session Types Breakdown
        </h3>
        {chartData.length > 0 ? (
             <div className="h-[250px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData}>
                 <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                 <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                 <Tooltip 
                    contentStyle={{ backgroundColor: '#1e1b2e', borderColor: '#4c1d95', color: '#fff' }}
                    itemStyle={{ color: '#d8b4fe' }}
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                 />
                 <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#8b5cf6', '#ec4899', '#6366f1', '#a855f7'][index % 4]} />
                    ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        ) : (
            <div className="h-full flex items-center justify-center text-gray-500">No data to display</div>
        )}
      </div>

      {/* Detailed List (Simplified for Report View) */}
      <div className="glass-panel rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-white/5 text-gray-100 uppercase text-xs">
                    <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Client</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                    {filteredBookings.length > 0 ? filteredBookings.map(b => (
                        <tr key={b.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3">
                                {b.date} 
                                <span className="text-xs text-gray-500 block">{b.startTime}</span>
                            </td>
                            <td className="px-4 py-3 font-medium text-white">
                                {b.clientName} 
                                <span className="text-xs text-gray-500 block">{b.phoneNumber || '-'}</span>
                            </td>
                            <td className="px-4 py-3">{b.type}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-1 rounded border ${
                                  b.status === 'CONFIRMED' ? 'border-blue-500/30 text-blue-300' :
                                  b.status === 'COMPLETED' ? 'border-green-500/30 text-green-300' :
                                  'border-red-500/30 text-red-300'
                              }`}>
                                  {b.status}
                              </span>
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan={4} className="text-center py-8 text-gray-500">No records found.</td></tr>
                    )}
                </tbody>
            </table>
          </div>
      </div>
    </div>
  );
};

export default Reports;