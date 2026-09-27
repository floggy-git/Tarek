/** Student-only bridge to a separately deployed Apps Script web app. */
type GatewayAction = 'me' | 'register' | 'chat' | 'trainerMe';

export async function callStudentGateway<T>(action: GatewayAction, token: string, profile?: object): Promise<T> {
  const address = String((import.meta as any).env?.VITE_STUDENT_GATEWAY_URL || '').trim();
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(address)) {
    throw new Error('Student sheet gateway is not configured.');
  }
  if (!token) throw new Error('Student sign-in is required.');
  return new Promise<T>((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.setAttribute('aria-hidden', 'true');
    const id = crypto.randomUUID();
    iframe.src = address + '?bridge=' + encodeURIComponent(id);
    let sent = false;
    const timer = setTimeout(() => finish(new Error('Student sheet gateway timed out.')), 30000);
    function finish(error?: Error, value?: T) {
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      iframe.remove();
      if (error) reject(error); else resolve(value as T);
    }
    function onMessage(event: MessageEvent) {
      if (!/^https:\/\/(?:[a-z0-9-]+\.)*(?:googleusercontent\.com|google\.com)$/.test(event.origin) ||
          event.data?.bridge !== id) return;
      if (event.data?.tarekGateway === 'ready' && !sent) {
        sent = true;
        (event.source as Window).postMessage({ tarekGateway: 'request', bridge: id, id, action, token, profile }, event.origin);
      } else if (event.data?.tarekGateway === 'reply' && event.data.id === id) {
        if (event.data.ok) finish(undefined, event.data.value as T);
        else finish(new Error(String(event.data.error || 'Student sheet request failed.')));
      }
    }
    window.addEventListener('message', onMessage);
    document.body.appendChild(iframe);
  });
}
