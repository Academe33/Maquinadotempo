import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span className="font-sans text-[1.6rem] font-bold tracking-tight">
        <span className="text-gray-200">Acade</span>
        <span className="text-purple-600">me</span>
      </span>
    </div>
  );
};

export default Logo;
