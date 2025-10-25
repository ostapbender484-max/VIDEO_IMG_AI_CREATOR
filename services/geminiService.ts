import { GoogleGenAI, Modality, Chat } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Keep the chat instance in memory to maintain conversation history
let chat: Chat | null = null;

function initializeChat() {
    chat = ai.chats.create({
        model: 'gemini-2.5-flash',
    });
}

export async function editImageWithPrompt(
    base64Image: string, 
    mimeType: string, 
    prompt: string
): Promise<{ base64: string; mimeType: string }> {
    try {
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: mimeType,
            },
        };

        const textPart = {
            text: prompt,
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [imagePart, textPart],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        // Find the image part in the response
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                return {
                    base64: part.inlineData.data,
                    mimeType: part.inlineData.mimeType,
                };
            }
        }
        
        throw new Error("No image found in the Gemini API response.");

    } catch (error) {
        console.error("Error editing image with Gemini:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate image: ${error.message}`);
        }
        throw new Error("An unexpected error occurred while communicating with the Gemini API.");
    }
}

export async function sendMessageToBot(message: string): Promise<string> {
    if (!chat) {
        initializeChat();
    }
    
    try {
        // We can safely assume chat is initialized here due to the check above.
        const response = await (chat as Chat).sendMessage({ message });
        return response.text;
    } catch (error) {
        console.error("Error sending message to bot:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to get chat response: ${error.message}`);
        }
        throw new Error("An unexpected error occurred while communicating with the Chat API.");
    }
}

export async function generateVideoWithPrompt(
    prompt: string,
    aspectRatio: '16:9' | '9:16',
    startingImage?: { base64: string; mimeType: string }
): Promise<string> {
    // Create a new instance to ensure the latest API key is used
    const videoAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
        let operation = await videoAI.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            image: startingImage ? {
                imageBytes: startingImage.base64,
                mimeType: startingImage.mimeType,
            } : undefined,
            config: {
                numberOfVideos: 1,
                aspectRatio: aspectRatio,
                resolution: '720p',
            }
        });

        while (!operation.done) {
            // Poll every 10 seconds
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await videoAI.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("Video generation succeeded but no download link was found.");
        }
        
        // Fetch the video as a blob and create an object URL
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!response.ok) {
            throw new Error(`Failed to download the generated video. Status: ${response.status}`);
        }
        const videoBlob = await response.blob();
        return URL.createObjectURL(videoBlob);

    } catch (error) {
        console.error("Error generating video with Veo:", error);

        let errorContent = '';
        if (error instanceof Error) {
            errorContent = error.message;
        } else {
            try {
                // The error might be the raw JSON response body from the API
                errorContent = JSON.stringify(error);
            } catch {
                errorContent = String(error);
            }
        }

        if (errorContent.includes("Requested entity was not found.")) {
             throw new Error("API key not found or invalid. Please select a valid API key and try again.");
        }
        
        if (error instanceof Error) {
            throw new Error(`Failed to generate video: ${error.message}`);
        }
        throw new Error("An unexpected error occurred while generating the video.");
    }
}