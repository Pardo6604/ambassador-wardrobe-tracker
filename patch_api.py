import re

with open('src/services/api.ts', 'r') as f:
    content = f.read()

# Add getAuthHeader helper
header_helper = """
const TOKEN_KEY = 'closet_pr_jwt_token';

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}
"""
content = content.replace("const ITEMS_STORAGE_KEY = 'closet_pr_ambassador_items_v1';", header_helper + "\nconst ITEMS_STORAGE_KEY = 'closet_pr_ambassador_items_v1';")

# Patch fetch calls
content = re.sub(r"headers: \{ 'Accept': 'application/json' \}", "headers: { 'Accept': 'application/json', ...getAuthHeader() }", content)
content = re.sub(r"headers: \{ 'Content-Type': 'application/json' \}", "headers: { 'Content-Type': 'application/json', ...getAuthHeader() }", content)
content = re.sub(r"method: 'DELETE',", "method: 'DELETE',\n        headers: { ...getAuthHeader() },", content)
content = re.sub(r"\{ method: 'DELETE' \}", "{ method: 'DELETE', headers: { ...getAuthHeader() } }", content)
content = re.sub(r"method: 'POST' \}", "method: 'POST', headers: { ...getAuthHeader() } }", content)

# Rewrite login, add register
auth_methods = """
  async register(email: string, password: string, name: string): Promise<boolean> {
    try {
      const res = await fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async login(email: string, password?: string): Promise<boolean> {
    try {
      const res = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: password || 'password123' })
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof window !== 'undefined') {
          localStorage.setItem(TOKEN_KEY, data.access_token);
          localStorage.setItem('closet_pr_auth_session', 'logged_in');
          // fetch profile to update local storage
          const profRes = await fetch('/api/user/profile', { headers: getAuthHeader() });
          if (profRes.ok) {
             const profile = await profRes.json();
             localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
          }
        }
        return true;
      }
      return false;
    } catch {
      // Mock login for offline dev if needed
      if (typeof window !== 'undefined') {
        localStorage.setItem('closet_pr_auth_session', 'logged_in');
      }
      return true;
    }
  },

  async logout(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.setItem('closet_pr_auth_session', 'logged_out');
    }
  },

  isLoggedIn(): boolean {
    if (typeof window === 'undefined') return true;
    const token = localStorage.getItem(TOKEN_KEY);
    return !!token && localStorage.getItem('closet_pr_auth_session') !== 'logged_out';
  },
"""

# Replace existing login/logout/isLoggedIn
content = re.sub(r"  async logout\(\): Promise<void> \{[\s\S]*?login\(email\?: string\): void \{[\s\S]*?    \}\n  \},", auth_methods, content)

with open('src/services/api.ts', 'w') as f:
    f.write(content)
