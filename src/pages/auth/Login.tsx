import React, { useEffect } from 'react';
import {
  LoginPage,
  LoginForm,
  LoginMainFooterBandItem,
  ListVariant,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { CONFIG, ROUTES } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';
import { useLoginMutation } from '../../hooks/useAuthQueries';

const Login: React.FC = () => {
  const [usernameValue, setUsernameValue] = React.useState('');
  const [passwordValue, setPasswordValue] = React.useState('');
  const [isValidUsername, setIsValidUsername] = React.useState(true);
  const [isValidPassword, setIsValidPassword] = React.useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const loginMutation = useLoginMutation();

  // Get the intended destination from location state, default to dashboard
  const from = location.state?.from?.pathname || ROUTES.DASHBOARD;

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

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

    // Reset validation states
    setIsValidUsername(true);
    setIsValidPassword(true);

    // Validate inputs
    const isUsernameValid = !!usernameValue.trim();
    const isPasswordValid = !!passwordValue.trim();

    setIsValidUsername(isUsernameValid);
    setIsValidPassword(isPasswordValid);

    if (!isUsernameValid || !isPasswordValid) {
      return;
    }

    // Attempt login
    try {
      await loginMutation.mutateAsync({
        username: usernameValue.trim(),
        password: passwordValue,
      });
      // Navigation will be handled by the useEffect hook when isAuthenticated changes
    } catch (error) {
      // Error handling is managed by the mutation hook
      console.error('Login failed:', error);
    }
  };

  const loginForm = (
    <LoginForm
      showHelperText={loginMutation.isError}
      helperText={loginMutation.error?.message || 'Invalid login credentials.'}
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
      isLoginButtonDisabled={loginMutation.isPending}
      loginButtonLabel={loginMutation.isPending ? 'Signing in...' : 'Sign in'}
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
    >
      {loginForm}
    </LoginPage>
  );
};

export default Login;
