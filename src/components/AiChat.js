import React, { useState, useRef, useEffect, useMemo } from 'react';
import { financialYearMonths } from '../constants';

function AiChat({ unitId, capitalExpenses, dailyTransactions, monthlyProjections }) {
  const [messages, setMessages] = useState([{ text: "Hello! How can I help you analyze your financial data for this unit?", sender: 'ai' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const financialDataSummary = useMemo(() => {
     const capEx = capitalExpenses.map(c => ({ item: c.item, actualExpense: c.actualExpense }));
     const monthlyActuals = financialYearMonths.map(month => {
        const monthTx = dailyTransactions.filter(t => t.monthYear === month);
        const income = monthTx.filter(t => t.type === 'Income').reduce((s,t) => s + (t.transactionType === 'tariff' ? t.nights*t.amount : t.amount), 0);
        const expense = monthTx.filter(t => t.type === 'Expense').reduce((s,t) => s + t.amount, 0);
        return { month, income, expense, net: income - expense };
     });
     const projections = monthlyProjections.map(p => {
        const { unitId, userId, lastUpdated, ...rest } = p;
        return rest;
     });

     return { capitalExpenses: capEx, monthlyActuals, monthlyProjections: projections };
  }, [capitalExpenses, dailyTransactions, monthlyProjections]);

  const handleSend = async () => {
    if (!input.trim() || loading || !GEMINI_API_KEY) {
        if (!GEMINI_API_KEY) {
            alert("Gemini API Key is not configured. Please set it up in your .env file.");
        }
        return;
    };

    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    const prompt = `
      You are a helpful financial assistant for an Airbnb host.
      Analyze the following financial data for one of their rental properties and answer the user's question.
      Provide concise, insightful answers based ONLY on the data provided. Format numbers as Indian Rupees (₹) where appropriate.

      Here is the financial data in JSON format:
      ${JSON.stringify(financialDataSummary, null, 2)}

      User's Question: "${input}"
    `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const aiText = data.candidates[0]?.content.parts[0]?.text || "I couldn't process that request.";
        setMessages(prev => [...prev, { text: aiText, sender: 'ai' }]);

    } catch (error) {
        console.error("AI Chat Error:", error);
        setMessages(prev => [...prev, { text: "Sorry, I'm having trouble connecting. Please check the API key and try again.", sender: 'ai' }]);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div>
        <h2 className="text-xl font-bold mb-4">AI Financial Assistant</h2>
        <div className="border rounded-lg bg-white shadow-inner flex flex-col h-[60vh]">
            <div className="flex-1 p-4 overflow-y-auto">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex mb-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`rounded-lg px-4 py-2 max-w-lg ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                            {msg.text.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="rounded-lg px-4 py-2 bg-gray-200 text-gray-500">
                           AI is typing...
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
            <div className="p-4 border-t flex">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask about your finances..."
                    className="flex-1 p-2 border rounded-l-md"
                    disabled={loading}
                />
                <button onClick={handleSend} disabled={loading} className="p-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:bg-blue-300">
                    Send
                </button>
            </div>
        </div>
    </div>
  );
}

export default AiChat;