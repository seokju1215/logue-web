import { useState, useEffect } from 'react';
import './App.css';
import GoogleLoginButton from './components/Login/GoogleLoginButton';
import LogoutButton from './components/Login/LogoutButton';
import supabase from './config/supabaseClient';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      return () => {
        listener?.unsubscribe();
      };
    };

    fetchSession();
  }, []);
  console.log(user);
  return (
    <div>
      <h1>구글 로그인 연결</h1>
      {user ? (
        <div>
          <p>로그인된 사용자: {user.email}</p>
          <LogoutButton />
        </div>
      ) : (
        <GoogleLoginButton />
      )}
    </div>
  );
}

export default App;