import type { FC } from '../../../lib/teact/teact';
import React, { memo, useCallback, useEffect, useRef } from '../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../global';

import type { ApiPrivacySettings } from '../../../api/types';
import type { GlobalState } from '../../../global/types';
import { SettingsScreens } from '../../../types';

import { selectCanSetPasscode, selectIsCurrentUserPremium } from '../../../global/selectors';

import useHistoryBack from '../../../hooks/useHistoryBack';
import useLang from '../../../hooks/useLang';
import useOldLang from '../../../hooks/useOldLang';
import { getEnigmaUtils } from '../../../util/enigmaUtils';

import StarIcon from '../../common/icons/StarIcon';
import Checkbox from '../../ui/Checkbox';
import ListItem from '../../ui/ListItem';
import Switcher from '../../ui/Switcher';
import Button from '../../ui/Button';

import { CHAT_HEIGHT_PX } from '../../../config';
import { ApiPrivacyKey } from '../../../global/types';

type OwnProps = {
  isActive?: boolean;
  onScreenSelect: (screen: SettingsScreens) => void;
  onReset: () => void;
};

type StateProps = {
  isCurrentUserPremium?: boolean;
  hasPassword?: boolean;
  hasPasscode?: boolean;
  canSetPasscode?: boolean;
  blockedCount: number;
  webAuthCount: number;
  isSensitiveEnabled?: boolean;
  canChangeSensitive?: boolean;
  canDisplayAutoarchiveSetting: boolean;
  shouldArchiveAndMuteNewNonContact?: boolean;
  shouldNewNonContactPeersRequirePremium?: boolean;
  canDisplayChatInTitle?: boolean;
  privacy: GlobalState['settings']['privacy'];
  enigmaEnabled?: boolean;
};

const SettingsPrivacy: FC<OwnProps & StateProps> = ({
  isActive,
  isCurrentUserPremium,
  hasPassword,
  hasPasscode,
  blockedCount,
  webAuthCount,
  isSensitiveEnabled,
  canChangeSensitive,
  canDisplayAutoarchiveSetting,
  shouldArchiveAndMuteNewNonContact,
  shouldNewNonContactPeersRequirePremium,
  canDisplayChatInTitle,
  canSetPasscode,
  privacy,
  enigmaEnabled,
  onScreenSelect,
  onReset,
}) => {
  const {
    loadPrivacySettings,
    loadBlockedUsers,
    loadContentSettings,
    updateContentSettings,
    loadGlobalPrivacySettings,
    updateGlobalPrivacySettings,
    loadWebAuthorizations,
    setSettingOption,
    toggleEnigmaEnabled,
    showNotification,
    clearWebAuthorizations,
    loadBlockedContacts,
    loadPasswordInfo,
  } = getActions();

  useEffect(() => {
    loadBlockedUsers();
    loadPrivacySettings();
    loadContentSettings();
    loadWebAuthorizations();
  }, []);

  useEffect(() => {
    if (isActive) {
      loadGlobalPrivacySettings();
      loadBlockedContacts();
      loadPasswordInfo();
    }
  }, [isActive, loadGlobalPrivacySettings, loadBlockedContacts, loadPasswordInfo]);

  const oldLang = useOldLang();
  const lang = useLang();

  useHistoryBack({
    isActive,
    onBack: onReset,
  });

  const enigmaUtils = getEnigmaUtils();
  const isEnigmaEnabled = enigmaUtils.isEnigmaEnabled();

  const handleArchiveAndMuteChange = useCallback((isEnabled: boolean) => {
    updateGlobalPrivacySettings({
      shouldArchiveAndMuteNewNonContact: isEnabled,
    });
  }, [updateGlobalPrivacySettings]);

  const handleChatInTitleChange = useCallback((isChecked: boolean) => {
    setSettingOption({
      canDisplayChatInTitle: isChecked,
    });
  }, []);

  const handleUpdateContentSettings = useCallback((isChecked: boolean) => {
    updateContentSettings(isChecked);
  }, [updateContentSettings]);

  const handleEnigmaToggle = useCallback(() => {
    toggleEnigmaEnabled({ enabled: !enigmaEnabled });
    showNotification({ message: enigmaEnabled ? 'Enigma encryption disabled' : 'Enigma encryption enabled' });
  }, [toggleEnigmaEnabled, enigmaEnabled, showNotification]);

  const handleEnigmaClick = useCallback(() => {
    getActions().openEnigmaSettings();
  }, []);

  function getVisibilityValue(setting?: ApiPrivacySettings) {
    if (!setting) return oldLang('Loading');

    const { visibility, shouldAllowPremium, botsPrivacy } = setting;

    const isAllowBots = botsPrivacy === 'allow';
    const isVisibilityEverybody = visibility === 'everybody';
    const shouldShowBotsString = isAllowBots && !isVisibilityEverybody;

    const blockCount = setting.blockChatIds.length + setting.blockUserIds.length;
    const allowCount = setting.allowChatIds.length + setting.allowUserIds.length;
    const total = [];
    if (blockCount) total.push(`-${blockCount}`);
    if (allowCount && !isVisibilityEverybody) total.push(`+${allowCount}`);

    const botPrivacyString = shouldShowBotsString ? lang('PrivacyValueBots') : '';
    const totalString = lang.conjunction(total);

    const exceptionString = [botPrivacyString, totalString].filter(Boolean).join(' ');
    if (shouldShowBotsString && !isVisibilityEverybody) return exceptionString;

    if (shouldAllowPremium) {
      return oldLang(exceptionString ? 'ContactsAndPremium' : 'PrivacyPremium');
    }

    switch (visibility) {
      case 'everybody':
        return `${oldLang('P2PEverybody')} ${exceptionString}`;

      case 'contacts':
        return `${oldLang('P2PContacts')} ${exceptionString}`;

      case 'nobody':
        return `${oldLang('P2PNobody')} ${exceptionString}`;
    }

    return undefined;
  }

  return (
    <div className="settings-content custom-scroll">
      <div className="settings-item pt-3">
        <Button
          isText
          isDisabled={isRemoving}
          onClick={onReset}
          className="mb-1"
        >
          {lang('BackButton')}
        </Button>

        <p className="settings-item-description mb-4">{lang('PrivacySettings')}</p>
      </div>

      <div className="settings-item">
        <h4 className="settings-item-header">{lang('Privacy')}</h4>

        <ListItem
          icon="phone-outline"
          onClick={() => onScreenSelect(SettingsScreens.PrivacyPhoneNumber)}
        >
          <div className="multiline-menu-item">
            {lang('PrivacyPhone')}
            <span className="subtitle" dir="auto">
              {getVisibilityValue(privacy.phoneNumber)}
            </span>
          </div>
        </ListItem>

        <ListItem
          icon="lock"
          ripple
          onClick={handleEnigmaClick}
        >
          <div className="multiline-menu-item">
            Enigma Encryption
            <span className="subtitle" dir="auto">
              {isEnigmaEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <Switcher
            id="enigma-toggle"
            label="Toggle Enigma Encryption"
            checked={Boolean(isEnigmaEnabled)}
            inactive={false}
          />
        </ListItem>

        <ListItem
          icon="last-seen-outline"
          onClick={() => onScreenSelect(SettingsScreens.PrivacyLastSeen)}
        >
          <div className="multiline-menu-item">
            {lang('LastSeenTitle')}
            <span className="subtitle" dir="auto">
              {getVisibilityValue(privacy.lastSeen)}
            </span>
          </div>
        </ListItem>

        <ListItem
          icon="profile-outline"
          onClick={() => onScreenSelect(SettingsScreens.PrivacyProfilePhoto)}
        >
          <div className="multiline-menu-item">
            {lang('PrivacyProfilePhoto')}
            <span className="subtitle" dir="auto">
              {getVisibilityValue(privacy.profilePhoto)}
            </span>
          </div>
        </ListItem>

        <ListItem
          icon="bio-outline"
          onClick={() => onScreenSelect(SettingsScreens.PrivacyBio)}
        >
          <div className="multiline-menu-item">
            {lang('PrivacyBio')}
            <span className="subtitle" dir="auto">
              {getVisibilityValue(privacy.bio)}
            </span>
          </div>
        </ListItem>

        <ListItem
          icon="birthday-outline"
          onClick={() => onScreenSelect(SettingsScreens.PrivacyBirthday)}
        >
          <div className="multiline-menu-item">
            {lang('PrivacyBirthday')}
            <span className="subtitle" dir="auto">
              {getVisibilityValue(privacy.birthday)}
            </span>
          </div>
        </ListItem>

        <ListItem
          icon="gift-outline"
          onClick={() => onScreenSelect(SettingsScreens.PrivacyGifts)}
        >
          <div className="multiline-menu-item">
            {lang('PrivacyGifts')}
            <span className="subtitle" dir="auto">
              {getVisibilityValue(privacy.gifts)}
            </span>
          </div>
        </ListItem>

        <ListItem
          icon="forward-outline"
          onClick={() => onScreenSelect(SettingsScreens.PrivacyForwarding)}
        >
          <div className="multiline-menu-item">
            {lang('PrivacyForwards')}
            <span className="subtitle" dir="auto">
              {getVisibilityValue(privacy.forwards)}
            </span>
          </div>
        </ListItem>

        <ListItem
          icon="call-outline"
          onClick={() => onScreenSelect(SettingsScreens.PrivacyPhoneCall)}
        >
          <div className="multiline-menu-item">
            {lang('WhoCanCallMe')}
            <span className="subtitle" dir="auto">
              {getVisibilityValue(privacy.phoneCall)}
            </span>
          </div>
        </ListItem>

        <ListItem
          icon="mic-outline"
          onClick={() => onScreenSelect(SettingsScreens.PrivacyVoiceMessages)}
        >
          <div className="multiline-menu-item">
            {lang('PrivacyVoiceMessages')}
            <span className="subtitle" dir="auto">
              {getVisibilityValue(privacy.voiceMessages)}
            </span>
          </div>
        </ListItem>

        <ListItem
          icon="chat-outline"
          onClick={() => onScreenSelect(SettingsScreens.PrivacyMessages)}
        >
          <div className="multiline-menu-item">
            {lang('PrivacyMessages')}
            <span className="subtitle" dir="auto">
              {shouldNewNonContactPeersRequirePremium
                ? lang('PrivacyMessagesContactsAndPremium')
                : lang('P2PEverybody')}
            </span>
          </div>
        </ListItem>

        <ListItem
          icon="group-outline"
          onClick={() => onScreenSelect(SettingsScreens.PrivacyGroupChats)}
        >
          <div className="multiline-menu-item">
            {lang('WhoCanAddMe')}
            <span className="subtitle" dir="auto">
              {getVisibilityValue(privacy.chatInvite)}
            </span>
          </div>
        </ListItem>
      </div>

      {canChangeSensitive && (
        <div className="settings-item">
          <h4 className="settings-item-header" dir={oldLang.isRtl ? 'rtl' : undefined}>
            {oldLang('lng_settings_sensitive_title')}
          </h4>
          <Checkbox
            label={oldLang('lng_settings_sensitive_disable_filtering')}
            subLabel={oldLang('lng_settings_sensitive_about')}
            checked={Boolean(isSensitiveEnabled)}
            disabled={!canChangeSensitive}
            onCheck={handleUpdateContentSettings}
          />
        </div>
      )}

      {canDisplayAutoarchiveSetting && (
        <div className="settings-item">
          <h4 className="settings-item-header" dir={oldLang.isRtl ? 'rtl' : undefined}>
            {oldLang('NewChatsFromNonContacts')}
          </h4>
          <Checkbox
            label={oldLang('ArchiveAndMute')}
            subLabel={oldLang('ArchiveAndMuteInfo')}
            checked={Boolean(shouldArchiveAndMuteNewNonContact)}
            onCheck={handleArchiveAndMuteChange}
          />
        </div>
      )}

      <div className="settings-item">
        <h4 className="settings-item-header" dir={oldLang.isRtl ? 'rtl' : undefined}>
          {oldLang('lng_settings_window_system')}
        </h4>
        <Checkbox
          label={oldLang('lng_settings_title_chat_name')}
          checked={Boolean(canDisplayChatInTitle)}
          onCheck={handleChatInTitleChange}
        />
      </div>
    </div>
  );
};

export default memo(withGlobal<OwnProps>(
  (global): StateProps => {
    const {
      settings: {
        byKey: {
          hasPassword, isSensitiveEnabled, canChangeSensitive, shouldArchiveAndMuteNewNonContact,
          canDisplayChatInTitle, shouldNewNonContactPeersRequirePremium,
        },
        privacy,
      },
      blocked,
      passcode: {
        hasPasscode,
      },
      appConfig,
    } = global;

    return {
      isCurrentUserPremium: selectIsCurrentUserPremium(global),
      hasPassword,
      hasPasscode: Boolean(hasPasscode),
      blockedCount: blocked.totalCount,
      webAuthCount: global.activeWebSessions.orderedHashes.length,
      isSensitiveEnabled,
      canDisplayAutoarchiveSetting: Boolean(appConfig?.canDisplayAutoarchiveSetting),
      shouldArchiveAndMuteNewNonContact,
      canChangeSensitive,
      shouldNewNonContactPeersRequirePremium,
      privacy,
      canDisplayChatInTitle,
      canSetPasscode: selectCanSetPasscode(global),
    };
  },
)(SettingsPrivacy));
