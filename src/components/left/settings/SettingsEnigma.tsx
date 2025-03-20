import React, { useState, useEffect } from '../../../lib/teact/teact';
import { getActions, getGlobal } from '../../../global';

import useLang from '../../../hooks/useLang';
import useLastCallback from '../../../hooks/useLastCallback';

import ListItem from '../../ui/ListItem';
import RadioGroup from '../../ui/RadioGroup';
import Switcher from '../../ui/Switcher';
import EnigmaKeyInput from '../../common/EnigmaKeyInput';

import './SettingsEnigma.scss';

type StateProps = {
  enigmaEnabled?: boolean;
  enigmaKey?: string;
};

const SettingsEnigma: React.FC<StateProps> = ({
  enigmaEnabled,
  enigmaKey,
}) => {
  const { setSettingOption, showNotification } = getActions();
  const lang = useLang();
  
  const [key, setKey] = useState(enigmaKey || '');
  
  useEffect(() => {
    if (enigmaKey !== undefined) {
      setKey(enigmaKey);
    }
  }, [enigmaKey]);
  
  const handleToggleEnigma = useLastCallback((isEnabled: boolean) => {
    setSettingOption({ enigmaEnabled: isEnabled });
    
    if (isEnabled) {
      showNotification({ message: lang('Enigma encryption enabled') });
    } else {
      showNotification({ message: lang('Enigma encryption disabled') });
    }
  });
  
  const handleKeyChange = useLastCallback((newKey: string) => {
    setKey(newKey);
    setSettingOption({ enigmaKey: newKey });
  });
  
  return (
    <div className="settings-content custom-scroll">
      <div className="settings-content-header">
        <div className="settings-content-icon">
          <i className="icon-lock" />
        </div>
        
        <p className="settings-item-description mb-3">
          {lang('Enigma encryption allows you to encrypt your messages with a custom key. Only people with the same key can decrypt and read your messages.')}
        </p>
      </div>
      
      <div className="settings-item">
        <ListItem ripple onClick={() => handleToggleEnigma(!enigmaEnabled)}>
          <div className="multiline-item">
            <span className="title">{lang('Enable Enigma Encryption')}</span>
            <span className="subtitle">{enigmaEnabled ? lang('Enabled') : lang('Disabled')}</span>
          </div>
          <Switcher
            id="enigma-enabled"
            checked={Boolean(enigmaEnabled)}
            inactive={false}
          />
        </ListItem>
      </div>
      
      {enigmaEnabled && (
        <div className="settings-item">
          <h4 className="settings-item-header mb-2">{lang('Encryption Key')}</h4>
          
          <p className="settings-item-description mb-3">
            {lang('Enter your encryption key. You need to share this key with anyone you want to communicate securely with.')}
          </p>
          
          <div className="mb-2">
            <EnigmaKeyInput
              value={key}
              onChange={handleKeyChange}
              label={lang('Encryption Key')}
              placeholder={lang('Enter your secret key (minimum 3 characters)')}
            />
          </div>
          
          <p className="settings-item-description mb-3 text-muted">
            {lang('Note: The key should be at least 3 characters long. Keep this key secret and only share it with trusted contacts.')}
          </p>
        </div>
      )}
    </div>
  );
};

export default SettingsEnigma; 