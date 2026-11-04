import { useCallback, useEffect, useRef, useState } from 'react';

const TOKEN_KEY = 'volley_session';

// 탭을 닫으면 사라지는 sessionStorage만 쓴다. localStorage에는 아무것도 남기지 않는다.
const storage = {
  get(key) {
    try { return sessionStorage.getItem(key); } catch { return null; }
  },
  set(key, value) {
    try { sessionStorage.setItem(key, value); } catch { /* 저장이 막혀도 새로고침 복구만 안 될 뿐이다 */ }
  },
  remove(key) {
    try { sessionStorage.removeItem(key); } catch { /* 위와 같음 */ }
  },
};

export function useRoom({ teacherKey = null } = {}) {
  const [state, setState] = useState(null);
  const [rally, setRally] = useState(null);
  const [online, setOnline] = useState(false);
  const [toast, setToast] = useState(null);
  const [replaced, setReplaced] = useState(false);
  const [denied, setDenied] = useState(false);
  const wsRef = useRef(null);
  const stoppedRef = useRef(false);
  const offsetRef = useRef(0);
  const toastTimer = useRef(null);

  const showToast = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const send = useCallback((action, payload = {}) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action, ...payload }));
      return true;
    }
    showToast('서버와 연결이 끊겼습니다. 다시 연결하는 중입니다.');
    return false;
  }, [showToast]);

  useEffect(() => {
    stoppedRef.current = false;
    let retry = null;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const ws = new WebSocket(`${protocol}://${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        setOnline(true);
        if (teacherKey) {
          ws.send(JSON.stringify({ action: 'teacherHello', key: teacherKey }));
        } else {
          const token = storage.get(TOKEN_KEY);
          if (token) ws.send(JSON.stringify({ action: 'resume', token }));
        }
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'state') {
          offsetRef.current = message.state.now - Date.now();
          setState(message.state);
        } else if (message.type === 'rally') {
          setRally(message.rally);
        } else if (message.type === 'joined') {
          storage.set(TOKEN_KEY, message.token);
          setReplaced(false);
        } else if (message.type === 'error') {
          if (message.action === 'teacherHello') setDenied(true);
          else showToast(message.message);
        } else if (message.type === 'ended') {
          storage.remove(TOKEN_KEY);
          setState(null);
        } else if (message.type === 'replaced') {
          stoppedRef.current = true;
          setReplaced(true);
          storage.remove(TOKEN_KEY);
          setState(null);
          ws.close();
        }
      };

      ws.onclose = () => {
        setOnline(false);
        if (!stoppedRef.current) retry = setTimeout(connect, 1500);
      };
    };

    connect();
    return () => {
      stoppedRef.current = true;
      clearTimeout(retry);
      wsRef.current?.close();
    };
  }, [teacherKey, showToast]);

  const serverNow = useCallback(() => Date.now() + offsetRef.current, []);

  return { state, rally, online, toast, send, serverNow, replaced, denied, showToast };
}
