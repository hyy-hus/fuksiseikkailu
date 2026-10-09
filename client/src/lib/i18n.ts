import i18n from 'i18next'

/**
 * Extracts a localized string from a JSON translation object ({ fi: "...", sv: "...", en: "..." }),
 * defaulting to active i18n language, then fallback languages, then raw string.
 */
export function getLocalizedText(
    value: unknown,
    currentLang: string = i18n.language
): string {
    if (!value) return ''
    if (typeof value === 'string') return value

    if (typeof value === 'object' && value !== null) {
        const obj = value as Record<string, string>
        const lang = currentLang.slice(0, 2)

        if (obj[lang]) return obj[lang]
        if (obj.fi) return obj.fi
        if (obj.sv) return obj.sv
        if (obj.en) return obj.en

        const firstAvailable = Object.values(obj).find((v) => typeof v === 'string')
        if (firstAvailable) return firstAvailable
    }

    return String(value)
}
