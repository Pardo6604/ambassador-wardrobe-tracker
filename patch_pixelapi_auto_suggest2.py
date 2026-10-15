import re

with open('api/index.py', 'r') as f:
    content = f.read()

pattern = re.compile(r'    try:\n        hf_token = os\.environ\.get\("HF_TOKEN"\).*?return current_person_b64\n\n    except Exception as e:\n        raise HTTPException\(status_code=500, detail=f"Failed to auto-suggest outfit: \{str\(e\)\}"\)', re.DOTALL)

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

if pattern.search(content):
    content = pattern.sub(new_try, content)
else:
    print("Could not match regex")

with open('api/index.py', 'w') as f:
    f.write(content)
