import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  isLoading = false,
  children,
  disabled,
  className,
  ...props
}) => {
  const baseClasses = 'font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center';

  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white disabled:bg-primary-400',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:bg-gray-400',
    danger: 'bg-red-600 hover:bg-red-700 text-white disabled:bg-red-400',
  };

  const disabledClasses = disabled || isLoading ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${disabledClasses} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Загрузка...
        </>
      ) : (
        children
      )}
    </button>
  );
};