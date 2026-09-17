import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from '@tanstack/react-form'
import { AlertCircle, Globe, Loader2, Save, X } from 'lucide-react'

import type { Checkpoint, CheckpointCategory, CreateCheckpoint, UpdateCheckpoint } from '@/api/generated/types.gen'
import { useCreateCheckpoint, useUpdateCheckpoint } from '@/hooks/useCheckpoints'
import { cn } from '@/lib/utils'
import { getApiErrorMessage } from '@/lib/errors'

interface CheckpointFormProps {
    initialData?: Checkpoint | null
    onSuccess?: () => void
    onCancel?: () => void
}

type LangTab = 'fi' | 'sv' | 'en'

function parseLocalizedField(value: unknown): { fi: string; sv: string; en: string } {
    if (!value) return { fi: '', sv: '', en: '' }

    if (typeof value === 'object' && value !== null) {
        const raw = value as Record<string, string>
        return { fi: raw.fi || '', sv: raw.sv || '', en: raw.en || '' }
    }

    if (typeof value === 'string') {
        const trimmed = value.trim()
        if (trimmed.startsWith('{')) {
            try {
                const parsed = JSON.parse(trimmed)
                return { fi: parsed.fi || '', sv: parsed.sv || '', en: parsed.en || '' }
            } catch {
                return { fi: trimmed, sv: '', en: '' }
            }
        }
        return { fi: trimmed, sv: '', en: '' }
    }

    return { fi: '', sv: '', en: '' }
}

export function CheckpointForm({ initialData, onSuccess, onCancel }: CheckpointFormProps) {
    const { t, i18n } = useTranslation()
    const isEditing = Boolean(initialData)

    const [descLang, setDescLang] = React.useState<LangTab>(
        (i18n.language as LangTab) || 'fi'
    )
    const [orgLang, setOrgLang] = React.useState<LangTab>(
        (i18n.language as LangTab) || 'fi'
    )

    // Localized content state
    const [description, setDescription] = React.useState<{ fi: string; sv: string; en: string }>(() =>
        parseLocalizedField(initialData?.checkpoint_description)
    )
    const [orgDescription, setOrgDescription] = React.useState<{ fi: string; sv: string; en: string }>(() =>
        parseLocalizedField(initialData?.org_description)
    )

    const CATEGORY_OPTIONS: { label: string; value: CheckpointCategory }[] = React.useMemo(
        () => [
            { label: t('checkpointForm.categories.subject', 'Subject / Ainejärjestö'), value: 'subject' },
            { label: t('checkpointForm.categories.nation', 'Nation / Osakunta'), value: 'nation' },
            { label: t('checkpointForm.categories.hobby', 'Hobby / Kerho'), value: 'hobby' },
            { label: t('checkpointForm.categories.hyy', 'HYY'), value: 'hyy' },
            { label: t('checkpointForm.categories.yliopisto', 'Yliopisto'), value: 'yliopisto' },
            { label: t('checkpointForm.categories.other', 'Other / Muu'), value: 'other' },
            { label: t('checkpointForm.categories.marker', 'Marker'), value: 'marker' },
        ],
        [t]
    )

    const createMutation = useCreateCheckpoint(onSuccess)
    const updateMutation = useUpdateCheckpoint(initialData?.id, onSuccess)

    const isSubmitting = createMutation.isPending || updateMutation.isPending
    const activeError = createMutation.error || updateMutation.error
    const errorMessage = getApiErrorMessage(activeError)

    const form = useForm({
        defaultValues: {
            name: initialData?.name ?? '',
            number: initialData?.number ?? ('' as number | string),
            category: (initialData?.category ?? 'subject') as CheckpointCategory,
            location_name: initialData?.location_name ?? '',
            latitude: initialData?.latitude ?? ('' as number | string),
            longitude: initialData?.longitude ?? ('' as number | string),
            lanes: initialData?.lanes ?? 1,
            accessible: initialData?.accessible ?? true,
            contact_person: initialData?.contact_person ?? '',
            contact_email: initialData?.contact_email ?? '',
            contact_phone: initialData?.contact_phone ?? '',
            url: initialData?.url ?? '',
            execution: initialData?.execution ?? '',
            requirements: initialData?.requirements ?? '',
            cancelled: initialData?.cancelled ?? false,
        },
        onSubmit: async ({ value }) => {
            const hasDesc = Boolean(description.fi.trim() || description.sv.trim() || description.en.trim())
            const serializedDescription = hasDesc ? JSON.stringify(description) : null

            const hasOrgDesc = Boolean(orgDescription.fi.trim() || orgDescription.sv.trim() || orgDescription.en.trim())
            const serializedOrgDescription = hasOrgDesc ? JSON.stringify(orgDescription) : null

            const payload: CreateCheckpoint | UpdateCheckpoint = {
                name: value.name.trim(),
                number: value.number !== '' ? Number(value.number) : null,
                category: value.category,
                location_name: value.location_name.trim() || null,
                latitude: value.latitude !== '' ? Number(value.latitude) : 0,
                longitude: value.longitude !== '' ? Number(value.longitude) : 0,
                lanes: Number(value.lanes) || 1,
                accessible: value.accessible,
                checkpoint_description: serializedDescription,
                org_description: serializedOrgDescription,
                contact_person: value.contact_person.trim() || null,
                contact_email: value.contact_email.trim() || null,
                contact_phone: value.contact_phone.trim() || null,
                url: value.url.trim() || null,
                execution: value.execution.trim() || null,
                requirements: value.requirements.trim() || null,
                cancelled: value.cancelled,
            }

            if (isEditing && initialData) {
                await updateMutation.mutateAsync({
                    path: { id: initialData.id },
                    body: payload as UpdateCheckpoint,
                })
            } else {
                await createMutation.mutateAsync({
                    body: payload as CreateCheckpoint,
                })
            }
        },
    })

    return (
        <div className={cn('flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border-2 border-black bg-white shadow-xl isolate')}>
            <div className={cn('flex items-center justify-between border-b-2 border-black p-4 bg-amber-400 shrink-0')}>
                <div>
                    <h3 className={cn('text-base font-extrabold uppercase tracking-tight text-black')}>
                        {isEditing
                            ? t('checkpointForm.titleEdit', 'Edit Checkpoint: {{name}}', { name: initialData?.name })
                            : t('checkpointForm.titleCreate', 'Create New Checkpoint')}
                    </h3>
                    <p className={cn('mt-0.5 text-xs font-medium text-black/80')}>
                        {isEditing
                            ? t('checkpointForm.subtitleEdit', 'Update operational info, contact details, or location coordinates.')
                            : t('checkpointForm.subtitleCreate', 'Add a new checkpoint to the event database.')}
                    </p>
                </div>

                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className={cn('flex h-7 w-7 items-center justify-center rounded-md border-2 border-black bg-white hover:bg-black/10 transition-colors cursor-pointer')}
                    >
                        <X className={cn('h-4 w-4 text-black')} />
                    </button>
                )}
            </div>

            {activeError && (
                <div className={cn('m-4 flex items-start gap-3 rounded-md border-2 border-black bg-rose-100 p-3 text-xs font-bold text-black shadow-2xs')}>
                    <AlertCircle className={cn('h-5 w-5 shrink-0 text-rose-600 stroke-[2.5]')} />
                    <div className={cn('flex-1 min-w-0')}>
                        <p className={cn('font-black uppercase tracking-wide text-rose-950')}>
                            {t('checkpointForm.submissionFailed', 'Submission Failed')}
                        </p>
                        <p className={cn('mt-0.5 font-medium leading-relaxed text-rose-900')}>
                            {errorMessage}
                        </p>
                    </div>
                </div>
            )}

            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    form.handleSubmit()
                }}
                className={cn('flex flex-col gap-4 p-4 text-xs font-bold text-black')}
            >
                {/* Basic Info: Name & Number */}
                <div className={cn('grid grid-cols-1 sm:grid-cols-3 gap-3')}>
                    <form.Field
                        name="name"
                        validators={{
                            onChange: ({ value }) => (!value.trim() ? t('checkpointForm.validation.nameRequired', 'Name is required') : undefined),
                        }}
                    >
                        {(field) => (
                            <div className={cn('sm:col-span-2 flex flex-col gap-1')}>
                                <label htmlFor={field.name} className={cn('uppercase tracking-wider text-[10px] text-black/70')}>
                                    {t('checkpointForm.labels.name', 'Checkpoint Name *')}
                                </label>
                                <input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder={t('checkpointForm.placeholders.name', 'e.g. OIH Räp-Räp')}
                                    className={cn(
                                        'rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-bold text-black placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-black/20',
                                        field.state.meta.errors.length > 0 && 'border-rose-600 bg-rose-50'
                                    )}
                                />
                                {field.state.meta.errors[0] && (
                                    <span className={cn('text-[10px] text-rose-600 font-extrabold')}>
                                        {field.state.meta.errors[0]}
                                    </span>
                                )}
                            </div>
                        )}
                    </form.Field>

                    <form.Field name="number">
                        {(field) => (
                            <div className={cn('flex flex-col gap-1')}>
                                <label htmlFor={field.name} className={cn('uppercase tracking-wider text-[10px] text-black/70')}>
                                    {t('checkpointForm.labels.number', 'Number (#)')}
                                </label>
                                <input
                                    id={field.name}
                                    name={field.name}
                                    type="number"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder={t('checkpointForm.placeholders.number', 'e.g. 12')}
                                    className={cn('rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-bold text-black placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-black/20')}
                                />
                            </div>
                        )}
                    </form.Field>
                </div>

                {/* Category & Location Name */}
                <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-3')}>
                    <form.Field name="category">
                        {(field) => (
                            <div className={cn('flex flex-col gap-1')}>
                                <label htmlFor={field.name} className={cn('uppercase tracking-wider text-[10px] text-black/70')}>
                                    {t('checkpointForm.labels.category', 'Category')}
                                </label>
                                <select
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.value as CheckpointCategory)}
                                    className={cn('rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-black/20')}
                                >
                                    {CATEGORY_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </form.Field>

                    <form.Field name="location_name">
                        {(field) => (
                            <div className={cn('flex flex-col gap-1')}>
                                <label htmlFor={field.name} className={cn('uppercase tracking-wider text-[10px] text-black/70')}>
                                    {t('checkpointForm.labels.locationName', 'Location Name')}
                                </label>
                                <input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder={t('checkpointForm.placeholders.locationName', 'e.g. Topelia Courtyard')}
                                    className={cn('rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-bold text-black placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-black/20')}
                                />
                            </div>
                        )}
                    </form.Field>
                </div>

                {/* Coordinates & Lanes */}
                <div className={cn('grid grid-cols-3 gap-3')}>
                    <form.Field name="latitude">
                        {(field) => (
                            <div className={cn('flex flex-col gap-1')}>
                                <label htmlFor={field.name} className={cn('uppercase tracking-wider text-[10px] text-black/70')}>
                                    {t('checkpointForm.labels.latitude', 'Latitude')}
                                </label>
                                <input
                                    id={field.name}
                                    name={field.name}
                                    type="number"
                                    step="any"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder={t('checkpointForm.placeholders.latitude', '60.1708')}
                                    className={cn('rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-bold text-black placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-black/20')}
                                />
                            </div>
                        )}
                    </form.Field>

                    <form.Field name="longitude">
                        {(field) => (
                            <div className={cn('flex flex-col gap-1')}>
                                <label htmlFor={field.name} className={cn('uppercase tracking-wider text-[10px] text-black/70')}>
                                    {t('checkpointForm.labels.longitude', 'Longitude')}
                                </label>
                                <input
                                    id={field.name}
                                    name={field.name}
                                    type="number"
                                    step="any"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder={t('checkpointForm.placeholders.longitude', '24.9502')}
                                    className={cn('rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-bold text-black placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-black/20')}
                                />
                            </div>
                        )}
                    </form.Field>

                    <form.Field name="lanes">
                        {(field) => (
                            <div className={cn('flex flex-col gap-1')}>
                                <label htmlFor={field.name} className={cn('uppercase tracking-wider text-[10px] text-black/70')}>
                                    {t('checkpointForm.labels.lanes', 'Lanes')}
                                </label>
                                <input
                                    id={field.name}
                                    name={field.name}
                                    type="number"
                                    min={1}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(Number(e.target.value))}
                                    className={cn('rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-black/20')}
                                />
                            </div>
                        )}
                    </form.Field>
                </div>

                {/* Operational Info: Execution & Requirements */}
                <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-black/10')}>
                    <form.Field name="execution">
                        {(field) => (
                            <div className={cn('flex flex-col gap-1')}>
                                <label htmlFor={field.name} className={cn('uppercase tracking-wider text-[10px] text-black/70')}>
                                    {t('checkpointForm.labels.execution', 'Execution / Toteutus')}
                                </label>
                                <input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder={t('checkpointForm.placeholders.execution', 'e.g. Physical activity / Juoksukilpailu')}
                                    className={cn('rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-bold text-black placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-black/20')}
                                />
                            </div>
                        )}
                    </form.Field>

                    <form.Field name="requirements">
                        {(field) => (
                            <div className={cn('flex flex-col gap-1')}>
                                <label htmlFor={field.name} className={cn('uppercase tracking-wider text-[10px] text-black/70')}>
                                    {t('checkpointForm.labels.requirements', 'Requirements / Vaatimukset')}
                                </label>
                                <input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder={t('checkpointForm.placeholders.requirements', 'e.g. Bring own props / Omat varusteet')}
                                    className={cn('rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-bold text-black placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-black/20')}
                                />
                            </div>
                        )}
                    </form.Field>
                </div>

                {/* Multi-language Public Description Tabs */}
                <div className={cn('flex flex-col gap-2 pt-2 border-t-2 border-black/10')}>
                    <div className={cn('flex items-center justify-between')}>
                        <span className={cn('uppercase tracking-wider text-[10px] text-black/70 flex items-center gap-1')}>
                            <Globe className="h-3 w-3" />
                            {t('checkpointForm.labels.description', 'Public Description & Instructions')}
                        </span>
                        <div className={cn('flex items-center gap-1 rounded-md border-2 border-black bg-black/5 p-0.5')}>
                            {(['fi', 'sv', 'en'] as LangTab[]).map((lang) => (
                                <button
                                    key={lang}
                                    type="button"
                                    onClick={() => setDescLang(lang)}
                                    className={cn(
                                        'rounded px-2.5 py-1 text-[10px] font-black uppercase transition-colors cursor-pointer',
                                        descLang === lang
                                            ? 'bg-amber-400 text-black border border-black shadow-2xs'
                                            : 'text-black/60 hover:text-black'
                                    )}
                                >
                                    {lang}
                                </button>
                            ))}
                        </div>
                    </div>

                    <textarea
                        rows={3}
                        value={description[descLang]}
                        onChange={(e) =>
                            setDescription({
                                ...description,
                                [descLang]: e.target.value,
                            })
                        }
                        placeholder={t('checkpointForm.placeholders.description', 'Write public checkpoint guidelines in {{lang}}...', { lang: descLang.toUpperCase() })}
                        className={cn('w-full rounded-md border-2 border-black bg-white p-3 text-xs font-medium text-black focus:outline-none focus:ring-2 focus:ring-black/20')}
                    />
                </div>

                {/* Multi-language Organizer Info Tabs */}
                <div className={cn('flex flex-col gap-2 pt-2 border-t-2 border-black/10')}>
                    <div className={cn('flex items-center justify-between')}>
                        <span className={cn('uppercase tracking-wider text-[10px] text-black/70 flex items-center gap-1')}>
                            <Globe className="h-3 w-3" />
                            {t('checkpointForm.labels.orgDescription', 'Organizer Info / Järjestäjän Kuvaus')}
                        </span>
                        <div className={cn('flex items-center gap-1 rounded-md border-2 border-black bg-black/5 p-0.5')}>
                            {(['fi', 'sv', 'en'] as LangTab[]).map((lang) => (
                                <button
                                    key={lang}
                                    type="button"
                                    onClick={() => setOrgLang(lang)}
                                    className={cn(
                                        'rounded px-2.5 py-1 text-[10px] font-black uppercase transition-colors cursor-pointer',
                                        orgLang === lang
                                            ? 'bg-amber-400 text-black border border-black shadow-2xs'
                                            : 'text-black/60 hover:text-black'
                                    )}
                                >
                                    {lang}
                                </button>
                            ))}
                        </div>
                    </div>

                    <textarea
                        rows={3}
                        value={orgDescription[orgLang]}
                        onChange={(e) =>
                            setOrgDescription({
                                ...orgDescription,
                                [orgLang]: e.target.value,
                            })
                        }
                        placeholder={t('checkpointForm.placeholders.orgDescription', 'Write internal organizer details in {{lang}}...', { lang: orgLang.toUpperCase() })}
                        className={cn('w-full rounded-md border-2 border-black bg-white p-3 text-xs font-medium text-black focus:outline-none focus:ring-2 focus:ring-black/20')}
                    />
                </div>

                {/* Contact Information & URL */}
                <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-black/10')}>
                    <form.Field name="contact_person">
                        {(field) => (
                            <div className={cn('flex flex-col gap-1')}>
                                <label htmlFor={field.name} className={cn('uppercase tracking-wider text-[10px] text-black/70')}>
                                    {t('checkpointForm.labels.contactPerson', 'Contact Person')}
                                </label>
                                <input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder={t('checkpointForm.placeholders.contactPerson', 'Matti Meikäläinen')}
                                    className={cn('rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-bold text-black placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-black/20')}
                                />
                            </div>
                        )}
                    </form.Field>

                    <form.Field name="contact_email">
                        {(field) => (
                            <div className={cn('flex flex-col gap-1')}>
                                <label htmlFor={field.name} className={cn('uppercase tracking-wider text-[10px] text-black/70')}>
                                    {t('checkpointForm.labels.contactEmail', 'Contact Email')}
                                </label>
                                <input
                                    id={field.name}
                                    name={field.name}
                                    type="email"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder={t('checkpointForm.placeholders.contactEmail', 'organizer@helsinki.fi')}
                                    className={cn('rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-bold text-black placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-black/20')}
                                />
                            </div>
                        )}
                    </form.Field>

                    <form.Field name="contact_phone">
                        {(field) => (
                            <div className={cn('flex flex-col gap-1')}>
                                <label htmlFor={field.name} className={cn('uppercase tracking-wider text-[10px] text-black/70')}>
                                    {t('checkpointForm.labels.contactPhone', 'Contact Phone')}
                                </label>
                                <input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder={t('checkpointForm.placeholders.contactPhone', '+358 40 1234567')}
                                    className={cn('rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-bold text-black placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-black/20')}
                                />
                            </div>
                        )}
                    </form.Field>

                    <form.Field name="url">
                        {(field) => (
                            <div className={cn('flex flex-col gap-1')}>
                                <label htmlFor={field.name} className={cn('uppercase tracking-wider text-[10px] text-black/70')}>
                                    {t('checkpointForm.labels.url', 'Website URL')}
                                </label>
                                <input
                                    id={field.name}
                                    name={field.name}
                                    type="url"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder={t('checkpointForm.placeholders.url', 'https://example.org')}
                                    className={cn('rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-bold text-black placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-black/20')}
                                />
                            </div>
                        )}
                    </form.Field>
                </div>

                {/* Checkbox Flags */}
                <div className={cn('flex items-center justify-between gap-4 pt-2 border-t border-black/10')}>
                    <form.Field name="accessible">
                        {(field) => (
                            <label className={cn('flex items-center gap-2 cursor-pointer')}>
                                <input
                                    type="checkbox"
                                    checked={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.checked)}
                                    className={cn('h-4 w-4 rounded border-2 border-black accent-black focus:ring-0')}
                                />
                                <span className={cn('uppercase tracking-wider text-[10px] text-black/80')}>
                                    {t('checkpointForm.labels.accessible', 'Wheelchair Accessible')}
                                </span>
                            </label>
                        )}
                    </form.Field>

                    <form.Field name="cancelled">
                        {(field) => (
                            <label className={cn('flex items-center gap-2 cursor-pointer')}>
                                <input
                                    type="checkbox"
                                    checked={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.checked)}
                                    className={cn('h-4 w-4 rounded border-2 border-black accent-rose-600 focus:ring-0')}
                                />
                                <span className={cn('uppercase tracking-wider text-[10px] text-rose-600 font-extrabold')}>
                                    {t('checkpointForm.labels.cancelled', 'Mark as Cancelled')}
                                </span>
                            </label>
                        )}
                    </form.Field>
                </div>

                {/* Actions */}
                <div className={cn('flex items-center justify-end gap-2 pt-3 border-t-2 border-black')}>
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className={cn('rounded-md border-2 border-black bg-white px-4 py-2 text-xs font-extrabold text-black shadow-2xs hover:bg-black/5 transition-colors disabled:opacity-50 cursor-pointer')}
                        >
                            {t('common.cancel', 'Cancel')}
                        </button>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={cn('flex items-center gap-1.5 rounded-md border-2 border-black bg-amber-400 px-5 py-2 text-xs font-extrabold text-black shadow-2xs hover:bg-amber-300 transition-colors disabled:opacity-50 cursor-pointer')}
                    >
                        {isSubmitting ? (
                            <Loader2 className={cn('h-4 w-4 animate-spin text-black')} />
                        ) : (
                            <Save className={cn('h-4 w-4 text-black')} />
                        )}
                        {isEditing
                            ? t('checkpointForm.saveChanges', 'Save Changes')
                            : t('checkpointForm.createCheckpoint', 'Create Checkpoint')}
                    </button>
                </div>
            </form>
        </div>
    )
}
