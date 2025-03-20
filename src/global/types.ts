export interface ISettings extends GlobalState['settings'] {
  byKey: {
    // ... existing settings ...
    enigmaEnabled?: boolean;
    enigmaKey?: string;
  };
}

export interface PrivacySettings {
  phoneNumber: PhoneNumberPrivacy;
  lastSeen: LastSeenPrivacy;
  profilePhoto: ProfilePhotoPrivacy;
  bio: BioPrivacy;
  forwards: ForwardsPrivacy;
  chatInvite: ChatInvitePrivacy;
  phoneCall: PhoneCallPrivacy;
  phoneP2P: PhoneP2PPrivacy;
  voiceMessages: VoiceMessagesPrivacy;
  groupChats: GroupChatsPrivacy;
  blockedUserIds: string[];
  blockedBotIds: string[];
  // Enigma encryption settings
  enigmaEnabled?: boolean;
  enigmaKey?: string;
}

export enum SettingsScreens {
  Main,
  EditProfile,
  Notifications,
  DataStorage,
  Language,
  BlockedUsers,
  Security,
  Components,
  Texts,
  Connections,
  Privacy,
  Folders,
  Support,
  ChatBackground,
  CodeLanguages,
  Enigma,
} 