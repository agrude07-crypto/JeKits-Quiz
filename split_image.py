from PIL import Image
import os

img_path = r'C:/Users/Albrecht Reese/.gemini/antigravity/brain/4117bc19-af02-4369-8fcd-2334c6e43b49/615a9ffc-1e24-406a-939e-d30f3c5f242c.png'
out_dir = r'C:/Users/Albrecht Reese/OneDrive - Landesverband der Musikschulen in NRW e.V/Dokumente/6 Privat/DEV/JeKits-Quiz/img/figures'

try:
    img = Image.open(img_path)
    # The image has 3 distinct figures side-by-side. 
    # We will slice it roughly into thirds.
    width, height = img.size
    
    # Slice 1: Left figure (Boy with Trumpet)
    box1 = (0, 0, width // 3, height)
    img1 = img.crop(box1)
    img1.save(os.path.join(out_dir, 'figure2.png')) # 2nd place
    
    # Slice 2: Middle figure (Girl)
    box2 = (width // 3, 0, 2 * (width // 3), height)
    img2 = img.crop(box2)
    img2.save(os.path.join(out_dir, 'figure1.png')) # 1st place
    
    # Slice 3: Right figure (Boy Singing)
    box3 = (2 * (width // 3), 0, width, height)
    img3 = img.crop(box3)
    img3.save(os.path.join(out_dir, 'figure3.png')) # 3rd place
    
    print('Successfully split the figures.')
except Exception as e:
    print('Error:', e)
