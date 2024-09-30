import React from 'react';
const Button = ({ children, ...props }) => {
    return (
      <button {...props} className="w-full text-left px-4 py-2 bg-blue-400 text-white rounded">
        {children}
      </button>
    );
  };
  
export default Button;