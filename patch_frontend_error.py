import re

with open('src/services/api.ts', 'r') as f:
    content = f.read()

# Make generateTryOn throw the actual error message
old_api = """      if (res.ok) {
        const data = await res.json();
        return data.result_image_base64;
      }
      console.error("VTON failed", await res.text());
      return null;"""

new_api = """      if (res.ok) {
        const data = await res.json();
        return data.result_image_base64;
      }
      const errorData = await res.json();
      throw new Error(errorData.detail || "Failed to generate image");"""

content = content.replace(old_api, new_api)

with open('src/services/api.ts', 'w') as f:
    f.write(content)

with open('src/components/TryOnModal.tsx', 'r') as f:
    content_modal = f.read()

old_modal = """        const result = await apiService.generateTryOn(currentImage, garment.image_url, description);
        if (result) {
            currentImage = result;
        } else {
            alert(`Failed to generate image for ${garment.brand}. Please check logs.`);
            setLoading(false);
            return;
        }"""

new_modal = """        try {
            const result = await apiService.generateTryOn(currentImage, garment.image_url, description);
            if (result) {
                currentImage = result;
            }
        } catch (err: any) {
            alert(`Error: ${err.message}`);
            setLoading(false);
            return;
        }"""

content_modal = content_modal.replace(old_modal, new_modal)

with open('src/components/TryOnModal.tsx', 'w') as f:
    f.write(content_modal)
