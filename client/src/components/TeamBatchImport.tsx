import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, Check, FileSpreadsheet, Upload, X } from 'lucide-react'
import Papa from 'papaparse'

import type { CreateTeam } from '@/api/generated/types.gen'
import { useBatchImportTeams } from '@/hooks/useTeams'
import { cn } from '@/lib/utils'

interface TeamBatchImportProps {
    onSuccess?: () => void
    onCancel?: () => void
}

export function TeamBatchImport({ onSuccess, onCancel }: TeamBatchImportProps) {
    const { t } = useTranslation()
    const [step, setStep] = React.useState<1 | 2>(1)
    const [rawText, setRawText] = React.useState('')
    const [parsedHeaders, setParsedHeaders] = React.useState<string[]>([])
    const [parsedRows, setParsedRows] = React.useState<Record<string, string>[]>([])
    const [columnMapping, setColumnMapping] = React.useState<Record<string, string>>({})

    const TEAM_FIELDS = React.useMemo(
        () => [
            { key: 'name', label: t('teams.batchImport.fields.name', 'Team Name'), required: true },
            { key: 'number', label: t('teams.batchImport.fields.number', 'Team Number (#)') },
            { key: 'participants', label: t('teams.batchImport.fields.participants', 'Participants Count') },
        ],
        [t]
    )

    const batchMutation = useBatchImportTeams(onSuccess)

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
            TEAM_FIELDS.forEach((field) => {
                const matched = headers.find(
                    (h) =>
                        h.toLowerCase().trim() === field.key.toLowerCase() ||
                        h.toLowerCase().trim() === field.label.toLowerCase()
                )
                if (matched) initialMap[field.key] = matched
            })

            setColumnMapping(initialMap)
            setStep(2)
        }
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => parseRawInput(event.target?.result as string)
        reader.readAsText(file)
    }

    const transformedPayload = React.useMemo<CreateTeam[]>(() => {
        return parsedRows.map((row) => {
            const getValue = (key: string) => {
                const header = columnMapping[key]
                return header ? row[header] : undefined
            }

            const numVal = getValue('number')
            const partVal = getValue('participants')

            return {
                name: String(getValue('name') || '').trim(),
                number: numVal ? Number(numVal) : null,
                participants: partVal ? Number(partVal) : 0,
            }
        })
    }, [parsedRows, columnMapping])

    const handleImportSubmit = async () => {
        await batchMutation.mutateAsync({
            body: { teams: transformedPayload },
        })
    }

    return (
        <div className={cn('flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border-2 border-black bg-white shadow-xl isolate')}>
            <div className={cn('flex items-center justify-between border-b-2 border-black bg-white p-4')}>
                <div className={cn('flex items-center gap-2')}>
                    <FileSpreadsheet className={cn('h-5 w-5 text-black')} />
                    <div>
                        <h3 className={cn('text-base font-extrabold uppercase tracking-tight text-black')}>
                            {t('teams.batchImport.title', 'Batch Import Teams')}
                        </h3>
                        <p className={cn('mt-0.5 text-xs font-medium text-black/70')}>
                            {step === 1
                                ? t('teams.batchImport.subtitleStep1', 'Upload CSV/TSV or paste table data')
                                : t('teams.batchImport.subtitleStep2', 'Step 2: Map Columns ({{count}} rows detected)', {
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
                            {t('teams.batchImport.dropzoneLabel', 'Drop your CSV / TSV file here or click to browse')}
                        </span>
                        <input
                            type="file"
                            accept=".csv,.tsv,.txt"
                            onChange={handleFileUpload}
                            className={cn('hidden')}
                        />
                    </label>

                    <textarea
                        rows={6}
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        placeholder="name\tnumber\tparticipants\nTeam Alpha\t101\t5"
                        className={cn('w-full rounded-md border-2 border-black bg-white p-3 font-mono text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-black/20')}
                    />

                    <button
                        type="button"
                        disabled={!rawText.trim()}
                        onClick={() => parseRawInput(rawText)}
                        className={cn('flex items-center justify-center gap-2 rounded-md border-2 border-black bg-amber-400 py-2.5 text-xs font-extrabold text-black shadow-2xs hover:bg-amber-300 transition-colors disabled:opacity-50')}
                    >
                        {t('teams.batchImport.parseButton', 'Parse & Map Columns')} <ArrowRight className={cn('h-4 w-4')} />
                    </button>
                </div>
            )}

            {step === 2 && (
                <div className={cn('flex flex-col gap-4 p-4 text-xs font-bold text-black')}>
                    <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-3')}>
                        {TEAM_FIELDS.map((field) => (
                            <div key={field.key} className={cn('flex flex-col gap-1 rounded-md border border-black/20 bg-black/5 p-2.5')}>
                                <label className={cn('uppercase tracking-wider text-[10px] text-black/80 flex items-center justify-between')}>
                                    <span>
                                        {field.label} {field.required && <span className={cn('text-rose-600')}>*</span>}
                                    </span>
                                </label>
                                <select
                                    value={columnMapping[field.key] || ''}
                                    onChange={(e) => setColumnMapping({ ...columnMapping, [field.key]: e.target.value })}
                                    className={cn('rounded border-2 border-black bg-white px-2 py-1 text-xs font-bold text-black focus:outline-none')}
                                >
                                    <option value="">{t('teams.batchImport.ignoreField', '-- Ignore / Skip Field --')}</option>
                                    {parsedHeaders.map((header) => (
                                        <option key={header} value={header}>{header}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>

                    <div className={cn('flex items-center justify-between border-t-2 border-black pt-3')}>
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className={cn('flex items-center gap-1.5 rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-extrabold text-black hover:bg-black/5')}
                        >
                            <ArrowLeft className={cn('h-4 w-4')} /> {t('common.back', 'Back')}
                        </button>

                        <button
                            type="button"
                            disabled={batchMutation.isPending || !columnMapping.name}
                            onClick={handleImportSubmit}
                            className={cn('flex items-center gap-2 rounded-md border-2 border-black bg-emerald-400 px-5 py-2 text-xs font-extrabold text-black shadow-2xs hover:bg-emerald-300 disabled:opacity-50')}
                        >
                            <Check className={cn('h-4 w-4 stroke-[3]')} />
                            {t('teams.batchImport.submitButton', 'Import {{count}} Teams', { count: transformedPayload.length })}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
