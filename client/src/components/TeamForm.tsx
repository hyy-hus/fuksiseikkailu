import { useTranslation } from 'react-i18next'
import { useForm } from '@tanstack/react-form'
import { AlertCircle, Loader2, Save, X } from 'lucide-react'

import type { CreateTeam, Team, UpdateTeam } from '@/api/generated/types.gen'
import { useCreateTeam, useUpdateTeam } from '@/hooks/useTeams'
import { getApiErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'

interface TeamFormProps {
    initialData?: Team | null
    onSuccess?: () => void
    onCancel?: () => void
}

export function TeamForm({ initialData, onSuccess, onCancel }: TeamFormProps) {
    const { t } = useTranslation()
    const isEditing = Boolean(initialData)

    const createMutation = useCreateTeam(onSuccess)
    const updateMutation = useUpdateTeam(initialData?.id, onSuccess)

    const isSubmitting = createMutation.isPending || updateMutation.isPending
    const activeError = createMutation.error || updateMutation.error
    const errorMessage = getApiErrorMessage(activeError)

    const form = useForm({
        defaultValues: {
            name: initialData?.name ?? '',
            number: initialData?.number ?? ('' as number | string),
            participants: initialData?.participants ?? 0,
        },
        onSubmit: async ({ value }) => {
            const payload: CreateTeam | UpdateTeam = {
                name: value.name.trim(),
                number: value.number !== '' ? Number(value.number) : null,
                participants: Number(value.participants) || 0,
            }

            if (isEditing && initialData) {
                await updateMutation.mutateAsync({
                    path: { id: initialData.id },
                    body: payload as UpdateTeam,
                })
            } else {
                await createMutation.mutateAsync({
                    body: payload as CreateTeam,
                })
            }
        },
    })

    return (
        <div className={cn('flex w-full max-w-xl flex-col overflow-hidden rounded-xl border-2 border-black bg-white shadow-xl isolate')}>
            <div className={cn('flex items-center justify-between border-b-2 border-black p-4 bg-white shrink-0')}>
                <div>
                    <h3 className={cn('text-base font-extrabold uppercase tracking-tight text-black')}>
                        {isEditing
                            ? t('teamForm.titleEdit', 'Edit Team: {{name}}', { name: initialData?.name })
                            : t('teamForm.titleCreate', 'Create New Team')}
                    </h3>
                    <p className={cn('mt-0.5 text-xs font-medium text-black/70')}>
                        {isEditing
                            ? t('teamForm.subtitleEdit', 'Update team details and participant counts.')
                            : t('teamForm.subtitleCreate', 'Add a new team to the event database.')}
                    </p>
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

            {activeError && (
                <div className={cn('m-4 flex items-start gap-3 rounded-md border-2 border-black bg-rose-100 p-3 text-xs font-bold text-black shadow-2xs')}>
                    <AlertCircle className={cn('h-5 w-5 shrink-0 text-rose-600 stroke-[2.5]')} />
                    <div className={cn('flex-1 min-w-0')}>
                        <p className={cn('font-black uppercase tracking-wide text-rose-950')}>
                            {t('teamForm.submissionFailed', 'Submission Failed')}
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
                <div className={cn('grid grid-cols-1 sm:grid-cols-3 gap-3')}>
                    <form.Field
                        name="name"
                        validators={{
                            onChange: ({ value }) => (!value.trim() ? t('teamForm.validation.nameRequired', 'Team name is required') : undefined),
                        }}
                    >
                        {(field) => (
                            <div className={cn('sm:col-span-2 flex flex-col gap-1')}>
                                <label htmlFor={field.name} className={cn('uppercase tracking-wider text-[10px] text-black/70')}>
                                    {t('teamForm.labels.name', 'Team Name *')}
                                </label>
                                <input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder={t('teamForm.placeholders.name', 'e.g. Super Seikkailijat')}
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
                                    {t('teamForm.labels.number', 'Team Number (#)')}
                                </label>
                                <input
                                    id={field.name}
                                    name={field.name}
                                    type="number"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder={t('teamForm.placeholders.number', 'e.g. 101')}
                                    className={cn('rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-bold text-black placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-black/20')}
                                />
                            </div>
                        )}
                    </form.Field>
                </div>

                <form.Field name="participants">
                    {(field) => (
                        <div className={cn('flex flex-col gap-1')}>
                            <label htmlFor={field.name} className={cn('uppercase tracking-wider text-[10px] text-black/70')}>
                                {t('teamForm.labels.participants', 'Participants Count')}
                            </label>
                            <input
                                id={field.name}
                                name={field.name}
                                type="number"
                                min={0}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(Number(e.target.value))}
                                className={cn('rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-black/20')}
                            />
                        </div>
                    )}
                </form.Field>

                <div className={cn('flex items-center justify-end gap-2 pt-3 border-t-2 border-black')}>
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className={cn('rounded-md border-2 border-black bg-white px-4 py-2 text-xs font-extrabold text-black shadow-2xs hover:bg-black/5 transition-colors disabled:opacity-50')}
                        >
                            {t('common.cancel', 'Cancel')}
                        </button>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={cn('flex items-center gap-1.5 rounded-md border-2 border-black bg-amber-400 px-5 py-2 text-xs font-extrabold text-black shadow-2xs hover:bg-amber-300 transition-colors disabled:opacity-50')}
                    >
                        {isSubmitting ? (
                            <Loader2 className={cn('h-4 w-4 animate-spin text-black')} />
                        ) : (
                            <Save className={cn('h-4 w-4 text-black')} />
                        )}
                        {isEditing
                            ? t('teamForm.saveChanges', 'Save Changes')
                            : t('teamForm.createTeam', 'Create Team')}
                    </button>
                </div>
            </form>
        </div>
    )
}
