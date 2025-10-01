
"use client"

import React, { useRef } from 'react';
import { Button } from './ui/button';
import { Loader2, Upload } from 'lucide-react';
import Image from 'next/image';

interface ImageKitUploaderProps {
    onUploadSuccess: (urls: string[]) => void;
    folder?: string;
    initialImageUrl?: string;
    multiple?: boolean;
}

const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;

if (!publicKey || !urlEndpoint) {
    console.error("ImageKit public key or URL endpoint is not defined in environment variables.");
}

const ImageKitUploader: React.FC<ImageKitUploaderProps> = ({ onUploadSuccess, folder, initialImageUrl, multiple = false }) => {
    const [uploading, setUploading] = React.useState(false);
    const [imageUrl, setImageUrl] = React.useState<string | null>(initialImageUrl || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        setImageUrl(initialImageUrl || null);
    }, [initialImageUrl]);

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0 || !publicKey || !urlEndpoint) return;

        setUploading(true);

        const uploadPromises = Array.from(files).map(async (file) => {
             try {
                const authRes = await fetch('/api/imagekit/auth');
                if (!authRes.ok) throw new Error('Failed to authenticate with ImageKit');
                const { token, expire, signature } = await authRes.json();

                const formData = new FormData();
                formData.append('file', file);
                formData.append('publicKey', publicKey);
                formData.append('signature', signature);
                formData.append('expire', expire);
                formData.append('token', token);
                formData.append('fileName', file.name);
                if (folder) {
                    formData.append('folder', folder);
                }

                const uploadRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!uploadRes.ok) {
                    const errorData = await uploadRes.json();
                    throw new Error(`ImageKit upload failed: ${errorData.message}`);
                }
                return await uploadRes.json();
            } catch (err: any) {
                console.error("Upload Error for file", file.name, err);
                return null; // Return null for failed uploads
            }
        });
        
        try {
            const results = await Promise.all(uploadPromises);
            const successfulUploads = results.filter(res => res !== null);

            if (successfulUploads.length > 0) {
                const urls = successfulUploads.map(res => res.url);
                if (!multiple && urls.length > 0) {
                     setImageUrl(urls[0]);
                }
                onUploadSuccess(urls);
            }
        } catch (e) {
            console.error("Error during batch upload:", e)
        } finally {
            setUploading(false);
        }
    };

    if (!publicKey || !urlEndpoint) {
        return <div className="text-red-500">ImageKit is not configured.</div>;
    }
    
    // Simplified view for multiple file uploads
    if (multiple) {
        return (
             <div>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleUpload}
                    style={{ display: 'none' }}
                    id={`file-upload-${folder}`}
                    accept="image/*,application/pdf"
                    multiple
                />
                 <Button asChild variant="outline" className="w-full">
                    <label htmlFor={`file-upload-${folder}`}>
                        {uploading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                আপলোড হচ্ছে...
                            </>
                        ) : (
                            <>
                                <Upload className="h-4 w-4 mr-2" />
                                ফাইল নির্বাচন করুন
                            </>
                        )}
                    </label>
                </Button>
            </div>
        )
    }

    return (
        <div className="w-full h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground relative">
            {imageUrl ? (
                 <Image src={imageUrl} alt="Uploaded image" layout="fill" className="rounded-md object-cover" />
            ) : (
                <div className="w-24 h-24 bg-gray-200 rounded-lg mb-2 flex items-center justify-center">
                    <Image data-ai-hint="placeholder image" src="https://picsum.photos/100/100" width={96} height={96} alt="placeholder" className="rounded-md object-cover" />
                </div>
            )}
             <div className="absolute bottom-2">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleUpload}
                    style={{ display: 'none' }}
                    id={`file-upload-single-${folder}`}
                    accept="image/*"
                    multiple={false}
                />
                 <Button asChild variant="ghost" size="sm">
                    <label htmlFor={`file-upload-single-${folder}`}>
                        {uploading ? (
                            <>
                                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                আপলোড হচ্ছে...
                            </>
                        ) : (
                            <>
                                <Upload className="h-3 w-3 mr-2" />
                                ছবি আপলোড করুন
                            </>
                        )}
                    </label>
                </Button>
            </div>
        </div>
    );
};

export default ImageKitUploader;
