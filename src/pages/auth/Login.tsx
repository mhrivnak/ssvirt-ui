import React from 'react';
import {
  LoginPage,
  LoginForm,
  LoginMainFooterBandItem,
  ListVariant,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { CONFIG } from '../../utils/constants';

const Login: React.FC = () => {
  const [showHelperText, setShowHelperText] = React.useState(false);
  const [usernameValue, setUsernameValue] = React.useState('');
  const [isValidUsername, setIsValidUsername] = React.useState(true);
  const [passwordValue, setPasswordValue] = React.useState('');
  const [isValidPassword, setIsValidPassword] = React.useState(true);
  const [isLoginButtonDisabled, setIsLoginButtonDisabled] = React.useState(false);

  const handleUsernameChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setUsernameValue(value);
  };

  const handlePasswordChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setPasswordValue(value);
  };

  const onLoginButtonClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    setIsLoginButtonDisabled(true);
    setShowHelperText(false);
    setIsValidUsername(!!usernameValue);
    setIsValidPassword(!!passwordValue);
    
    if (usernameValue && passwordValue) {
      // TODO: Implement actual login logic in PR #2
      console.log('Login attempt:', { username: usernameValue });
    } else {
      setIsLoginButtonDisabled(false);
      setShowHelperText(true);
    }
  };

  const loginForm = (
    <LoginForm
      showHelperText={showHelperText}
      helperText="Invalid login credentials."
      helperTextIcon={<ExclamationCircleIcon />}
      usernameLabel="Username"
      usernameValue={usernameValue}
      onChangeUsername={handleUsernameChange}
      isValidUsername={isValidUsername}
      passwordLabel="Password"
      passwordValue={passwordValue}
      onChangePassword={handlePasswordChange}
      isValidPassword={isValidPassword}
      onLoginButtonClick={onLoginButtonClick}
      isLoginButtonDisabled={isLoginButtonDisabled}
    />
  );

  return (
    <LoginPage
      footerListVariants={ListVariant.inline}
      brandImgSrc="/logo.svg"
      brandImgAlt={CONFIG.APP_TITLE}
      footerListItems={[
        <LoginMainFooterBandItem key="version">
          Version {CONFIG.APP_VERSION}
        </LoginMainFooterBandItem>
      ]}
      textContent="Self-Service Virtual Infrastructure Runtime"
      loginTitle="Log in to your account"
      loginSubtitle="Please enter your credentials"
    >
      {loginForm}
    </LoginPage>
  );
};

export default Login;