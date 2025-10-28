import React from 'react';
import Header from '../layout/Header';
import BottomNavigation from '../layout/BottomNavigation';

const FinancesScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Header title="Finances" />
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900">Financial Management</h2>
            <p className="mt-2 text-gray-600">
              This is the finances screen where you can track your income, expenses, and overall financial performance. 
              You'll be able to view revenue by payment type, track outstanding payments, and generate financial reports.
            </p>
          </div>
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
};

export default FinancesScreen;