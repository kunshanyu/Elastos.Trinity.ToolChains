import os
import sys
import subprocess
from xml.dom import minidom

SCRIPT_PATH=os.path.realpath(__file__)
TOOLCHAINS_DIR_PATH=os.path.dirname(os.path.dirname(SCRIPT_PATH))
TOOLCHAINS_DIR_NAME=os.path.basename(TOOLCHAINS_DIR_PATH)
PROJECT_DIR_PATH=os.path.join(TOOLCHAINS_DIR_PATH, "..")
RUNTIME_DIR_PATH=os.path.join(PROJECT_DIR_PATH, "Runtime")
PLUGIN_DIR_PATH=os.path.join(PROJECT_DIR_PATH, "Plugins")
RUNTIME_PLUGIN_PATH=os.path.join(RUNTIME_DIR_PATH, "plugins")

def run_cmd(cmd, ignore_error=False):
    print("Running: " + cmd)
    ret = subprocess.call(cmd, shell=True)
    if not ignore_error and ret != 0:
        sys.exit(ret)

def plugin_prepare(check_update=False):
    if os.path.isdir(RUNTIME_PLUGIN_PATH):
        if check_update:
            plugin_update()
    else:
        plugin_convertTS2JS()

def plugin_update():
    dirs = os.listdir(PLUGIN_DIR_PATH)
    for dir in dirs:
        filepath = os.path.join(PLUGIN_DIR_PATH, dir)
        if os.path.isdir(filepath):
            try:
                is_changed = is_plugin_changed(dir);
                if is_changed:
                    print('reinstall plugin ' + dir);
                    re_install_plugin(filepath);
            except Exception as err:
                print("Error: " + str(err))
    restore_config()

# first build
def plugin_convertTS2JS():
    run_cmd("npm install typescript -g")
    dirs = os.listdir(PLUGIN_DIR_PATH)
    for dir in dirs:
        filepath = os.path.join(PLUGIN_DIR_PATH, dir)
        if os.path.isdir(filepath):
            tsconfig = os.path.join(filepath, "www/tsconfig.json")
            if os.path.isfile(tsconfig):
                run_cmd("tsc --build " + tsconfig)

def get_pluginId(directory):
    xmldoc = minidom.parse(directory + '/plugin.xml')
    itemlist = xmldoc.getElementsByTagName('plugin')
    return itemlist[0].attributes['id'].value

def is_plugin_changed(directory):
    filepath = os.path.join(PLUGIN_DIR_PATH, directory + '/www/' + directory + '.ts');
    if os.path.isfile(filepath):
        modify_time_1 = os.stat(filepath).st_mtime;

        plugin_path = os.path.join(PLUGIN_DIR_PATH, directory)
        pluginId = get_pluginId(plugin_path);
        plugin_runtime = os.path.join(RUNTIME_DIR_PATH, 'plugins/' + pluginId + '/www/' + directory + '.ts');
        modify_time_2 = os.stat(plugin_runtime).st_mtime;
        return (modify_time_1 > modify_time_2);

def re_install_plugin(plugindir):
    run_cmd("tsc --build " + plugindir + "/www/tsconfig.json")
    os.chdir(RUNTIME_DIR_PATH)
    backup_config()
    run_cmd("cordova plugin rm " + get_pluginId(plugindir), True)
    run_cmd("cordova plugin add " + os.path.relpath(plugindir))

def backup_config():
    if not os.path.isfile(os.path.join(RUNTIME_DIR_PATH + '/config.xml.bak')):
        os.chdir(RUNTIME_DIR_PATH)
        run_cmd('cp config.xml config.xml.bak')

def restore_config():
    if os.path.isfile(os.path.join(RUNTIME_DIR_PATH + '/config.xml.bak')):
        os.chdir(RUNTIME_DIR_PATH)
        run_cmd('mv config.xml.bak config.xml')
