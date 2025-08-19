import React, { useEffect, useState } from 'react';
import {
  LoginPage,
  LoginForm,
  LoginMainFooterBandItem,
  ListVariant,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { CONFIG, ROUTES } from '../../utils/constants';
import { useRole } from '../../hooks/useRole';
import { AuthService } from '../../services/api';
import { getDefaultRouteForUser } from '../../utils/routeProtection';

const Login: React.FC = () => {
  const [usernameValue, setUsernameValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [isValidUsername, setIsValidUsername] = useState(true);
  const [isValidPassword, setIsValidPassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { sessionData } = useRole();

  // Get the intended destination from location state, default to dashboard
  const from = location.state?.from?.pathname || ROUTES.DASHBOARD;

  // Redirect if already authenticated
  useEffect(() => {
    if (sessionData) {
      const defaultRoute = getDefaultRouteForUser(sessionData.roles);
      navigate(from !== ROUTES.LOGIN ? from : defaultRoute, { replace: true });
    }
  }, [sessionData, navigate, from]);

  const handleUsernameChange = (
    _event: React.FormEvent<HTMLInputElement>,
    value: string
  ) => {
    setUsernameValue(value);
  };

  const handlePasswordChange = (
    _event: React.FormEvent<HTMLInputElement>,
    value: string
  ) => {
    setPasswordValue(value);
  };

  const onLoginButtonClick = async (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    event.preventDefault();

    // Reset states
    setIsValidUsername(true);
    setIsValidPassword(true);
    setErrorMessage('');

    // Validate inputs
    const isUsernameValid = !!usernameValue.trim();
    const isPasswordValid = !!passwordValue.trim();

    setIsValidUsername(isUsernameValid);
    setIsValidPassword(isPasswordValid);

    if (!isUsernameValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);

    try {
      const sessionData = await AuthService.login({
        username: usernameValue.trim(),
        password: passwordValue.trim(),
      });

      // Navigation will be handled by the useEffect hook when sessionData changes
      const defaultRoute = getDefaultRouteForUser(sessionData.roles);
      navigate(from !== ROUTES.LOGIN ? from : defaultRoute, { replace: true });
    } catch (error) {
      console.error('Login failed:', error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Login failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loginForm = (
    <LoginForm
      showHelperText={!!errorMessage}
      helperText={errorMessage}
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
      isLoginButtonDisabled={isLoading}
      loginButtonLabel={isLoading ? 'Signing in...' : 'Sign in'}
    />
  );

  return (
    <LoginPage
      footerListVariants={ListVariant.inline}
      brandImgSrc={CONFIG.LOGO_URL}
      brandImgAlt={CONFIG.APP_TITLE}
      footerListItems={[
        <LoginMainFooterBandItem key="version">
          Version {CONFIG.APP_VERSION}
        </LoginMainFooterBandItem>,
      ]}
      textContent="Self-Service Virtual Infrastructure Runtime"
      loginTitle="Log in to your account"
      loginSubtitle="Please enter your credentials"
      style={
        {
          '--pf-v6-c-login__brand img': 'max-height: 120px; width: auto;',
        } as React.CSSProperties
      }
    >
      {loginForm}
    </LoginPage>
  );
};

export default Login;
