import re

with open('api/index.py', 'r') as f:
    content = f.read()

# I will just replace the "try:" block and below in auto_suggest_outfit using string matching up to "return current_person_b64"
old_try = """    try:
        hf_token = os.environ.get("HF_TOKEN")
        client = Client("levihsu/OOTDiffusion", token=hf_token)
        
        current_person_b64 = person_base64
        
        # Apply each piece sequentially
        for piece in outfit_items:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as p_file:
                person_data = base64.b64decode(current_person_b64.split(",")[1] if "," in current_person_b64 else current_person_b64)
                p_file.write(person_data)
                person_path = p_file.name

            with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as g_file:
                garment_base64 = piece.image_url
                garment_data = base64.b64decode(garment_base64.split(",")[1] if "," in garment_base64 else garment_base64)
                g_file.write(garment_data)
                garment_path = g_file.name

            cat_lower = piece.category.lower()
            if any(word in cat_lower for word in ["bottom", "pant", "jean", "short", "skirt", "trouser", "legging"]):
                cloth_type = "Lower-body"
            elif any(word in cat_lower for word in ["dress", "gown", "jumpsuit", "romper"]):
                cloth_type = "Dress"
            else:
                cloth_type = "Upper-body"
                
            try:
                result = client.predict(
                    vton_img=handle_file(person_path),
                    garm_img=handle_file(garment_path),
                    category=cloth_type,
                    n_samples=1,
                    n_steps=20,
                    image_scale=2.0,
                    seed=random.randint(0, 100000),
                    api_name="/process_dc"
                )
                output_path = result[0]['image']
            except Exception as e:
                if "ZeroGPU" in str(e):
                    raise HTTPException(status_code=429, detail="Hugging Face Free GPU quota exceeded. Please try again later.")
                raise HTTPException(status_code=500, detail=f"VTON Model Error: {str(e)}")
            
            with open(output_path, "rb") as f:
                output_b64 = base64.b64encode(f.read()).decode("utf-8")
                
            os.remove(person_path)
            os.remove(garment_path)
            
            # Update the person base64 to the newly generated image for the next layer
            current_person_b64 = f"data:image/png;base64,{output_b64}"
            
        return current_person_b64

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to auto-suggest outfit: {str(e)}")"""

new_try = """    try:
        pixel_api_key = os.environ.get("PIXEL_API_KEY") or os.environ.get("PIXELAPI_KEY") or os.environ.get("PIXELAPI")
        if not pixel_api_key:
            raise HTTPException(status_code=500, detail="PixelAPI key not configured in .env")
        
        current_person_b64 = person_base64
        
        # Apply each piece sequentially
        for piece in outfit_items:
            cat_lower = piece.category.lower()
            if any(word in cat_lower for word in ["bottom", "pant", "jean", "short", "skirt", "trouser", "legging"]):
                cloth_type = "lowerbody"
            elif any(word in cat_lower for word in ["dress", "gown", "jumpsuit", "romper"]):
                cloth_type = "dress"
            else:
                cloth_type = "upperbody"
                
            # Strip data:image/... prefix
            person_raw = current_person_b64.split(",")[1] if "," in current_person_b64 else current_person_b64
            garment_raw = piece.image_url.split(",")[1] if "," in piece.image_url else piece.image_url
            
            # Submit to PixelAPI
            headers = {
                "Authorization": f"Bearer {pixel_api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "person_image": person_raw,
                "garment_image": garment_raw,
                "category": cloth_type
            }
            res = requests.post("https://api.pixelapi.dev/v1/virtual-tryon", json=payload, headers=headers)
            if not res.ok:
                raise HTTPException(status_code=500, detail=f"PixelAPI submit error: {res.text}")
            
            job_id = res.json().get("job_id")
            
            # Poll
            for _ in range(60):
                time.sleep(2)
                poll_res = requests.get(f"https://api.pixelapi.dev/v1/virtual-tryon/jobs/{job_id}", headers=headers)
                if not poll_res.ok:
                    raise HTTPException(status_code=500, detail=f"PixelAPI poll error: {poll_res.text}")
                poll_data = poll_res.json()
                status = poll_data.get("status")
                if status == "completed":
                    output_b64 = poll_data.get("result_image_b64")
                    current_person_b64 = f"data:image/png;base64,{output_b64}"
                    break
                elif status == "failed":
                    raise HTTPException(status_code=500, detail="PixelAPI job failed.")
            else:
                raise HTTPException(status_code=504, detail="PixelAPI polling timed out")
            
        return current_person_b64

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to auto-suggest outfit: {str(e)}")"""

if old_try in content:
    content = content.replace(old_try, new_try)
else:
    print("Could not find old_try")

with open('api/index.py', 'w') as f:
    f.write(content)

