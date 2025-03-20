import { getEnigmaUtils } from '../../../util/enigmaUtils';
import useLang from '../../../hooks/useLang';

const MessageText: FC<OwnProps> = ({
  text,
  highlight,
  sender,
  isForwarded,
  isSimple,
  className,
  messageId,
}) => {
  const { loadCustomEmojis } = getActions();
  const lang = useLang();
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedText, setDecryptedText] = useState<ApiFormattedText | undefined>();
  
  const globalState = useGlobalForMedia('customEmojis');
  const customEmojis = useMemo(() => {
    return text && text.entities
      ? text.entities.reduce((acc: Record<string, ApiSticker>, entity) => {
        if (entity.type === ApiMessageEntityTypes.CustomEmoji && entity.documentId) {
          const customEmoji = globalState?.customEmojis.byId[entity.documentId];
          if (customEmoji) {
            acc[entity.documentId] = customEmoji;
          }
        }
        return acc;
      }, {})
      : {};
  }, [globalState?.customEmojis.byId, text]);

  // Попытка дешифровать сообщение, если оно зашифровано
  useEffect(() => {
    const enigmaUtils = getEnigmaUtils();
    const isEnigmaEnabled = enigmaUtils.isEnigmaEnabled();
    const global = getGlobal();
    const enigmaKey = global.settings.privacy?.enigmaKey || '';
    
    if (isEnigmaEnabled && enigmaKey && text) {
      let messageText = typeof text === 'string' ? text : text.text;
      
      if (messageText && messageText.startsWith('[ENIGMA]')) {
        setIsDecrypting(true);
        
        (async () => {
          try {
            const decrypted = await enigmaUtils.decryptMessage(messageText, enigmaKey);
            
            if (typeof text === 'string') {
              setDecryptedText(decrypted);
            } else {
              setDecryptedText({
                ...text,
                text: decrypted,
              });
            }
          } catch (error) {
            console.error('Failed to decrypt message:', error);
          } finally {
            setIsDecrypting(false);
          }
        })();
      }
    }
  }, [text]);
  
  // Загрузка отсутствующих кастомных эмодзи
  useEffect(() => {
    if (!text) return;
    
    const customEmojiIds = Object.keys(customEmojis);
    const missingEmojiIds = (text.entities || [])
      .filter((entity) => (
        entity.type === ApiMessageEntityTypes.CustomEmoji
        && entity.documentId
        && !customEmojiIds.includes(entity.documentId)
      ))
      .map((entity) => entity.documentId) as string[];
    
    if (missingEmojiIds.length) {
      loadCustomEmojis({ ids: missingEmojiIds });
    }
  }, [text, customEmojis, loadCustomEmojis]);
  
  const textToRender = decryptedText || text;
  
  if (!textToRender) {
    return undefined;
  }
  
  // Отображаем индикатор дешифрования, если сообщение в процессе дешифрования
  if (isDecrypting) {
    return (
      <div className={buildClassName('MessageText', className)}>
        <span className="encryption-indicator">
          <i className="icon-lock" /> {lang('Decrypting...')}
        </span>
      </div>
    );
  }
  
  // ... existing rendering code using textToRender instead of text ...
  
  const textContent = typeof textToRender === 'string'
    ? textToRender
    : textToRender.text;
  
  // Отмечаем зашифрованные сообщения
  const isEncrypted = typeof text === 'string'
    ? text.startsWith('[ENIGMA]')
    : text.text?.startsWith('[ENIGMA]');
  
  return (
    <div className={buildClassName('MessageText', className, isEncrypted && 'encrypted')}>
      {isEncrypted && (
        <span className="encryption-indicator" title={lang('This message is encrypted')}>
          <i className="icon-lock" />
        </span>
      )}
      {textContent ? renderTextWithEntities({
        // ... existing code ...
      }) : ''}
    </div>
  );
}; 