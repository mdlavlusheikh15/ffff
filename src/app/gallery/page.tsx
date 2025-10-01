
"use client"

import * as React from "react";
import Image from "next/image";
import MainLayout from "@/app/(main)/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type GalleryImage = {
    id: string;
    src: string;
    alt?: string;
    hint: string;
}

const defaultGalleryImages: GalleryImage[] = [
    { id: 'g1', src: "https://picsum.photos/seed/event-1/600/400", alt: "Annual Sports Day", hint: "sports day" },
    { id: 'g2', src: "https://picsum.photos/seed/event-2/600/400", alt: "Science Fair", hint: "science fair" },
    { id: 'g3', src: "https://picsum.photos/seed/event-3/600/400", alt: "Cultural Program", hint: "cultural program" },
    { id: 'g4', src: "https://picsum.photos/seed/event-4/600/400", alt: "Prize Giving Ceremony", hint: "prize giving" },
    { id: 'g5', src: "https://picsum.photos/seed/event-5/600/400", alt: "Art Competition", hint: "art competition" },
    { id: 'g6', src: "https://picsum.photos/seed/event-6/600/400", alt: "Graduation Day", hint: "graduation day" },
];

export default function GalleryPage() {
    const [galleryImages, setGalleryImages] = React.useState<GalleryImage[]>([]);
    const [loading, setLoading] = React.useState(true);
    const db = getFirestore(app);

    React.useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const docRef = doc(db, "settings", "landing_page");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().galleryImages?.length > 0) {
                    setGalleryImages(docSnap.data().galleryImages);
                } else {
                    setGalleryImages(defaultGalleryImages);
                }
            } catch (error) {
                console.error("Error fetching gallery images:", error);
                setGalleryImages(defaultGalleryImages);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [db]);

    const handleDownload = (imageUrl: string, filename: string) => {
        fetch(imageUrl, {
            headers: new Headers({
                'Origin': location.origin
            }),
            mode: 'cors'
        })
        .then(response => response.blob())
        .then(blob => {
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(blobUrl);
        })
        .catch(e => console.error("Could not download image: ", e));
    }


    return (
        <MainLayout>
            <div className="bg-gray-50/50">
                <div className="py-12">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold">ফটো ও ভিডিও গ্যালারী</CardTitle>
                            <CardDescription>আমাদের প্রতিষ্ঠানের কার্যক্রমের মুহূর্তগুলো দেখুন।</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="photos">
                                <TabsList className="grid w-full grid-cols-2 max-w-sm mx-auto">
                                    <TabsTrigger value="photos">ফটো</TabsTrigger>
                                    <TabsTrigger value="videos">ভিডিও</TabsTrigger>
                                </TabsList>
                                <TabsContent value="photos" className="mt-6">
                                    {loading ? (
                                        <div className="flex justify-center items-center h-64">
                                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {galleryImages.map((image) => (
                                                <div key={image.id} className="group relative overflow-hidden rounded-lg">
                                                    <Image
                                                        src={image.src}
                                                        alt={image.alt || 'Gallery Image'}
                                                        width={600}
                                                        height={400}
                                                        className="h-full w-full object-cover transform transition-transform duration-300 group-hover:scale-110"
                                                        data-ai-hint={image.hint}
                                                    />
                                                     <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4 items-start" />
                                                    <div className="absolute bottom-0 left-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <p className="text-white font-semibold">{image.alt}</p>
                                                    </div>
                                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                         <Button 
                                                            size="icon" 
                                                            variant="secondary"
                                                            onClick={() => handleDownload(image.src, image.alt || `gallery-image-${image.id}`)}
                                                         >
                                                            <Download className="h-5 w-5" />
                                                         </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>
                                <TabsContent value="videos" className="mt-6">
                                     <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                                        <p className="text-lg font-medium">শীঘ্রই আসছে</p>
                                        <p>ভিডিও গ্যালারী এখনো নির্মাণাধীন।</p>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    )
}
