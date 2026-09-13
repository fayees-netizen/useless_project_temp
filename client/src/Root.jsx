import { useState } from 'react';
import LoginPage from './LoginPage.jsx';
import App from './App.jsx';

function Root() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return <App />;
}

export default Root;