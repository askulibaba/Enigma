import React, {
  memo, useMemo, useRef,
} from '../../lib/teact/teact';

import type { ApiFormattedText, ApiMessage, ApiStory } from '../../api/types';
import type { ObserveFn } from '../../hooks/useIntersectionObserver';
import type { ThreadId } from '../../types';
import { ApiMessageEntityTypes } from '../../api/types';

import { CONTENT_NOT_SUPPORTED } from '../../config';
import { extractMessageText, stripCustomEmoji } from '../../global/helpers';
import trimText from '../../util/trimText';
import { renderTextWithEntities } from './helpers/renderTextWithEntities';
import enigmaEncryption from '../../lib/enigma/EnigmaEncryption';
import useGlobal from '../../hooks/useGlobal';

import useSyncEffect from '../../hooks/useSyncEffect';
import useUniqueId from '../../hooks/useUniqueId';

import './MessageText.scss';

interface OwnProps {
  messageOrStory: ApiMessage | ApiStory;
  threadId?: ThreadId;
  translatedText?: ApiFormattedText;
  isForAnimation?: boolean;
  emojiSize?: number;
  highlight?: string;
  asPreview?: boolean;
  truncateLength?: number;
  isProtected?: boolean;
  observeIntersectionForLoading?: ObserveFn;
  observeIntersectionForPlaying?: ObserveFn;
  withTranslucentThumbs?: boolean;
  shouldRenderAsHtml?: boolean;
  inChatList?: boolean;
  forcePlayback?: boolean;
  focusedQuote?: string;
  isInSelectMode?: boolean;
  canBeEmpty?: boolean;
  maxTimestamp?: number;
}

const MIN_CUSTOM_EMOJIS_FOR_SHARED_CANVAS = 3;

function MessageText({
  messageOrStory,
  translatedText,
  isForAnimation,
  emojiSize,
  highlight,
  asPreview,
  truncateLength,
  isProtected,
  observeIntersectionForLoading,
  observeIntersectionForPlaying,
  withTranslucentThumbs,
  shouldRenderAsHtml,
  inChatList,
  forcePlayback,
  focusedQuote,
  isInSelectMode,
  canBeEmpty,
  maxTimestamp,
  threadId,
}: OwnProps) {
  // eslint-disable-next-line no-null/no-null
  const sharedCanvasRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line no-null/no-null
  const sharedCanvasHqRef = useRef<HTMLCanvasElement>(null);

  const textCacheBusterRef = useRef(0);
  
  // Получаем настройки Enigma из глобального состояния
  const { enigmaEnabled, enigmaKey } = useGlobal(global => {
    return {
      enigmaEnabled: global.settings.byKey.enigmaEnabled,
      enigmaKey: global.settings.byKey.enigmaKey,
    };
  });

  let formattedText = translatedText || extractMessageText(messageOrStory, inChatList);
  
  // Проверяем, не зашифровано ли сообщение с помощью Enigma
  if (enigmaEnabled && enigmaKey && formattedText?.text && enigmaEncryption.isEncrypted(formattedText.text)) {
    try {
      const decryptedText = enigmaEncryption.decryptText(formattedText.text, enigmaKey);
      // Создаем новый объект с расшифрованным текстом
      // Обратите внимание, что энтити не будут корректными, поэтому мы их убираем
      formattedText = {
        ...formattedText,
        text: decryptedText,
        entities: [],
      };
    } catch (error) {
      console.error('Error decrypting message:', error);
    }
  }
  
  const adaptedFormattedText = isForAnimation && formattedText ? stripCustomEmoji(formattedText) : formattedText;
  const { text, entities } = adaptedFormattedText || {};

  const containerId = useUniqueId();

  useSyncEffect(() => {
    textCacheBusterRef.current += 1;
  }, [text, entities]);

  const withSharedCanvas = useMemo(() => {
    const hasSpoilers = entities?.some((e) => e.type === ApiMessageEntityTypes.Spoiler);
    if (hasSpoilers) {
      return false;
    }

    const customEmojisCount = entities?.filter((e) => e.type === ApiMessageEntityTypes.CustomEmoji).length || 0;
    return customEmojisCount >= MIN_CUSTOM_EMOJIS_FOR_SHARED_CANVAS;
  }, [entities]) || 0;

  if (!text && !canBeEmpty) {
    return <span className="content-unsupported">{CONTENT_NOT_SUPPORTED}</span>;
  }

  // Определяем, является ли сообщение расшифрованным
  const isDecrypted = enigmaEnabled && enigmaKey && formattedText?.text 
    && enigmaEncryption.isEncrypted(formattedText.text);

  return (
    <>
      {isDecrypted && (
        <i className="icon-lock enigma-decrypted-icon" title="Зашифрованное сообщение" />
      )}
      {[
        withSharedCanvas && <canvas ref={sharedCanvasRef} className="shared-canvas" />,
        withSharedCanvas && <canvas ref={sharedCanvasHqRef} className="shared-canvas" />,
        renderTextWithEntities({
          text: trimText(text!, truncateLength),
          entities,
          highlight,
          emojiSize,
          shouldRenderAsHtml,
          containerId,
          asPreview,
          isProtected,
          observeIntersectionForLoading,
          observeIntersectionForPlaying,
          withTranslucentThumbs,
          sharedCanvasRef,
          sharedCanvasHqRef,
          cacheBuster: textCacheBusterRef.current.toString(),
          forcePlayback,
          focusedQuote,
          isInSelectMode,
          maxTimestamp,
          chatId: 'chatId' in messageOrStory ? messageOrStory.chatId : undefined,
          messageId: messageOrStory.id,
          threadId,
        }),
      ].flat().filter(Boolean)}
    </>
  );
}

export default memo(MessageText);
