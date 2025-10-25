
import React, { useState } from 'react';
import { ImageEditor } from './components/ImageEditor';
import { VideoGenerator } from './components/VideoGenerator';
import { PhotoIcon, VideoCameraIcon } from './components/Icons';
import { Footer } from './components/Footer';
import { DragonBackground } from './components/DragonBackground';

type Mode = 'image' | 'video';

const App: React.FC = () => {
    const [mode, setMode] = useState<Mode>('image');

    const getButtonClasses = (buttonMode: Mode) => {
        const baseClasses = "flex items-center gap-3 px-6 py-2.5 font-semibold rounded-lg transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900";
        if (mode === buttonMode) {
            return `${baseClasses} bg-blue-600 text-white`;
        }
        return `${baseClasses} bg-slate-800 text-slate-300 hover:bg-slate-700`;
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
            <DragonBackground />
            <header className="w-full max-w-7xl text-center mb-8 z-10">
                <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
                    MAXBOOSTED AI CREATOR
                </h1>
                <p className="mt-2 text-base text-slate-400">
                    {mode === 'image' ? 'Edit images with text prompts and chat with an AI assistant.' : 'Generate stunning videos from text and images.'}
                </p>
                 <nav className="mt-8 flex justify-center gap-4">
                    <button onClick={() => setMode('image')} className={getButtonClasses('image')} title="Switch to the Image Editor">
                        <PhotoIcon className="w-6 h-6" />
                        Image Editor
                    </button>
                    <button onClick={() => setMode('video')} className={getButtonClasses('video')} title="Switch to the Video Generator">
                        <VideoCameraIcon className="w-6 h-6" />
                        Video Generator
                    </button>
                </nav>
            </header>
            
            <div className="w-full max-w-7xl flex-grow z-10">
                {mode === 'image' ? <ImageEditor /> : <VideoGenerator />}
            </div>

            <Footer />
        </div>
    );
};

export default App;