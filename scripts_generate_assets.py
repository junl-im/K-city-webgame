from PIL import Image, ImageDraw, ImageFilter, ImageChops
import os, math, random, json, wave, struct
from pathlib import Path
ROOT=Path('/mnt/data/soul23work/soul-online-alpha')
random.seed(23)

def ensure(p): Path(p).mkdir(parents=True, exist_ok=True)
for d in [
 ROOT/'public/assets/soulpack/characters', ROOT/'public/assets/soulpack/monsters', ROOT/'public/assets/soulpack/tiles', ROOT/'public/assets/soulpack/props', ROOT/'public/assets/soulpack/buildings', ROOT/'public/assets/soulpack/ui/icons', ROOT/'public/assets/soulpack/cards', ROOT/'public/assets/soulpack/souls', ROOT/'public/assets/soulpack/weapons', ROOT/'public/assets/soulpack/effects',
 ROOT/'src/assets/2p5d/characters', ROOT/'src/assets/2p5d/monsters', ROOT/'src/assets/2p5d/tiles', ROOT/'src/assets/2p5d/props', ROOT/'src/assets/2p5d/buildings', ROOT/'src/assets/ui'
]: ensure(d)

def rgba(hexv, a=255):
    hexv=hexv.lstrip('#'); return tuple(int(hexv[i:i+2],16) for i in (0,2,4))+(a,)

def lerp(c1,c2,t): return tuple(int(c1[i]+(c2[i]-c1[i])*t) for i in range(4))

def add_shadow(img, shape_bbox, alpha=90):
    layer=Image.new('RGBA', img.size, (0,0,0,0)); d=ImageDraw.Draw(layer)
    d.ellipse(shape_bbox, fill=(0,0,0,alpha)); layer=layer.filter(ImageFilter.GaussianBlur(5))
    img.alpha_composite(layer)

def glow(img, bbox, color, blur=16, alpha=80, shape='ellipse'):
    layer=Image.new('RGBA', img.size, (0,0,0,0)); d=ImageDraw.Draw(layer)
    if shape=='ellipse': d.ellipse(bbox, fill=color[:3]+(alpha,))
    else: d.rounded_rectangle(bbox, radius=12, fill=color[:3]+(alpha,))
    layer=layer.filter(ImageFilter.GaussianBlur(blur)); img.alpha_composite(layer)

def grad_bg(w,h,c1,c2,c3=None):
    img=Image.new('RGBA',(w,h),(0,0,0,255)); pix=img.load()
    for y in range(h):
        t=y/(h-1)
        if c3 and t>0.55:
            tt=(t-0.55)/0.45; col=lerp(c2,c3,tt)
        else:
            tt=t/0.55 if c3 else t; col=lerp(c1,c2,tt)
        for x in range(w): pix[x,y]=col
    return img

def draw_sparkles(img, n, colors):
    d=ImageDraw.Draw(img)
    for i in range(n):
        x=random.randint(0,img.width-1); y=random.randint(0,img.height-1); r=random.choice([1,1,2,3])
        col=random.choice(colors)
        d.ellipse((x-r,y-r,x+r,y+r), fill=col)

# Tiles 256x128 isometric
TILE= (256,128)
def make_tile(name, base, edge, detail):
    img=Image.new('RGBA',TILE,(0,0,0,0)); d=ImageDraw.Draw(img)
    poly=[(128,4),(252,64),(128,124),(4,64)]
    d.polygon(poly, fill=base, outline=edge)
    # depth underside
    d.polygon([(4,64),(128,124),(252,64),(252,76),(128,136),(4,76)], fill=tuple(max(0,int(c*0.55)) for c in base[:3])+(170,))
    for i in range(34):
        x=random.randint(20,236); y=random.randint(20,108)
        # inside diamond approx
        if abs(x-128)/124 + abs(y-64)/60 > 1: continue
        if detail=='grass':
            col=random.choice([(128,168,84,70),(186,222,111,70),(74,112,66,65)])
            d.arc((x-8,y-5,x+8,y+7), 200, 330, fill=col, width=2)
        elif detail=='dirt':
            col=random.choice([(222,176,101,80),(104,70,45,65),(244,210,140,55)])
            d.line((x-12,y,x+13,y+random.randint(-2,2)), fill=col, width=random.randint(1,3))
        elif detail=='stone':
            col=random.choice([(200,188,158,70),(42,45,46,60)])
            d.line((x-14,y-4,x,y+3,x+15,y-3), fill=col, width=2)
        elif detail=='crystal':
            col=random.choice([(123,231,255,115),(154,128,255,90),(220,250,255,80)])
            d.line((x-12,y+4,x+10,y-7), fill=col, width=2)
            d.polygon([(x,y-12),(x+6,y+2),(x,y+10),(x-5,y+2)], fill=col[:3]+(65,))
        elif detail=='water':
            col=random.choice([(143,231,255,80),(75,127,170,70)])
            d.arc((x-18,y-5,x+18,y+9), 190, 350, fill=col, width=2)
        elif detail=='cliff':
            col=random.choice([(32,34,38,90),(118,104,79,70)])
            d.line((x-10,y-9,x+4,y+2,x-9,y+12), fill=col, width=3)
    if detail=='portal':
        glow(img,(42,12,214,116),(104,218,255,255),16,120)
        for r in [34,48,60]: d.ellipse((128-r,64-r/2,128+r,64+r/2), outline=(159,236,255,140), width=3)
    # save
    for out in [ROOT/'public/assets/soulpack/tiles'/f'tile-{name}.png', ROOT/'src/assets/2p5d/tiles'/f'tile-{name}.png']:
        img.save(out)

tiles={
 'grass': ((62,107,55,255),(160,190,98,200),'grass'), 'dirt':((126,89,53,255),(217,170,91,200),'dirt'), 'moss':((40,104,89,255),(110,236,212,190),'crystal'), 'stone':((95,91,83,255),(190,172,130,190),'stone'), 'crystal':((39,46,73,255),(117,230,255,200),'crystal'), 'water':((27,70,93,235),(129,230,255,190),'water'), 'cliff':((45,43,42,255),(120,105,83,180),'cliff'), 'portal':((35,45,55,245),(127,236,255,220),'portal')}
for n,(b,e,det) in tiles.items(): make_tile(n,b,e,det)

# Props
def save_prop(img, name):
    for base in [ROOT/'public/assets/soulpack/props', ROOT/'src/assets/2p5d/props']:
        img.save(base/name)

def tree_img(i):
    w,h=256,340; img=Image.new('RGBA',(w,h),(0,0,0,0)); d=ImageDraw.Draw(img)
    add_shadow(img,(52,294,204,326),60)
    trunk_col=(76+random.randint(-10,10),48+random.randint(-8,8),31,255)
    d.polygon([(118,132),(144,132),(154,300),(103,300)], fill=trunk_col)
    d.line((128,145,92,205), fill=(55,35,22,230), width=8)
    d.line((134,160,178,218), fill=(55,35,22,230), width=7)
    colors=[(26,82,56,240),(46,112,62,240),(70,137,70,235),(22,60,72,240)]
    for j in range(18):
        cx=128+random.randint(-58,58); cy=120+random.randint(-80,78); rx=random.randint(42,70); ry=random.randint(28,52)
        d.ellipse((cx-rx,cy-ry,cx+rx,cy+ry), fill=random.choice(colors), outline=(138,170,102,55))
    glow(img,(55,25,205,225),(87,255,190,255),22,26)
    return img
for i in range(1,11): save_prop(tree_img(i), f'prop-tree-{i:02d}.png')
# base tree alias
save_prop(tree_img(0),'prop-tree.png')

def rock_img(i):
    w,h=256,220; img=Image.new('RGBA',(w,h),(0,0,0,0)); d=ImageDraw.Draw(img); add_shadow(img,(46,160,216,198),65)
    pts=[]; cx=128; cy=130
    for k in range(10):
        a=math.pi*2*k/10; r=random.randint(55,96)
        pts.append((cx+math.cos(a)*r, cy+math.sin(a)*r*0.7-random.randint(0,30)))
    d.polygon(pts, fill=(78,79,83,255), outline=(170,158,125,110))
    for k in range(8):
        x=random.randint(60,195); y=random.randint(58,146)
        d.line((x,y,x+random.randint(15,42), y+random.randint(-12,18)), fill=(188,175,133,80), width=3)
    return img
for i in range(1,11): save_prop(rock_img(i), f'prop-rock-{i:02d}.png')
save_prop(rock_img(0),'prop-rock.png')

def chest_img(i):
    w,h=220,180; img=Image.new('RGBA',(w,h),(0,0,0,0)); d=ImageDraw.Draw(img); add_shadow(img,(36,135,184,160),60)
    hue=[(93,49,29,255),(61,42,58,255),(75,64,38,255),(46,67,74,255),(88,38,42,255)][(i-1)%5]
    d.rounded_rectangle((52,70,168,130), radius=12, fill=hue, outline=(232,191,90,190), width=4)
    d.pieslice((52,34,168,104), 180, 360, fill=tuple(min(255,c+25) for c in hue[:3])+(255,), outline=(232,191,90,170), width=4)
    d.rectangle((104,78,120,122), fill=(224,184,78,255))
    glow(img,(80,45,142,116),(226,185,95,255),14,28)
    return img
for i in range(1,6): save_prop(chest_img(i), f'prop-chest-{i:02d}.png')

def torch_img(i):
    w,h=160,250; img=Image.new('RGBA',(w,h),(0,0,0,0)); d=ImageDraw.Draw(img); add_shadow(img,(48,220,116,238),50)
    d.rectangle((72,78,88,225), fill=(68,42,24,255))
    d.polygon([(60,74),(100,74),(88,100),(72,100)], fill=(98,63,34,255), outline=(226,185,95,120))
    colors=[(255,217,94,230),(255,121,54,220),(255,76,40,150)]
    for r,c in [(35,colors[2]),(24,colors[1]),(13,colors[0])]:
        d.ellipse((80-r,56-r,80+r,56+r*1.35), fill=c)
    glow(img,(36,4,124,118),(255,148,54,255),22,110)
    return img
for i in range(1,6): save_prop(torch_img(i), f'prop-torch-{i:02d}.png')
# aliases for existing
save_prop(rock_img(9),'prop-crystal.png')
save_prop(chest_img(2),'prop-ruin.png')

# Buildings
def building(kind, palette):
    w,h=512,384; img=Image.new('RGBA',(w,h),(0,0,0,0)); d=ImageDraw.Draw(img); add_shadow(img,(70,310,440,362),90)
    base,roof,accent=palette
    d.polygon([(110,150),(250,90),(405,152),(384,302),(126,304)], fill=base, outline=(240,210,135,100))
    d.polygon([(80,155),(248,52),(432,155),(402,178),(250,92),(104,178)], fill=roof, outline=(248,218,133,140))
    d.rectangle((222,214,288,304), fill=(45,33,28,255), outline=(226,185,95,150), width=3)
    for x in [150,335]:
        d.rounded_rectangle((x,190,x+48,238), radius=6, fill=(28,42,48,240), outline=accent, width=3)
        glow(img,(x-20,168,x+68,256),accent,18,42)
    if kind=='forge':
        d.rectangle((360,70,385,150), fill=(55,45,38,255)); glow(img,(330,15,420,132),(255,110,64,255),24,90)
    if kind=='shop':
        d.rectangle((124,145,386,180), fill=(190,70,65,255)); d.text((200,150),'SHOP', fill=(255,230,170,255))
    return img
builds={'town-hall':((88,75,58,255),(54,63,72,255),(114,231,255,200)), 'blacksmith':((75,67,58,255),(95,54,41,255),(255,118,62,200)), 'storage':((70,66,56,255),(55,75,57,255),(226,185,95,200)), 'shop':((80,58,49,255),(93,42,54,255),(226,185,95,200))}
for k,p in builds.items():
    img=building(k,p)
    for base in [ROOT/'public/assets/soulpack/buildings', ROOT/'src/assets/2p5d/buildings']:
        img.save(base/f'{k}.png')

# Character/monster sheets
DIRS=['s','sw','w','nw','n','ne','e','se']
FW,FH=160,240; MFH=200; COLS=48
actions=[('idle',0,4),('walk',4,8),('run',12,8),('attack',20,8),('hit',28,4),('death',32,8),('skill',40,8)]

def draw_humanoid_frame(cls, gender, row, col):
    img=Image.new('RGBA',(FW,FH),(0,0,0,0)); d=ImageDraw.Draw(img)
    # action offsets
    act='idle'
    for a,s,n in actions:
        if s<=col<s+n: act=a; frame=col-s; break
    t=(frame if 'frame' in locals() else 0)
    bob= math.sin((t/8)*math.pi*2)*3 if act in ['walk','run'] else math.sin(t)*1
    x=FW//2; y=FH-40+int(bob)
    colors={
      'warrior':((72,86,98),(208,174,91),(42,46,55),(180,205,222)),
      'taoist':((42,49,96),(99,211,255),(38,30,62),(174,119,255)),
      'cleric':((178,170,134),(246,219,111),(56,61,72),(238,238,220))}
    armor,accent,dark,light=colors[cls]
    if gender=='female': body_w=33; head_r=17; waist=26
    else: body_w=38; head_r=18; waist=31
    if act=='attack': x+= int(math.sin(t/7*math.pi)*7)
    if act=='hit': x-=5
    if act=='death':
        d.ellipse((x-42,y-20,x+42,y-6), fill=(0,0,0,80));
        d.rounded_rectangle((x-46,y-53,x+46,y-22), radius=14, fill=armor+(230,), outline=accent+(180,));
        return img
    # shadow
    d.ellipse((x-42,y-7,x+42,y+7), fill=(0,0,0,80))
    # legs
    leg_shift = int(math.sin(t*1.7)*5) if act in ['walk','run'] else 0
    d.rounded_rectangle((x-18-leg_shift,y-68,x-4-leg_shift,y-8), radius=5, fill=dark+(255,))
    d.rounded_rectangle((x+4+leg_shift,y-68,x+18+leg_shift,y-8), radius=5, fill=dark+(255,))
    d.rounded_rectangle((x-23-leg_shift,y-12,x-2-leg_shift,y), radius=4, fill=accent+(220,))
    d.rounded_rectangle((x+2+leg_shift,y-12,x+23+leg_shift,y), radius=4, fill=accent+(220,))
    # cape/robe
    if cls in ['taoist','cleric']:
        d.polygon([(x-waist-12,y-118),(x+waist+12,y-118),(x+waist+25,y-18),(x-waist-25,y-18)], fill=dark+(220,))
    else:
        d.polygon([(x-42,y-122),(x-8,y-136),(x-8,y-22),(x-52,y-42)], fill=(45,37,45,190))
    # torso armor
    d.rounded_rectangle((x-body_w,y-128,x+body_w,y-58), radius=12, fill=armor+(255,), outline=accent+(170,), width=3)
    d.polygon([(x-body_w,y-126),(x+body_w,y-126),(x+waist,y-72),(x-waist,y-72)], fill=light+(90,))
    # shoulders
    d.ellipse((x-body_w-18,y-126,x-body_w+10,y-94), fill=accent+(210,))
    d.ellipse((x+body_w-10,y-126,x+body_w+18,y-94), fill=accent+(210,))
    # arms/weapon
    if cls=='warrior':
        swordx=x+52+ (16 if act in ['attack','skill'] else 0)
        d.line((x+28,y-105,swordx,y-158), fill=(226,240,255,255), width=7)
        d.line((swordx,y-164,swordx+22,y-202), fill=(216,235,255,240), width=5)
        glow(img,(swordx-30,y-210,swordx+46,y-128),accent+(255,),12,60)
    elif cls=='taoist':
        staffx=x+45
        d.line((staffx,y-158,staffx,y-22), fill=(122,82,52,255), width=6)
        d.ellipse((staffx-14,y-174,staffx+14,y-146), fill=accent+(230,)); glow(img,(staffx-34,y-190,staffx+34,y-126),accent+(255,),16,80)
    else:
        mace=x+40
        d.line((mace,y-140,mace,y-40), fill=(212,190,120,255), width=6)
        d.ellipse((mace-16,y-156,mace+16,y-124), fill=accent+(230,)); glow(img,(mace-38,y-180,mace+38,y-104),accent+(255,),18,75)
    d.rounded_rectangle((x-48,y-112,x-30,y-62), radius=7, fill=armor+(245,))
    d.rounded_rectangle((x+30,y-112,x+48,y-62), radius=7, fill=armor+(245,))
    # head/hair
    skin=(218,170,130,255) if gender=='male' else (236,188,150,255)
    d.ellipse((x-head_r,y-170,x+head_r,y-170+head_r*2), fill=skin, outline=(80,48,34,120))
    hair=(38,30,24,255) if cls!='taoist' else (32,38,80,255)
    d.pieslice((x-head_r-3,y-176,x+head_r+3,y-142),180,360, fill=hair)
    if gender=='female':
        d.ellipse((x-28,y-165,x-8,y-128), fill=hair); d.ellipse((x+8,y-165,x+28,y-128), fill=hair)
    # face glints
    d.ellipse((x-7,y-154,x-3,y-150), fill=(20,22,25,255)); d.ellipse((x+4,y-154,x+8,y-150), fill=(20,22,25,255))
    if act=='skill': glow(img,(x-80,y-195,x+80,y-25),accent+(255,),24,80)
    return img

def make_char_sheet(cls, gender):
    sheet=Image.new('RGBA',(FW*COLS,FH*len(DIRS)),(0,0,0,0))
    for r,dirn in enumerate(DIRS):
        for c in range(COLS):
            frame=draw_humanoid_frame(cls,gender,r,c)
            if dirn in ['w','nw','sw']:
                frame=frame.transpose(Image.FLIP_LEFT_RIGHT)
            sheet.alpha_composite(frame,(c*FW,r*FH))
    return sheet
for cls in ['warrior','taoist','cleric']:
    for gender in ['male','female']:
        img=make_char_sheet(cls,gender)
        name=f'hero-{cls}-{gender}-sheet.png'
        for base in [ROOT/'public/assets/soulpack/characters', ROOT/'src/assets/2p5d/characters']:
            img.save(base/name)

# Monsters
MW,MH=160,200
monster_pal={
 'slime':((80,205,140),(160,255,210),(26,91,70)), 'wolf':((76,93,108),(164,221,255),(25,36,52)), 'goblin':((88,124,64),(224,160,72),(47,57,34)), 'bear':((86,80,110),(158,132,255),(38,30,60)), 'dragon':((82,40,38),(255,118,60),(38,22,24)), 'imp':((45,38,72),(190,110,255),(23,20,38)), 'golem':((96,116,90),(126,240,212),(55,70,62)), 'wraith':((56,66,88),(170,220,255),(18,22,32)), 'fireDrake':((114,52,32),(255,144,48),(55,22,16)), 'harpy':((68,80,112),(125,224,255),(34,38,62)), 'graveKnight':((78,75,78),(225,188,90),(38,36,42)), 'fieldBoss':((82,62,48),(255,199,88),(40,28,22))}

def draw_monster_frame(kind,row,col):
    img=Image.new('RGBA',(MW,MH),(0,0,0,0)); d=ImageDraw.Draw(img)
    a='idle'; frame=0
    for name,s,n in actions:
        if s<=col<s+n: a=name; frame=col-s; break
    base,accent,dark=monster_pal[kind]
    x=MW//2; y=MH-28+int(math.sin(frame*0.9)*2)
    if a=='attack': x+=int(math.sin(frame/7*math.pi)*8)
    if a=='death':
        d.ellipse((x-48,y-24,x+48,y-8), fill=(0,0,0,80)); d.ellipse((x-55,y-65,x+55,y-20), fill=base+(160,)); return img
    d.ellipse((x-50,y-8,x+50,y+8), fill=(0,0,0,78))
    if kind in ['slime']:
        d.ellipse((x-50,y-80,x+50,y), fill=base+(230,), outline=accent+(160,), width=3); glow(img,(x-62,y-92,x+62,y+10),accent+(255,),18,54); d.ellipse((x-20,y-50,x-8,y-38), fill=(10,30,22,220)); d.ellipse((x+8,y-50,x+20,y-38), fill=(10,30,22,220))
    elif kind in ['wolf','harpy']:
        d.ellipse((x-54,y-78,x+45,y-20), fill=base+(255,), outline=accent+(90,), width=2); d.polygon([(x+18,y-88),(x+58,y-118),(x+42,y-66)], fill=base+(255,)); d.polygon([(x+28,y-102),(x+60,y-118),(x+44,y-86)], fill=accent+(130,));
        for lx in [-34,-12,14,36]: d.rounded_rectangle((x+lx,y-32,x+lx+10,y), radius=4, fill=dark+(255,))
        if kind=='harpy':
            d.polygon([(x-36,y-75),(x-96,y-120),(x-64,y-55)], fill=dark+(210,)); d.polygon([(x+20,y-75),(x+92,y-114),(x+62,y-52)], fill=dark+(210,)); glow(img,(x-96,y-132,x+92,y-42),accent+(255,),18,35)
    elif kind in ['goblin','imp','graveKnight']:
        d.rounded_rectangle((x-30,y-100,x+30,y-34), radius=12, fill=base+(255,), outline=accent+(110,), width=2); d.ellipse((x-24,y-132,x+24,y-86), fill=(110,146,85,255) if kind=='goblin' else base+(255,)); d.polygon([(x-22,y-110),(x-54,y-122),(x-27,y-94)], fill=base+(255,)); d.polygon([(x+22,y-110),(x+54,y-122),(x+27,y-94)], fill=base+(255,));
        d.line((x+32,y-90,x+62,y-138), fill=accent+(255,), width=5); glow(img,(x+38,y-150,x+76,y-94),accent+(255,),14,46)
        if kind=='graveKnight': d.rounded_rectangle((x-36,y-120,x+36,y-42), radius=8, fill=(70,70,76,250), outline=accent+(160,), width=3)
    elif kind in ['bear','golem','fieldBoss']:
        d.ellipse((x-58,y-110,x+58,y-22), fill=base+(255,), outline=accent+(130,), width=3); d.ellipse((x-36,y-152,x+36,y-92), fill=base+(255,), outline=accent+(100,));
        d.rounded_rectangle((x-64,y-76,x-36,y-10), radius=10, fill=dark+(255,)); d.rounded_rectangle((x+36,y-76,x+64,y-10), radius=10, fill=dark+(255,)); glow(img,(x-70,y-158,x+70,y-20),accent+(255,),18,45)
    else: # dragon/drake
        d.ellipse((x-60,y-88,x+48,y-24), fill=base+(255,), outline=accent+(120,), width=3); d.polygon([(x+20,y-110),(x+75,y-142),(x+58,y-76)], fill=base+(255,), outline=accent+(100,));
        d.polygon([(x-20,y-76),(x-94,y-130),(x-68,y-58)], fill=dark+(230,)); d.polygon([(x+4,y-78),(x+92,y-128),(x+66,y-56)], fill=dark+(230,));
        d.line((x-52,y-44,x-82,y-20), fill=base+(255,), width=10); glow(img,(x+36,y-154,x+90,y-82),accent+(255,),18,65)
    if a=='skill': glow(img,(x-90,y-165,x+90,y+8),accent+(255,),24,80)
    return img

def make_monster_sheet(kind):
    sheet=Image.new('RGBA',(MW*COLS,MH*len(DIRS)),(0,0,0,0))
    for r,dirn in enumerate(DIRS):
        for c in range(COLS):
            frame=draw_monster_frame(kind,r,c)
            if dirn in ['w','nw','sw']: frame=frame.transpose(Image.FLIP_LEFT_RIGHT)
            sheet.alpha_composite(frame,(c*MW,r*MH))
    return sheet
name_map={'slime':'monster-slime-sheet.png','wolf':'monster-wolf-sheet.png','goblin':'monster-goblin-sheet.png','bear':'monster-bear-sheet.png','dragon':'boss-dragon-sheet.png','imp':'monster-imp-sheet.png','golem':'monster-golem-sheet.png','wraith':'monster-wraith-sheet.png','fireDrake':'monster-firedrake-sheet.png','harpy':'monster-harpy-sheet.png','graveKnight':'monster-grave-knight-sheet.png','fieldBoss':'monster-fieldboss-sheet.png'}
for kind,name in name_map.items():
    img=make_monster_sheet(kind)
    for base in [ROOT/'public/assets/soulpack/monsters', ROOT/'src/assets/2p5d/monsters']:
        img.save(base/name)

# Title and portraits
bg=grad_bg(1440,2560,(6,9,12,255),(20,26,30,255),(5,6,8,255))
d=ImageDraw.Draw(bg)
for i in range(18):
    x=random.randint(-300,1440); y=1200+random.randint(-120,720); w=random.randint(220,520); h=random.randint(300,760)
    d.polygon([(x,y+h),(x+w//2,y),(x+w,y+h)], fill=(12,18,17,190), outline=(65,95,80,50))
for i in range(40):
    x=random.randint(0,1440); y=random.randint(0,1800); r=random.randint(2,7); d.ellipse((x-r,y-r,x+r,y+r), fill=(190,224,255,random.randint(50,170)))
glow(bg,(120,560,1320,1940),(90,220,255,255),90,60); glow(bg,(420,1380,1080,2320),(226,185,95,255),80,70)
bg.save(ROOT/'src/assets/ui/title-bg.png'); bg.save(ROOT/'public/assets/soulpack/ui/title-bg.png')
hero=Image.new('RGBA',(720,1100),(0,0,0,0)); hd=ImageDraw.Draw(hero); add_shadow(hero,(180,1010,560,1070),110); glow(hero,(120,70,600,1040),(226,185,95,255),40,70)
# draw larger warrior portrait
hd.polygon([(360,100),(430,240),(392,450),(325,450),(292,240)], fill=(220,190,120,255), outline=(255,238,180,160))
hd.ellipse((300,115,420,235), fill=(220,170,130,255), outline=(60,40,35,180), width=4)
hd.pieslice((280,85,440,210),180,360, fill=(26,28,35,255))
hd.rounded_rectangle((235,300,485,740), radius=40, fill=(75,86,100,255), outline=(226,185,95,210), width=8)
hd.polygon([(235,300),(485,300),(425,640),(295,640)], fill=(170,190,210,80))
hd.ellipse((165,300,280,470), fill=(226,185,95,220)); hd.ellipse((440,300,555,470), fill=(226,185,95,220))
hd.polygon([(190,720),(530,720),(590,1050),(130,1050)], fill=(35,26,35,230))
hd.line((525,320,620,100), fill=(230,240,255,255), width=24); hd.line((620,100,682,6), fill=(250,255,255,255), width=16)
hero.save(ROOT/'src/assets/ui/title-hero.png'); hero.save(ROOT/'public/assets/soulpack/ui/title-hero.png')
for cls in ['warrior','taoist','cleric']:
    for gender in ['male','female']:
        img=Image.new('RGBA',(360,420),(0,0,0,0)); pd=ImageDraw.Draw(img); glow(img,(40,40,320,380),(226,185,95,255) if cls=='warrior' else (90,220,255,255),28,70)
        frame=draw_humanoid_frame(cls,gender,0,0).resize((280,420), Image.Resampling.LANCZOS)
        img.alpha_composite(frame,(40,0)); img.save(ROOT/'public/assets/soulpack/ui'/f'portrait-{cls}-{gender}.png'); img.save(ROOT/'src/assets/ui'/f'portrait-{cls}-{gender}.png')

# Icons, cards, souls, weapons, effects
icon_names=[]
for i in range(1,61):
    img=Image.new('RGBA',(96,96),(0,0,0,0)); d=ImageDraw.Draw(img)
    col=random.choice([(226,185,95),(114,231,255),(157,120,217),(217,87,87),(115,199,123)])
    d.rounded_rectangle((5,5,91,91), radius=18, fill=(15,18,18,235), outline=col+(180,), width=3)
    glow(img,(14,14,82,82),col+(255,),12,50)
    sides=random.randint(3,8); pts=[]
    for k in range(sides):
        a=-math.pi/2+2*math.pi*k/sides; r=22+random.randint(-4,5)
        pts.append((48+math.cos(a)*r,48+math.sin(a)*r))
    d.polygon(pts, fill=col+(170,), outline=(255,245,210,150))
    d.text((36,37),str(i), fill=(255,255,230,210))
    img.save(ROOT/'public/assets/soulpack/ui/icons'/f'icon-{i:02d}.png')
    icon_names.append(f'ui/icons/icon-{i:02d}.png')
for i in range(1,25):
    for folder,label in [('cards','card'),('souls','soul'),('weapons','weapon')]:
        img=Image.new('RGBA',(256,320),(0,0,0,0)); d=ImageDraw.Draw(img)
        col=random.choice([(226,185,95),(114,231,255),(157,120,217),(217,87,87),(115,199,123)])
        d.rounded_rectangle((12,12,244,308), radius=22, fill=(16,18,20,255), outline=col+(190,), width=4)
        glow(img,(36,44,220,230),col+(255,),26,80)
        if folder=='weapons':
            d.line((70,240,190,70), fill=(235,240,255,255), width=12); d.line((104,190,150,226), fill=col+(255,), width=8)
        else:
            d.ellipse((66,70,190,210), fill=col+(130,), outline=(255,245,220,120), width=4)
            d.polygon([(128,48),(166,156),(128,238),(90,156)], fill=col+(80,))
        d.text((32,270),f'{label.upper()} {i:02d}', fill=(255,242,210,230))
        img.convert('RGB').save(ROOT/'public/assets/soulpack'/folder/f'{label}-{i:02d}.jpg', quality=90)
for name,col in [('lightning',(120,220,255)),('fireball',(255,120,48)),('holy-nova',(250,230,150)),('soul-slash',(226,185,95)),('dark-rift',(160,110,255))]:
    img=Image.new('RGBA',(512,512),(0,0,0,0)); d=ImageDraw.Draw(img); glow(img,(64,64,448,448),col+(255,),36,90)
    for k in range(18):
        pts=[]; x=256; y=60
        for s in range(8): pts.append((x+random.randint(-70,70), y+s*55+random.randint(-20,20)))
        d.line(pts, fill=col+(220,), width=random.randint(3,8))
    img.save(ROOT/'public/assets/soulpack/effects'/f'{name}.png')

manifest={
 'version':'0.23.0','style':'original dark-fantasy 2.5D asset expansion','characters':6,'directions':8,'motions':['idle','walk','run','attack','hit','death','skill'], 'monsters':list(name_map.values()),
 'props':{'trees':10,'rocks':10,'chests':5,'torches':5}, 'buildings':list(builds.keys()), 'icons':icon_names[:60], 'notes':'Original procedural placeholder assets. Replace with hand-painted/pre-rendered files using the same names for production.'}
with open(ROOT/'public/assets/soulpack/asset-pack.json','w',encoding='utf-8') as f: json.dump(manifest,f,ensure_ascii=False,indent=2)

print('generated asset pack 0.23')
