with open('src/components/AccountModal.tsx', 'r') as f:
    content = f.read()

old_handler = """  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setLocalTryonImage(base64);
        try {
          const { apiService } = await import('../services/api');
          await apiService.updateTryOnImage(base64);
          onUpdateProfile({ ...profile, tryon_base_image: base64 });
        } catch(e) {
          console.error(e);
        }
      };
      reader.readAsDataURL(file);
    }
  };"""

new_handler = """  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingImage(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = async () => {
          try {
            const canvas = document.createElement('canvas');
            const MAX_HEIGHT = 1024;
            const scaleSize = MAX_HEIGHT / img.height;
            canvas.width = img.width * scaleSize;
            canvas.height = MAX_HEIGHT;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
            const base64 = canvas.toDataURL('image/jpeg', 0.8);
            
            setLocalTryonImage(base64);
            const { apiService } = await import('../services/api');
            const ok = await apiService.updateTryOnImage(base64);
            if (ok) {
              onUpdateProfile({ ...profile, tryon_base_image: base64 });
            } else {
              alert("Failed to save avatar.");
            }
          } catch(e) {
            alert("Error processing image.");
          } finally {
            setIsUploadingImage(false);
          }
        };
        img.onerror = () => {
           alert("Invalid image format! Please use JPG or PNG.");
           setIsUploadingImage(false);
        };
        img.src = reader.result as string;
      };
      reader.onerror = () => setIsUploadingImage(false);
      reader.readAsDataURL(file);
    }
  };"""

content = content.replace(old_handler, new_handler)

with open('src/components/AccountModal.tsx', 'w') as f:
    f.write(content)
