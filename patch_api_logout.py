import re
with open('src/services/api.ts', 'r') as f:
    content = f.read()

old_logout = """  async logout(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.setItem('closet_pr_auth_session', 'logged_out');
    }
  },"""

new_logout = """  async logout(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(PROFILE_STORAGE_KEY);
      localStorage.setItem('closet_pr_auth_session', 'logged_out');
    }
  },"""

content = content.replace(old_logout, new_logout)

with open('src/services/api.ts', 'w') as f:
    f.write(content)
