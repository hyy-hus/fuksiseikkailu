import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
    ArrowLeft,
    ArrowRight,
    Check,
    FileSpreadsheet,
    Upload,
    X,
} from 'lucide-react'
import Papa from 'papaparse'

import { batchImportMutation } from '@/api/generated/@tanstack/react-query.gen'
import type { CheckpointCategory, CreateCheckpoint } from '@/api/generated/types.gen'
import { cn } from '@/lib/utils'

interface CheckpointBatchImportProps {
    onSuccess?: () => void
    onCancel?: () => void
}

export function CheckpointBatchImport({ onSuccess, onCancel }: CheckpointBatchImportProps) {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const [step, setStep] = React.useState<1 | 2>(1)
    const [rawText, setRawText] = React.useState('')
    const [parsedHeaders, setParsedHeaders] = React.useState<string[]>([])
    const [parsedRows, setParsedRows] = React.useState<Record<string, string>[]>([])

    const [columnMapping, setColumnMapping] = React.useState<Record<string, string>>({})

    const CHECKPOINT_FIELDS: { key: keyof CreateCheckpoint; label: string; required?: boolean }[] = React.useMemo(
        () => [
            { key: 'name', label: t('batchImport.fields.name', 'Checkpoint Name'), required: true },
            { key: 'number', label: t('batchImport.fields.number', 'Number (#)') },
            { key: 'category', label: t('batchImport.fields.category', 'Category') },
            { key: 'location_name', label: t('batchImport.fields.locationName', 'Location Name') },
            { key: 'latitude', label: t('batchImport.fields.latitude', 'Latitude') },
            { key: 'longitude', label: t('batchImport.fields.longitude', 'Longitude') },
            { key: 'lanes', label: t('batchImport.fields.lanes', 'Lanes') },
            { key: 'checkpoint_description', label: t('batchImport.fields.description', 'Description') },
            { key: 'contact_person', label: t('batchImport.fields.contactPerson', 'Contact Person') },
            { key: 'contact_email', label: t('batchImport.fields.contactEmail', 'Contact Email') },
            { key: 'contact_phone', label: t('batchImport.fields.contactPhone', 'Contact Phone') },
        ],
        [t]
    )

    const batchMutation = useMutation({
        ...batchImportMutation(),
        mutationKey: ['checkpoints', 'batchCreate'],
        meta: {
            loadingMessage: t('batchImport.meta.loading', 'Importing checkpoints batch...'),
            successMessage: (data: any) =>
                t('batchImport.meta.success', 'Successfully imported {{count}} checkpoints!', {
                    count: Array.isArray(data) ? data.length : '',
                }),
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['checkpoints'] })
            onSuccess?.()
        },
    })

    const parseRawInput = (content: string) => {
        if (!content.trim()) return

        const results = Papa.parse<Record<string, string>>(content, {
            header: true,
            skipEmptyLines: true,
        })

        if (results.meta.fields && results.data.length > 0) {
            const headers = results.meta.fields
            setParsedHeaders(headers)
            setParsedRows(results.data)

            const initialMap: Record<string, string> = {}
            CHECKPOINT_FIELDS.forEach((field) => {
                const matched = headers.find(
                    (h) =>
                        h.toLowerCase().trim() === field.key.toLowerCase() ||
                        h.toLowerCase().trim() === field.label.toLowerCase()
                )
                if (matched) {
                    initialMap[field.key] = matched
                }
            })

            setColumnMapping(initialMap)
            setStep(2)
        }
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            const text = event.target?.result as string
            parseRawInput(text)
        }
        reader.readAsText(file)
    }

    const transformedPayload = React.useMemo<CreateCheckpoint[]>(() => {
        return parsedRows.map((row) => {
            const getValue = (key: keyof CreateCheckpoint) => {
                const header = columnMapping[key]
                return header ? row[header] : undefined
            }

            const numVal = getValue('number')
            const latVal = getValue('latitude')
            const lngVal = getValue('longitude')
            const lanesVal = getValue('lanes')

            return {
                name: String(getValue('name') || '').trim(),
                number: numVal ? Number(numVal) : null,
                category: (getValue('category')?.toLowerCase() as CheckpointCategory) || 'subject',
                location_name: getValue('location_name')?.trim() || null,
                latitude: latVal ? Number(latVal) : 0,
                longitude: lngVal ? Number(lngVal) : 0,
                lanes: lanesVal ? Number(lanesVal) : 1,
                accessible: true,
                checkpoint_description: getValue('checkpoint_description')?.trim() || null,
                contact_person: getValue('contact_person')?.trim() || null,
                contact_email: getValue('contact_email')?.trim() || null,
                contact_phone: getValue('contact_phone')?.trim() || null,
                url: null,
                cancelled: false,
            }
        })
    }, [parsedRows, columnMapping])

    const handleImportSubmit = async () => {
        await batchMutation.mutateAsync({
            body: {
                checkpoints: transformedPayload,
            },
        })
    }

    return (
        <div className={cn('flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border-2 border-black bg-white shadow-xl isolate')}>
            {/* Header */}
            <div className={cn('flex items-center justify-between border-b-2 border-black bg-white p-4')}>
                <div className={cn('flex items-center gap-2')}>
                    <FileSpreadsheet className={cn('h-5 w-5 text-black')} />
                    <div>
                        <h3 className={cn('text-base font-extrabold uppercase tracking-tight text-black')}>
                            {t('batchImport.title', 'Batch Import Checkpoints')}
                        </h3>
                        <p className={cn('mt-0.5 text-xs font-medium text-black/70')}>
                            {step === 1
                                ? t('batchImport.subtitleStep1', 'Upload CSV/TSV or paste table data')
                                : t('batchImport.subtitleStep2', 'Step 2: Map Columns ({{count}} rows detected)', {
                                    count: parsedRows.length,
                                })}
                        </p>
                    </div>
                </div>

                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className={cn('flex h-7 w-7 items-center justify-center rounded-md border-2 border-black bg-white hover:bg-black/10 transition-colors')}
                    >
                        <X className={cn('h-4 w-4 text-black')} />
                    </button>
                )}
            </div>

            {/* STEP 1: Upload / Paste */}
            {step === 1 && (
                <div className={cn('flex flex-col gap-4 p-4 text-xs font-bold text-black')}>
                    <label className={cn('flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-black bg-amber-50/50 p-6 cursor-pointer hover:bg-amber-100/50 transition-colors')}>
                        <Upload className={cn('h-8 w-8 text-black')} />
                        <span className={cn('text-xs font-black uppercase tracking-wide text-black')}>
                            {t('batchImport.dropzoneLabel', 'Drop your CSV / TSV file here or click to browse')}
                        </span>
                        <input
                            type="file"
                            accept=".csv,.tsv,.txt"
                            onChange={handleFileUpload}
                            className={cn('hidden')}
                        />
                    </label>

                    <div className={cn('flex items-center justify-center gap-2 text-black/40')}>
                        <div className={cn('h-0.5 flex-1 bg-black/10')} />
                        <span className={cn('text-[10px] font-extrabold uppercase')}>
                            {t('batchImport.orSeparator', 'OR PASTE RAW TABULAR DATA')}
                        </span>
                        <div className={cn('h-0.5 flex-1 bg-black/10')} />
                    </div>

                    <textarea
                        rows={6}
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        placeholder={t(
                            'batchImport.textareaPlaceholder',
                            `Name\tNumber\tCategory\tLocation\nCheckpoint A\t1\tsubject\tCourtyard A\nCheckpoint B\t2\tnation\tHall B`
                        )}
                        className={cn('w-full rounded-md border-2 border-black bg-white p-3 font-mono text-xs font-bold text-black placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-black/20')}
                    />

                    <button
                        type="button"
                        disabled={!rawText.trim()}
                        onClick={() => parseRawInput(rawText)}
                        className={cn('flex items-center justify-center gap-2 rounded-md border-2 border-black bg-amber-400 py-2.5 text-xs font-extrabold text-black shadow-2xs hover:bg-amber-300 transition-colors disabled:opacity-50')}
                    >
                        {t('batchImport.parseButton', 'Parse & Map Columns')} <ArrowRight className={cn('h-4 w-4')} />
                    </button>
                </div>
            )}

            {/* STEP 2: Column Mapping */}
            {step === 2 && (
                <div className={cn('flex flex-col gap-4 p-4 text-xs font-bold text-black')}>
                    <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1')}>
                        {CHECKPOINT_FIELDS.map((field) => (
                            <div
                                key={field.key}
                                className={cn('flex flex-col gap-1 rounded-md border border-black/20 bg-black/5 p-2.5')}
                            >
                                <label className={cn('uppercase tracking-wider text-[10px] text-black/80 flex items-center justify-between')}>
                                    <span>
                                        {field.label} {field.required && <span className={cn('text-rose-600')}>*</span>}
                                    </span>
                                    <span className={cn('font-mono text-[9px] text-black/50')}>{field.key}</span>
                                </label>

                                <select
                                    value={columnMapping[field.key] || ''}
                                    onChange={(e) =>
                                        setColumnMapping({ ...columnMapping, [field.key]: e.target.value })
                                    }
                                    className={cn('rounded border-2 border-black bg-white px-2 py-1 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-black/20')}
                                >
                                    <option value="">{t('batchImport.ignoreField', '-- Ignore / Skip Field --')}</option>
                                    {parsedHeaders.map((header) => (
                                        <option key={header} value={header}>
                                            {header}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>

                    <div className={cn('flex items-center justify-between border-t-2 border-black pt-3')}>
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className={cn('flex items-center gap-1.5 rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-extrabold text-black hover:bg-black/5 transition-colors')}
                        >
                            <ArrowLeft className={cn('h-4 w-4')} /> {t('common.back', 'Back')}
                        </button>

                        <button
                            type="button"
                            disabled={batchMutation.isPending || !columnMapping.name}
                            onClick={handleImportSubmit}
                            className={cn('flex items-center gap-2 rounded-md border-2 border-black bg-emerald-400 px-5 py-2 text-xs font-extrabold text-black shadow-2xs hover:bg-emerald-300 transition-colors disabled:opacity-50')}
                        >
                            <Check className={cn('h-4 w-4 stroke-[3]')} />{' '}
                            {t('batchImport.submitButton', 'Import {{count}} Checkpoints', {
                                count: transformedPayload.length,
                            })}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
