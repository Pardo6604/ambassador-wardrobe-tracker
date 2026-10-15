import re

with open('api/index.py', 'r') as f:
    content = f.read()

# Replace CatVTON client instantiation and predict for auto_suggest_outfit
old_auto_suggest = """        client = Client("multimodalart/CatVTON-zerogpu", token=hf_token)
        
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
                cloth_type = "lower"
            elif any(word in cat_lower for word in ["dress", "gown", "jumpsuit", "romper"]):
                cloth_type = "overall"
            else:
                cloth_type = "upper"
                
            result = client.predict(
                person_image=dict({"background": handle_file(person_path), "layers": [], "composite": None}),
                cloth_image=handle_file(garment_path),
                cloth_type=cloth_type,
                num_inference_steps=50,
                guidance_scale=2.5,
                seed=random.randint(0, 100000),
                show_type="result only",
                api_name="/submit_function"
            )
            
            output_path = result"""

new_auto_suggest = """        client = Client("levihsu/OOTDiffusion", token=hf_token)
        
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
            
            # OOTDiffusion returns a Gallery (list of dicts containing 'image')
            output_path = result[0]['image']"""

content = content.replace(old_auto_suggest, new_auto_suggest)

# Replace for generate_tryon
old_generate = """        client = Client("multimodalart/CatVTON-zerogpu", token=hf_token)

        if request.garment_description == "lower_body":
            cloth_type = "lower"
        elif request.garment_description == "dresses":
            cloth_type = "overall"
        else:
            cloth_type = "upper"

        result = client.predict(
            person_image=dict({"background": handle_file(person_path), "layers": [], "composite": None}),
            cloth_image=handle_file(garment_path),
            cloth_type=cloth_type,
            num_inference_steps=50,
            guidance_scale=2.5,
            seed=random.randint(0, 100000),
            show_type="result only",
            api_name="/submit_function"
        )
        
        output_path = result"""

new_generate = """        client = Client("levihsu/OOTDiffusion", token=hf_token)

        if request.garment_description == "lower_body":
            cloth_type = "Lower-body"
        elif request.garment_description == "dresses":
            cloth_type = "Dress"
        else:
            cloth_type = "Upper-body"

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
        
        # OOTDiffusion returns a Gallery (list of dicts containing 'image')
        output_path = result[0]['image']"""

content = content.replace(old_generate, new_generate)

with open('api/index.py', 'w') as f:
    f.write(content)
