import re

with open('api/index.py', 'r') as f:
    content = f.read()

# Add requests and time import if not present
if "import requests" not in content:
    content = "import requests\nimport time\n" + content

# Use regex to replace the entire auto_suggest_outfit function
pattern_auto = re.compile(r'def auto_suggest_outfit\(.*?\n        return current_person_b64\n\n    except Exception as e:\n        raise HTTPException.*?str\(e\)\}\)', re.DOTALL)

new_auto_suggest = """def auto_suggest_outfit(user: User, items: list[ClothingItem], person_base64: str, avatar_id: str = None):
    # Try to build a full outfit: Top + Bottom
    tops = [i for i in items if not any(w in i.category.lower() for w in ["bottom", "pant", "jean", "short", "skirt", "trouser", "legging", "shoe", "foot", "sneaker", "boot"])]
    bottoms = [i for i in items if any(w in i.category.lower() for w in ["bottom", "pant", "jean", "short", "skirt", "trouser", "legging"])]
    
    outfit_items = []
    
    # Add bottoms FIRST, then tops, so tops drape over bottoms during VTON
    if bottoms:
        unworn_bottoms = [i for i in bottoms if i.status == "Unworn"]
        outfit_items.append(random.choice(unworn_bottoms) if unworn_bottoms else random.choice(bottoms))

    if tops:
        unworn_tops = [i for i in tops if i.status == "Unworn"]
        outfit_items.append(random.choice(unworn_tops) if unworn_tops else random.choice(tops))
        
    # Filter out bottoms if top is a dress
    if any(w in i.category.lower() for i in outfit_items for w in ["dress", "gown", "jumpsuit", "romper"]):
        outfit_items = [i for i in outfit_items if not any(w in i.category.lower() for w in ["bottom", "pant", "jean", "short", "skirt", "trouser", "legging"])]

    if not outfit_items:
        # Fallback to any item if no tops or bottoms
        outfit_items.append(random.choice(items))

    try:
        pixel_api_key = os.environ.get("PIXEL_API_KEY") or os.environ.get("PIXELAPI_KEY")
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

if pattern_auto.search(content):
    content = pattern_auto.sub(new_auto_suggest, content)
else:
    print("Could not match auto_suggest_outfit")

pattern_generate = re.compile(r'def generate_tryon\(.*?\n        return \{"result_image_base64": f"data:image/png;base64,\{output_b64\}"\}', re.DOTALL)

new_generate = """def generate_tryon(request: TryOnRequest, current_user: User = Depends(get_current_user)):
    try:
        pixel_api_key = os.environ.get("PIXEL_API_KEY") or os.environ.get("PIXELAPI_KEY")
        if not pixel_api_key:
            raise HTTPException(status_code=500, detail="PixelAPI key not configured in .env")

        if request.garment_description == "lower_body":
            cloth_type = "lowerbody"
        elif request.garment_description == "dresses":
            cloth_type = "dress"
        else:
            cloth_type = "upperbody"

        person_raw = request.person_image_base64.split(",")[1] if "," in request.person_image_base64 else request.person_image_base64
        garment_raw = request.garment_image_base64.split(",")[1] if "," in request.garment_image_base64 else request.garment_image_base64

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
                return {"result_image_base64": f"data:image/png;base64,{output_b64}"}
            elif status == "failed":
                raise HTTPException(status_code=500, detail="PixelAPI job failed.")
        
        raise HTTPException(status_code=504, detail="PixelAPI polling timed out")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))"""

if pattern_generate.search(content):
    content = pattern_generate.sub(new_generate, content)
else:
    print("Could not match generate_tryon")

with open('api/index.py', 'w') as f:
    f.write(content)
