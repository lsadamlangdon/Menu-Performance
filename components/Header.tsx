
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-lightspeed-red rounded-lg flex items-center justify-center shadow-sm">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-black uppercase tracking-widest text-lightspeed-dark leading-none">Menu Analyst</span>
            <span className="text-[9px] font-bold text-lightspeed-text-secondary uppercase tracking-[0.05em] mt-1 opacity-80">powered by lightspeed</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="text-[10px] font-black uppercase tracking-widest hover:text-lightspeed-red transition-colors border-b-2 border-transparent hover:border-lightspeed-red pb-1">Contact us</a>
        </div>
      </div>
    </header>
  );
};

export default Header;
