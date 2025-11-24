import React, { useState } from 'react';
import { Plus, Sparkles, Loader2, X } from 'lucide-react';
import { Booking, BookingStatus } from '../types';
import { parseBookingRequest } from '../services/geminiService';

interface BookingFormProps {
  onAddBooking: (booking: Booking) => void;
  existingBookings: Booking[];
  onClose: () => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ onAddBooking, existingBookings, onClose }) => {
  const [formData, setFormData] = useState<Partial<Booking>>({
    clientName: '',
    phoneNumber: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    durationHours: 2,
    type: 'Vocal Recording',
    status: BookingStatus.CONFIRMED,
  });
  
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const checkOverlap = (newBooking: Partial<Booking>): boolean => {
    if (!newBooking.date || !newBooking.startTime || !newBooking.durationHours) return false;

    const newStart = parseInt(newBooking.startTime.replace(':', ''));
    const startHour = Math.floor(newStart / 100);
    const startMin = newStart % 100;
    
    const newStartTimeMinutes = startHour * 60 + startMin;
    const newEndTimeMinutes = newStartTimeMinutes + (Number(newBooking.durationHours) * 60);

    return existingBookings.some(b => {
      if (b.status === BookingStatus.CANCELLED) return false;
      if (b.date !== newBooking.date) return false;

      const bStartParts = b.startTime.split(':').map(Number);
      const bStartMinutes = bStartParts[0] * 60 + bStartParts[1];
      const bEndMinutes = bStartMinutes + (b.durationHours * 60);

      // Check if ranges overlap
      return (newStartTimeMinutes < bEndMinutes && newEndTimeMinutes > bStartMinutes);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation: Phone number is now optional
    if (!formData.clientName || !formData.date || !formData.startTime) {
      setError("Please fill in all required fields.");
      return;
    }

    if (checkOverlap(formData)) {
      setError("⚠ Overlap Detected! This slot is already booked.");
      return;
    }

    const newBooking: Booking = {
      id: crypto.randomUUID(),
      clientName: formData.clientName,
      phoneNumber: formData.phoneNumber || '', // Optional
      date: formData.date,
      startTime: formData.startTime,
      durationHours: Number(formData.durationHours),
      type: formData.type || 'General',
      status: BookingStatus.CONFIRMED,
      createdAt: Date.now(),
      notes: formData.notes
    };

    onAddBooking(newBooking);
    onClose();
  };

  const handleAIFill = async () => {
    if (!aiPrompt.trim()) return;
    setIsAnalyzing(true);
    setError(null);

    const extracted = await parseBookingRequest(aiPrompt);
    
    setIsAnalyzing(false);
    if (extracted) {
      setFormData(prev => ({
        ...prev,
        ...extracted,
        // Ensure defaults if AI misses something
        type: extracted.type || prev.type,
        durationHours: extracted.durationHours || prev.durationHours
      }));
    } else {
      setError("Could not understand the booking request. Please try again or fill manually.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-6 relative animate-fadeIn">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-6">
          New Studio Session
        </h2>

        {/* AI Assistant Section */}
        <div className="mb-6 bg-purple-900/20 border border-purple-500/30 rounded-xl p-4">
          <label className="block text-xs font-semibold text-purple-300 uppercase mb-2 flex items-center gap-2">
            <Sparkles size={14} /> AI Quick Fill
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g., 'Book John for vocals tomorrow at 2pm for 3 hours'"
              className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 text-white placeholder-white/30"
            />
            <button
              onClick={handleAIFill}
              disabled={isAnalyzing}
              className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-semibold disabled:opacity-50"
            >
              {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : 'Fill'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Client Name *</label>
              <input
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Phone Number (Optional)</label>
              <input
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Optional"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Date *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 transition-colors text-white [color-scheme:dark]"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Start Time *</label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 transition-colors text-white [color-scheme:dark]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Duration (Hours) *</label>
              <input
                type="number"
                name="durationHours"
                min="1"
                max="12"
                value={formData.durationHours}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Session Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 transition-colors text-white [&>option]:bg-slate-900"
              >
                <option value="Vocal Recording">Vocal Recording</option>
                <option value="Music Production">Music Production</option>
                <option value="Mixing & Mastering">Mixing & Mastering</option>
                <option value="Dubbing">Dubbing</option>
                <option value="Jamming">Jamming</option>
                <option value="Podcast">Podcast</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-500/25 transition-all transform hover:scale-[1.02] mt-4 flex items-center justify-center gap-2"
          >
            <Plus size={20} /> Confirm Booking
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;