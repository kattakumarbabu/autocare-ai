/**
 * Token storage utility — centralises localStorage access.
 * Swap the implementation here to use httpOnly cookies (via API) if needed.
 */

const TOKEN_KEY = 'autocare_token';
const USER_KEY  = 'autocare_user';

export const tokenStorage = {
  getToken:   ()          => localStorage.getItem(TOKEN_KEY),
  setToken:   (token)     => localStorage.setItem(TOKEN_KEY, token),
  removeToken:()          => localStorage.removeItem(TOKEN_KEY),

  getUser:    ()          => {
    const raw = localStorage.getItem(USER_KEY);
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  },
  setUser:    (user)      => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  removeUser: ()          => localStorage.removeItem(USER_KEY),

  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
