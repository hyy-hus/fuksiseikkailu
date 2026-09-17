import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, CheckCircle2, Loader2, UploadCloud, X } from 'lucide-react'

import { useCreatePhoto } from '@/hooks/usePhotos'
import { uploadPhotoToS3 } from '@/lib/s3Uploader'

interface FileItem {
    id: string
    file: File
    status: 'idle' | 'uploading' | 'done' | 'error'
    progress: number
    error?: string
}

interface PhotoUploadModalProps {
    isOpen: boolean
    onClose: () => void
}

export function PhotoUploadModal({ isOpen, onClose }: PhotoUploadModalProps) {
    const { t } = useTranslation()
    const [files, setFiles] = React.useState<FileItem[]>([])
    const [isUploading, setIsUploading] = React.useState(false)
    const createPhoto = useCreatePhoto()

    if (!isOpen) return null

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return
        const selectedFiles = Array.from(e.target.files).map((file) => ({
            id: Math.random().toString(36).substring(2, 9),
            file,
            status: 'idle' as const,
            progress: 0,
        }))
        setFiles((prev) => [...prev, ...selectedFiles])
    }

    const removeFile = (id: string) => {
        setFiles((prev) => prev.filter((item) => item.id !== id))
    }

    const handleStartUpload = async () => {
        setIsUploading(true)

        for (const item of files) {
            if (item.status === 'done') continue

            setFiles((prev) =>
                prev.map((f) => (f.id === item.id ? { ...f, status: 'uploading', progress: 20 } : f))
            )

            try {
                // 1. Direct S3 upload
                const { key } = await uploadPhotoToS3(item.file, (pct) => {
                    setFiles((prev) =>
                        prev.map((f) => (f.id === item.id ? { ...f, progress: Math.min(pct, 90) } : f))
                    )
                })

                // 2. Database metadata payload strictly matching CreatePhotoPayload
                await createPhoto.mutateAsync({
                    body: {
                        s3_key: key,
                        published: true,
                    },
                })

                setFiles((prev) =>
                    prev.map((f) => (f.id === item.id ? { ...f, status: 'done', progress: 100 } : f))
                )
            } catch (err: unknown) {
                const errorMsg = err instanceof Error ? err.message : 'Upload failed'
                setFiles((prev) =>
                    prev.map((f) => (f.id === item.id ? { ...f, status: 'error', error: errorMsg } : f))
                )
            }
        }

        setIsUploading(false)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="flex w-full max-w-xl flex-col overflow-hidden rounded-xl border-2 border-black bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-black bg-amber-400 p-4">
                    <h3 className="text-base font-extrabold uppercase tracking-tight text-black flex items-center gap-2">
                        <UploadCloud className="h-5 w-5" />
                        {t('photos.uploadTitle', 'Batch Upload Photos')}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isUploading}
                        className="rounded-md border-2 border-black bg-white p-1 hover:bg-black/10 cursor-pointer disabled:opacity-50"
                    >
                        <X className="h-4 w-4 text-black" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex flex-col gap-4 p-4 max-h-[60vh] overflow-y-auto">
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-black bg-amber-50/50 p-6 text-center hover:bg-amber-100/50 transition-colors">
                        <UploadCloud className="h-8 w-8 text-black/60 mb-2" />
                        <span className="text-xs font-black uppercase text-black">
                            {t('photos.selectFiles', 'Click or drag photos to upload')}
                        </span>
                        <span className="text-[10px] font-bold text-black/60 mt-0.5">
                            JPG, PNG, WEBP up to 10MB each
                        </span>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileSelect}
                            disabled={isUploading}
                            className="hidden"
                        />
                    </label>

                    {files.length > 0 && (
                        <div className="flex flex-col gap-2 divide-y border-t-2 border-black/10 pt-2">
                            {files.map((item) => (
                                <div key={item.id} className="flex items-center justify-between gap-3 pt-2">
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="text-xs font-bold text-black truncate">{item.file.name}</span>
                                        <span className="text-[10px] text-black/50 font-medium">
                                            {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {item.status === 'uploading' && (
                                            <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                                        )}
                                        {item.status === 'done' && (
                                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                        )}
                                        {item.status === 'error' && (
                                            <AlertCircle className="h-4 w-4 text-rose-600" />
                                        )}
                                        {!isUploading && item.status !== 'done' && (
                                            <button
                                                type="button"
                                                onClick={() => removeFile(item.id)}
                                                className="text-black/40 hover:text-black cursor-pointer"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 border-t-2 border-black p-4 bg-white">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isUploading}
                        className="rounded-md border-2 border-black bg-white px-4 py-2 text-xs font-extrabold text-black hover:bg-black/5 cursor-pointer disabled:opacity-50"
                    >
                        {t('common.cancel', 'Cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={handleStartUpload}
                        disabled={isUploading || files.length === 0}
                        className="flex items-center gap-1.5 rounded-md border-2 border-black bg-emerald-400 px-5 py-2 text-xs font-black uppercase text-black shadow-2xs hover:bg-emerald-300 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        {isUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <UploadCloud className="h-4 w-4" />
                        )}
                        {t('photos.uploadAction', 'Start Upload ({{count}})', { count: files.length })}
                    </button>
                </div>
            </div>
        </div>
    )
}
