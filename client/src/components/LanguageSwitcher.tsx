import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'

export function LanguageSwitcher() {
    const { i18n } = useTranslation()

    return (
        <div className="flex items-center gap-1 rounded-md border-2 border-black bg-white px-2 py-1 text-xs font-black text-black shadow-2xs">
            <Globe className="h-3.5 w-3.5" />
            <select
                value={i18n.language.slice(0, 2)}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                className="bg-transparent font-extrabold uppercase focus:outline-none cursor-pointer"
            >
                <option value="fi">FI</option>
                <option value="sv">SV</option>
                <option value="en">EN</option>
            </select>
        </div>
    )
}
