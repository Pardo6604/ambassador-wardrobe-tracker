with open('api/index.py', 'r') as f:
    content = f.read()

old_call = """        result = client.predict(
            dict={"background": handle_file(person_path), "layers": [], "composite": None},
            garment=handle_file(garment_path),
            prompt=request.garment_description,
            is_checked=True,
            is_checked_crop=False,
            denoise_steps=30,
            seed=42,
            api_name="/tryon"
        )"""

new_call = """        result = client.predict(
            dict={"background": handle_file(person_path), "layers": [], "composite": None},
            garm_img=handle_file(garment_path),
            garment_des=request.garment_description,
            is_checked=True,
            is_checked_crop=False,
            denoise_steps=30,
            seed=42,
            api_name="/tryon"
        )"""

content = content.replace(old_call, new_call)

with open('api/index.py', 'w') as f:
    f.write(content)
