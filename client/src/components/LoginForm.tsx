import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { KeyRound, Mail, ArrowRight, CheckCircle2, LogOut } from 'lucide-react'

import {
    requestOtpMutation,
    verifyOtpMutation,
} from '@/api/generated/@tanstack/react-query.gen'
import { useAuth } from '@/auth/AuthContext'
import { cn } from '@/lib/utils'

export function LoginForm() {
    const { t } = useTranslation()
    const { isAuthenticated, login, logout } = useAuth()
    const [step, setStep] = React.useState<'request' | 'verify'>('request')
    const [sentEmail, setSentEmail] = React.useState('')

    // Mutations with custom toast meta
    const requestOtp = useMutation({
        ...requestOtpMutation(),
        mutationKey: ['auth', 'requestOtp'],
        meta: {
            loadingMessage: t('login.meta.requestLoading', 'Sending magic code...'),
            successMessage: t('login.meta.requestSuccess', 'OTP code sent to your email!'),
        },
    })

    const verifyOtp = useMutation({
        ...verifyOtpMutation(),
        mutationKey: ['auth', 'verifyOtp'],
        meta: {
            loadingMessage: t('login.meta.verifyLoading', 'Verifying code...'),
            successMessage: t('login.meta.verifySuccess', 'Authenticated successfully!'),
        },
    })

    // Step 1 Form: Email Request
    const requestForm = useForm({
        defaultValues: { email: '' },
        onSubmit: async ({ value }) => {
            const email = value.email.trim().toLowerCase()
            await requestOtp.mutateAsync({ body: { email } })
            setSentEmail(email)
            setStep('verify')
        },
    })

    // Step 2 Form: Code Verification
    const verifyForm = useForm({
        defaultValues: { code: '' },
        onSubmit: async ({ value }) => {
            const res = await verifyOtp.mutateAsync({
                body: {
                    email: sentEmail,
                    code: value.code.trim(),
                },
            })

            if (!res?.access_token) {
                throw new Error(
                    t('login.error.noToken', 'Authentication succeeded but no access token was returned by the server.')
                )
            }

            login(res.access_token)
        },
    })

    if (isAuthenticated) {
        return (
            <div className={cn('flex w-full max-w-sm flex-col overflow-hidden rounded-xl border-2 border-black bg-white shadow-xl isolate')}>
                <div className={cn('flex items-center gap-3 border-b-2 border-black bg-emerald-300 p-4')}>
                    <CheckCircle2 className={cn('h-6 w-6 stroke-[2.5] text-black')} />
                    <div>
                        <h3 className={cn('text-sm font-black uppercase tracking-wide text-black')}>
                            {t('login.authenticatedTitle', 'Authenticated')}
                        </h3>
                        <p className={cn('text-[11px] font-bold text-black/80')}>
                            {t('login.authenticatedSubtitle', 'Your session token is saved in local storage.')}
                        </p>
                    </div>
                </div>

                <div className={cn('p-4')}>
                    <button
                        type="button"
                        onClick={logout}
                        className={cn('flex w-full items-center justify-center gap-2 rounded-md border-2 border-black bg-rose-500 py-2 text-xs font-extrabold text-white shadow-2xs transition-colors hover:bg-rose-600')}
                    >
                        <LogOut className={cn('h-4 w-4')} />
                        {t('login.logoutButton', 'Log Out / Clear Token')}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className={cn('flex w-full max-w-sm flex-col overflow-hidden rounded-xl border-2 border-black bg-white shadow-xl isolate')}>
            {/* Header */}
            <div className={cn('border-b-2 border-black bg-amber-400 p-4 text-black')}>
                <h3 className={cn('text-base font-black uppercase tracking-tight')}>
                    {step === 'request'
                        ? t('login.headerRequestTitle', 'Event Login')
                        : t('login.headerVerifyTitle', 'Enter Verification Code')}
                </h3>
                <p className={cn('mt-0.5 text-xs font-bold text-black/80')}>
                    {step === 'request'
                        ? t('login.headerRequestSubtitle', 'Enter your organizer email to receive a login code.')
                        : t('login.headerVerifySubtitle', 'Code sent to {{email}}', { email: sentEmail })}
                </p>
            </div>

            {/* Step 1: Request OTP */}
            {step === 'request' ? (
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        requestForm.handleSubmit()
                    }}
                    className={cn('flex flex-col gap-4 p-4 text-xs font-bold text-black')}
                >
                    <requestForm.Field
                        name="email"
                        validators={{
                            onChange: ({ value }) =>
                                !value.includes('@')
                                    ? t('login.validation.invalidEmail', 'Enter a valid email')
                                    : undefined,
                        }}
                    >
                        {(field) => (
                            <div className={cn('flex flex-col gap-1')}>
                                <label htmlFor={field.name} className={cn('uppercase tracking-wider text-[10px] text-black/70')}>
                                    {t('login.labels.email', 'Email Address')}
                                </label>
                                <div className={cn('relative')}>
                                    <Mail className={cn('absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/50')} />
                                    <input
                                        id={field.name}
                                        type="email"
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        placeholder={t('login.placeholders.email', 'organizer@helsinki.fi')}
                                        className={cn('w-full rounded-md border-2 border-black bg-white py-2 pl-9 pr-3 text-xs font-bold text-black placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-black/20')}
                                    />
                                </div>
                            </div>
                        )}
                    </requestForm.Field>

                    <button
                        type="submit"
                        disabled={requestOtp.isPending}
                        className={cn('flex items-center justify-center gap-2 rounded-md border-2 border-black bg-amber-400 py-2.5 text-xs font-extrabold text-black shadow-2xs hover:bg-amber-300 transition-colors disabled:opacity-50')}
                    >
                        {t('login.buttons.sendCode', 'Send Login Code')} <ArrowRight className={cn('h-4 w-4')} />
                    </button>
                </form>
            ) : (
                /* Step 2: Verify OTP */
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        verifyForm.handleSubmit()
                    }}
                    className={cn('flex flex-col gap-4 p-4 text-xs font-bold text-black')}
                >
                    <verifyForm.Field name="code">
                        {(field) => (
                            <div className={cn('flex flex-col gap-1')}>
                                <label htmlFor={field.name} className={cn('uppercase tracking-wider text-[10px] text-black/70')}>
                                    {t('login.labels.code', '6-Digit Verification Code')}
                                </label>
                                <div className={cn('relative')}>
                                    <KeyRound className={cn('absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/50')} />
                                    <input
                                        id={field.name}
                                        type="text"
                                        maxLength={6}
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        placeholder={t('login.placeholders.code', '123456')}
                                        className={cn('w-full rounded-md border-2 border-black bg-white py-2 pl-9 pr-3 font-mono text-sm tracking-widest font-black text-black placeholder:text-black/30 focus:outline-none focus:ring-2 focus:ring-black/20')}
                                    />
                                </div>
                            </div>
                        )}
                    </verifyForm.Field>

                    <div className={cn('flex gap-2')}>
                        <button
                            type="button"
                            onClick={() => setStep('request')}
                            className={cn('flex-1 rounded-md border-2 border-black bg-white py-2 text-xs font-extrabold text-black hover:bg-black/5')}
                        >
                            {t('common.back', 'Back')}
                        </button>
                        <button
                            type="submit"
                            disabled={verifyOtp.isPending}
                            className={cn('flex-2 rounded-md border-2 border-black bg-emerald-400 py-2 text-xs font-extrabold text-black hover:bg-emerald-300 transition-colors disabled:opacity-50')}
                        >
                            {t('login.buttons.verify', 'Verify & Log In')}
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}
