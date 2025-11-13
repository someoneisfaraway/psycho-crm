import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Menu } from 'lucide-react';
import { useUserDisplayName } from '../../utils/useUserDisplayName';

interface HeaderProps {
  title: string;
  showMenu?: boolean;
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, showMenu = false, onMenuClick }) => {
  const { signOut } = useAuth();
  const displayName = useUserDisplayName();

  const handleSignOut = async () => {
    try {
      await signOut();
      // After sign out, user will be redirected to auth screen automatically
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-white shadow z-10">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {showMenu && (
              <button
                onClick={onMenuClick}
                className="mr-3 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <Menu size={24} />
              </button>
            )}
            <h1 className="text-base font-bold text-gray-900">{title}</h1>
          </div>
          {/* Удалены имя пользователя и кнопка выхода — выход теперь на экране настроек */}
        </div>
      </div>
    </header>
  );
};

export default Header;
