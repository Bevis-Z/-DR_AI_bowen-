import React from 'react';

const Header = () => {
  return (
    <div className="h-14 bg-white flex justify-between items-center border-b px-4 py-6">
      <img
        src="https://13sick.com.au/wp-content/uploads/2023/04/13sick-logo-mark-full-color-rgb.svg"
        alt="13sick logo"
        className="h-8"
      />
      <p className="text text-[#00006e] font-bold">AI ChatBox</p>
      <img
        src="https://13sick.com.au/wp-content/uploads/2023/04/13sick-logo-full-color-rgb.svg"
        alt="13sick logo"
        className="h-8"
      />
    </div>
  );
};

export default Header;
