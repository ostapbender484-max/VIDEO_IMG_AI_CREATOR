
export interface ImageFile {
    file?: File;
    base64: string;
    mimeType: string;
    dataURL: string;
}

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}
