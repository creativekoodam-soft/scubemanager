import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Booking, BookingStatus } from '../types';
import BookingList from './BookingList';

interface CalendarViewProps {
  bookings: Booking[];
  onStatusChange: (id: string, status: BookingStatus) => void;
  onComplete: (id: string, endTime: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ bookings, onStatusChange, onComplete }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    setSelectedDate(dateStr);
  };

  const getBookingsForDay = (day: number) => {
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return bookings.filter(b => b.date === dateStr && b.status !== BookingStatus.CANCELLED);
  };

  const selectedDateBookings = useMemo(() => {
    return bookings.filter(b => b.date === selectedDate).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [bookings, selectedDate]);

  const renderCalendarDays = () => {
    const days = [];
    // Empty slots for previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-16 md:h-24 bg-black/20 border border-white/5"></div>);
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const isSelected = selectedDate === dateStr;
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      const dayBookings = getBookingsForDay(day);
      const hasBookings = dayBookings.length > 0;

      days.push(
        <div 
          key={day} 
          onClick={() => handleDayClick(day)}
          className={`h-16 md:h-24 border border-white/10 p-2 cursor-pointer transition-all relative overflow-hidden
            ${isSelected ? 'bg-purple-900/30 border-purple-500' : 'hover:bg-white/5 bg-black/40'}
            ${isToday ? 'bg-indigo-900/20' : ''}
          `}
        >
          <div className={`text-sm font-medium mb-1 flex justify-between items-center ${isToday ? 'text-indigo-400' : 'text-gray-300'}`}>
            {day}
            {isToday && <span className="text-[10px] uppercase bg-indigo-500/20 px-1 rounded">Today</span>}
          </div>
          
          {/* Indicators */}
          <div className="flex flex-wrap gap-1">
            {dayBookings.slice(0, 4).map((b, i) => (
              <div 
                key={i} 
                className={`w-2 h-2 rounded-full ${b.status === BookingStatus.COMPLETED ? 'bg-green-500' : 'bg-purple-500'}`} 
              />
            ))}
            {dayBookings.length > 4 && <span className="text-[10px] text-gray-500">+</span>}
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Calendar Header */}
      <div className="flex items-center justify-between bg-purple-900/10 p-4 rounded-xl border border-purple-500/20">
        <h2 className="text-2xl font-bold font-display text-white capitalize">
          {monthName} <span className="text-purple-400">{year}</span>
        </h2>
        <div className="flex gap-2">
          <button onClick={handlePrevMonth} className="p-2 rounded-lg bg-black/40 hover:bg-white/10 text-white transition-colors">
            <ChevronLeft size={20} />
          </button>
          <button onClick={handleNextMonth} className="p-2 rounded-lg bg-black/40 hover:bg-white/10 text-white transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="glass-panel rounded-xl overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-black/60 border-b border-white/10 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{d}</div>
          ))}
        </div>
        {/* Days */}
        <div className="grid grid-cols-7 bg-black/20">
          {renderCalendarDays()}
        </div>
      </div>

      {/* Selected Date Details */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            Schedule for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </h3>
        <BookingList 
            bookings={selectedDateBookings} 
            onStatusChange={onStatusChange}
            onComplete={onComplete}
        />
      </div>
    </div>
  );
};

export default CalendarView;