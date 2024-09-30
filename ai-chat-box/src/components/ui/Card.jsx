import React from 'react';
const Card = ({ className, children }) => {
    return <div className={`border rounded shadow-md ${className}`}>{children}</div>;
  };
  
  const CardHeader = ({ children }) => <div className="font-bold mb-2">{children}</div>;
  const CardContent = ({ className, children }) => <div className={className}>{children}</div>;
  const CardTitle = ({ children }) => <h2 className="text-lg font-bold">{children}</h2>;
  
  export { Card, CardHeader, CardContent, CardTitle };