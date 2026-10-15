import re

with open('api/index.py', 'r') as f:
    content = f.read()

start_idx = content.find("def auto_suggest_outfit(")
end_idx = content.find("@app.get(\"/api/outfits\", response_model=List[OutfitResponse])")

if start_idx == -1 or end_idx == -1:
    print("Could not find start or end")
    exit(1)

new_code = """def auto_suggest_outfit(avatar_id: Optional[uuid.UUID] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    person_base64 = current_user.tryon_base_image
    
    if avatar_id:
        avatar = db.query(TryonAvatar).filter(TryonAvatar.id == avatar_id, TryonAvatar.user_id == current_user.id).first()
        if not avatar:
            raise HTTPException(status_code=404, detail="Selected avatar not found.")
        person_base64 = avatar.image_base64
    else:
        # Fallback to first avatar if no default tryon_base_image
        if not person_base64:
            first_avatar = db.query(TryonAvatar).filter(TryonAvatar.user_id == current_user.id).first()
            if first_avatar:
                person_base64 = first_avatar.image_base64

    if not person_base64:
        raise HTTPException(status_code=400, detail="Please upload a Default Try-On Avatar in your profile first.")

    # Get items
    items = db.query(ClothingItem).filter(ClothingItem.user_id == current_user.id).all()
    if not items:
        raise HTTPException(status_code=400, detail="No clothes found in your closet.")

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
        fal_key = os.environ.get("FAL_KEY")
        pixel_api_key = os.environ.get("PIXEL_API_KEY") or os.environ.get("PIXELAPI_KEY") or os.environ.get("PIXELAPI")
        hf_token = os.environ.get("HF_TOKEN")
        
        if not (fal_key or pixel_api_key or hf_token):
            raise HTTPException(status_code=500, detail="No VTON API key configured (FAL_KEY, PIXELAPI, or HF_TOKEN)")
        
        current_person_b64 = person_base64
        
        # Apply each piece sequentially
        for piece in outfit_items:
            cat_lower = piece.category.lower()
            if any(word in cat_lower for word in ["bottom", "pant", "jean", "short", "skirt", "trouser", "legging"]):
                desc = "lower_body"
                px_cat = "lowerbody"
                hf_cat = "Lower-body"
            elif any(word in cat_lower for word in ["dress", "gown", "jumpsuit", "romper"]):
                desc = "dresses"
                px_cat = "dress"
                hf_cat = "Dress"
            else:
                desc = "upper_body"
                px_cat = "upperbody"
                hf_cat = "Upper-body"
                
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
                current_person_b64 = f"data:image/png;base64,{output_b64}"

        final_image_url = current_person_b64
        
        # Determine title and styling notes based on brands
        brands = [p.brand for p in outfit_items]
        brand_str = " + ".join(list(set(brands)))
        title = f"AI Suggestion: {brand_str} Look"
        notes = f"Auto-generated layered look featuring {brand_str}."
        
        # Determine occasion based on the items
        occasion = "Casual"
        if any("suit" in p.category.lower() or "gown" in p.category.lower() for p in outfit_items):
            occasion = "Formal Event"
        elif any("athletic" in p.category.lower() or "sport" in p.category.lower() for p in outfit_items):
            occasion = "Workout"
        
        new_outfit = Outfit(
            id=uuid.uuid4(),
            user_id=current_user.id,
            title=title,
            occasion=occasion,
            model_image_url=final_image_url,
            styling_notes=notes
        )
        db.add(new_outfit)
        db.commit()
        db.refresh(new_outfit)

        # Record associations
        for piece in outfit_items:
            db.execute(
                Outfit.__table__.metadata.tables['outfit_items'].insert().values(
                    outfit_id=new_outfit.id,
                    clothing_item_id=piece.id
                )
            )
            # Mark worn
            piece.status = "Worn"
            piece.last_worn = datetime.utcnow()
        
        db.commit()
        
        return new_outfit

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to auto-suggest outfit: {str(e)}")

@app.post("/api/outfits/generate-tryon")
def generate_tryon(request: TryOnRequest, current_user: User = Depends(get_current_user)):
    try:
        fal_key = os.environ.get("FAL_KEY")
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
            return {"result_image_base64": f"data:image/png;base64,{output_b64}"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

"""

content = content[:start_idx] + new_code + content[end_idx:]

with open('api/index.py', 'w') as f:
    f.write(content)

