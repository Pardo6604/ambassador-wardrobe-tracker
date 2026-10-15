import re

with open('api/index.py', 'r') as f:
    content = f.read()

# Replace the generation logic in auto_suggest_outfit
old_try_auto = re.compile(r'    try:\n        pixel_api_key = os\.environ\.get\("PIXEL_API_KEY"\).*?return current_person_b64\n\n    except HTTPException:', re.DOTALL)

new_try_auto = """    try:
        fal_key = os.environ.get("FAL_KEY")
        pixel_api_key = os.environ.get("PIXEL_API_KEY") or os.environ.get("PIXELAPI_KEY") or os.environ.get("PIXELAPI")
        hf_token = os.environ.get("HF_TOKEN")
        
        if not (fal_key or pixel_api_key or hf_token):
            raise HTTPException(status_code=500, detail="No VTON API key configured (FAL_KEY, PIXELAPI, or HF_TOKEN)")
        
        current_person_b64 = person_base64
        
        for piece in outfit_items:
            cat_lower = piece.category.lower()
            if any(word in cat_lower for word in ["bottom", "pant", "jean", "short", "skirt", "trouser", "legging"]):
                desc = "lower_body"
                px_cat = "lowerbody"
            elif any(word in cat_lower for word in ["dress", "gown", "jumpsuit", "romper"]):
                desc = "dresses"
                px_cat = "dress"
            else:
                desc = "upper_body"
                px_cat = "upperbody"
                
            if fal_key:
                headers = {"Authorization": f"Key {fal_key}", "Content-Type": "application/json"}
                person_data_url = current_person_b64 if current_person_b64.startswith("data:image") else f"data:image/png;base64,{current_person_b64}"
                garment_data_url = piece.image_url if piece.image_url.startswith("data:image") else f"data:image/png;base64,{piece.image_url}"
                payload = {
                    "human_image_url": person_data_url,
                    "garment_image_url": garment_data_url,
                    "description": desc,
                    "category": desc
                }
                res = requests.post("https://fal.run/fal-ai/idm-vton", json=payload, headers=headers)
                if not res.ok:
                    raise HTTPException(status_code=500, detail=f"Fal.ai error: {res.text}")
                output_url = res.json().get("image", {}).get("url")
                img_data = requests.get(output_url).content
                output_b64 = base64.b64encode(img_data).decode("utf-8")
                current_person_b64 = f"data:image/png;base64,{output_b64}"
                
            elif pixel_api_key:
                person_raw = current_person_b64.split(",")[1] if "," in current_person_b64 else current_person_b64
                garment_raw = piece.image_url.split(",")[1] if "," in piece.image_url else piece.image_url
                headers = {"Authorization": f"Bearer {pixel_api_key}", "Content-Type": "application/json"}
                payload = {"person_image": person_raw, "garment_image": garment_raw, "category": px_cat}
                res = requests.post("https://api.pixelapi.dev/v1/virtual-tryon", json=payload, headers=headers)
                if not res.ok:
                    raise HTTPException(status_code=500, detail=f"PixelAPI error: {res.text}")
                job_id = res.json().get("job_id")
                for _ in range(60):
                    time.sleep(2)
                    poll_res = requests.get(f"https://api.pixelapi.dev/v1/virtual-tryon/jobs/{job_id}", headers=headers)
                    if not poll_res.ok:
                        raise HTTPException(status_code=500, detail=f"PixelAPI poll error: {poll_res.text}")
                    poll_data = poll_res.json()
                    status = poll_data.get("status")
                    if status == "completed":
                        output_b64 = poll_data.get("result_image_b64")
                        if not output_b64 and poll_data.get("output_url"):
                            img_data = requests.get(poll_data.get("output_url")).content
                            output_b64 = base64.b64encode(img_data).decode("utf-8")
                        current_person_b64 = f"data:image/png;base64,{output_b64}"
                        break
                    elif status == "failed":
                        raise HTTPException(status_code=500, detail="PixelAPI job failed.")
                else:
                    raise HTTPException(status_code=504, detail="PixelAPI polling timed out")
                    
            elif hf_token:
                # Fallback to HF Client
                client = Client("levihsu/OOTDiffusion", token=hf_token)
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
                current_person_b64 = f"data:image/png;base64,{output_b64}"
                
        return current_person_b64

    except HTTPException:"""

if old_try_auto.search(content):
    content = old_try_auto.sub(new_try_auto, content)
else:
    print("Could not match auto_suggest_outfit")

# Do the same for generate_tryon
old_generate = re.compile(r'        pixel_api_key = os\.environ\.get\("PIXEL_API_KEY"\).*?raise HTTPException\(status_code=504, detail="PixelAPI polling timed out"\)', re.DOTALL)

new_generate = """        fal_key = os.environ.get("FAL_KEY")
        pixel_api_key = os.environ.get("PIXEL_API_KEY") or os.environ.get("PIXELAPI_KEY") or os.environ.get("PIXELAPI")
        hf_token = os.environ.get("HF_TOKEN")
        
        if not (fal_key or pixel_api_key or hf_token):
            raise HTTPException(status_code=500, detail="No VTON API key configured (FAL_KEY, PIXELAPI, or HF_TOKEN)")

        if request.garment_description == "lower_body":
            desc = "lower_body"
            px_cat = "lowerbody"
            hf_cat = "Lower-body"
        elif request.garment_description == "dresses":
            desc = "dresses"
            px_cat = "dress"
            hf_cat = "Dress"
        else:
            desc = "upper_body"
            px_cat = "upperbody"
            hf_cat = "Upper-body"

        if fal_key:
            headers = {"Authorization": f"Key {fal_key}", "Content-Type": "application/json"}
            person_data_url = request.person_image_base64 if request.person_image_base64.startswith("data:image") else f"data:image/png;base64,{request.person_image_base64}"
            garment_data_url = request.garment_image_base64 if request.garment_image_base64.startswith("data:image") else f"data:image/png;base64,{request.garment_image_base64}"
            payload = {
                "human_image_url": person_data_url,
                "garment_image_url": garment_data_url,
                "description": desc,
                "category": desc
            }
            res = requests.post("https://fal.run/fal-ai/idm-vton", json=payload, headers=headers)
            if not res.ok:
                raise HTTPException(status_code=500, detail=f"Fal.ai error: {res.text}")
            output_url = res.json().get("image", {}).get("url")
            img_data = requests.get(output_url).content
            output_b64 = base64.b64encode(img_data).decode("utf-8")
            return {"result_image_base64": f"data:image/png;base64,{output_b64}"}
            
        elif pixel_api_key:
            person_raw = request.person_image_base64.split(",")[1] if "," in request.person_image_base64 else request.person_image_base64
            garment_raw = request.garment_image_base64.split(",")[1] if "," in request.garment_image_base64 else request.garment_image_base64
            headers = {"Authorization": f"Bearer {pixel_api_key}", "Content-Type": "application/json"}
            payload = {"person_image": person_raw, "garment_image": garment_raw, "category": px_cat}
            res = requests.post("https://api.pixelapi.dev/v1/virtual-tryon", json=payload, headers=headers)
            if not res.ok:
                raise HTTPException(status_code=500, detail=f"PixelAPI submit error: {res.text}")
            job_id = res.json().get("job_id")
            for _ in range(60):
                time.sleep(2)
                poll_res = requests.get(f"https://api.pixelapi.dev/v1/virtual-tryon/jobs/{job_id}", headers=headers)
                if not poll_res.ok:
                    raise HTTPException(status_code=500, detail=f"PixelAPI poll error: {poll_res.text}")
                poll_data = poll_res.json()
                status = poll_data.get("status")
                if status == "completed":
                    output_b64 = poll_data.get("result_image_b64")
                    if not output_b64 and poll_data.get("output_url"):
                        img_data = requests.get(poll_data.get("output_url")).content
                        output_b64 = base64.b64encode(img_data).decode("utf-8")
                    return {"result_image_base64": f"data:image/png;base64,{output_b64}"}
                elif status == "failed":
                    raise HTTPException(status_code=500, detail="PixelAPI job failed.")
            raise HTTPException(status_code=504, detail="PixelAPI polling timed out")
            
        elif hf_token:
            client = Client("levihsu/OOTDiffusion", token=hf_token)
            with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as p_file:
                person_data = base64.b64decode(request.person_image_base64.split(",")[1] if "," in request.person_image_base64 else request.person_image_base64)
                p_file.write(person_data)
                person_path = p_file.name

            with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as g_file:
                garment_data = base64.b64decode(request.garment_image_base64.split(",")[1] if "," in request.garment_image_base64 else request.garment_image_base64)
                g_file.write(garment_data)
                garment_path = g_file.name
                
            try:
                result = client.predict(
                    vton_img=handle_file(person_path),
                    garm_img=handle_file(garment_path),
                    category=hf_cat,
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
            return {"result_image_base64": f"data:image/png;base64,{output_b64}"}"""

if old_generate.search(content):
    content = old_generate.sub(new_generate, content)
else:
    print("Could not match generate_tryon")

with open('api/index.py', 'w') as f:
    f.write(content)

