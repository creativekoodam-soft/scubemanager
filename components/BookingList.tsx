import React, { useState } from 'react';
import { CheckCircle, Trash2, Clock, Phone, Music, AlertCircle, X, Save } from 'lucide-react';
import { Booking, BookingStatus } from '../types';

interface BookingListProps {
  bookings: Booking[];
  onStatusChange: (id: string, status: BookingStatus) => void;
  onComplete: (id: string, endTime: string) => void;
}

const BookingList: React.FC<BookingListProps> = ({ bookings, onStatusChange, onComplete }) => {
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [completionTime, setCompletionTime] = useState<string>('');

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.CONFIRMED: return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case BookingStatus.COMPLETED: return 'bg-green-500/20 text-green-300 border-green-500/30';
      case BookingStatus.CANCELLED: return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const initiateCompletion = (booking: Booking) => {
    // Calculate a default end time based on start + duration
    const startParts = booking.startTime.split(':').map(Number);
    const endHour = (startParts[0] + booking.durationHours) % 24;
    const defaultEnd = `${endHour.toString().padStart(2, '0')}:${startParts[1].toString().padStart(2, '0')}`;
    
    setCompletionTime(defaultEnd);
    setCompletingId(booking.id);
  };

  const confirmCompletion = () => {
    if (completingId && completionTime) {
      onComplete(completingId, completionTime);
      setCompletingId(null);
    }
  };

  if (bookings.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400 flex flex-col items-center">
        <Music size={48} className="mb-4 opacity-20" />
        <p>No bookings found for this period.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <div 
          key={booking.id} 
          className={`glass-panel p-4 rounded-xl transition-all hover:border-purple-500/40 group relative overflow-hidden ${booking.status === BookingStatus.CANCELLED ? 'opacity-60 grayscale-[0.5]' : ''}`}
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Left Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-semibold text-white">{booking.clientName}</h3>
                <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(booking.status)} font-medium`}>
                  {booking.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1"><Clock size={14} /> {booking.date} • {booking.startTime} ({booking.durationHours}h)</span>
                {booking.phoneNumber && (
                    <span className="flex items-center gap-1"><Phone size={14} /> {booking.phoneNumber}</span>
                )}
                <span className="flex items-center gap-1 text-purple-300"><Music size={14} /> {booking.type}</span>
                {booking.actualEndTime && (
                    <span className="flex items-center gap-1 text-green-400">Ended: {booking.actualEndTime}</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 w-full md:w-auto">
               {completingId === booking.id ? (
                 <div className="flex items-center gap-2 bg-black/40 p-1 rounded-lg border border-purple-500/50 animate-fadeIn">
                   <span className="text-xs text-gray-300 pl-2">End Time:</span>
                   <input 
                     type="time" 
                     value={completionTime}
                     onChange={(e) => setCompletionTime(e.target.value)}
                     className="bg-white/10 border border-white/10 rounded px-2 py-1 text-sm text-white w-24 [color-scheme:dark]"
                   />
                   <button 
                     onClick={confirmCompletion}
                     className="bg-green-600 hover:bg-green-500 text-white p-1.5 rounded"
                     title="Confirm"
                   >
                     <Save size={16} />
                   </button>
                   <button 
                     onClick={() => setCompletingId(null)}
                     className="bg-red-500/20 hover:bg-red-500/30 text-red-300 p-1.5 rounded"
                     title="Cancel"
                   >
                     <X size={16} />
                   </button>
                 </div>
               ) : (
                 <>
                   {booking.status === BookingStatus.CONFIRMED && (
                     <>
                       <button 
                         onClick={() => initiateCompletion(booking)}
                         className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-2 rounded-lg transition-colors"
                         title="Mark Completed"
                       >
                         <CheckCircle size={18} />
                         <span className="md:hidden">Complete</span>
                       </button>
                       
                       <button 
                         onClick={() => onStatusChange(booking.id, BookingStatus.CANCELLED)}
                         className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-2 rounded-lg transition-colors"
                         title="Cancel Booking"
                       >
                         <Trash2 size={18} />
                         <span className="md:hidden">Cancel</span>
                       </button>
                     </>
                   )}
                 </>
               )}

               {booking.status === BookingStatus.CANCELLED && (
                 <div className="flex items-center gap-1 text-red-400 text-sm italic">
                    <AlertCircle size={16} /> Cancelled
                 </div>
               )}
               {booking.status === BookingStatus.COMPLETED && (
                  <div className="flex items-center gap-1 text-green-400 text-sm italic">
                    <CheckCircle size={16} /> Done
                  </div>
               )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BookingList;