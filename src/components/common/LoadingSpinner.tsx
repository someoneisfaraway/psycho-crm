import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', text }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-solid border-indigo-600 border-t-transparent`}
      ></div>
      {text && <p className="mt-2 text-gray-600">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;