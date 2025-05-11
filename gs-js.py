import os

def gs_to_js():
    dir_list = os.listdir()
    dir_list = [i for i in dir_list if i[-3:]==".gs"]
    for file in dir_list:
        os.rename(file, file.replace("gs", "js"))
    return

def js_to_gs():
    dir_list = os.listdir()
    dir_list = [i for i in dir_list if i[-3:]==".js"]
    for file in dir_list:
        os.rename(file, file.replace("js", "gs"))
    return

js_to_gs()