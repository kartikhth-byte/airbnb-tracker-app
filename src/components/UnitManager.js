import React, { useState } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

function UnitManager({ user, units, selectedUnitId, setSelectedUnitId }) {
  const [newUnitName, setNewUnitName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddUnit = async (e) => {
    e.preventDefault();
    if (!newUnitName.trim()) return;
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'units'), {
        name: newUnitName,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      setNewUnitName('');
      setSelectedUnitId(docRef.id); // Automatically select the new unit
    } catch (error) {
      console.error("Error adding unit:", error);
      alert("Failed to add unit. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
      <div className="flex items-center mb-4 md:mb-0">
        <label htmlFor="unit-select" className="mr-2 font-semibold text-gray-700">Select Unit:</label>
        <select
          id="unit-select"
          value={selectedUnitId}
          onChange={(e) => setSelectedUnitId(e.target.value)}
          className="p-2 border rounded-md shadow-sm"
          disabled={units.length === 0}
        >
          {units.length === 0 ? (
            <option>No units available</option>
          ) : (
            units.map(unit => (
              <option key={unit.id} value={unit.id}>{unit.name}</option>
            ))
          )}
        </select>
      </div>
      <form onSubmit={handleAddUnit} className="flex items-center">
        <input
          type="text"
          value={newUnitName}
          onChange={(e) => setNewUnitName(e.target.value)}
          placeholder="New Unit Name"
          className="p-2 border rounded-l-md"
          required
        />
        <button type="submit" disabled={loading} className="p-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:bg-blue-300">
          {loading ? 'Adding...' : 'Add Unit'}
        </button>
      </form>
    </div>
  );
}

export default UnitManager;