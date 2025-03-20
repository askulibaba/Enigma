import type { FC } from '../../lib/teact/teact';
import React, {
  memo, useEffect, useMemo, useRef, useSignal, useState,
} from '../../lib/teact/teact';
import { getActions, getGlobal, withGlobal } from '../../global';

import type {
  ApiAttachment,
  ApiAttachMenuPeerType,
  ApiAvailableEffect,
  ApiAvailableReaction,
  ApiBotCommand,
  ApiBotInlineMediaResult,
  ApiBotInlineResult,
  ApiBotMenuButton,
  ApiChat,
  ApiChatFullInfo,
  ApiDraft,
  ApiFormattedText,
  ApiMessage,
  ApiMessageEntity,
  ApiNewPoll,
  ApiQuickReply,
  ApiReaction,
  ApiStealthMode,
  ApiSticker,
  ApiTopic,
  ApiUser,
  ApiVideo,
  ApiWebPage,
} from '../../api/types';
import type {
  GlobalState, TabState,
} from '../../global/types';
import type {
  IAnchorPosition,
  InlineBotSettings,
  ISettings,
  MessageList,
  MessageListType,
  ThreadId,
} from '../../types';
import { MAIN_THREAD_ID } from '../../api/types';

import {
  BASE_EMOJI_KEYWORD_LANG,
  DEFAULT_MAX_MESSAGE_LENGTH,
  EDITABLE_INPUT_MODAL_ID,
  HEART_REACTION,
  MAX_UPLOAD_FILEPART_SIZE,
  ONE_TIME_MEDIA_TTL_SECONDS,
  SCHEDULED_WHEN_ONLINE,
  SEND_MESSAGE_ACTION_INTERVAL,
  SERVICE_NOTIFICATIONS_USER_ID,
} from '../../config';
import { requestMeasure, requestNextMutation } from '../../lib/fasterdom/fasterdom';
import {
  canEditMedia,
  getAllowedAttachmentOptions,
  getReactionKey,
  getStoryKey,
  isChatAdmin,
  isChatChannel,
  isChatSuperGroup,
  isSameReaction,
  isSystemBot,
  isUserId,
} from '../../global/helpers';
import {
  selectBot,
  selectCanPlayAnimatedEmojis,
  selectCanScheduleUntilOnline,
  selectChat,
  selectChatFullInfo,
  selectChatMessage,
  selectChatType,
  selectCurrentMessageList,
  selectDraft,
  selectEditingDraft,
  selectEditingMessage,
  selectEditingScheduledDraft,
  selectIsChatWithSelf,
  selectIsCurrentUserPremium,
  selectIsInSelectMode,
  selectIsPremiumPurchaseBlocked,
  selectIsReactionPickerOpen,
  selectIsRightColumnShown,
  selectNewestMessageWithBotKeyboardButtons,
  selectNoWebPage,
  selectPeerStory,
  selectPerformanceSettingsValue,
  selectRequestedDraft,
  selectRequestedDraftFiles,
  selectTabState,
  selectTheme,
  selectTopicFromMessage,
  selectUser,
  selectUserFullInfo,
} from '../../global/selectors';
import { selectCurrentLimit } from '../../global/selectors/limits';
import buildClassName from '../../util/buildClassName';
import { formatMediaDuration, formatVoiceRecordDuration } from '../../util/dates/dateFormat';
import { processDeepLink } from '../../util/deeplink';
import { tryParseDeepLink } from '../../util/deepLinkParser';
import deleteLastCharacterOutsideSelection from '../../util/deleteLastCharacterOutsideSelection';
import { processMessageInputForCustomEmoji } from '../../util/emoji/customEmojiManager';
import focusEditableElement from '../../util/focusEditableElement';
import { MEMO_EMPTY_ARRAY } from '../../util/memo';
import parseHtmlAsFormattedText from '../../util/parseHtmlAsFormattedText';
import { insertHtmlInSelection } from '../../util/selection';
import { getServerTime } from '../../util/serverTime';
import { IS_IOS, IS_VOICE_RECORDING_SUPPORTED } from '../../util/windowEnvironment';
import windowSize from '../../util/windowSize';
import applyIosAutoCapitalizationFix from '../middle/composer/helpers/applyIosAutoCapitalizationFix';
import buildAttachment, { prepareAttachmentsToSend } from '../middle/composer/helpers/buildAttachment';
import { buildCustomEmojiHtml } from '../middle/composer/helpers/customEmoji';
import { isSelectionInsideInput } from '../middle/composer/helpers/selection';
import { getPeerColorClass } from './helpers/peerColor';
import renderText from './helpers/renderText';
import { getTextWithEntitiesAsHtml } from './helpers/renderTextWithEntities';

import useInterval from '../../hooks/schedulers/useInterval';
import useTimeout from '../../hooks/schedulers/useTimeout';
import useContextMenuHandlers from '../../hooks/useContextMenuHandlers';
import useDerivedState from '../../hooks/useDerivedState';
import useEffectWithPrevDeps from '../../hooks/useEffectWithPrevDeps';
import useFlag from '../../hooks/useFlag';
import useGetSelectionRange from '../../hooks/useGetSelectionRange';
import useLastCallback from '../../hooks/useLastCallback';
import useOldLang from '../../hooks/useOldLang';
import usePreviousDeprecated from '../../hooks/usePreviousDeprecated';
import useSchedule from '../../hooks/useSchedule';
import useSendMessageAction from '../../hooks/useSendMessageAction';
import useShowTransitionDeprecated from '../../hooks/useShowTransitionDeprecated';
import { useStateRef } from '../../hooks/useStateRef';
import useSyncEffect from '../../hooks/useSyncEffect';
import useAttachmentModal from '../middle/composer/hooks/useAttachmentModal';
import useChatCommandTooltip from '../middle/composer/hooks/useChatCommandTooltip';
import useClipboardPaste from '../middle/composer/hooks/useClipboardPaste';
import useCustomEmojiTooltip from '../middle/composer/hooks/useCustomEmojiTooltip';
import useDraft from '../middle/composer/hooks/useDraft';
import useEditing from '../middle/composer/hooks/useEditing';
import useEmojiTooltip from '../middle/composer/hooks/useEmojiTooltip';
import useInlineBotTooltip from '../middle/composer/hooks/useInlineBotTooltip';
import useMentionTooltip from '../middle/composer/hooks/useMentionTooltip';
import useStickerTooltip from '../middle/composer/hooks/useStickerTooltip';
import useVoiceRecording from '../middle/composer/hooks/useVoiceRecording';

import AttachmentModal from '../middle/composer/AttachmentModal.async';
import AttachMenu from '../middle/composer/AttachMenu';
import BotCommandMenu from '../middle/composer/BotCommandMenu.async';
import BotKeyboardMenu from '../middle/composer/BotKeyboardMenu';
import BotMenuButton from '../middle/composer/BotMenuButton';
import ChatCommandTooltip from '../middle/composer/ChatCommandTooltip.async';
import ComposerEmbeddedMessage from '../middle/composer/ComposerEmbeddedMessage';
import CustomEmojiTooltip from '../middle/composer/CustomEmojiTooltip.async';
import CustomSendMenu from '../middle/composer/CustomSendMenu.async';
import DropArea, { DropAreaState } from '../middle/composer/DropArea.async';
import EmojiTooltip from '../middle/composer/EmojiTooltip.async';
import InlineBotTooltip from '../middle/composer/InlineBotTooltip.async';
import MentionTooltip from '../middle/composer/MentionTooltip.async';
import MessageInput from '../middle/composer/MessageInput';
import PollModal from '../middle/composer/PollModal.async';
import SendAsMenu from '../middle/composer/SendAsMenu.async';
import StickerTooltip from '../middle/composer/StickerTooltip.async';
import SymbolMenuButton from '../middle/composer/SymbolMenuButton';
import WebPagePreview from '../middle/composer/WebPagePreview';
import MessageEffect from '../middle/message/MessageEffect';
import ReactionSelector from '../middle/message/reactions/ReactionSelector';
import Button from '../ui/Button';
import ResponsiveHoverButton from '../ui/ResponsiveHoverButton';
import Spinner from '../ui/Spinner';
import Avatar from './Avatar';
import Icon from './icons/Icon';
import ReactionAnimatedEmoji from './reactions/ReactionAnimatedEmoji';
import SelectWithLabel from '../ui/SelectWithLabel';
import Spinner from '../ui/Spinner';
import TextArea from '../ui/TextArea';
import WebPagePreview from '../middle/composer/WebPagePreview';
import Button from '../ui/Button';
import Clock from '../ui/Clock';
import Drag from '../ui/Drag';
import EnigmaKeyInput from './EnigmaKeyInput';
import { getTranslation } from '../../util/langProvider';

import './Composer.scss';

type ComposerType = 'messageList' | 'story';

type OwnProps = {
  type: ComposerType;
  chatId: string;
  threadId: ThreadId;
  storyId?: number;
  messageListType: MessageListType;
  dropAreaState?: string;
  isReady: boolean;
  isMobile?: boolean;
  inputId: string;
  editableInputCssSelector: string;
  editableInputId: string;
  className?: string;
  inputPlaceholder?: string;
  onDropHide?: NoneToVoidFunction;
  onForward?: NoneToVoidFunction;
  onFocus?: NoneToVoidFunction;
  onBlur?: NoneToVoidFunction;
};

type StateProps =
  {
    isOnActiveTab: boolean;
    editingMessage?: ApiMessage;
    chat?: ApiChat;
    chatFullInfo?: ApiChatFullInfo;
    draft?: ApiDraft;
    replyToTopic?: ApiTopic;
    currentMessageList?: MessageList;
    isChatWithBot?: boolean;
    isChatWithSelf?: boolean;
    isChannel?: boolean;
    isForCurrentMessageList: boolean;
    isRightColumnShown?: boolean;
    isSelectModeActive?: boolean;
    isReactionPickerOpen?: boolean;
    isForwarding?: boolean;
    pollModal: TabState['pollModal'];
    botKeyboardMessageId?: number;
    botKeyboardPlaceholder?: string;
    withScheduledButton?: boolean;
    isInScheduledList?: boolean;
    canScheduleUntilOnline?: boolean;
    stickersForEmoji?: ApiSticker[];
    customEmojiForEmoji?: ApiSticker[];
    currentUserId?: string;
    currentUser?: ApiUser;
    recentEmojis: string[];
    contentToBeScheduled?: TabState['contentToBeScheduled'];
    shouldSuggestStickers?: boolean;
    shouldSuggestCustomEmoji?: boolean;
    baseEmojiKeywords?: Record<string, string[]>;
    emojiKeywords?: Record<string, string[]>;
    topInlineBotIds?: string[];
    isInlineBotLoading: boolean;
    inlineBots?: Record<string, false | InlineBotSettings>;
    botCommands?: ApiBotCommand[] | false;
    botMenuButton?: ApiBotMenuButton;
    sendAsUser?: ApiUser;
    sendAsChat?: ApiChat;
    sendAsId?: string;
    editingDraft?: ApiFormattedText;
    requestedDraft?: ApiFormattedText;
    requestedDraftFiles?: File[];
    attachBots: GlobalState['attachMenu']['bots'];
    attachMenuPeerType?: ApiAttachMenuPeerType;
    theme: ISettings['theme'];
    fileSizeLimit: number;
    captionLimit: number;
    isCurrentUserPremium?: boolean;
    canSendVoiceByPrivacy?: boolean;
    attachmentSettings: GlobalState['attachmentSettings'];
    slowMode?: ApiChatFullInfo['slowMode'];
    shouldUpdateStickerSetOrder?: boolean;
    availableReactions?: ApiAvailableReaction[];
    topReactions?: ApiReaction[];
    canPlayAnimatedEmojis?: boolean;
    canBuyPremium?: boolean;
    shouldCollectDebugLogs?: boolean;
    sentStoryReaction?: ApiReaction;
    stealthMode?: ApiStealthMode;
    canSendOneTimeMedia?: boolean;
    quickReplyMessages?: Record<number, ApiMessage>;
    quickReplies?: Record<number, ApiQuickReply>;
    canSendQuickReplies?: boolean;
    webPagePreview?: ApiWebPage;
    noWebPage?: boolean;
    isContactRequirePremium?: boolean;
    effect?: ApiAvailableEffect;
    effectReactions?: ApiReaction[];
    areEffectsSupported?: boolean;
    canPlayEffect?: boolean;
    shouldPlayEffect?: boolean;
    maxMessageLength: number;
  };

enum MainButtonState {
  Send = 'send',
  Record = 'record',
  Edit = 'edit',
  Schedule = 'schedule',
  Forward = 'forward',
  SendOneTime = 'sendOneTime',
}

type ScheduledMessageArgs = TabState['contentToBeScheduled'] | {
  id: string; queryId: string; isSilent?: boolean;
};

const VOICE_RECORDING_FILENAME = 'wonderful-voice-message.ogg';
// When voice recording is active, composer placeholder will hide to prevent overlapping
const SCREEN_WIDTH_TO_HIDE_PLACEHOLDER = 600; // px

const MOBILE_KEYBOARD_HIDE_DELAY_MS = 100;
const SELECT_MODE_TRANSITION_MS = 200;
const SENDING_ANIMATION_DURATION = 350;
const MOUNT_ANIMATION_DURATION = 430;

const Composer: FC<OwnProps & StateProps> = ({
  type,
  isOnActiveTab,
  dropAreaState,
  isInScheduledList,
  canScheduleUntilOnline,
  isReady,
  isMobile,
  onDropHide,
  onFocus,
  onBlur,
  editingMessage,
  chatId,
  threadId,
  storyId,
  currentMessageList,
  messageListType,
  draft,
  chat,
  chatFullInfo,
  replyToTopic,
  isForCurrentMessageList,
  isCurrentUserPremium,
  canSendVoiceByPrivacy,
  isChatWithBot,
  isChatWithSelf,
  isChannel,
  fileSizeLimit,
  isRightColumnShown,
  isSelectModeActive,
  isReactionPickerOpen,
  isForwarding,
  pollModal,
  botKeyboardMessageId,
  botKeyboardPlaceholder,
  inputPlaceholder,
  withScheduledButton,
  stickersForEmoji,
  customEmojiForEmoji,
  topInlineBotIds,
  currentUserId,
  currentUser,
  captionLimit,
  contentToBeScheduled,
  shouldSuggestStickers,
  shouldSuggestCustomEmoji,
  baseEmojiKeywords,
  emojiKeywords,
  recentEmojis,
  inlineBots,
  isInlineBotLoading,
  botCommands,
  sendAsUser,
  sendAsChat,
  sendAsId,
  editingDraft,
  requestedDraft,
  requestedDraftFiles,
  botMenuButton,
  attachBots,
  attachMenuPeerType,
  attachmentSettings,
  theme,
  slowMode,
  shouldUpdateStickerSetOrder,
  editableInputCssSelector,
  editableInputId,
  inputId,
  className,
  availableReactions,
  topReactions,
  canBuyPremium,
  canPlayAnimatedEmojis,
  shouldCollectDebugLogs,
  sentStoryReaction,
  stealthMode,
  canSendOneTimeMedia,
  quickReplyMessages,
  quickReplies,
  canSendQuickReplies,
  onForward,
  webPagePreview,
  noWebPage,
  isContactRequirePremium,
  effect,
  effectReactions,
  areEffectsSupported,
  canPlayEffect,
  shouldPlayEffect,
  maxMessageLength,
}) => {
  const {
    sendMessage,
    clearDraft,
    showDialog,
    forwardMessages,
    openPollModal,
    closePollModal,
    loadScheduledHistory,
    openThread,
    addRecentEmoji,
    sendInlineBotResult,
    loadSendAs,
    resetOpenChatWithDraft,
    callAttachBot,
    addRecentCustomEmoji,
    showNotification,
    showAllowedMessageTypesNotification,
    openStoryReactionPicker,
    closeReactionPicker,
    sendStoryReaction,
    editMessage,
    updateAttachmentSettings,
    saveEffectInDraft,
    setReactionEffect,
    hideEffectInComposer,
  } = getActions();

  const lang = useOldLang();

  // eslint-disable-next-line no-null/no-null
  const inputRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line no-null/no-null
  const storyReactionRef = useRef<HTMLButtonElement>(null);

  const [getHtml, setHtml] = useSignal('');
  const [isMounted, setIsMounted] = useState(false);
  const getSelectionRange = useGetSelectionRange(editableInputCssSelector);
  const lastMessageSendTimeSeconds = useRef<number>();
  const prevDropAreaState = usePreviousDeprecated(dropAreaState);
  const { width: windowWidth } = windowSize.get();

  const isInMessageList = type === 'messageList';
  const isInStoryViewer = type === 'story';
  const sendAsPeerIds = isInMessageList ? chat?.sendAsPeerIds : undefined;
  const canShowSendAs = sendAsPeerIds
    && (sendAsPeerIds.length > 1 || !sendAsPeerIds.some((peer) => peer.id === currentUserId!));
  // Prevent Symbol Menu from closing when calendar is open
  const [isSymbolMenuForced, forceShowSymbolMenu, cancelForceShowSymbolMenu] = useFlag();
  const sendMessageAction = useSendMessageAction(chatId, threadId);
  const [isInputHasFocus, markInputHasFocus, unmarkInputHasFocus] = useFlag();
  const [isAttachMenuOpen, onAttachMenuOpen, onAttachMenuClose] = useFlag();

  const canMediaBeReplaced = editingMessage && canEditMedia(editingMessage);

  const { emojiSet, members: groupChatMembers, botCommands: chatBotCommands } = chatFullInfo || {};
  const chatEmojiSetId = emojiSet?.id;

  const isSentStoryReactionHeart = sentStoryReaction && isSameReaction(sentStoryReaction, HEART_REACTION);

  useEffect(processMessageInputForCustomEmoji, [getHtml]);

  const customEmojiNotificationNumber = useRef(0);

  const [requestCalendar, calendar] = useSchedule(
    isInMessageList && canScheduleUntilOnline,
    cancelForceShowSymbolMenu,
  );

  useTimeout(() => {
    setIsMounted(true);
  }, MOUNT_ANIMATION_DURATION);

  useEffect(() => {
    if (isInMessageList) return;

    closeReactionPicker();
  }, [isInMessageList, storyId]);

  useEffect(() => {
    lastMessageSendTimeSeconds.current = undefined;
  }, [chatId]);

  useEffect(() => {
    if (chatId && isReady && !isInStoryViewer) {
      loadScheduledHistory({ chatId });
    }
  }, [isReady, chatId, threadId, isInStoryViewer]);

  useEffect(() => {
    const isChannelWithProfiles = isChannel && chat?.areProfilesShown;
    if (chatId && chat && !sendAsPeerIds && isReady && (isChatSuperGroup(chat) || isChannelWithProfiles)) {
      loadSendAs({ chatId });
    }
  }, [chat, chatId, isChannel, isReady, loadSendAs, sendAsPeerIds]);

  const shouldAnimateSendAsButtonRef = useRef(false);
  useSyncEffect(([prevChatId, prevSendAsPeerIds]) => {
    // We only animate send-as button if `sendAsPeerIds` was missing when opening the chat
    shouldAnimateSendAsButtonRef.current = Boolean(chatId === prevChatId && sendAsPeerIds && !prevSendAsPeerIds);
  }, [chatId, sendAsPeerIds]);

  const [attachments, setAttachments] = useState<ApiAttachment[]>([]);
  const hasAttachments = Boolean(attachments.length);
  const [nextText, setNextText] = useState<ApiFormattedText | undefined>(undefined);

  const {
    canSendStickers, canSendGifs, canAttachMedia, canAttachPolls, canAttachEmbedLinks,
    canSendVoices, canSendPlainText, canSendAudios, canSendVideos, canSendPhotos, canSendDocuments,
  } = useMemo(
    () => getAllowedAttachmentOptions(chat, chatFullInfo, isChatWithBot, isInStoryViewer),
    [chat, chatFullInfo, isChatWithBot, isInStoryViewer],
  );

  const isNeedPremium = isContactRequirePremium && isInStoryViewer;
  const isSendTextBlocked = isNeedPremium || !canSendPlainText;

  const hasWebPagePreview = !hasAttachments && canAttachEmbedLinks && !noWebPage && Boolean(webPagePreview);
  const isComposerBlocked = isSendTextBlocked && !editingMessage;

  useEffect(() => {
    if (!hasWebPagePreview) {
      updateAttachmentSettings({ isInvertedMedia: undefined });
    }
  }, [hasWebPagePreview]);

  const insertHtmlAndUpdateCursor = useLastCallback((newHtml: string, inInputId: string = editableInputId) => {
    if (inInputId === editableInputId && isComposerBlocked) return;
    const selection = window.getSelection()!;
    let messageInput: HTMLDivElement;
    if (inInputId === editableInputId) {
      messageInput = document.querySelector<HTMLDivElement>(editableInputCssSelector)!;
    } else {
      messageInput = document.getElementById(inInputId) as HTMLDivElement;
    }

    if (selection.rangeCount) {
      const selectionRange = selection.getRangeAt(0);
      if (isSelectionInsideInput(selectionRange, inInputId)) {
        insertHtmlInSelection(newHtml);
        messageInput.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
    }

    setHtml(`${getHtml()}${newHtml}`);

    // If selection is outside of input, set cursor at the end of input
    requestNextMutation(() => {
      focusEditableElement(messageInput);
    });
  });

  const insertTextAndUpdateCursor = useLastCallback((
    text: string, inInputId: string = editableInputId,
  ) => {
    const newHtml = renderText(text, ['escape_html', 'emoji_html', 'br_html'])
      .join('')
      .replace(/\u200b+/g, '\u200b');
    insertHtmlAndUpdateCursor(newHtml, inInputId);
  });

  const insertFormattedTextAndUpdateCursor = useLastCallback((
    text: ApiFormattedText, inInputId: string = editableInputId,
  ) => {
    const newHtml = getTextWithEntitiesAsHtml(text);
    insertHtmlAndUpdateCursor(newHtml, inInputId);
  });

  const insertCustomEmojiAndUpdateCursor = useLastCallback((emoji: ApiSticker, inInputId: string = editableInputId) => {
    insertHtmlAndUpdateCursor(buildCustomEmojiHtml(emoji), inInputId);
  });

  const insertNextText = useLastCallback(() => {
    if (!nextText) return;
    insertFormattedTextAndUpdateCursor(nextText, editableInputId);
    setNextText(undefined);
  });

  const {
    shouldSuggestCompression,
    shouldForceCompression,
    shouldForceAsFile,
    handleAppendFiles,
    handleFileSelect,
    onCaptionUpdate,
    handleClearAttachments,
    handleSetAttachments,
  } = useAttachmentModal({
    attachments,
    setHtml,
    setAttachments,
    fileSizeLimit,
    chatId,
    canSendAudios,
    canSendVideos,
    canSendPhotos,
    canSendDocuments,
    insertNextText,
    editedMessage: editingMessage,
  });

  const [isBotKeyboardOpen, openBotKeyboard, closeBotKeyboard] = useFlag();
  const [isBotCommandMenuOpen, openBotCommandMenu, closeBotCommandMenu] = useFlag();
  const [isSymbolMenuOpen, openSymbolMenu, closeSymbolMenu] = useFlag();
  const [isSendAsMenuOpen, openSendAsMenu, closeSendAsMenu] = useFlag();
  const [isHoverDisabled, disableHover, enableHover] = useFlag();

  const {
    startRecordingVoice,
    stopRecordingVoice,
    pauseRecordingVoice,
    activeVoiceRecording,
    currentRecordTime,
    recordButtonRef: mainButtonRef,
    startRecordTimeRef,
    isViewOnceEnabled,
    setIsViewOnceEnabled,
    toogleViewOnceEnabled,
  } = useVoiceRecording();

  const shouldSendRecordingStatus = isForCurrentMessageList && !isInStoryViewer;
  useInterval(() => {
    sendMessageAction({ type: 'recordAudio' });
  }, shouldSendRecordingStatus ? activeVoiceRecording && SEND_MESSAGE_ACTION_INTERVAL : undefined);

  useEffect(() => {
    if (!isForCurrentMessageList || isInStoryViewer) return;
    if (!activeVoiceRecording) {
      sendMessageAction({ type: 'cancel' });
    }
  }, [activeVoiceRecording, isForCurrentMessageList, isInStoryViewer, sendMessageAction]);

  const isEditingRef = useStateRef(Boolean(editingMessage));
  useEffect(() => {
    if (!isForCurrentMessageList || isInStoryViewer) return;
    if (getHtml() && !isEditingRef.current) {
      sendMessageAction({ type: 'typing' });
    }
  }, [getHtml, isEditingRef, isForCurrentMessageList, isInStoryViewer, sendMessageAction]);

  const isAdmin = chat && isChatAdmin(chat);

  const {
    isEmojiTooltipOpen,
    closeEmojiTooltip,
    filteredEmojis,
    filteredCustomEmojis,
    insertEmoji,
  } = useEmojiTooltip(
    Boolean(isReady && isOnActiveTab && (isInStoryViewer || isForCurrentMessageList)
      && shouldSuggestStickers && !hasAttachments),
    getHtml,
    setHtml,
    undefined,
    recentEmojis,
    baseEmojiKeywords,
    emojiKeywords,
  );

  const {
    isCustomEmojiTooltipOpen,
    closeCustomEmojiTooltip,
    insertCustomEmoji,
  } = useCustomEmojiTooltip(
    Boolean(isReady && isOnActiveTab && (isInStoryViewer || isForCurrentMessageList)
      && shouldSuggestCustomEmoji && !hasAttachments),
    getHtml,
    setHtml,
    getSelectionRange,
    inputRef,
    customEmojiForEmoji,
  );

  const {
    isStickerTooltipOpen,
    closeStickerTooltip,
  } = useStickerTooltip(
    Boolean(isReady
      && isOnActiveTab
      && (isInStoryViewer || isForCurrentMessageList)
      && shouldSuggestStickers
      && canSendStickers
      && !hasAttachments),
    getHtml,
    stickersForEmoji,
  );

  const {
    isMentionTooltipOpen,
    closeMentionTooltip,
    insertMention,
    mentionFilteredUsers,
  } = useMentionTooltip(
    Boolean(isInMessageList && isReady && isForCurrentMessageList && !hasAttachments),
    getHtml,
    setHtml,
    getSelectionRange,
    inputRef,
    groupChatMembers,
    topInlineBotIds,
    currentUserId,
  );

  const {
    isOpen: isInlineBotTooltipOpen,
    botId: inlineBotId,
    isGallery: isInlineBotTooltipGallery,
    switchPm: inlineBotSwitchPm,
    switchWebview: inlineBotSwitchWebview,
    results: inlineBotResults,
    closeTooltip: closeInlineBotTooltip,
    help: inlineBotHelp,
    loadMore: loadMoreForInlineBot,
  } = useInlineBotTooltip(
    Boolean(isInMessageList && isReady && isForCurrentMessageList && !hasAttachments),
    chatId,
    getHtml,
    inlineBots,
  );

  const hasQuickReplies = Boolean(quickReplies && Object.keys(quickReplies).length);

  const {
    isOpen: isChatCommandTooltipOpen,
    close: closeChatCommandTooltip,
    filteredBotCommands: botTooltipCommands,
    filteredQuickReplies: quickReplyCommands,
  } = useChatCommandTooltip(
    Boolean(isInMessageList
      && isReady
      && isForCurrentMessageList
      && ((botCommands && botCommands?.length) || chatBotCommands?.length || (hasQuickReplies && canSendQuickReplies))),
    getHtml,
    botCommands,
    chatBotCommands,
    canSendQuickReplies ? quickReplies : undefined,
  );

  useDraft({
    draft,
    chatId,
    threadId,
    getHtml,
    setHtml,
    editedMessage: editingMessage,
    isDisabled: isInStoryViewer || Boolean(requestedDraft),
  });

  const resetComposer = useLastCallback((shouldPreserveInput = false) => {
    if (!shouldPreserveInput) {
      setHtml('');
    }

    setAttachments(MEMO_EMPTY_ARRAY);
    setNextText(undefined);

    closeEmojiTooltip();
    closeCustomEmojiTooltip();
    closeStickerTooltip();
    closeMentionTooltip();

    if (isMobile) {
      // @optimization
      setTimeout(() => closeSymbolMenu(), SENDING_ANIMATION_DURATION);
    } else {
      closeSymbolMenu();
    }
  });

  const [handleEditComplete, handleEditCancel, shouldForceShowEditing] = useEditing(
    getHtml,
    setHtml,
    editingMessage,
    resetComposer,
    chatId,
    threadId,
    messageListType,
    draft,
    editingDraft,
  );

  // Handle chat change (should be placed after `useDraft` and `useEditing`)
  const resetComposerRef = useStateRef(resetComposer);
  const stopRecordingVoiceRef = useStateRef(stopRecordingVoice);
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
      stopRecordingVoiceRef.current();
      // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
      resetComposerRef.current();
    };
  }, [chatId, threadId, resetComposerRef, stopRecordingVoiceRef]);

  const showCustomEmojiPremiumNotification = useLastCallback(() => {
    const notificationNumber = customEmojiNotificationNumber.current;
    if (!notificationNumber) {
      showNotification({
        message: lang('UnlockPremiumEmojiHint'),
        action: {
          action: 'openPremiumModal',
          payload: { initialSection: 'animated_emoji' },
        },
        actionText: lang('PremiumMore'),
      });
    } else {
      showNotification({
        message: lang('UnlockPremiumEmojiHint2'),
        action: {
          action: 'openChat',
          payload: { id: currentUserId, shouldReplaceHistory: true },
        },
        actionText: lang('Open'),
      });
    }
    customEmojiNotificationNumber.current = Number(!notificationNumber);
  });

  const mainButtonState = useDerivedState(() => {
    if (!isInputHasFocus && onForward && !(getHtml() && !hasAttachments)) {
      return MainButtonState.Forward;
    }

    if (editingMessage && shouldForceShowEditing) {
      return MainButtonState.Edit;
    }

    if (IS_VOICE_RECORDING_SUPPORTED && !activeVoiceRecording && !isForwarding && !(getHtml() && !hasAttachments)) {
      return MainButtonState.Record;
    }

    if (isInScheduledList) {
      return MainButtonState.Schedule;
    }

    return MainButtonState.Send;
  }, [
    activeVoiceRecording, editingMessage, getHtml, hasAttachments, isForwarding, isInputHasFocus, onForward,
    shouldForceShowEditing, isInScheduledList,
  ]);
  const canShowCustomSendMenu = !isInScheduledList;

  const {
    isContextMenuOpen: isCustomSendMenuOpen,
    handleContextMenu,
    handleContextMenuClose,
    handleContextMenuHide,
  } = useContextMenuHandlers(mainButtonRef, !(mainButtonState === MainButtonState.Send && canShowCustomSendMenu));

  const {
    contextMenuAnchor: storyReactionPickerAnchor,
    handleContextMenu: handleStoryPickerContextMenu,
    handleBeforeContextMenu: handleBeforeStoryPickerContextMenu,
    handleContextMenuHide: handleStoryPickerContextMenuHide,
  } = useContextMenuHandlers(storyReactionRef, !isInStoryViewer);

  useEffect(() => {
    if (isReactionPickerOpen) return;

    if (storyReactionPickerAnchor) {
      openStoryReactionPicker({
        peerId: chatId,
        storyId: storyId!,
        position: storyReactionPickerAnchor,
      });
      handleStoryPickerContextMenuHide();
    }
  }, [chatId, handleStoryPickerContextMenuHide, isReactionPickerOpen, storyId, storyReactionPickerAnchor]);

  useClipboardPaste(
    isForCurrentMessageList || isInStoryViewer,
    insertFormattedTextAndUpdateCursor,
    handleSetAttachments,
    setNextText,
    editingMessage,
    !isCurrentUserPremium && !isChatWithSelf,
    showCustomEmojiPremiumNotification,
  );

  const handleEmbeddedClear = useLastCallback(() => {
    if (editingMessage) {
      handleEditCancel();
    }
  });

  const validateTextLength = useLastCallback((text: string, isAttachmentModal?: boolean) => {
    const maxLength = isAttachmentModal ? captionLimit : maxMessageLength;
    if (text?.length > maxLength) {
      const extraLength = text.length - maxLength;
      showDialog({
        data: {
          message: 'MESSAGE_TOO_LONG_PLEASE_REMOVE_CHARACTERS',
          textParams: {
            '{EXTRA_CHARS_COUNT}': extraLength.toString(),
            '{PLURAL_S}': extraLength > 1 ? 's' : '',
          },
          hasErrorKey: true,
        },
      });

      return false;
    }
    return true;
  });

  const checkSlowMode = useLastCallback(() => {
    if (slowMode && !isAdmin) {
      const messageInput = document.querySelector<HTMLDivElement>(editableInputCssSelector);

      const nowSeconds = getServerTime();
      const secondsSinceLastMessage = lastMessageSendTimeSeconds.current
        && Math.floor(nowSeconds - lastMessageSendTimeSeconds.current);
      const nextSendDateNotReached = slowMode.nextSendDate && slowMode.nextSendDate > nowSeconds;

      if (
        (secondsSinceLastMessage && secondsSinceLastMessage < slowMode.seconds)
        || nextSendDateNotReached
      ) {
        const secondsRemaining = nextSendDateNotReached
          ? slowMode.nextSendDate! - nowSeconds
          : slowMode.seconds - secondsSinceLastMessage!;
        showDialog({
          data: {
            message: lang('SlowModeHint', formatMediaDuration(secondsRemaining)),
            isSlowMode: true,
            hasErrorKey: false,
          },
        });

        messageInput?.blur();

        return false;
      }
    }
    return true;
  });

  const sendAttachments = useLastCallback(({
    attachments: attachmentsToSend,
    sendCompressed = attachmentSettings.shouldCompress,
    sendGrouped = attachmentSettings.shouldSendGrouped,
    isSilent,
    scheduledAt,
    isInvertedMedia,
  }: {
    attachments: ApiAttachment[];
    sendCompressed?: boolean;
    sendGrouped?: boolean;
    isSilent?: boolean;
    scheduledAt?: number;
    isInvertedMedia?: true;
  }) => {
    if (!currentMessageList && !storyId) {
      return;
    }

    const { text, entities } = parseHtmlAsFormattedText(getHtml());
    if (!text && !attachmentsToSend.length) {
      return;
    }
    if (!validateTextLength(text, true)) return;
    if (!checkSlowMode()) return;

    isInvertedMedia = text && sendCompressed && sendGrouped ? isInvertedMedia : undefined;

    if (editingMessage) {
      editMessage({
        messageList: currentMessageList,
        text,
        entities,
        attachments: prepareAttachmentsToSend(attachmentsToSend, sendCompressed),
      });
    } else {
      sendMessage({
        messageList: currentMessageList,
        text,
        entities,
        scheduledAt,
        isSilent,
        shouldUpdateStickerSetOrder,
        attachments: prepareAttachmentsToSend(attachmentsToSend, sendCompressed),
        shouldGroupMessages: sendGrouped,
        isInvertedMedia,
      });
    }

    lastMessageSendTimeSeconds.current = getServerTime();

    clearDraft({ chatId, isLocalOnly: true });

    // Wait until message animation starts
    requestMeasure(() => {
      resetComposer();
    });
  });

  const handleSendAttachmentsFromModal = useLastCallback((
    sendCompressed: boolean,
    sendGrouped: boolean,
    isInvertedMedia?: true,
  ) => {
    sendAttachments({
      attachments,
      sendCompressed,
      sendGrouped,
      isInvertedMedia,
    });
  });

  const handleSendAttachments = useLastCallback((
    sendCompressed: boolean,
    sendGrouped: boolean,
    isSilent?: boolean,
    scheduledAt?: number,
    isInvertedMedia?: true,
  ) => {
    sendAttachments({
      attachments,
      sendCompressed,
      sendGrouped,
      isSilent,
      scheduledAt,
      isInvertedMedia,
    });
  });

  const handleSend = useLastCallback(async (isSilent = false, scheduledAt?: number) => {
    if (!currentMessageList && !storyId) {
      return;
    }

    let currentAttachments = attachments;

    if (activeVoiceRecording) {
      const record = await stopRecordingVoice();
      const ttlSeconds = isViewOnceEnabled ? ONE_TIME_MEDIA_TTL_SECONDS : undefined;
      if (record) {
        const { blob, duration, waveform } = record;
        currentAttachments = [await buildAttachment(
          VOICE_RECORDING_FILENAME,
          blob,
          { voice: { duration, waveform }, ttlSeconds },
        )];
      }
    }

    const { text, entities } = parseHtmlAsFormattedText(getHtml());

    if (currentAttachments.length) {
      sendAttachments({
        attachments: currentAttachments,
        scheduledAt,
        isSilent,
      });
      return;
    }

    if (!text && !isForwarding) {
      return;
    }

    if (!validateTextLength(text)) return;

    const messageInput = document.querySelector<HTMLDivElement>(editableInputCssSelector);

    const effectId = effect?.id;

    if (text) {
      if (!checkSlowMode()) return;

      const isInvertedMedia = hasWebPagePreview ? attachmentSettings.isInvertedMedia : undefined;

      if (areEffectsSupported) saveEffectInDraft({ chatId, threadId, effectId: undefined });

      // Encrypt text if enigma is enabled and key is valid
      let processedText = text;
      let processedEntities = entities;
      
      if (enigmaEnabled && enigmaKey) {
        try {
          import('../../lib/enigma/EnigmaEncryption').then((module) => {
            const enigmaEncryption = module.default;
            if (enigmaEncryption.validateKey(enigmaKey)) {
              processedText = enigmaEncryption.encryptText(text, enigmaKey);
              processedEntities = []; // Сбрасываем entities, так как они не будут иметь смысла в зашифрованном тексте
            }
          });
        } catch (error) {
          console.error('Error encrypting message:', error);
        }
      }

      sendMessage({
        messageList: currentMessageList,
        text: processedText,
        entities: processedEntities,
        scheduledAt,
        isSilent,
        shouldUpdateStickerSetOrder,
        isInvertedMedia,
        effectId,
      recentEmojis: global.recentEmojis,
      baseEmojiKeywords: baseEmojiKeywords?.keywords,
      emojiKeywords: emojiKeywords?.keywords,
      inlineBots: tabState.inlineBots.byUsername,
      isInlineBotLoading: tabState.inlineBots.isLoading,
      botCommands: userFullInfo ? (userFullInfo.botInfo?.commands || false) : undefined,
      botMenuButton: userFullInfo?.botInfo?.menuButton,
      sendAsUser,
      sendAsChat,
      sendAsId,
      editingDraft,
      requestedDraft,
      requestedDraftFiles,
      attachBots: global.attachMenu.bots,
      attachMenuPeerType: selectChatType(global, chatId),
      theme: selectTheme(global),
      fileSizeLimit: selectCurrentLimit(global, 'uploadMaxFileparts') * MAX_UPLOAD_FILEPART_SIZE,
      captionLimit: selectCurrentLimit(global, 'captionLength'),
      isCurrentUserPremium,
      canSendVoiceByPrivacy,
      attachmentSettings: global.attachmentSettings,
      slowMode,
      currentMessageList,
      isReactionPickerOpen: selectIsReactionPickerOpen(global),
      canBuyPremium: !isCurrentUserPremium && !selectIsPremiumPurchaseBlocked(global),
      canPlayAnimatedEmojis: selectCanPlayAnimatedEmojis(global),
      canSendOneTimeMedia: !isChatWithSelf && isChatWithUser && !isChatWithBot && !isInScheduledList,
      shouldCollectDebugLogs: global.settings.byKey.shouldCollectDebugLogs,
      sentStoryReaction,
      stealthMode: global.stories.stealthMode,
      replyToTopic,
      quickReplyMessages: global.quickReplies.messagesById,
      quickReplies: global.quickReplies.byId,
      canSendQuickReplies,
      noWebPage,
      webPagePreview: selectTabState(global).webPagePreview,
      isContactRequirePremium: userFullInfo?.isContactRequirePremium,
      effect,
      effectReactions,
      areEffectsSupported,
      canPlayEffect,
      shouldPlayEffect,
      maxMessageLength,
    };
  },
)(Composer));
