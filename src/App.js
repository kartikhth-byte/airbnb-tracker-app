import React, { useState, useEffect } from 'react';
import { auth, db, signInAnonymously, onAuthStateChanged } from './firebase/config';
import { collection, query, onSnapshot, where } from 'firebase/firestore';

import UnitManager from './components/UnitManager';
import CapitalExpenses from './components/CapitalExpenses';
import DailyTransactions from './components/DailyTransactions';
import MonthlySummary from './components/MonthlySummary';
import MonthlyProjections from './components/MonthlyProjections';
import RoiAnalysis from './components/RoiAnalysis';
import AiChat from './components/AiChat';

const TABS = [
  'Capital Expenses',
  'Daily Transactions',
  'Monthly Summary',
  'Monthly Projections',
  'ROI Analysis',
  'AI Chat',
];

function App() {
  const [user, setUser] = useState(null);
  const [units, setUnits] = useState([]);
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [loading, setLoading] = useState(true);

  // Data states for passing to child components
  const [capitalExpenses, setCapitalExpenses] = useState([]);
  const [dailyTransactions, setDailyTransactions] = useState([]);
  const [monthlyProjections, setMonthlyProjections] = useState([]);

  // This useEffect block now uses the correct modern syntax
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        signInAnonymously(auth).catch((error) => {
          console.error("Anonymous sign-in failed:", error);
        });
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const q = query(collection(db, 'units'), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const unitsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUnits(unitsData);
      if (unitsData.length > 0 && !selectedUnitId) {
        setSelectedUnitId(unitsData[0].id);
      } else if (unitsData.length === 0) {
        setSelectedUnitId('');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!selectedUnitId) {
      setCapitalExpenses([]);
      setDailyTransactions([]);
      setMonthlyProjections([]);
      return;
    };

    const unsubCapital = onSnapshot(query(collection(db, 'capitalExpenses'), where("unitId", "==", selectedUnitId)), (snapshot) => {
      setCapitalExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubDaily = onSnapshot(query(collection(db, 'dailyTransactions'), where("unitId", "==", selectedUnitId)), (snapshot) => {
      setDailyTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubProjections = onSnapshot(query(collection(db, 'monthlyProjections'), where("unitId", "==", selectedUnitId)), (snapshot) => {
      setMonthlyProjections(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubCapital();
      unsubDaily();
      unsubProjections();
    };
  }, [selectedUnitId]);

  const renderTabContent = () => {
    if (!selectedUnitId && units.length > 0) {
      return <div className="p-6 text-center text-gray-500">Please select a unit to manage its finances.</div>;
    }
    if (units.length === 0 && !loading) {
       return <div className="p-6 text-center text-gray-500">Add your first Airbnb unit to get started!</div>;
    }
    if (!selectedUnitId && units.length === 0 && !loading) {
      return <div className="p-6 text-center text-gray-500">Add your first Airbnb unit to get started!</div>;
    }
    if (!selectedUnitId) return null; // Don't render tabs if no unit is selected

    switch (activeTab) {
      case 'Capital Expenses':
        return <CapitalExpenses user={user} unitId={selectedUnitId} data={capitalExpenses} />;
      case 'Daily Transactions':
        return <DailyTransactions user={user} unitId={selectedUnitId} data={dailyTransactions} />;
      case 'Monthly Summary':
        return <MonthlySummary transactions={dailyTransactions} />;
      case 'Monthly Projections':
        return <MonthlyProjections user={user} unitId={selectedUnitId} data={monthlyProjections} />;
      case 'ROI Analysis':
        return <RoiAnalysis capitalExpenses={capitalExpenses} dailyTransactions={dailyTransactions} />;
      case 'AI Chat':
        return <AiChat 
            unitId={selectedUnitId} 
            capitalExpenses={capitalExpenses}
            dailyTransactions={dailyTransactions}
            monthlyProjections={monthlyProjections}
            />;
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading application...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">Airbnb Business Financial Tracker</h1>
          {user && <p className="text-sm text-gray-500 mt-1">User ID: {user.uid}</p>}
        </div>
      </header>
      
      <main className="container mx-auto p-4">
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <UnitManager user={user} units={units} selectedUnitId={selectedUnitId} setSelectedUnitId={setSelectedUnitId} />
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex flex-wrap -mb-px p-2" aria-label="Tabs">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap mr-2 my-1 px-4 py-2 text-sm font-medium rounded-md
                    ${activeTab === tab 
                      ? 'bg-blue-600 text-white shadow' 
                      : 'text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
          <div className="p-4 md:p-6">
            {renderTabContent()}
          </div>
        </div>
      </main>

       <footer className="text-center py-4 text-gray-500 text-sm">
        <p>Built by Gemini for demonstration purposes.</p>
      </footer>
    </div>
  );
}

export default App;