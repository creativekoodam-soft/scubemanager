import { GoogleGenAI, Type } from "@google/genai";
import { Booking } from "../types";

interface ExtractedBookingData {
  clientName?: string;
  phoneNumber?: string;
  date?: string;
  startTime?: string;
  durationHours?: number;
  type?: string;
}

export const parseBookingRequest = async (text: string): Promise<ExtractedBookingData | null> => {
  try {
    // Initialize inside the function to avoid build-time errors
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Extract booking details from the following text. 
      Current Date: ${new Date().toISOString().split('T')[0]}. 
      Assume the year is ${new Date().getFullYear()} unless specified.
      If the user says "tomorrow", calculate the date based on the current date.
      Text: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            clientName: { type: Type.STRING, description: "Name of the client" },
            phoneNumber: { type: Type.STRING, description: "Phone number of the client" },
            date: { type: Type.STRING, description: "Date of booking in YYYY-MM-DD format" },
            startTime: { type: Type.STRING, description: "Start time in HH:mm 24-hour format" },
            durationHours: { type: Type.NUMBER, description: "Duration in hours" },
            type: { type: Type.STRING, description: "Type of recording session (e.g., Vocal, Mixing)" },
          },
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as ExtractedBookingData;
    }
    return null;
  } catch (error) {
    console.error("Error parsing booking with Gemini:", error);
    return null;
  }
};

export const generateSessionSummary = async (bookings: Booking[]): Promise<string> => {
    if (bookings.length === 0) return "No sessions to summarize.";

    const bookingText = bookings.map(b => 
        `${b.date} at ${b.startTime}: ${b.type} session with ${b.clientName} (${b.status})`
    ).join('\n');

    try {
        // Initialize inside the function to avoid build-time errors
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Summarize the studio's schedule performance based on these bookings. Keep it professional and encouraging for the studio owner. Maximum 2 sentences.\n\n${bookingText}`
        });
        return response.text || "Summary unavailable.";
    } catch (e) {
        return "Could not generate summary.";
    }
}