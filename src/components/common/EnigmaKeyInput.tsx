import React, { useState, useEffect, useRef } from '../../../lib/teact/teact';
import { getActions, getGlobal } from '../../../global';
import Button from '../Button';
import Input from '../Input';
import useLang from '../../../hooks/useLang';
import useLastCallback from '../../../hooks/useLastCallback';
import useDebouncedCallback from '../../../hooks/useDebouncedCallback';
import buildClassName from '../../../util/buildClassName';
import { getEnigmaUtils } from '../../../util/enigmaUtils';

import './EnigmaKeyInput.scss';

type OwnProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
};

const EnigmaKeyInput: React.FC<OwnProps> = ({
  value, onChange, placeholder, label, error,
}) => {
  const { showNotification } = getActions();
  const lang = useLang();
  const [showKey, setShowKey] = useState(false);
  const [isKeyValid, setIsKeyValid] = useState<boolean | undefined>(undefined);
  const [keyErrorMsg, setKeyErrorMsg] = useState<string | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  const checkKeyValidity = useDebouncedCallback(async (key: string) => {
    if (!key) {
      setIsKeyValid(undefined);
      setKeyErrorMsg(undefined);
      return;
    }

    try {
      const enigmaUtils = getEnigmaUtils();
      const isValid = await enigmaUtils.validateKey(key);
      
      setIsKeyValid(isValid);
      setKeyErrorMsg(isValid ? undefined : lang('Key is invalid. Please check the format.'));
    } catch (e) {
      setIsKeyValid(false);
      setKeyErrorMsg(lang('Error validating key. Please try again.'));
    }
  }, 300);

  useEffect(() => {
    checkKeyValidity(value);
  }, [value, checkKeyValidity]);

  const handleChange = useLastCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  });

  const toggleShowKey = useLastCallback(() => {
    setShowKey(!showKey);
  });

  const inputClassName = buildClassName(
    'enigma-input',
    keyErrorMsg && 'error',
  );

  return (
    <div className="EnigmaKeyInput">
      <div className="enigma-input-wrapper">
        <Input
          ref={inputRef}
          className={inputClassName}
          type={showKey ? 'text' : 'password'}
          value={value}
          onChange={handleChange}
          placeholder={placeholder || lang('Enter encryption key')}
          label={label}
          error={error}
        />
        <Button
          className="toggle-visibility-button"
          color="translucent"
          onClick={toggleShowKey}
          ariaLabel={showKey ? lang('Hide') : lang('Show')}
        >
          {showKey ? lang('Hide') : lang('Show')}
        </Button>
      </div>
      
      {keyErrorMsg && (
        <div className="enigma-key-error">
          {keyErrorMsg}
        </div>
      )}
      
      {isKeyValid && (
        <div className="enigma-key-valid">
          <i className="icon-check" />
          {lang('Valid key')}
        </div>
      )}
    </div>
  );
};

export default EnigmaKeyInput; 