
import React, { useState, useCallback, useEffect } from 'react';
import { generateVideoWithPrompt } from '../services/geminiService';
import type { ImageFile } from '../types';
import { Spinner } from './Spinner';
import { UploadIcon, SparklesIcon, XCircleIcon, VideoCameraIcon } from './Icons';

export const VideoGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [startingImage, setStartingImage] = useState<ImageFile | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isKeySelected, setIsKeySelected] = useState(false);

    useEffect(() => {
        // Revoke the old object URL when the component unmounts or the URL changes
        return () => {
            if (videoUrl) {
                URL.revokeObjectURL(videoUrl);
            }
        };
    }, [videoUrl]);

    useEffect(() => {
        const checkApiKey = async () => {
            if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
                setIsKeySelected(true);
            }
        };
        checkApiKey();
    }, []);

    const handleSelectKey = async () => {
        if (window.aistudio) {
            await window.aistudio.openSelectKey();
            // Assume selection was successful to unblock the UI immediately
            setIsKeySelected(true); 
        }
    };

    const handleImageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = (reader.result as string).split(',')[1];
                const newImage: ImageFile = {
                    base64: base64String,
                    mimeType: file.type,
                    dataURL: reader.result as string,
                };
                setStartingImage(newImage);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const handleRemoveImage = useCallback(() => {
        setStartingImage(null);
    }, []);

    const handleSubmit = async () => {
        if (!prompt) {
            setError("Please provide a prompt for the video.");
            return;
        }
        if (!isKeySelected) {
            setError("Please select an API key before generating a video.");
            return;
        }
        setIsLoading(true);
        setError(null);
        if (videoUrl) {
            URL.revokeObjectURL(videoUrl);
        }
        setVideoUrl(null);
        setLoadingMessage("Initiating video generation... this may take a few minutes.");

        try {
            const generatedUrl = await generateVideoWithPrompt(
                prompt,
                aspectRatio,
                startingImage ? { base64: startingImage.base64, mimeType: startingImage.mimeType } : undefined
            );
            setVideoUrl(generatedUrl);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setError(errorMessage);
            if (errorMessage.includes("API key not found")) {
                setIsKeySelected(false);
            }
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const renderApiKeyPrompt = () => (
        <div className="text-center p-8 bg-slate-800 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">API Key Required</h3>
            <p className="text-slate-400 mb-6">
                Video generation with Veo requires a valid API key. Please select a key to proceed.
                For more information on billing, visit the{' '}
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                    billing documentation
                </a>.
            </p>
            <button
                onClick={handleSelectKey}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                title="You must select an API key to use the video generation feature"
            >
                Select API Key
            </button>
        </div>
    );

    return (
        <main className="w-full flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Panel */}
            <div className="bg-slate-800/50 rounded-2xl p-6 flex flex-col space-y-6 shadow-2xl backdrop-blur-sm border border-slate-700">
                {!isKeySelected ? renderApiKeyPrompt() : (
                    <>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="prompt" className="block text-sm font-medium text-slate-300 mb-2">Video Prompt</label>
                                <textarea
                                    id="prompt"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="e.g., A cinematic shot of a car driving on a rainy night"
                                    rows={4}
                                    className="w-full bg-slate-900/70 border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    disabled={isLoading}
                                    title="Describe the video you want to create"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Aspect Ratio</label>
                                <div className="flex space-x-2 rounded-lg bg-slate-900/70 p-1 border border-slate-700 w-min">
                                    <button
                                        onClick={() => setAspectRatio('16:9')}
                                        disabled={isLoading}
                                        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors disabled:cursor-not-allowed ${aspectRatio === '16:9' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                                        title="Generate a video in 16:9 aspect ratio (Landscape)"
                                    >
                                        Landscape (16:9)
                                    </button>
                                    <button
                                        onClick={() => setAspectRatio('9:16')}
                                        disabled={isLoading}
                                        className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors disabled:cursor-not-allowed ${aspectRatio === '9:16' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
                                        title="Generate a video in 9:16 aspect ratio (Portrait)"
                                    >
                                        Portrait (9:16)
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Starting Image (Optional)</label>
                                {!startingImage ? (
                                    <label htmlFor="video-image-upload" className="flex flex-col justify-center items-center border-2 border-dashed border-slate-600 rounded-lg p-6 cursor-pointer hover:border-blue-400 hover:bg-slate-800 transition-colors" title="Optionally provide an image to start the video from">
                                        <UploadIcon className="w-10 h-10 text-slate-500 mb-2" />
                                        <span className="font-semibold text-slate-300">Upload starting image</span>
                                        <input id="video-image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={isLoading}/>
                                    </label>
                                ) : (
                                    <div className="relative group w-48">
                                        <img src={startingImage.dataURL} alt="Starting image" className="w-full h-auto object-contain rounded-lg"/>
                                        <button onClick={handleRemoveImage} title="Remove starting image" className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-red-600/80 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100">
                                            <XCircleIcon className="w-5 h-5"/>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={!prompt || isLoading}
                            className="w-full mt-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-teal-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none"
                            title="Start the video generation process. This may take several minutes."
                        >
                            {isLoading ? <><Spinner /> Generating...</> : <><VideoCameraIcon className="w-5 h-5" /> Generate Video</>}
                        </button>
                    </>
                )}
            </div>

            {/* Output Panel */}
            <div className="bg-slate-800/50 rounded-2xl p-6 flex justify-center items-center shadow-2xl backdrop-blur-sm border border-slate-700 min-h-[400px] lg:min-h-0">
                {isLoading && (
                    <div className="text-center">
                        <Spinner size="lg" />
                        <p className="mt-4 text-slate-400 animate-pulse">{loadingMessage}</p>
                    </div>
                )}
                {!isLoading && error && (
                    <div className="text-center text-red-400 max-w-sm">
                        <XCircleIcon className="w-12 h-12 mx-auto mb-2" />
                        <p className="font-semibold">Generation Failed</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}
                {!isLoading && !error && videoUrl && (
                    <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain rounded-lg" />
                )}
                {!isLoading && !error && !videoUrl && (
                    <div className="text-center text-slate-500">
                        <VideoCameraIcon className="w-16 h-16 mx-auto mb-4" />
                        <p className="font-semibold">Your generated video will appear here</p>
                    </div>
                )}
            </div>
        </main>
    );
};
