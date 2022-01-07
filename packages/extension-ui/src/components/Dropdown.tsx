import type {ThemeProps} from '../types';
import React, {useState} from 'react';
import styled from 'styled-components';
import Label from './Label';
import Select from "react-select";
// interface DropdownOption {
//   text: string;
//   value: string;
// }

interface Props extends ThemeProps {
  className?: string;
  defaultValue?: string | null;
  isDisabled?: boolean
  isError?: boolean;
  isFocussed?: boolean;
  label: string;
  onBlur?: () => void;
  onChange?: (value: string) => void;
  options?: any;
  value?: string;
}

function Dropdown ({ className, defaultValue, isDisabled, isFocussed, label, onBlur, onChange, options, value}: Props): React.ReactElement<Props> {
  const transformOptions = options.map((t: { text: any; value: any; }) => ({label: t.text, value: t.value}));
  const [selectedValue, setSelectedValue] = useState(value || transformOptions[0].value);

  const handleChange = (e: { value: any }) => {
    onChange && onChange(e.value.trim());
    setSelectedValue(e.value);
  }

  const customStyles = {
    option: (base: any) => {
      return {
        ...base,
        textAlign: 'left',
        fontFamily: 'Lexend',
        fontSize: '15px'
      }
    }
  }
  return (
    <>
      <Label
        className={className}
        label={label}
      >
        <Select
          options={transformOptions}
          value={transformOptions.filter((obj: { value: number; }) => obj.value === selectedValue)}
          menuPortalTarget={document.body}
          isSearchable
          styles={customStyles}
          className='kn-dropdown-wrapper'
          classNamePrefix='kn-dropdown'
          onChange={handleChange}
        />

        {/*<select*/}
        {/*  autoFocus={isFocussed}*/}
        {/*  defaultValue={defaultValue || undefined}*/}
        {/*  disabled={isDisabled}*/}
        {/*  onBlur={onBlur}*/}
        {/*  onChange={_onChange}*/}
        {/*  value={value}*/}
        {/*>*/}
        {/*  {options.map(({ text, value }): React.ReactNode => (*/}
        {/*    <option*/}
        {/*      key={value}*/}
        {/*      value={value}*/}
        {/*    >*/}
        {/*      {text}*/}
        {/*    </option>*/}
        {/*  ))}*/}
        {/*</select>*/}
      </Label>
    </>
  );
}

export default React.memo(styled(Dropdown)(({ isError, label, theme }: Props) => `
  .kn-dropdown__control {
    height: 48px;
    border-radius: 8px;
    width: 100%;
    cursor: pointer;
    margin-top: 4px;
    border: 1px solid transparent;
    box-sizing: border-box;
    display: flex;
    font-family: ${theme.fontFamily};
    background: ${theme.backgroundAccountAddress};
    box-shadow: none;
  }

  .kn-dropdown__control:hover {
    border: 1px solid transparent;
    box-shadow: none;
  }

  .kn-dropdown__single-value {
    color: ${theme.textColor};
  }

  .kn-dropdown__indicator-separator {
    display: none;
  }

  .kn-dropdown__input-container {
    color: ${theme.textColor};
  }

  .kn-dropdown__menu-portal {
    text-align: left;
    font-size: 15px;
  }

`));
