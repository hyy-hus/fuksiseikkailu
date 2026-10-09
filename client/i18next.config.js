export default {
    locales: ['fi', 'sv', 'en'],
    defaultLocale: 'en',
    defaultNs: '',
    extract: {
        input: ['src/**/*.{ts,tsx}'],
        output: 'src/i18n/locales/{{language}}.json',
        // Only use fallback values for the default locale (en)
        defaultValue: (lng, ns, key, fallbackValue) => {
            return lng === 'en' ? fallbackValue : ''
        },
    },
    keySeparator: '.',
}
