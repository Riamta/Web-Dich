export interface Language {
    code: string;
    name: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
    { code: 'vi', name: 'Tiếng Việt' },
    { code: 'en', name: 'Tiếng Anh' },
    { code: 'zh', name: 'Tiếng Trung' },
    { code: 'ja', name: 'Tiếng Nhật' },
    { code: 'ko', name: 'Tiếng Hàn' },
    { code: 'fr', name: 'Tiếng Pháp' },
    { code: 'auto', name: 'Tự động' }
];

export const getLanguageName = (code: string): string => {
    const language = SUPPORTED_LANGUAGES.find(lang => lang.code === code);
    return language ? language.name : code;
};

export const isValidLanguage = (code: string): boolean => {
    return SUPPORTED_LANGUAGES.some(lang => lang.code === code);
}; 