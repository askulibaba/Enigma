/**
 * Простая реализация шифрования в стиле Enigma
 * Данный модуль предоставляет базовые функции для шифрования и дешифрования текста
 */

// Константы для шифрования
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 абвгдеёжзийклмнопрстуфхцчшщъыьэюя.,!?-_:;()[]{}=+*/\\\'"`<>@#$%^&|~';

class EnigmaEncryption {
  /**
   * Валидация ключа шифрования
   * @param key Ключ шифрования
   * @returns Булевое значение, указывающее на валидность ключа
   */
  validateKey(key: string): boolean {
    if (!key) return false;
    return key.length >= 3; // Минимальная длина ключа
  }

  /**
   * Шифрование текста с использованием алгоритма Enigma
   * @param text Текст для шифрования
   * @param key Ключ шифрования
   * @returns Зашифрованный текст
   */
  encryptText(text: string, key: string): string {
    if (!this.validateKey(key)) {
      console.error('Invalid encryption key');
      return text;
    }

    const result: string[] = [];
    const keySum = this.getSumFromKey(key);
    
    // Для каждого символа входного текста
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const charIndex = ALPHABET.indexOf(char.toUpperCase());
      
      // Если символ найден в алфавите, шифруем его
      if (charIndex !== -1) {
        // Используем позицию, ключ и индекс для создания сдвига
        const shift = this.calculateShift(i, keySum, key);
        const newIndex = (charIndex + shift) % ALPHABET.length;
        result.push(ALPHABET[newIndex]);
      } else {
        // Если символ не в алфавите, оставляем как есть
        result.push(char);
      }
    }
    
    return result.join('');
  }

  /**
   * Дешифрование текста, зашифрованного алгоритмом Enigma
   * @param encryptedText Зашифрованный текст
   * @param key Ключ шифрования
   * @returns Расшифрованный текст
   */
  decryptText(encryptedText: string, key: string): string {
    if (!this.validateKey(key)) {
      console.error('Invalid decryption key');
      return encryptedText;
    }

    const result: string[] = [];
    const keySum = this.getSumFromKey(key);
    
    // Для каждого символа зашифрованного текста
    for (let i = 0; i < encryptedText.length; i++) {
      const char = encryptedText[i];
      const charIndex = ALPHABET.indexOf(char);
      
      // Если символ найден в алфавите, дешифруем его
      if (charIndex !== -1) {
        // Используем позицию, ключ и индекс для создания сдвига
        const shift = this.calculateShift(i, keySum, key);
        // Используем обратный сдвиг для дешифрования
        let newIndex = (charIndex - shift) % ALPHABET.length;
        if (newIndex < 0) newIndex += ALPHABET.length;
        result.push(ALPHABET[newIndex]);
      } else {
        // Если символ не в алфавите, оставляем как есть
        result.push(char);
      }
    }
    
    return result.join('');
  }

  /**
   * Вычисляет числовое значение из ключа
   * @param key Ключ шифрования
   * @returns Сумма кодов символов ключа
   */
  private getSumFromKey(key: string): number {
    return Array.from(key)
      .map(char => char.charCodeAt(0))
      .reduce((sum, code) => sum + code, 0);
  }

  /**
   * Вычисляет сдвиг для конкретной позиции в тексте
   * @param position Позиция символа в тексте
   * @param keySum Сумма кодов символов ключа
   * @param key Ключ шифрования
   * @returns Сдвиг для данной позиции
   */
  private calculateShift(position: number, keySum: number, key: string): number {
    // Используем позицию и сумму ключа для создания уникального сдвига для каждой позиции
    const keyChar = key[position % key.length];
    const keyCharCode = keyChar.charCodeAt(0);
    return (keySum + position + keyCharCode) % ALPHABET.length;
  }
  
  /**
   * Проверяет, является ли текст зашифрованным
   * @param text Текст для проверки
   * @returns Булевое значение, указывающее на вероятность того, что текст зашифрован
   */
  isEncrypted(text: string): boolean {
    // Простая эвристика для определения зашифрованного текста
    // Проверяем распределение символов и другие признаки
    if (!text || text.length < 5) return false;
    
    // Проверка на случайное распределение символов
    const charFrequency: Record<string, number> = {};
    for (const char of text) {
      charFrequency[char] = (charFrequency[char] || 0) + 1;
    }
    
    // Вычисляем энтропию текста (мера случайности)
    const entropy = Object.values(charFrequency).reduce((sum, freq) => {
      const p = freq / text.length;
      return sum - p * Math.log2(p);
    }, 0);
    
    // Зашифрованный текст обычно имеет более высокую энтропию
    return entropy > 3.5;
  }
}

export default new EnigmaEncryption(); 