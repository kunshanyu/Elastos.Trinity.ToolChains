const prompts = require('prompts');
const validator = require('validator');
const editJsonFile = require("edit-json-file");
const fs = require("fs-extra");
const path = require("path");
const ip = require('ip');

module.exports = class ManifestHelper {
    /**
     * Prompts some information to user about his application (app name, etc).
     * That is be used to customize the template manifest with custom user information.
     */
    async promptAppInformation() {
        return new Promise(async (resolve, reject) => {
            const questions = [
                {
                    type: 'text',
                    name: 'appname',
                    message: 'Application title',
                    validate: value => {
                        return value != ""
                    }
                },
                {
                    type: 'select',
                    name: 'framework',
                    message: 'Framework',
                    choices: [
                        { title: 'Angular | https://angular.io', value: 'angular' },
                        { title: 'React   | https://reactjs.org', value: 'react' },
                    ]
                },
                {
                    type: 'select',
                    name: 'template',
                    message: 'Template',
                    choices: [
                        { title: 'Basic', value: 'basic' }
                    ]
                },
                {
                    type: 'text',
                    name: 'packagename',
                    message: 'Package name (ex: org.company.yourapp)',
                    validate: value => {
                        return value != "" && value.indexOf(".") >= 0
                    }
                },
                {
                    type: 'text',
                    name: 'shortdescription',
                    message: 'Short description (< 80 characters)'
                },
                {
                    type: 'text',
                    name: 'description',
                    message: 'Full description'
                },
                {
                    type: 'text',
                    name: 'author',
                    message: 'Author',
                    validate: value => {
                        return value != ""
                    }
                },
                {
                    type: 'text',
                    name: 'email',
                    message: "Author's email",
                    validate: value => {
                        return value != "" && validator.isEmail(value)
                    }
                },
                {
                    type: 'text',
                    name: 'website',
                    message: "Author's website",
                    validate: value => {
                        return !value || value.indexOf("http") == 0 || validator.isFQDN(value)
                    }
                },
            ];
            
            const info = await prompts(questions);
            // => info => { username, age, about }

            resolve(info)
        })
    }

    /**
     * 
     * @param {*} assets_path 
     * @param {*} packagename 
     */
    getManifestPath(assets_path, packagename = '') {
        return path.join(process.cwd(), packagename, assets_path, "assets", "manifest.json")
    }

    /**
     * Customize a few things from our default manifest template, to match user information,
     * then overwrite any existing manifest at the given path
     */
    createManifestWithInfo(info, manifestDestinationPath) {
        return new Promise((resolve, reject) => {
            var rootScriptDirectory = path.dirname(require.main.filename)
            var templateManifestPath = path.join(rootScriptDirectory, "assets", "template_manifest.json")

            // Copy manifest template to current directory
            fs.copySync(templateManifestPath, manifestDestinationPath)

            // Update default manifest with user information
            var manifestJson = editJsonFile(manifestDestinationPath);
            
            manifestJson.set("id", info.packagename);
            manifestJson.set("name", info.appname);
            manifestJson.set("short_name", info.appname); // TODO: request both long name and short name from user?
            manifestJson.set("short_description", info.shortdescription);
            manifestJson.set("description", info.description);
            manifestJson.set("author.name", info.author);
            manifestJson.set("author.email", info.email);
            manifestJson.set("author.website", info.website);
            
            manifestJson.save(); // synchronous

            resolve()
        })
    }

    /**
     * Updates the given manifest with a start url that matches user's computer's IP address, instead of a local
     * index.html. This allows running ionic serve for easy debugging.
     */
    updateManifestForRemoteIndex(manifestPath) {
        console.log("Updating DApp manifest to use your computer's IP address as a start url (remote debugging)")

        var manifestJson = editJsonFile(manifestPath);

        // Retrieve computer's IP address
        var ipAddress = ip.address("public")

        manifestJson.set("start_url", "http://"+ipAddress+":8100");
        manifestJson.set("type", "url");

        manifestJson.save(); // synchronous
    }

    /**
     * Updates the given manifest with a start url points to the DApp's default index.html file.
     */
    updateManifestForLocalIndex(manifestPath) {
        console.log("Updating DApp manifest to use index.html as a start url")

        var manifestJson = editJsonFile(manifestPath);

        manifestJson.set("start_url", "index.html");
        manifestJson.set("type", "file");

        manifestJson.save(); // synchronous
    }

    updateManifestForProduction(manifestPath) {
        var manifestJson = editJsonFile(manifestPath);

        manifestJson.set("start_url", "index.html");
        manifestJson.set("type", "file");

        manifestJson.save(); // synchronous
    }
}