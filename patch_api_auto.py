with open('src/services/api.ts', 'r') as f:
    content = f.read()

new_methods = """
  async updateTryOnImage(base64Image: string): Promise<boolean> {
    try {
      const res = await fetch('/api/user/tryon-image', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ tryon_base_image: base64Image })
      });
      if (res.ok) {
        const profile = await res.json();
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  async autoSuggestOutfit(): Promise<OutfitSuggestion | null> {
    try {
      const res = await fetch('/api/outfits/auto-suggest', {
        method: 'POST',
        headers: getAuthHeader()
      });
      if (res.ok) {
        return await res.json();
      }
      const err = await res.text();
      throw new Error(err);
    } catch (e) {
      console.error(e);
      throw e;
    }
  },
"""

content = content.replace("async generateTryOn", new_methods + "\n  async generateTryOn")

with open('src/services/api.ts', 'w') as f:
    f.write(content)
