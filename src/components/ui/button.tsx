import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export const Button = ({ children, ...props }: ButtonProps) => {
  return (
    <button
      {...props}
      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
    >
      {children}
    </button>
  );
};
