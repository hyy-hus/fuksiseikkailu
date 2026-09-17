import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, Calendar, Globe, Loader2, Save, Trash2, X } from 'lucide-react'

import type { CreateNewsPayload, NewsArticle, UpdateNewsPayload } from '@/api/generated/types.gen'
import { useCreateNews, useDeleteNews, useUpdateNews } from '@/hooks/useNews'
import { getApiErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'

interface NewsFormProps {
    initialData?: NewsArticle | null
    onSuccess?: () => void
    onCancel?: () => void
}

type LangTab = 'fi' | 'sv' | 'en'

export function NewsForm({ initialData, onSuccess, onCancel }: NewsFormProps) {
    const { t, i18n } = useTranslation()
    const isEditing = Boolean(initialData)

    const [activeLang, setActiveLang] = React.useState<LangTab>(
        (i18n.language as LangTab) || 'fi'
    )

    // Localized content state
    const [title, setTitle] = React.useState(initialData?.title ?? '')
    const [content, setContent] = React.useState<{ fi: string; sv: string; en: string }>(() => {
        if (!initialData?.content) return { fi: '', sv: '', en: '' }
        if (typeof initialData.content === 'object' && initialData.content !== null) {
            const raw = initialData.content as Record<string, string>
            return {
                fi: raw.fi || '',
                sv: raw.sv || '',
                en: raw.en || '',
            }
        }
        return { fi: String(initialData.content), sv: '', en: '' }
    })

    const [publishedAt, setPublishedAt] = React.useState<string>(() => {
        if (initialData?.published_at) {
            return new Date(initialData.published_at).toISOString().slice(0, 16)
        }
        return new Date().toISOString().slice(0, 16)
    })

    const createMutation = useCreateNews(onSuccess)
    const updateMutation = useUpdateNews(initialData?.id, onSuccess)
    const deleteMutation = useDeleteNews(onSuccess)

    const isSubmitting = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
    const activeError = createMutation.error || updateMutation.error || deleteMutation.error

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const publishedDateIso = publishedAt ? new Date(publishedAt).toISOString() : null

        if (isEditing && initialData) {
            const payload: UpdateNewsPayload = {
                title: title.trim(),
                content: content,
                published_at: publishedDateIso,
            }
            await updateMutation.mutateAsync({
                path: { id: initialData.id },
                body: payload,
            })
        } else {
            const payload: CreateNewsPayload = {
                title: title.trim(),
                content: content,
                published_at: publishedDateIso,
            }
            await createMutation.mutateAsync({ body: payload })
        }
    }

    const handleDelete = async () => {
        if (!initialData || !window.confirm(t('news.confirmDelete', 'Delete this news article?'))) return
        await deleteMutation.mutateAsync({ path: { id: initialData.id } })
    }

    return (
        <div className={cn('flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border-2 border-black bg-white shadow-xl isolate')}>
            {/* Header */}
            <div className={cn('flex items-center justify-between border-b-2 border-black bg-amber-400 p-4')}>
                <div>
                    <h3 className={cn('text-base font-extrabold uppercase tracking-tight text-black')}>
                        {isEditing
                            ? t('news.form.editTitle', 'Edit News Article')
                            : t('news.form.createTitle', 'Create News Article')}
                    </h3>
                    <p className={cn('mt-0.5 text-xs font-medium text-black/80')}>
                        {t('news.form.subtitle', 'Publish announcements across Finnish, Swedish, and English.')}
                    </p>
                </div>

                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className={cn('flex h-7 w-7 items-center justify-center rounded-md border-2 border-black bg-white hover:bg-black/10 transition-colors cursor-pointer')}
                    >
                        <X className="h-4 w-4 text-black" />
                    </button>
                )}
            </div>

            {/* Error Banner */}
            {activeError && (
                <div className={cn('m-4 flex items-center gap-3 rounded-md border-2 border-black bg-rose-100 p-3 text-xs font-bold text-black')}>
                    <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 stroke-[2.5]" />
                    <p>{getApiErrorMessage(activeError)}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className={cn('flex flex-col gap-4 p-4 text-xs font-bold text-black')}>
                {/* Title */}
                <div className={cn('flex flex-col gap-1')}>
                    <label className={cn('uppercase tracking-wider text-[10px] text-black/70')}>
                        {t('news.form.labels.title', 'Internal Article Title *')}
                    </label>
                    <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={t('news.form.placeholders.title', 'e.g. Event Schedule Update')}
                        className={cn('rounded-md border-2 border-black bg-white px-3 py-2 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-black/20')}
                    />
                </div>

                {/* Publish Date/Time */}
                <div className={cn('flex flex-col gap-1')}>
                    <label className={cn('uppercase tracking-wider text-[10px] text-black/70 flex items-center gap-1')}>
                        <Calendar className="h-3 w-3" />
                        {t('news.form.labels.publishedAt', 'Publish Date & Time')}
                    </label>
                    <input
                        type="datetime-local"
                        value={publishedAt}
                        onChange={(e) => setPublishedAt(e.target.value)}
                        className={cn('rounded-md border-2 border-black bg-white px-3 py-2 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-black/20')}
                    />
                </div>

                {/* Multi-language Content Tabs */}
                <div className={cn('flex flex-col gap-2 pt-2 border-t-2 border-black/10')}>
                    <div className={cn('flex items-center justify-between')}>
                        <span className={cn('uppercase tracking-wider text-[10px] text-black/70 flex items-center gap-1')}>
                            <Globe className="h-3 w-3" />
                            {t('news.form.labels.localizedContent', 'Localized Content')}
                        </span>
                        <div className={cn('flex items-center gap-1 rounded-md border-2 border-black bg-black/5 p-0.5')}>
                            {(['fi', 'sv', 'en'] as LangTab[]).map((lang) => (
                                <button
                                    key={lang}
                                    type="button"
                                    onClick={() => setActiveLang(lang)}
                                    className={cn(
                                        'rounded px-2.5 py-1 text-[10px] font-black uppercase transition-colors cursor-pointer',
                                        activeLang === lang
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
                        rows={6}
                        value={content[activeLang]}
                        onChange={(e) =>
                            setContent({
                                ...content,
                                [activeLang]: e.target.value,
                            })
                        }
                        placeholder={t('news.form.placeholders.content', 'Write announcement text in {{lang}}...', { lang: activeLang.toUpperCase() })}
                        className={cn('w-full rounded-md border-2 border-black bg-white p-3 text-xs font-medium text-black focus:outline-none focus:ring-2 focus:ring-black/20')}
                    />
                </div>

                {/* Submit / Actions */}
                <div className={cn('flex items-center justify-between border-t-2 border-black pt-3 mt-2')}>
                    {isEditing ? (
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={isSubmitting}
                            className={cn('flex items-center gap-1 rounded-md border-2 border-black bg-rose-500 px-3 py-2 text-xs font-extrabold text-white hover:bg-rose-600 transition-colors disabled:opacity-50 cursor-pointer')}
                        >
                            <Trash2 className="h-4 w-4" />
                            {t('common.delete', 'Delete')}
                        </button>
                    ) : <div />}

                    <div className={cn('flex items-center gap-2')}>
                        {onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                disabled={isSubmitting}
                                className={cn('rounded-md border-2 border-black bg-white px-4 py-2 text-xs font-extrabold text-black hover:bg-black/5 transition-colors disabled:opacity-50 cursor-pointer')}
                            >
                                {t('common.cancel', 'Cancel')}
                            </button>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={cn('flex items-center gap-1.5 rounded-md border-2 border-black bg-emerald-400 px-5 py-2 text-xs font-black uppercase text-black shadow-2xs hover:bg-emerald-300 transition-colors disabled:opacity-50 cursor-pointer')}
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {isEditing
                                ? t('news.form.saveChanges', 'Save Changes')
                                : t('news.form.create', 'Publish Article')}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
