import React, { useMemo } from 'react';
import { formatCurrency } from '../utils/helpers';
import { financialYearMonths } from '../constants';

function RoiAnalysis({ capitalExpenses, dailyTransactions }) {

    const analysisData = useMemo(() => {
        const totalCapital = capitalExpenses.reduce((sum, item) => sum + (Number(item.actualExpense) || 0), 0);
        
        const yearNetProfit = financialYearMonths.reduce((totalNet, month) => {
             const monthTransactions = dailyTransactions.filter(t => t.monthYear === month);
            
            const totalIncome = monthTransactions
                .filter(t => t.type === 'Income')
                .reduce((sum, t) => {
                    const amount = t.transactionType === 'tariff' ? (Number(t.nights) * Number(t.amount)) : Number(t.amount);
                    return sum + amount;
                }, 0);

            const totalExpenses = monthTransactions
                .filter(t => t.type === 'Expense')
                .reduce((sum, t) => sum + Number(t.amount), 0);

            return totalNet + (totalIncome - totalExpenses);
        }, 0);

        const roi = totalCapital > 0 ? (yearNetProfit / totalCapital) * 100 : 0;

        return { totalCapital, yearNetProfit, roi };

    }, [capitalExpenses, dailyTransactions]);


    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Return on Investment (ROI) Analysis</h2>
            <div className="bg-white border rounded-lg p-6 max-w-md mx-auto">
                <table className="w-full">
                    <tbody>
                        <tr className="border-b">
                            <td className="py-3 font-semibold text-gray-700">Total Capital Expenses</td>
                            <td className="py-3 text-right text-lg font-mono">{formatCurrency(analysisData.totalCapital)}</td>
                        </tr>
                        <tr className="border-b">
                            <td className="py-3 font-semibold text-gray-700">Year Total Net Profit/Loss</td>
                            <td className={`py-3 text-right text-lg font-mono ${analysisData.yearNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(analysisData.yearNetProfit)}
                            </td>
                        </tr>
                        <tr className="bg-gray-100">
                            <td className="py-4 font-bold text-gray-800 text-lg">Return on Investment (ROI)</td>
                            <td className={`py-4 text-right text-2xl font-bold ${analysisData.roi >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {analysisData.roi.toFixed(2)}%
                            </td>
                        </tr>
                    </tbody>
                </table>
                 {analysisData.totalCapital === 0 && (
                    <p className="text-center text-sm text-red-500 mt-4">
                        ROI cannot be calculated until Capital Expenses (Actual) are added.
                    </p>
                )}
            </div>
        </div>
    );
}

export default RoiAnalysis;