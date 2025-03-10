interface DictionaryEntry {
  from: string;
  to: string;
}

interface IDictionaryService {
  addEntry(from: string, to: string): void;
  removeEntry(from: string): void;
  getAllEntries(): DictionaryEntry[];
  applyDictionary(text: string): string;
}

class DictionaryService implements IDictionaryService {
  private static instance: DictionaryService | null = null;
  private dictionary: DictionaryEntry[] = [];

  private constructor() {
    this.loadDictionary();
  }

  public static getInstance(): IDictionaryService {
    if (typeof window === 'undefined') {
      // Return a mock service for server-side rendering
      return new class implements IDictionaryService {
        addEntry() {}
        removeEntry() {}
        getAllEntries() { return []; }
        applyDictionary(text: string) { return text; }
      };
    }

    if (!DictionaryService.instance) {
      DictionaryService.instance = new DictionaryService();
    }
    return DictionaryService.instance;
  }

  private loadDictionary(): void {
    try {
      const savedDictionary = localStorage.getItem('translationDictionary');
      if (savedDictionary) {
        this.dictionary = JSON.parse(savedDictionary);
      }
    } catch (error) {
      console.error('Error loading dictionary:', error);
    }
  }

  private saveDictionary(): void {
    try {
      localStorage.setItem('translationDictionary', JSON.stringify(this.dictionary));
    } catch (error) {
      console.error('Error saving dictionary:', error);
    }
  }

  public addEntry(from: string, to: string): void {
    const existingIndex = this.dictionary.findIndex(entry => entry.from === from);
    if (existingIndex !== -1) {
      this.dictionary[existingIndex] = { from, to };
    } else {
      this.dictionary.push({ from, to });
    }
    this.saveDictionary();
  }

  public removeEntry(from: string): void {
    this.dictionary = this.dictionary.filter(entry => entry.from !== from);
    this.saveDictionary();
  }

  public getAllEntries(): DictionaryEntry[] {
    return [...this.dictionary];
  }

  public applyDictionary(text: string): string {
    let result = text;
    for (const entry of this.dictionary) {
      // Create a regular expression that matches whole words only
      const regex = new RegExp(`\\b${entry.from}\\b`, 'gi');
      result = result.replace(regex, entry.to);
    }
    return result;
  }
}

export const dictionaryService = DictionaryService.getInstance(); 