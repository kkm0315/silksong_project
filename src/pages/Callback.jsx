import React, { useEffect, useState } from "react";

export default function Callback() {
  const [status, setStatus] = useState("토큰 교환 중...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const code = params.get("code");

    const verifier = sessionStorage.getItem("pkce_verifier");

    console.log(verifier, "씨발");

    if (!code) {
      setStatus("코드가 없습니다. (코드 파라미터 누락)");
      return;
    }
    if (!verifier) {
      setStatus("code_verifier가 없습니다. (인가 전에 생성/저장 필요)");
      return;
    }

    const fetchToken = async () => {
      try {
        const response = await fetch("https://accounts.spotify.com/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
            grant_type: "authorization_code",
            code,
            redirect_uri: "http://127.0.0.1:8000/callback/",
            code_verifier: verifier,
          }),
        });

        const data = await response.json();

        if (data.access_token) {
          localStorage.setItem(
            "spotify_token",
            JSON.stringify({
              access_token: data.access_token,
              expires_in: data.expires_in,
            })
          );
          setStatus("로그인 성공!");
          window.location.href = "/";
        } else {
          setStatus("토큰 요청 실패: " + (data.error || "unknown"));
        }
      } catch (err) {
        setStatus("에러 발생: " + err.message);
      }
    };

    fetchToken();
  }, []);

  return <div>{status}</div>;
}
