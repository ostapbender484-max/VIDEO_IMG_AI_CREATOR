import React from 'react';

export const Footer: React.FC = () => {
    return (
        <footer className="w-full max-w-7xl text-center py-6 mt-8 border-t border-slate-700">
            <p className="text-sm text-slate-500">
                © {new Date().getFullYear()} MAXBOOSTED AI CREATOR. All rights reserved.
            </p>
            <p className="text-xs text-slate-600 mt-1">
                Powered by cutting-edge AI technology.
            </p>
        </footer>
    );
};