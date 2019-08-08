
const path = require("path");
const ManifestHelper = require("../helpers/manifest.helper")

exports.command = 'manifest'
exports.describe = 'Creates or update a Trinity manifest.json inside the ionic app project'
exports.builder = {
}
exports.handler = function (argv) {
    launchManifestCreation()
}

function launchManifestCreation() {
    var manifestHelper = new ManifestHelper()

    manifestHelper.promptAppInformation().then((info)=>{
        // Manifest is created in current folder
        var manifestDestinationPath = path.join(process.cwd(), "manifest.json")
        
        manifestHelper.createManifestWithInfo(info, manifestDestinationPath).then(()=>{
            console.log("OK - manifest.json has been created/updated.")
        })
        .catch((err)=>{
            console.error("Failed to save your information in the manifest")
            console.error("Error:", err)
        })
    })
    .catch((err)=>{
        console.error("Failed to collect information to generate the manifest")
        console.error("Error:", err)
    })
}