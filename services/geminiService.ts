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

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseBookingRequest = async (text: string): Promise<ExtractedBookingData | null> => {
  try {
    const ai = getAI();
    
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

export const parseVoiceBookingRequest = async (base64Audio: string, mimeType: string): Promise<ExtractedBookingData | null> => {
  try {
    const ai = getAI();

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Audio
            }
          },
          {
            text: `Listen to this audio request (it might be in Tamil or English). 
            Extract the booking details. 
            Current Date: ${new Date().toISOString().split('T')[0]}.
            If the user says "tomorrow" or "next friday", calculate the specific date YYYY-MM-DD.
            If a time is mentioned like "evening 6", convert to 18:00.`
          }
        ]
      },
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
    console.error("Error parsing voice booking:", error);
    return null;
  }
};

export const generateSessionSummary = async (bookings: Booking[]): Promise<string> => {
    if (bookings.length === 0) return "No sessions to summarize.";

    const bookingText = bookings.map(b => 
        `${b.date} at ${b.startTime}: ${b.type} session with ${b.clientName} (${b.status})`
    ).join('\n');

    try {
        const ai = getAI();

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Summarize the studio's schedule performance based on these bookings. Keep it professional and encouraging for the studio owner. Maximum 2 sentences.\n\n${bookingText}`
        });
        return response.text || "Summary unavailable.";
    } catch (e) {
        return "Could not generate summary.";
    }
};

export const askStudioAssistant = async (query: string | null, audioBase64: string | null, bookings: Booking[]): Promise<string> => {
  try {
    const ai = getAI();
    
    // Prepare the data context
    const dataContext = JSON.stringify(bookings.map(b => ({
      name: b.clientName,
      date: b.date,
      time: b.startTime,
      duration: b.durationHours,
      type: b.type,
      status: b.status,
      phone: b.phoneNumber
    })));

    const today = new Date().toISOString().split('T')[0];
    const systemPrompt = `
      You are an intelligent assistant for "S CUBE STUDIOZ".
      Current Date: ${today}.
      
      Here is the complete database of bookings:
      ${dataContext}

      Answer the user's question based strictly on this data.
      If the user asks about a specific date, check the data for that date.
      If the user asks "When is [Name] recording", search for that name.
      
      Important:
      1. If the input is in Tamil, reply in Tamil (or Tanglish if casual).
      2. If the input is in English, reply in English.
      3. Be concise and friendly.
      4. If no booking matches, say "I couldn't find any booking matching that request."
    `;

    const parts: any[] = [{ text: systemPrompt }];

    if (audioBase64) {
      parts.push({
        inlineData: {
          mimeType: 'audio/webm',
          data: audioBase64
        }
      });
      parts.push({ text: "The user has asked a question via audio. Listen and answer based on the provided database." });
    } else if (query) {
      parts.push({ text: `User Question: ${query}` });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts }
    });

    return response.text || "I'm sorry, I couldn't process that.";

  } catch (error) {
    console.error("Ask AI Error:", error);
    return "Sorry, I'm having trouble connecting to the brain right now.";
  }
};
