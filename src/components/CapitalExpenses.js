import React, { useState, useMemo, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { formatCurrency } from '../utils/helpers';

function CapitalExpenses({ user, unitId, data }) {
  const initialFormState = {
    item: '', totalBudget: '', advancePaid1: '', advancePaid2: '', advancePaid3: '', advancePaid4: '', advancePaid5: '', actualExpense: '', notes: ''
  };
  
  const [formState, setFormState] = useState(initialFormState);
  const [editingItem, setEditingItem] = useState(null); // This will hold the item being edited
  const [loading, setLoading] = useState(false);

  // This effect populates the form when a user clicks "Edit"
  useEffect(() => {
    if (editingItem) {
      // Create a new object with all fields from editingItem, ensuring no undefined values
      const populatedForm = {};
      Object.keys(initialFormState).forEach(key => {
        populatedForm[key] = editingItem[key] || '';
      });
      setFormState(populatedForm);
    } else {
      setFormState(initialFormState);
    }
  }, [editingItem]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState(prevState => ({ ...prevState, [name]: value }));
  };
  
  // This function now handles both ADDING and UPDATING
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const numericFields = ['totalBudget', 'advancePaid1', 'advancePaid2', 'advancePaid3', 'advancePaid4', 'advancePaid5', 'actualExpense'];
    const dataToSubmit = { ...formState };
    numericFields.forEach(field => {
      dataToSubmit[field] = Number(dataToSubmit[field]) || 0;
    });

    try {
      if (editingItem) {
        // --- UPDATE LOGIC ---
        const docRef = doc(db, 'capitalExpenses', editingItem.id);
        await updateDoc(docRef, { ...dataToSubmit, lastUpdated: serverTimestamp() });
        setEditingItem(null); // Exit edit mode
      } else {
        // --- ADD LOGIC (original logic) ---
        await addDoc(collection(db, 'capitalExpenses'), {
          ...dataToSubmit,
          userId: user.uid,
          unitId: unitId,
          createdAt: serverTimestamp(),
        });
      }
      setFormState(initialFormState); // Clear the form
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Failed to save expense. Please try again.");
    }
    setLoading(false);
  };

  // --- NEW FUNCTIONS ---

  const handleEditClick = (item) => {
    setEditingItem(item);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to the top to see the form
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    // The useEffect hook will automatically clear the form
  };

  const handleDelete = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this expense? This action cannot be undone.")) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'capitalExpenses', itemId));
      } catch (error) {
        console.error("Error deleting document:", error);
        alert("Failed to delete expense.");
      }
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    return data.reduce((acc, item) => {
      acc.totalBudget += Number(item.totalBudget) || 0;
      acc.totalAdvancePaid += (Number(item.advancePaid1) || 0) + (Number(item.advancePaid2) || 0) + (Number(item.advancePaid3) || 0) + (Number(item.advancePaid4) || 0) + (Number(item.advancePaid5) || 0);
      acc.actualExpense += Number(item.actualExpense) || 0;
      return acc;
    }, { totalBudget: 0, totalAdvancePaid: 0, actualExpense: 0 });
  }, [data]);
  
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Capital Expenses</h2>
      
      <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-2">
          {editingItem ? 'Edit Capital Expense' : 'Add New Capital Expense'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input name="item" value={formState.item} onChange={handleChange} placeholder="Item/Service" required className="p-2 border rounded"/>
          <input name="totalBudget" value={formState.totalBudget} onChange={handleChange} type="number" placeholder="Total Budget" className="p-2 border rounded"/>
          <input name="actualExpense" value={formState.actualExpense} onChange={handleChange} type="number" placeholder="Actual Expense" className="p-2 border rounded"/>
          <div className="md:col-span-2 lg:col-span-4 grid grid-cols-2 md:grid-cols-5 gap-4">
             <input name="advancePaid1" value={formState.advancePaid1} onChange={handleChange} type="number" placeholder="Advance 1" className="p-2 border rounded"/>
             <input name="advancePaid2" value={formState.advancePaid2} onChange={handleChange} type="number" placeholder="Advance 2" className="p-2 border rounded"/>
             <input name="advancePaid3" value={formState.advancePaid3} onChange={handleChange} type="number" placeholder="Advance 3" className="p-2 border rounded"/>
             <input name="advancePaid4" value={formState.advancePaid4} onChange={handleChange} type="number" placeholder="Advance 4" className="p-2 border rounded"/>
             <input name="advancePaid5" value={formState.advancePaid5} onChange={handleChange} type="number" placeholder="Advance 5" className="p-2 border rounded"/>
          </div>
          <input name="notes" value={formState.notes} onChange={handleChange} placeholder="Notes (Optional)" className="p-2 border rounded md:col-span-2 lg:col-span-4"/>
        </div>
        <div className="mt-4 flex items-center gap-4">
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300">
              {loading ? 'Saving...' : (editingItem ? 'Update Entry' : 'Add Entry')}
            </button>
            {editingItem && (
              <button type="button" onClick={handleCancelEdit} disabled={loading} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                Cancel
              </button>
            )}
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-200">
            <tr>
              <th className="py-2 px-4 border-b">Item</th>
              <th className="py-2 px-4 border-b">Total Budget</th>
              <th className="py-2 px-4 border-b">Total Advance Paid</th>
              <th className="py-2 px-4 border-b">Actual Expense</th>
              <th className="py-2 px-4 border-b">Notes</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => {
                const totalAdvance = (Number(item.advancePaid1) || 0) + (Number(item.advancePaid2) || 0) + (Number(item.advancePaid3) || 0) + (Number(item.advancePaid4) || 0) + (Number(item.advancePaid5) || 0);
                return (
                    <tr key={item.id} className="text-center hover:bg-gray-50">
                        <td className="py-2 px-4 border-b text-left">{item.item}</td>
                        <td className="py-2 px-4 border-b">{formatCurrency(item.totalBudget)}</td>
                        <td className="py-2 px-4 border-b">{formatCurrency(totalAdvance)}</td>
                        <td className="py-2 px-4 border-b">{formatCurrency(item.actualExpense)}</td>
                        <td className="py-2 px-4 border-b text-left">{item.notes}</td>
                        <td className="py-2 px-4 border-b">
                            <button onClick={() => handleEditClick(item)} disabled={loading} className="text-sm bg-yellow-500 text-white px-2 py-1 rounded mr-2 hover:bg-yellow-600 disabled:bg-yellow-300">Edit</button>
                            <button onClick={() => handleDelete(item.id)} disabled={loading} className="text-sm bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 disabled:bg-red-400">Delete</button>
                        </td>
                    </tr>
                );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-200 font-bold text-center">
              <td className="py-2 px-4 border-b">TOTALS</td>
              <td className="py-2 px-4 border-b">{formatCurrency(totals.totalBudget)}</td>
              <td className="py-2 px-4 border-b">{formatCurrency(totals.totalAdvancePaid)}</td>
              <td className="py-2 px-4 border-b">{formatCurrency(totals.actualExpense)}</td>
              <td className="py-2 px-4 border-b" colSpan="2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default CapitalExpenses;