
import React, { useState, useCallback, useEffect } from 'react';
import { editImageWithPrompt } from '../services/geminiService';
import type { ImageFile } from '../types';
import { Spinner } from './Spinner';
import { UploadIcon, XCircleIcon, PhotoIcon } from './Icons';
import { ChatBot } from './ChatBot';
import { HistoryPanel } from './HistoryPanel';

// Helper to convert image format using a canvas
const convertImageFormat = (
    base64Data: string, 
    fromMimeType: string, 
    toMimeType: 'image/png' | 'image/jpeg'
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }
            // For JPEG, fill background with white to avoid black background for transparent PNGs
            if (toMimeType === 'image/jpeg') {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.drawImage(img, 0, 0);
            // Get data URL with specified MIME type and quality for JPEG
            const dataUrl = canvas.toDataURL(toMimeType, 0.9); 
            resolve(dataUrl);
        };
        img.onerror = (err) => {
            reject(new Error(`Image loading failed for conversion: ${err}`));
        };
        img.src = `data:${fromMimeType};base64,${base64Data}`;
    });
};

export const ImageEditor: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<ImageFile | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [outputFormat, setOutputFormat] = useState<'image/png' | 'image/jpeg'>('image/png');
    const [history, setHistory] = useState<string[]>([]);

    useEffect(() => {
        try {
            const savedOriginal = localStorage.getItem('originalImage');
            const savedEdited = localStorage.getItem('editedImage');
            const savedHistory = localStorage.getItem('editHistory');

            if (savedOriginal) {
                setOriginalImage(JSON.parse(savedOriginal));
            }
            if (savedEdited) {
                setEditedImage(savedEdited);
            }
            if (savedHistory) {
                setHistory(JSON.parse(savedHistory));
            }
        } catch (e) {
            console.error("Failed to load state from localStorage", e);
            // Clear potentially corrupted storage
            localStorage.clear();
        }
    }, []);

    const handleImageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = (reader.result as string).split(',')[1];
                const newImage: ImageFile = {
                    file: file,
                    base64: base64String,
                    mimeType: file.type,
                    dataURL: reader.result as string,
                };
                setOriginalImage(newImage);
                setEditedImage(null);
                setError(null);
                setHistory([]);
                // Save to local storage
                localStorage.setItem('originalImage', JSON.stringify({
                    base64: newImage.base64,
                    mimeType: newImage.mimeType,
                    dataURL: newImage.dataURL,
                }));
                localStorage.removeItem('editedImage');
                localStorage.removeItem('editHistory');
            };
            reader.readAsDataURL(file);
        }
    }, []);
    
    const handleRemoveImage = useCallback(() => {
        setOriginalImage(null);
        setEditedImage(null);
        setError(null);
        setHistory([]);
        localStorage.removeItem('originalImage');
        localStorage.removeItem('editedImage');
        localStorage.removeItem('editHistory');
    }, []);

    const handleSubmit = async () => {
        if (!originalImage || !prompt) {
            setError("Please upload an image and provide an editing prompt.");
            return;
        }
        setIsLoading(true);
        setError(null);
        
        try {
            const { base64: newImageBase64, mimeType: newImageMimeType } = await editImageWithPrompt(originalImage.base64, originalImage.mimeType, prompt);
            
            let finalImageDataUrl: string;
            if (newImageMimeType !== outputFormat) {
                finalImageDataUrl = await convertImageFormat(newImageBase64, newImageMimeType, outputFormat);
            } else {
                finalImageDataUrl = `data:${newImageMimeType};base64,${newImageBase64}`;
            }

            setEditedImage(finalImageDataUrl);
            const newHistory = [...history, finalImageDataUrl];
            setHistory(newHistory);
            
            // Persist state
            localStorage.setItem('editedImage', finalImageDataUrl);
            localStorage.setItem('editHistory', JSON.stringify(newHistory));

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "An unknown error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRevertToHistory = (imageDataUrl: string) => {
        setEditedImage(imageDataUrl);
        localStorage.setItem('editedImage', imageDataUrl);
    };

    const handleClearHistory = () => {
        setHistory([]);
        localStorage.removeItem('editHistory');
    };

    return (
        <main className="w-full flex-grow grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Input Panel */}
            <div className="bg-slate-800/50 rounded-2xl p-6 flex flex-col space-y-6 shadow-2xl backdrop-blur-sm border border-slate-700">
                <div className="flex-grow flex flex-col">
                     {!originalImage ? (
                        <label htmlFor="image-upload" className="flex-grow flex flex-col justify-center items-center border-2 border-dashed border-slate-600 rounded-lg p-8 cursor-pointer hover:border-blue-400 hover:bg-slate-800 transition-colors">
                            <UploadIcon className="w-12 h-12 text-slate-500 mb-4" />
                            <span className="font-semibold text-slate-300">Click to upload an image</span>
                            <span className="text-sm text-slate-500">PNG, JPG, WEBP, etc.</span>
                            <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                        </label>
                     ) : (
                        <div className="relative group flex-grow">
                            <img src={originalImage.dataURL} alt="Original" className="w-full h-full object-contain rounded-lg"/>
                            <button onClick={handleRemoveImage} title="Remove image" className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-red-600/80 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100">
                                <XCircleIcon className="w-6 h-6"/>
                            </button>
                        </div>
                     )}
                </div>
                <div className="flex-shrink-0 space-y-4">
                    <div>
                        <label htmlFor="prompt" className="block text-sm font-medium text-slate-300 mb-2">Editing Prompt</label>
                        <textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., Add a retro filter"
                            rows={3}
                            className="w-full bg-slate-900/70 border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            disabled={!originalImage || isLoading}
                            title="Describe the changes you want to make to the image."
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Output Format
                        </label>
                        <div className="flex space-x-2 rounded-lg bg-slate-900/70 p-1 border border-slate-700 w-min">
                            <button
                                onClick={() => setOutputFormat('image/png')}
                                disabled={isLoading}
                                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors disabled:cursor-not-allowed ${
                                    outputFormat === 'image/png'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-400 hover:bg-slate-700'
                                }`}
                                title="Generate a PNG image. Best for images with transparency."
                            >
                                PNG
                            </button>
                            <button
                                onClick={() => setOutputFormat('image/jpeg')}
                                disabled={isLoading}
                                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors disabled:cursor-not-allowed ${
                                    outputFormat === 'image/jpeg'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-400 hover:bg-slate-700'
                                }`}
                                title="Generate a JPEG image. Best for photographs and smaller file sizes."
                            >
                                JPEG
                            </button>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={!originalImage || !prompt || isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-teal-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none"
                    title="Generate a new image based on your prompt."
                >
                    {isLoading ? <><Spinner size="sm" /> Generating...</> : 'Generate'}
                </button>
            </div>

            {/* Output Panel */}
             <div className="flex flex-col gap-6">
                <div className="bg-slate-800/50 rounded-2xl p-6 flex-grow flex justify-center items-center shadow-2xl backdrop-blur-sm border border-slate-700 min-h-[400px] lg:min-h-0">
                    {isLoading && (
                        <div className="text-center">
                            <Spinner size="lg" />
                            <p className="mt-4 text-slate-400 animate-pulse">AI is working its magic...</p>
                        </div>
                    )}
                    {!isLoading && error && (
                        <div className="text-center text-red-400">
                            <XCircleIcon className="w-12 h-12 mx-auto mb-2" />
                            <p className="font-semibold">Generation Failed</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}
                    {!isLoading && !error && editedImage && (
                        <img src={editedImage} alt="Edited" className="w-full h-full object-contain rounded-lg" />
                    )}
                    {!isLoading && !error && !editedImage && (
                        <div className="text-center text-slate-500">
                            <PhotoIcon className="w-16 h-16 mx-auto mb-4" />
                            <p className="font-semibold">Your generated image will appear here</p>
                            <p className="text-sm">Upload an image and enter a prompt to start</p>
                        </div>
                    )}
                </div>
                {originalImage && (
                    <HistoryPanel
                        history={history}
                        onRevert={handleRevertToHistory}
                        onClear={handleClearHistory}
                    />
                )}
            </div>

             {/* Chat Panel */}
            <div className="lg:col-span-1 min-h-[500px] lg:min-h-0">
                <ChatBot />
            </div>
        </main>
    );
};
