import React from "react";
import supabase from "../../config/supabaseClient";

function GoogleLoginButton(){
    const handleLogin = async () => {
        const { user, session, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
        });
    
        if (error) {
          console.error('로그인 오류:', error.message);
        } else {
          console.log('로그인 성공:', user);
          // 로그인 성공 시, 필요한 데이터 처리
        }
      };
    
      return (
        <button onClick={handleLogin}>
          Google로 로그인
        </button>
      );
}

export default GoogleLoginButton;