import React from 'react';
import Header from '../layout/Header';
import BottomNavigation from '../layout/BottomNavigation';

const CalendarScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Header title="Calendar" />
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900">Calendar View</h2>
            <p className="mt-2 text-gray-600">
              This is the calendar screen where you can view and manage your sessions. 
              You'll be able to see scheduled sessions, add new sessions, and navigate between months.
            </p>
          </div>
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
};

export default CalendarScreen;