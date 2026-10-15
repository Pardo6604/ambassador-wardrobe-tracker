import re

with open('src/services/api.ts', 'r') as f:
    content = f.read()

avatar_functions = """
  async getTryonAvatars(): Promise<any[]> {
    try {
      const res = await fetch('/api/user/avatars', { headers: getAuthHeader() });
      if (res.ok) return await res.json();
      return [];
    } catch {
      return [];
    }
  },

  async createTryonAvatar(name: string, imageBase64: string): Promise<any> {
    const res = await fetch('/api/user/avatars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ name, image_base64: imageBase64 })
    });
    if (!res.ok) throw new Error('Failed to create avatar');
    return await res.json();
  },

  async deleteTryonAvatar(id: string): Promise<void> {
    const res = await fetch(`/api/user/avatars/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Failed to delete avatar');
  },
"""

# Insert before "async fetchProfile"
content = content.replace("async fetchProfile():", avatar_functions + "\n  async fetchProfile():")

with open('src/services/api.ts', 'w') as f:
    f.write(content)
