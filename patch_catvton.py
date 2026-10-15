import re

with open('api/index.py', 'r') as f:
    content = f.read()

# Replace auto_suggest_outfit logic
old_auto_suggest = """    try:
        hf_token = os.environ.get("HF_TOKEN")
        client = Client("yisol/IDM-VTON", token=hf_token)
        
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
                garment_des = "lower_body"
            elif any(word in cat_lower for word in ["dress", "gown", "jumpsuit", "romper"]):
                garment_des = "dresses"
            else:
                garment_des = "upper_body"
            result = client.predict(
                dict={"background": handle_file(person_path), "layers": [], "composite": None},
                garm_img=handle_file(garment_path),
                garment_des=garment_des,
                is_checked=True,
                is_checked_crop=True,
                denoise_steps=30,
                seed=random.randint(0, 100000),
                api_name="/tryon"
            )
            
            output_path = result[0]"""

new_auto_suggest = """    try:
        hf_token = os.environ.get("HF_TOKEN")
        client = Client("multimodalart/CatVTON-zerogpu", token=hf_token)
        
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

content = content.replace(old_auto_suggest, new_auto_suggest)

# Replace generate_tryon logic
old_generate = """        # Initialize Hugging Face Gradio Client
        hf_token = os.environ.get("HF_TOKEN")
        client = Client("yisol/IDM-VTON", token=hf_token)

        result = client.predict(
            dict={"background": handle_file(person_path), "layers": [], "composite": None},
            garm_img=handle_file(garment_path),
            garment_des=request.garment_description,
            is_checked=True,
            is_checked_crop=True,
            denoise_steps=30,
            seed=random.randint(0, 100000),
            api_name="/tryon"
        )
        
        # result is a tuple where the first element is the output image path
        output_path = result[0]"""

new_generate = """        # Initialize Hugging Face Gradio Client
        hf_token = os.environ.get("HF_TOKEN")
        client = Client("multimodalart/CatVTON-zerogpu", token=hf_token)

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

content = content.replace(old_generate, new_generate)

with open('api/index.py', 'w') as f:
    f.write(content)
