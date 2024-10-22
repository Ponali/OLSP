const util = require('util');

var argv = require('minimist')(process.argv.slice(2));

const getProjectFormula = require("./formula.js")
const generateProject = require("./scratch.js");

function showObjectDetailed(myObject){
    console.log(util.inspect(myObject, {showHidden: false, depth: null, colors: true}));
}

let folder = argv._[0];
if(!folder){
    console.log("Please provide a project folder name. (eg.: example)")
    return;
}

let startDate=Date.now();
getProjectFormula(folder,formula=>{
    generateProject(folder,formula,()=>{
        let time=Date.now()-startDate;
        console.log("Finished generating project in "+time+"ms");
    });
})