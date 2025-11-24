import React, { useState, useEffect } from 'react';
import { Calendar, LayoutDashboard, FileBarChart, Plus, Sparkles } from 'lucide-react';
import BookingForm from './components/BookingForm';
import BookingList from './components/BookingList';
import CalendarView from './components/CalendarView';
import Reports from './components/Reports';
import AskAI from './components/AskAI';
import { Booking, BookingStatus, ViewMode } from './types';
import { generateSessionSummary } from './services/geminiService';

const App: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<string | null>(null);

  // Load from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('scube_bookings');
    if (saved) {
      setBookings(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  // Save to LocalStorage on change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('scube_bookings', JSON.stringify(bookings));
    }
  }, [bookings, loading]);

  // AI Summary effect
  useEffect(() => {
      if (viewMode === ViewMode.DASHBOARD && bookings.length > 0) {
          // Only summarize today/tomorrow for dashboard
          const today = new Date().toISOString().split('T')[0];
          const relevant = bookings.filter(b => b.date >= today && b.status === BookingStatus.CONFIRMED);
          generateSessionSummary(relevant).then(setSummary);
      }
  }, [viewMode, bookings]);

  const handleAddBooking = (newBooking: Booking) => {
    setBookings(prev => [...prev, newBooking]);
  };

  const handleStatusChange = (id: string, status: BookingStatus) => {
    setBookings(prev => prev.map(b => 
      b.id === id ? { ...b, status } : b
    ));
  };

  const handleComplete = (id: string, endTime: string) => {
    setBookings(prev => prev.map(b => 
      b.id === id ? { ...b, status: BookingStatus.COMPLETED, actualEndTime: endTime } : b
    ));
  };

  const handleUpdateBooking = (updatedBooking: Booking) => {
    setBookings(prev => prev.map(b => 
      b.id === updatedBooking.id ? updatedBooking : b
    ));
  };

  const getTodaysBookings = () => {
    const today = new Date().toISOString().split('T')[0];
    return bookings
      .filter(b => b.date === today)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getUpcomingBookings = () => {
    const today = new Date().toISOString().split('T')[0];
    return bookings
      .filter(b => b.date >= today)
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0 font-sans selection:bg-purple-500/30">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-black/50 backdrop-blur-xl border-b border-white/10 z-40 flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold font-display">
            S³
          </div>
          <span className="text-xl font-display font-bold text-white tracking-wider">
            S CUBE <span className="text-purple-400">STUDIOZ</span>
          </span>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-all shadow-[0_0_15px_rgba(124,58,237,0.5)]"
        >
          <Plus size={18} /> <span className="hidden md:inline">New Booking</span>
        </button>
      </nav>

      {/* Main Layout */}
      <main className="pt-24 px-4 md:px-8 max-w-7xl mx-auto">
        
        {/* View Navigation (Tabs) */}
        <div className="flex gap-4 mb-8 overflow-x-auto scrollbar-hide pb-2">
          <button 
            onClick={() => setViewMode(ViewMode.DASHBOARD)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all whitespace-nowrap ${viewMode === ViewMode.DASHBOARD ? 'bg-white text-black font-bold' : 'glass-panel text-gray-300 hover:text-white'}`}
          >
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button 
             onClick={() => setViewMode(ViewMode.CALENDAR)}
             className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all whitespace-nowrap ${viewMode === ViewMode.CALENDAR ? 'bg-white text-black font-bold' : 'glass-panel text-gray-300 hover:text-white'}`}
          >
            <Calendar size={18} /> Calendar
          </button>
          <button 
             onClick={() => setViewMode(ViewMode.REPORTS)}
             className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all whitespace-nowrap ${viewMode === ViewMode.REPORTS ? 'bg-white text-black font-bold' : 'glass-panel text-gray-300 hover:text-white'}`}
          >
            <FileBarChart size={18} /> Reports
          </button>
        </div>

        {/* Content Area */}
        <div className="animate-fadeIn">
          {viewMode === ViewMode.DASHBOARD && (
            <div className="space-y-8">
              {/* AI Insight */}
              {summary && (
                  <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-2xl p-5 flex items-start gap-4">
                      <Sparkles className="text-purple-300 shrink-0 mt-1" size={20} />
                      <div>
                          <h3 className="text-purple-200 font-semibold text-sm uppercase tracking-wide mb-1">AI Studio Insight</h3>
                          <p className="text-gray-300 leading-relaxed">{summary}</p>
                      </div>
                  </div>
              )}

              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  Today's Sessions <span className="text-sm font-normal text-gray-500 bg-white/5 px-2 py-1 rounded ml-2">{new Date().toISOString().split('T')[0]}</span>
                </h2>
                <BookingList 
                  bookings={getTodaysBookings()} 
                  onStatusChange={handleStatusChange} 
                  onComplete={handleComplete}
                  onUpdateBooking={handleUpdateBooking}
                />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Upcoming</h2>
                <div className="opacity-80">
                  <BookingList 
                    bookings={getUpcomingBookings().filter(b => b.date !== new Date().toISOString().split('T')[0]).slice(0, 5)} 
                    onStatusChange={handleStatusChange} 
                    onComplete={handleComplete}
                    onUpdateBooking={handleUpdateBooking}
                  />
                </div>
              </div>
            </div>
          )}

          {viewMode === ViewMode.CALENDAR && (
            <CalendarView 
              bookings={bookings} 
              onStatusChange={handleStatusChange}
              onComplete={handleComplete}
            />
          )}

          {viewMode === ViewMode.REPORTS && (
            <Reports bookings={bookings} />
          )}
        </div>
      </main>

      {/* AI Assistant Floating Button */}
      <AskAI bookings={bookings} />

      {/* Mobile Navigation Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-xl border-t border-white/10 flex items-center justify-around px-4 z-40">
        <button onClick={() => setViewMode(ViewMode.DASHBOARD)} className={`flex flex-col items-center gap-1 ${viewMode === ViewMode.DASHBOARD ? 'text-purple-400' : 'text-gray-500'}`}>
          <LayoutDashboard size={20} />
          <span className="text-[10px]">Home</span>
        </button>
        <button onClick={() => setShowAddModal(true)} className="flex flex-col items-center justify-center -mt-6 bg-purple-600 rounded-full w-12 h-12 text-white shadow-lg shadow-purple-600/40 border-4 border-black">
          <Plus size={24} />
        </button>
        <button onClick={() => setViewMode(ViewMode.REPORTS)} className={`flex flex-col items-center gap-1 ${viewMode === ViewMode.REPORTS ? 'text-purple-400' : 'text-gray-500'}`}>
          <FileBarChart size={20} />
          <span className="text-[10px]">Report</span>
        </button>
      </div>

      {/* Modals */}
      {showAddModal && (
        <BookingForm 
          existingBookings={bookings} 
          onAddBooking={handleAddBooking} 
          onClose={() => setShowAddModal(false)} 
        />
      )}

    </div>
  );
};

export default App;
