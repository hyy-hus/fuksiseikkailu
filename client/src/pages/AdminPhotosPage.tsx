import { getListPhotosQueryKey, useUploadPhotos } from "@api/endpoints";
import { Button } from "@components/Button";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next"

import { GoTrash, GoUpload, GoImage, GoX } from "react-icons/go";

interface ImagePreview {
    file: File;
    object_url?: string;
    resized?: Blob;
    thumb?: Blob;
    valid: boolean;
}


type ImageStatus =
    | "pending"
    | "processing"
    | "thumbnail"
    | "uploading"
    | "finished"
    | "error";

interface Props {
    maxFileSizeMB?: number;
    maxWidth?: number;
    maxHeight?: number;
}

export function UploadForm({
    maxFileSizeMB = 10,
    maxWidth = 2000,
    maxHeight = 2000,
}: Props) {
    const [images, setImages] = useState<ImagePreview[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageStatuses, setImageStatuses] = useState<Map<string, ImageStatus>>(
        new Map()
    );
    const [uploaded, setUploaded] = useState<boolean>(false);


    async function setImageStatus(name: string, status: ImageStatus) {
        setImageStatuses((prev) => {
            const m = new Map(prev);
            m.set(name, status);
            return m;
        });
    }

    async function resizeImage(
        file: File,
        maxW: number,
        maxH: number
    ): Promise<Blob> {
        const img = document.createElement("img");
        const url = URL.createObjectURL(file);
        await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.src = url;
        });
        URL.revokeObjectURL(url);

        let { width, height } = img;
        const scale = Math.min(maxW / width, maxH / height, 1);
        width = Math.round(width * scale);
        height = Math.round(height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);

        return new Promise((resolve) =>
            canvas.toBlob((blob) => resolve(blob!), "image/webp", 0.9)
        );
    }

    async function handleFiles(files: FileList | null) {
        if (!files) {
            return;
        }

        const selected = Array.from(files);

        for (const file of selected) {
            let valid = true;

            if (!file.type.startsWith("image/")) {
                valid = false;
                setError(`${file.name} is not an image`);
            }
            else if (file.size > maxFileSizeMB * 1024 * 1024) {
                valid = false;
                setError(`${file.name} is too large`);
            }

            const status = valid ? "pending" : "error"
            setImageStatus(file.name, status as ImageStatus);

            setImages(prev => [...prev, { file, valid }]);

            if (valid) {
                processImage(file);
            }
        }
    }

    const queryClient = useQueryClient();
    const uploadPhoto = useUploadPhotos({
        mutation: {
            onSuccess: async () => {
                await queryClient.invalidateQueries({ queryKey: getListPhotosQueryKey() });
            }
        }
    });

    function removeImage(name: string) {
        setImages((prev) => prev.filter((img) => img.file.name !== name));
        setImageStatuses((prev) => {
            const m = new Map(prev);
            m.delete(name);
            return m;
        })
    }

    async function processImage(file: File) {
        try {
            await setImageStatus(file.name, "processing");

            const thumb = await resizeImage(file, 1000, 1000);
            const object_url = URL.createObjectURL(thumb);

            setImages(prev =>
                prev.map(img =>
                    img.file.name === file.name ? { ...img, thumb, object_url } : img
                )
            );

            await setImageStatus(file.name, "thumbnail");

            const resized = await resizeImage(file, maxWidth, maxHeight);

            setImages(prev =>
                prev.map(img =>
                    img.file.name === file.name ? { ...img, resized } : img
                )
            );

            await setImageStatus(file.name, "pending");
        } catch (err) {
            setError(`Failed to process ${file.name}`)
            setImageStatus(file.name, "error");
        }
    }

    async function uploadImages() {
        const ready = images.filter(
            (img) => img.valid && img.resized && img.thumb
        );

        const tasks = ready.map(async (img) => {
            const { file, resized, thumb } = img;
            setImageStatus(file.name, "uploading");

            const formData = new FormData();
            formData.append("original", file);
            formData.append(
                "resized",
                resized!,
                file.name.replace(/\.\w+$/, ".webp")
            );
            formData.append(
                "thumb",
                thumb!,
                "thumb-" + file.name.replace(/\.\w+$/, ".webp")
            );

            console.log("Hei")

            if (resized && thumb) {
              uploadPhoto.mutateAsync( { data: { original: file, resized: resized, thumb: thumb } } );
            }
        });

        await Promise.all(tasks);

        setUploaded(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        console.log("Uploading!")

        try {
            await uploadImages();
        } catch (err) {
            console.error(err);
            setError("Upload failed.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form className="UploadForm" onSubmit={handleSubmit}>


            {error && (
                <div className="error">
                    <span>Error: {error}</span>
                    <button
                        className="close-button"
                        onClick={() => setError("")}
                    >
                        <GoX />
                    </button>
                </div>
            )}

            <div className="grid grid-cols-3 gap-4">
                {images.map((img) => {
                    const status = imageStatuses.get(img.file.name);
                    const invalid = !img.valid || status === "error";

                    return (
                        <div
                            key={img.file.name}
                            className={`max-w-50 ${invalid ? "invalid" : ""}`}
                        >
                            <Button
                                variant="gray"
                                className="mt-2 ml-2"
                                onClick={() => removeImage(img.file.name)}
                            >
                                <GoTrash />
                            </Button>

                            {img.object_url && img.valid ? (
                                <img src={img.object_url} alt={img.file.name} />
                            ) : (
                                <div className="placeholder" />
                            )}

                            <div className="info flex flex-col gap-0">
                                <span className="name">{img.file.name}</span>
                                <span className="status">{imageStatuses.get(img.file.name)}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="messages">
                {uploaded && (
                    <>
                        <p>
                            Upload finished.                         </p>
                    </>
                )}
            </div>

            <div className="buttons">
                <label htmlFor="file-upload" className="flex flex-row gap-4">
                    <span className="flex gap-4"><span><GoImage /></span><span>Select images</span></span>
                <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ opacity: 0, position: "absolute", pointerEvents: "none" }}
                    onChange={(e) => handleFiles(e.target.files)}
                />
                </label>
                <Button disabled={loading || images.length === 0}
                  onClick={uploadImages}
                  >
                    {loading ? "Uploading..." : (<span className="icon-text"><span><GoUpload /></span><span>Upload</span></span>)}
                </Button>
            </div>
        </form>
    );
}

export function AdminPhotosPage() {
    const { t } = useTranslation();

    // const { selectedAdventure } = useAdventure();

    // const queryClient = useQueryClient();



    return (
        <div className="flex flex-col gap-4">
            <h2>{t("photos")}</h2>
            <UploadForm />
        </div>
    )
}

