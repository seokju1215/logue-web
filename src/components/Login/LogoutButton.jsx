import React from 'react';
import supabase from '../../config/supabaseClient';

const LogoutButton = () => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    console.log('로그아웃 성공');
  };

  return <button onClick={handleLogout}>로그아웃</button>;
};

export default LogoutButton;