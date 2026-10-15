import re

with open('api/index.py', 'r') as f:
    content = f.read()

# Add error handling to auto_suggest_outfit
old_auto_suggest = """            result = client.predict(
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

new_auto_suggest = """            try:
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
                raise HTTPException(status_code=500, detail=f"VTON Model Error: {str(e)}")"""

content = content.replace(old_auto_suggest, new_auto_suggest)

with open('api/index.py', 'w') as f:
    f.write(content)
