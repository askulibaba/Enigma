import { getGlobal } from '../global';

export interface EnigmaUtils {
  validateKey: (key: string) => Promise<boolean>;
  encryptMessage: (message: string, key: string) => Promise<string>;
  decryptMessage: (encryptedMessage: string, key: string) => Promise<string>;
  isEnigmaEnabled: () => boolean;
}

let enigmaUtilsInstance: EnigmaUtils | undefined;

export function getEnigmaUtils(): EnigmaUtils {
  if (!enigmaUtilsInstance) {
    enigmaUtilsInstance = createEnigmaUtils();
  }
  
  return enigmaUtilsInstance;
}

function createEnigmaUtils(): EnigmaUtils {
  return {
    async validateKey(key: string): Promise<boolean> {
      // Минимальные требования к ключу - не менее 3 символов
      return key.length >= 3;
    },
    
    async encryptMessage(message: string, key: string): Promise<string> {
      if (!message || !key) {
        return message;
      }
      
      // Простая реализация шифрования (замените на реальный алгоритм)
      // Используем смещение символов на основе ключа (шифр Цезаря с переменным сдвигом)
      let encrypted = '';
      let keyIndex = 0;
      
      for (let i = 0; i < message.length; i++) {
        const charCode = message.charCodeAt(i);
        const keyChar = key.charCodeAt(keyIndex % key.length);
        const shift = keyChar % 26;
        
        // Шифруем только буквы, оставляем остальные символы как есть
        if ((charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122)) {
          const isUpperCase = charCode >= 65 && charCode <= 90;
          const base = isUpperCase ? 65 : 97;
          const encryptedCharCode = ((charCode - base + shift) % 26) + base;
          encrypted += String.fromCharCode(encryptedCharCode);
        } else {
          encrypted += message[i];
        }
        
        keyIndex++;
      }
      
      // Добавляем префикс для обозначения зашифрованного сообщения
      return `[ENIGMA]${encrypted}`;
    },
    
    async decryptMessage(encryptedMessage: string, key: string): Promise<string> {
      if (!encryptedMessage || !key) {
        return encryptedMessage;
      }
      
      // Проверяем, что сообщение зашифровано
      if (!encryptedMessage.startsWith('[ENIGMA]')) {
        return encryptedMessage;
      }
      
      // Удаляем префикс
      const message = encryptedMessage.slice(8);
      let decrypted = '';
      let keyIndex = 0;
      
      for (let i = 0; i < message.length; i++) {
        const charCode = message.charCodeAt(i);
        const keyChar = key.charCodeAt(keyIndex % key.length);
        const shift = keyChar % 26;
        
        // Дешифруем только буквы, оставляем остальные символы как есть
        if ((charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122)) {
          const isUpperCase = charCode >= 65 && charCode <= 90;
          const base = isUpperCase ? 65 : 97;
          // При дешифровании нужно смещать в обратную сторону
          const decryptedCharCode = ((charCode - base - shift + 26) % 26) + base;
          decrypted += String.fromCharCode(decryptedCharCode);
        } else {
          decrypted += message[i];
        }
        
        keyIndex++;
      }
      
      return decrypted;
    },
    
    isEnigmaEnabled(): boolean {
      const global = getGlobal();
      return global.settings.privacy?.enigmaEnabled ?? false;
    }
  };
} 