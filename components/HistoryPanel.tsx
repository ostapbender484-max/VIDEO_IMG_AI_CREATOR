
import React from 'react';
import { HistoryIcon, TrashIcon } from './Icons';

interface HistoryPanelProps {
    history: string[];
    onRevert: (imageDataUrl: string) => void;
    onClear: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onRevert, onClear }) => {
    if (history.length === 0) {
        return null;
    }

    return (
        <div className="bg-slate-800/50 rounded-2xl p-4 flex flex-col shadow-lg backdrop-blur-sm border border-slate-700">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                    <HistoryIcon className="w-5 h-5 text-slate-400" />
                    <h3 className="font-semibold text-slate-300">History</h3>
                </div>
                <button
                    onClick={onClear}
                    className="flex items-center gap-1 text-sm text-slate-400 hover:text-red-400 transition-colors"
                    aria-label="Clear history"
                    title="Permanently delete all editing history"
                >
                    <TrashIcon className="w-4 h-4" />
                    Clear
                </button>
            </div>
            <div className="flex overflow-x-auto space-x-3 pb-2 -mx-2 px-2">
                {history.map((imageDataUrl, index) => (
                    <button
                        key={index}
                        onClick={() => onRevert(imageDataUrl)}
                        className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 focus:border-blue-500 transition-all focus:outline-none"
                        aria-label={`Revert to step ${index + 1}`}
                        title="Click to restore this version"
                    >
                        <img
                            src={imageDataUrl}
                            alt={`History step ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                    </button>
                ))}
            </div>
        </div>
    );
};
