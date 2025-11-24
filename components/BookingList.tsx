import React, { useState } from 'react';
import { CheckCircle, Trash2, Clock, Phone, Music, AlertCircle, X, Save, FileText, Download, Share2 } from 'lucide-react';
import { Booking, BookingStatus } from '../types';
import jsPDF from 'jspdf';

interface BookingListProps {
  bookings: Booking[];
  onStatusChange: (id: string, status: BookingStatus) => void;
  onComplete: (id: string, endTime: string) => void;
  onUpdateBooking?: (booking: Booking) => void; // Added for invoice update
}

const BookingList: React.FC<BookingListProps> = ({ bookings, onStatusChange, onComplete, onUpdateBooking }) => {
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [completionTime, setCompletionTime] = useState<string>('');
  
  // Invoice State
  const [invoicingId, setInvoicingId] = useState<string | null>(null);
  const [invoiceRate, setInvoiceRate] = useState<number>(1000);

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.CONFIRMED: return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case BookingStatus.COMPLETED: return 'bg-green-500/20 text-green-300 border-green-500/30';
      case BookingStatus.CANCELLED: return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const initiateCompletion = (booking: Booking) => {
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

  // Invoice Logic
  const handleCreateInvoice = (booking: Booking) => {
    setInvoicingId(booking.id);
    // Default rate or existing rate
    setInvoiceRate(booking.invoiceDetails?.ratePerHour || 1000);
  };

  const generateAndDownloadPDF = (booking: Booking, rate: number, total: number) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(15, 5, 24); // Dark background
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("S CUBE STUDIOZ", 20, 20);
    doc.setFontSize(10);
    doc.text("Professional Recording Studio", 20, 28);

    // Invoice Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text("INVOICE", 20, 60);
    
    doc.setFontSize(10);
    doc.text(`Invoice Date: ${new Date().toLocaleDateString()}`, 20, 70);
    doc.text(`Booking Ref: #${booking.id.slice(0, 8).toUpperCase()}`, 20, 75);

    // Client Details
    doc.setFont("helvetica", "bold");
    doc.text("Bill To:", 20, 90);
    doc.setFont("helvetica", "normal");
    doc.text(booking.clientName, 20, 95);
    if(booking.phoneNumber) doc.text(booking.phoneNumber, 20, 100);

    // Table Header
    let y = 120;
    doc.setFillColor(240, 240, 240);
    doc.rect(20, y-5, 170, 10, 'F');
    doc.setFont("helvetica", "bold");
    doc.text("Description", 25, y);
    doc.text("Rate/Hr", 120, y);
    doc.text("Hours", 150, y);
    doc.text("Amount", 180, y, { align: 'right' });

    // Table Content
    y += 15;
    doc.setFont("helvetica", "normal");
    doc.text(`${booking.type} Session`, 25, y);
    doc.text(`${rate}`, 120, y);
    doc.text(`${booking.durationHours}`, 150, y);
    doc.text(`${total}`, 180, y, { align: 'right' });

    // Total
    y += 20;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, 190, y);
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Total Amount:", 120, y);
    doc.text(`Rs. ${total}`, 180, y, { align: 'right' });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Thank you for choosing S CUBE STUDIOZ!", 105, 280, { align: 'center' });

    doc.save(`Invoice_${booking.clientName.replace(/\s+/g, '_')}_${booking.date}.pdf`);

    // Save invoice details to booking if callback exists
    if(onUpdateBooking) {
        onUpdateBooking({
            ...booking,
            invoiceDetails: {
                ratePerHour: rate,
                totalAmount: total,
                generatedAt: Date.now()
            }
        });
    }
  };

  const shareOnWhatsApp = (booking: Booking, total: number) => {
    if (!booking.phoneNumber) {
        alert("Client phone number is missing!");
        return;
    }
    const message = `Hello ${booking.clientName},\nHere is your invoice for the ${booking.type} session at S CUBE STUDIOZ.\n\nDate: ${booking.date}\nDuration: ${booking.durationHours} hrs\nTotal Amount: Rs. ${total}\n\nThank you!`;
    const url = `https://wa.me/${booking.phoneNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
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
            <div className="flex flex-col items-end gap-2 w-full md:w-auto">
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
                 <div className="flex items-center gap-2">
                   {booking.status === BookingStatus.CONFIRMED && (
                     <>
                       <button 
                         onClick={() => initiateCompletion(booking)}
                         className="flex items-center gap-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-2 rounded-lg transition-colors text-sm"
                         title="Mark Completed"
                       >
                         <CheckCircle size={16} /> <span className="hidden md:inline">Complete</span>
                       </button>
                       
                       <button 
                         onClick={() => onStatusChange(booking.id, BookingStatus.CANCELLED)}
                         className="flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-2 rounded-lg transition-colors text-sm"
                         title="Cancel Booking"
                       >
                         <Trash2 size={16} /> <span className="hidden md:inline">Cancel</span>
                       </button>
                     </>
                   )}

                    {booking.status === BookingStatus.COMPLETED && (
                        <button 
                            onClick={() => handleCreateInvoice(booking)}
                            className="flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-3 py-2 rounded-lg transition-colors text-sm"
                        >
                            <FileText size={16} /> Invoice
                        </button>
                    )}
                 </div>
               )}
            </div>
          </div>

          {/* Invoice Generator Section */}
          {invoicingId === booking.id && (
              <div className="mt-4 pt-4 border-t border-white/10 animate-fadeIn">
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                      <div className="w-full md:w-auto flex flex-col gap-1">
                          <label className="text-xs text-gray-400">Hourly Rate: Rs. {invoiceRate}</label>
                          <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">300</span>
                              <input 
                                  type="range" 
                                  min="300" 
                                  max="5000" 
                                  step="100" 
                                  value={invoiceRate}
                                  onChange={(e) => setInvoiceRate(Number(e.target.value))}
                                  className="w-full md:w-48 accent-purple-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                              />
                              <span className="text-xs text-gray-500">5000</span>
                          </div>
                      </div>
                      <div className="flex items-center gap-4">
                          <div className="text-right">
                              <p className="text-xs text-gray-400">Total Amount</p>
                              <p className="text-xl font-bold text-white">Rs. {invoiceRate * booking.durationHours}</p>
                          </div>
                          <div className="flex gap-2">
                              <button 
                                  onClick={() => generateAndDownloadPDF(booking, invoiceRate, invoiceRate * booking.durationHours)}
                                  className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white" 
                                  title="Download PDF"
                              >
                                  <Download size={18} />
                              </button>
                              <button 
                                  onClick={() => shareOnWhatsApp(booking, invoiceRate * booking.durationHours)}
                                  className="p-2 bg-green-600 hover:bg-green-500 rounded-lg text-white" 
                                  title="Send on WhatsApp"
                              >
                                  <Share2 size={18} />
                              </button>
                              <button 
                                  onClick={() => setInvoicingId(null)}
                                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300" 
                                  title="Close"
                              >
                                  <X size={18} />
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default BookingList;