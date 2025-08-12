import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import { db } from '../firebase/config';
import { collection, addDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { financialYearMonths, incomeCategories, expenseCategories } from '../constants';
import { formatCurrency, formatDateForInput, getMonthYear } from '../utils/helpers';

function DailyTransactions({ user, unitId, data }) {
  const [selectedMonth, setSelectedMonth] = useState(financialYearMonths[0]);
  const [loading, setLoading] = useState(false);
  
  const [tariffForm, setTariffForm] = useState({ date: '', guestName: '', nights: '', dailyTariff: '' });
  const [otherForm, setOtherForm] = useState({ date: '', description: '', type: 'Expense', category: expenseCategories[0], amount: '', notes: '' });

  const filteredData = useMemo(() => {
    return data
      .filter(item => item.monthYear === selectedMonth)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [data, selectedMonth]);

  const totals = useMemo(() => {
    const tariffIncome = filteredData
      .filter(t => t.transactionType === 'tariff')
      .reduce((sum, t) => sum + (Number(t.nights) * Number(t.amount)), 0);

    const otherIncome = filteredData
      .filter(t => t.transactionType === 'other' && t.type === 'Income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const otherExpenses = filteredData
      .filter(t => t.transactionType === 'other' && t.type === 'Expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
      
    return { tariffIncome, otherIncome, otherExpenses };
  }, [filteredData]);

  const handleTariffSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'dailyTransactions'), {
        userId: user.uid,
        unitId,
        date: tariffForm.date,
        monthYear: getMonthYear(new Date(tariffForm.date)),
        guestName: tariffForm.guestName,
        nights: Number(tariffForm.nights),
        amount: Number(tariffForm.dailyTariff),
        transactionType: 'tariff',
        type: 'Income',
        category: 'Accommodation',
        description: `Stay for ${tariffForm.guestName}`,
        createdAt: serverTimestamp(),
      });
      setTariffForm({ date: '', guestName: '', nights: '', dailyTariff: '' });
    } catch (err) { console.error(err); alert("Failed to add tariff."); }
    setLoading(false);
  };
  
  const handleOtherSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'dailyTransactions'), {
        userId: user.uid,
        unitId,
        date: otherForm.date,
        monthYear: getMonthYear(new Date(otherForm.date)),
        description: otherForm.description,
        type: otherForm.type,
        category: otherForm.category,
        amount: Number(otherForm.amount),
        notes: otherForm.notes,
        transactionType: 'other',
        createdAt: serverTimestamp(),
      });
      setOtherForm({ date: '', description: '', type: 'Expense', category: expenseCategories[0], amount: '', notes: '' });
    } catch (err) { console.error(err); alert("Failed to add transaction."); }
    setLoading(false);
  };

  const handleCsvImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const batch = writeBatch(db);
        results.data.forEach(row => {
          const date = new Date(row.Date);
          if (!isNaN(date.getTime()) && row.GuestName && row.Nights && row.DailyTariff) {
            const newDocRef = collection(db, 'dailyTransactions').doc();
            batch.set(newDocRef, {
                userId: user.uid,
                unitId,
                date: date.toISOString().split('T')[0],
                monthYear: getMonthYear(date),
                guestName: row.GuestName,
                nights: Number(row.Nights),
                amount: Number(row.DailyTariff),
                transactionType: 'tariff',
                type: 'Income',
                category: 'Accommodation',
                description: `Stay for ${row.GuestName}`,
                createdAt: serverTimestamp(),
            });
          }
        });
        try {
          await batch.commit();
          alert("CSV data imported successfully!");
        } catch (err) {
          console.error("Error importing CSV:", err);
          alert("Failed to import CSV data.");
        }
        setLoading(false);
        e.target.value = null;
      },
      error: (err) => {
        console.error("CSV parsing error:", err);
        alert("Failed to parse CSV file.");
        setLoading(false);
      }
    });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Daily Income & Expenses</h2>
      <div className="mb-4">
        <label htmlFor="month-select" className="mr-2 font-semibold">Month:</label>
        <select id="month-select" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="p-2 border rounded">
          {financialYearMonths.map(month => <option key={month} value={month}>{month}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-4 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-2">Daily Tariff Income</h3>
          <form onSubmit={handleTariffSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <input type="date" value={tariffForm.date} onChange={e => setTariffForm({...tariffForm, date: e.target.value})} required className="p-2 border rounded"/>
            <input value={tariffForm.guestName} onChange={e => setTariffForm({...tariffForm, guestName: e.target.value})} placeholder="Guest Name" required className="p-2 border rounded"/>
            <input type="number" value={tariffForm.nights} onChange={e => setTariffForm({...tariffForm, nights: e.target.value})} placeholder="Nights" required className="p-2 border rounded"/>
            <input type="number" value={tariffForm.dailyTariff} onChange={e => setTariffForm({...tariffForm, dailyTariff: e.target.value})} placeholder="Daily Tariff (INR)" required className="p-2 border rounded"/>
            <button type="submit" disabled={loading} className="sm:col-span-2 p-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add Tariff Entry</button>
          </form>
          <div className="border-t pt-4">
            <label className="block font-semibold mb-1">Import from CSV</label>
            <p className="text-xs text-gray-500 mb-2">CSV must have headers: Date, GuestName, Nights, DailyTariff</p>
            <input type="file" accept=".csv" onChange={handleCsvImport} disabled={loading} className="text-sm"/>
          </div>
        </div>

        <div className="p-4 border rounded-lg bg-gray-50">
           <h3 className="text-lg font-semibold mb-2">Other Income & Expenses</h3>
            <form onSubmit={handleOtherSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <input type="date" value={otherForm.date} onChange={e => setOtherForm({...otherForm, date: e.target.value})} required className="p-2 border rounded"/>
              <input value={otherForm.description} onChange={e => setOtherForm({...otherForm, description: e.target.value})} placeholder="Description" required className="p-2 border rounded"/>
              <select value={otherForm.type} onChange={e => setOtherForm({...otherForm, type: e.target.value, category: e.target.value === 'Income' ? incomeCategories[0] : expenseCategories[0]})} className="p-2 border rounded">
                <option>Income</option>
                <option>Expense</option>
              </select>
               <select value={otherForm.category} onChange={e => setOtherForm({...otherForm, category: e.target.value})} className="p-2 border rounded">
                {(otherForm.type === 'Income' ? incomeCategories : expenseCategories).map(cat => <option key={cat}>{cat}</option>)}
              </select>
              <input type="number" value={otherForm.amount} onChange={e => setOtherForm({...otherForm, amount: e.target.value})} placeholder="Amount (INR)" required className="p-2 border rounded"/>
              <input value={otherForm.notes} onChange={e => setOtherForm({...otherForm, notes: e.target.value})} placeholder="Notes (Optional)" className="p-2 border rounded"/>
               <button type="submit" disabled={loading} className="sm:col-span-2 p-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add Transaction</button>
            </form>
        </div>
      </div>
      
      <div className="mt-8 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-2">Transactions for {selectedMonth}</h3>
         <table className="min-w-full bg-white border">
          <thead className="bg-gray-200">
            <tr>
              <th className="py-2 px-4 border-b">Date</th>
              <th className="py-2 px-4 border-b">Description</th>
              <th className="py-2 px-4 border-b">Category</th>
              <th className="py-2 px-4 border-b">Income</th>
              <th className="py-2 px-4 border-b">Expense</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(item => {
                const income = item.type === 'Income' ? (item.transactionType === 'tariff' ? (item.nights * item.amount) : item.amount) : 0;
                const expense = item.type === 'Expense' ? item.amount : 0;
                return (
                    <tr key={item.id} className="text-center hover:bg-gray-50">
                        <td className="py-2 px-4 border-b">{formatDateForInput(item.date)}</td>
                        <td className="py-2 px-4 border-b text-left">{item.description}</td>
                        <td className="py-2 px-4 border-b">{item.category}</td>
                        <td className="py-2 px-4 border-b text-green-600">{formatCurrency(income)}</td>
                        <td className="py-2 px-4 border-b text-red-600">{formatCurrency(expense)}</td>
                    </tr>
                );
            })}
          </tbody>
          <tfoot>
             <tr className="bg-gray-200 font-bold text-center">
                <td colSpan="3" className="py-2 px-4 border-b text-right">MONTHLY TOTALS</td>
                <td className="py-2 px-4 border-b text-green-700">{formatCurrency(totals.tariffIncome + totals.otherIncome)}</td>
                <td className="py-2 px-4 border-b text-red-700">{formatCurrency(totals.otherExpenses)}</td>
             </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default DailyTransactions;