with open('src/services/api.ts', 'r') as f:
    content = f.read()

new_method = """
  async generateTryOn(personImageBase64: string, garmentImageBase64: string): Promise<string | null> {
    try {
      const res = await fetch('/api/outfits/generate-tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          person_image_base64: personImageBase64,
          garment_image_base64: garmentImageBase64,
          garment_description: "A piece of clothing"
        })
      });
      if (res.ok) {
        const data = await res.json();
        return data.result_image_base64;
      }
      console.error("VTON failed", await res.text());
      return null;
    } catch (err) {
      console.error(err);
      return null;
    }
  },
"""

# Insert before logout
content = content.replace("async logout(): Promise<void> {", new_method + "\n  async logout(): Promise<void> {")

with open('src/services/api.ts', 'w') as f:
    f.write(content)
