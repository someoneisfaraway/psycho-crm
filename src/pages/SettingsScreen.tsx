import React from 'react';
import Header from '../layout/Header';
import BottomNavigation from '../layout/BottomNavigation';

const SettingsScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Header title="Settings" />
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900">Application Settings</h2>
            <p className="mt-2 text-gray-600">
              This is the settings screen where you can manage your profile, notification preferences, 
              and other application settings. You'll be able to update your information and customize the application.
            </p>
          </div>
        </div>
      </main>
      <BottomNavigation />
    </div>
  );
};

export default SettingsScreen;