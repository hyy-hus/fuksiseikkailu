import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
    ArrowLeft,
    ArrowRight,
    Check,
    FileSpreadsheet,
    Upload,
    X,
} from 'lucide-react'
import Papa from 'papaparse'

import type { CheckpointCategory, CreateCheckpoint } from '@/api/generated/types.gen'
import { useBatchImportCheckpoints } from '@/hooks/useCheckpoints'
import { cn } from '@/lib/utils'

interface CheckpointBatchImportProps {
    onSuccess?: () => void
    onCancel?: () => void
}

type ExtendedFieldKey =
    | keyof CreateCheckpoint
    | 'description_fi'
    | 'description_sv'
    | 'description_en'
    | 'org_description_fi'
    | 'org_description_sv'
    | 'org_description_en'

export function CheckpointBatchImport({ onSuccess, onCancel }: CheckpointBatchImportProps) {
    const { t } = useTranslation()
    const [step, setStep] = React.useState<1 | 2>(1)
    const [rawText, setRawText] = React.useState('')
    const [parsedHeaders, setParsedHeaders] = React.useState<string[]>([])
    const [parsedRows, setParsedRows] = React.useState<Record<string, string>[]>([])

    const [columnMapping, setColumnMapping] = React.useState<Record<string, string>>({})

    const CHECKPOINT_FIELDS: { key: ExtendedFieldKey; label: string; required?: boolean }[] = React.useMemo(
        () => [
            { key: 'name', label: t('batchImport.fields.name', 'Checkpoint Name'), required: true },
            { key: 'number', label: t('batchImport.fields.number', 'Number (#)') },
            { key: 'category', label: t('batchImport.fields.category', 'Category') },
            { key: 'location_name', label: t('batchImport.fields.locationName', 'Location Name') },
            { key: 'latitude', label: t('batchImport.fields.latitude', 'Latitude') },
            { key: 'longitude', label: t('batchImport.fields.longitude', 'Longitude') },
            { key: 'lanes', label: t('batchImport.fields.lanes', 'Lanes') },
            { key: 'url', label: t('batchImport.fields.url', 'URL / Website') },
            { key: 'requirements', label: t('batchImport.fields.requirements', 'Requirements') },
            { key: 'execution', label: t('batchImport.fields.execution', 'Execution Guidelines') },

            // Public Description Options
            { key: 'checkpoint_description', label: t('batchImport.fields.description', 'Public Description (Raw/General)') },
            { key: 'description_fi', label: t('batchImport.fields.descriptionFi', 'Public Description (FI)') },
            { key: 'description_sv', label: t('batchImport.fields.descriptionSv', 'Public Description (SV)') },
            { key: 'description_en', label: t('batchImport.fields.descriptionEn', 'Public Description (EN)') },

            // Organizer Description Options
            { key: 'org_description', label: t('batchImport.fields.orgDescription', 'Organizer Description (Raw/General)') },
            { key: 'org_description_fi', label: t('batchImport.fields.orgDescriptionFi', 'Organizer Description (FI)') },
            { key: 'org_description_sv', label: t('batchImport.fields.orgDescriptionSv', 'Organizer Description (SV)') },
            { key: 'org_description_en', label: t('batchImport.fields.orgDescriptionEn', 'Organizer Description (EN)') },

            // Contact Info
            { key: 'contact_person', label: t('batchImport.fields.contactPerson', 'Contact Person') },
            { key: 'contact_email', label: t('batchImport.fields.contactEmail', 'Contact Email') },
            { key: 'contact_phone', label: t('batchImport.fields.contactPhone', 'Contact Phone') },
        ],
        [t]
    )

    const batchMutation = useBatchImportCheckpoints(onSuccess)

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
            const getValue = (key: ExtendedFieldKey) => {
                const header = columnMapping[key]
                return header ? row[header] : undefined
            }

            const numVal = getValue('number')
            const latVal = getValue('latitude')
            const lngVal = getValue('longitude')
            const lanesVal = getValue('lanes')

            // 1. Build JSON object for localized public descriptions
            const descFi = getValue('description_fi')?.trim()
            const descSv = getValue('description_sv')?.trim()
            const descEn = getValue('description_en')?.trim()
            const descRaw = getValue('checkpoint_description')?.trim()

            let descriptionObj: Record<string, string> | string | null = null
            if (descFi || descSv || descEn) {
                const mapObj: Record<string, string> = {}
                if (descFi) mapObj.fi = descFi
                if (descSv) mapObj.sv = descSv
                if (descEn) mapObj.en = descEn
                descriptionObj = mapObj
            } else if (descRaw) {
                descriptionObj = descRaw
            }

            // 2. Build JSON object for localized organizer descriptions
            const orgDescFi = getValue('org_description_fi')?.trim()
            const orgDescSv = getValue('org_description_sv')?.trim()
            const orgDescEn = getValue('org_description_en')?.trim()
            const orgDescRaw = getValue('org_description')?.trim()

            let orgDescriptionObj: Record<string, string> | string | null = null
            if (orgDescFi || orgDescSv || orgDescEn) {
                const mapObj: Record<string, string> = {}
                if (orgDescFi) mapObj.fi = orgDescFi
                if (orgDescSv) mapObj.sv = orgDescSv
                if (orgDescEn) mapObj.en = orgDescEn
                orgDescriptionObj = mapObj
            } else if (orgDescRaw) {
                orgDescriptionObj = orgDescRaw
            }

            return {
                name: String(getValue('name') || '').trim(),
                number: numVal ? Number(numVal) : null,
                category: (getValue('category')?.toLowerCase() as CheckpointCategory) || 'subject',
                location_name: getValue('location_name')?.trim() || null,
                latitude: latVal ? Number(latVal) : 0,
                longitude: lngVal ? Number(lngVal) : 0,
                lanes: lanesVal ? Number(lanesVal) : 1,
                accessible: true,
                checkpoint_description: descriptionObj,
                org_description: orgDescriptionObj,
                requirements: getValue('requirements')?.trim() || null,
                execution: getValue('execution')?.trim() || null,
                contact_person: getValue('contact_person')?.trim() || null,
                contact_email: getValue('contact_email')?.trim() || null,
                contact_phone: getValue('contact_phone')?.trim() || null,
                url: getValue('url')?.trim() || null,
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
                            `Name\tNumber\tdescription_fi\trequirements\texecution\nCheckpoint A\t1\tSuomeksi kuvaus\tTarvikkeet\tSuoritusohjeet`
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
