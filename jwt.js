/* =====================================================
   EXPENSE TRACKER — Token helper (browser side)
   The server creates and verifies the JWT. The browser only
   stores it and sends it with each request.
   ===================================================== */
const JWT = {
  KEY: 'et_token',

  set(token) { sessionStorage.setItem(this.KEY, token); },
  get() { return sessionStorage.getItem(this.KEY); },
  clear() { sessionStorage.removeItem(this.KEY); },

  // Reads the token's contents for display only. The server does the real check.
  payload() {
    try {
      const part = (this.get() || '').split('.')[1];
      const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
      const data = JSON.parse(json);
      return data.exp * 1000 > Date.now() ? data : null;
    } catch { return null; }
  },

  logout(redirect = 'index.html') {
    this.clear();
    location.replace(redirect);
  }
};