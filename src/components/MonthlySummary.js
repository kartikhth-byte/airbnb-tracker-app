import React, { useMemo } from 'react';
import { financialYearMonths } from '../constants';
import { formatCurrency } from '../utils/helpers';

function MonthlySummary({ transactions }) {
    
    const summaryData = useMemo(() => {
        const data = financialYearMonths.map(month => {
            const monthTransactions = transactions.filter(t => t.monthYear === month);
            
            const totalIncome = monthTransactions
                .filter(t => t.type === 'Income')
                .reduce((sum, t) => {
                    const amount = t.transactionType === 'tariff' ? (Number(t.nights) * Number(t.amount)) : Number(t.amount);
                    return sum + amount;
                }, 0);

            const totalExpenses = monthTransactions
                .filter(t => t.type === 'Expense')
                .reduce((sum, t) => sum + Number(t.amount), 0);

            const netProfit = totalIncome - totalExpenses;

            return { month, totalIncome, totalExpenses, netProfit };
        });

        const yearTotal = data.reduce((acc, monthData) => {
            acc.totalIncome += monthData.totalIncome;
            acc.totalExpenses += monthData.totalExpenses;
            acc.netProfit += monthData.netProfit;
            return acc;
        }, { totalIncome: 0, totalExpenses: 0, netProfit: 0 });

        return { monthlyData: data, yearTotal };

    }, [transactions]);

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Monthly Financial Summary (Actuals)</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="py-2 px-4 border-b">Month</th>
                            <th className="py-2 px-4 border-b">Total Income (INR)</th>
                            <th className="py-2 px-4 border-b">Total Expenses (INR)</th>
                            <th className="py-2 px-4 border-b">Net Profit/Loss (INR)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {summaryData.monthlyData.map(({ month, totalIncome, totalExpenses, netProfit }) => (
                            <tr key={month} className="text-center hover:bg-gray-50">
                                <td className="py-2 px-4 border-b">{month}</td>
                                <td className="py-2 px-4 border-b text-green-600">{formatCurrency(totalIncome)}</td>
                                <td className="py-2 px-4 border-b text-red-600">{formatCurrency(totalExpenses)}</td>
                                <td className={`py-2 px-4 border-b font-semibold ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                    {formatCurrency(netProfit)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-gray-800 text-white font-bold text-center">
                            <td className="py-3 px-4 border-b">YEAR TOTAL</td>
                            <td className="py-3 px-4 border-b">{formatCurrency(summaryData.yearTotal.totalIncome)}</td>
                            <td className="py-3 px-4 border-b">{formatCurrency(summaryData.yearTotal.totalExpenses)}</td>
                            <td className={`py-3 px-4 border-b ${summaryData.yearTotal.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {formatCurrency(summaryData.yearTotal.netProfit)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}

export default MonthlySummary;