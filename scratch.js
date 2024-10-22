let JSZip = require("jszip");
let fs = require("fs");

function changeProjectJSON(folder,callback,endCallback){
    console.log("    Loading project through JSZip...")
    let filename = folder+"/project.sb3";
    JSZip.loadAsync(fs.readFileSync(filename)).then(zip=>{
        console.log("    Getting project.json...")
        zip.file("project.json").async("string").then(content=>{
            callback(JSON.parse(content),newContent=>{
                console.log("    Inserting edited project.json and saving file...");
                zip.file("project.json",JSON.stringify(newContent));
                zip
                .generateNodeStream({type:'nodebuffer',streamFiles:true})
                .pipe(fs.createWriteStream('generated.sb3')).on("finish",()=>{
                    endCallback();
                });
            })
        })
    })
}

function getOutputLocation(targets){
    let scan=targets.map(a=>a.blocks);
    for(let i=0;i<scan.length;i++){
        for(let j in scan[i]){
            if(scan[i][j].inputs.COLOR&&scan[i][j].inputs.COLOR[1][0]==12&&scan[i][j].inputs.COLOR[1][1]=="_OLSPOutput"){
                return [i,j];
                // first element: index of target (or sprite)
                // second element: id of block with variable
            }
        }
    }
}

function makeAvailableBlockID(existing){
    function letter(){
        return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"[Math.floor(Math.random()*64)];
    }
    let out="OLSP_"+[...Array(Math.floor(4+Math.random()*3))].map(letter).join("")
    if(existing[out]!==undefined) return makeAvailableBlockID(existing);
    return out;
}

function makeAvailableListID(existing){
    function letter(){
        return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"[Math.floor(Math.random()*64)];
    }
    let out="OLSP_"+[...Array(Math.floor(4+Math.random()*3))].map(letter).join("")
    if(existing.find(a=>a[0]==out)!==undefined) return makeAvailableBlockID(existing);
    return out;
}

let datalist=[];
let listname="data";
let listid="OLSPDataList";

function addDataList(project){
    project.targets[0].lists[listid]=[listname,[]];
    return project;
}

function addDataToDataList(project){
    //console.log(datalist);
    project.targets[0].lists[listid][1]=datalist.map(a=>""+a);
    return project;
}

let charIndexOfLists=[];

function addIndexArrayLists(project){
    for(let i=0;i<charIndexOfLists.length;i++){
        let ciolist=charIndexOfLists[i];
        if(typeof(ciolist[1])=="object") ciolist[1]=ciolist[1].value;
        project.targets[0].lists[ciolist[0]]=[ciolist[2],ciolist[1].split("")];
    }
    return project;
}

function addFormulaToProject(project,formula,targetIdx,parentID,properties){
    //console.log(formula);
    let id;

    function block(opcode,nums,numNames,fields){
        id=makeAvailableBlockID(project.targets[targetIdx].blocks);
        let inputsNative={};
        for(let i=0;i<numNames.length;i++){
            if(typeof(nums[i])=="object"&&nums[i].operator=="data") nums[i]=nums[i].value;
            if(typeof(nums[i])=="number"){
                inputsNative[numNames[i]]=[1,[4,nums[i].toString()]]
            } else if(typeof(nums[i])=="string"&&((!properties.rules.lists)||(nums[i].length<properties.rules.dataListMinimumLength))){
                // if its data and lists aren't allowed
                inputsNative[numNames[i]]=[1,[4,nums[i]]]
            } else {
                inputsNative[numNames[i]]=[3,addFormulaToProject(project,nums[i],targetIdx,id,properties)[1],[4,""]]
            }
        }
        project.targets[targetIdx].blocks[id]={opcode:opcode,next:null,parent:parentID,inputs:inputsNative,fields};
    }

    function handleData(data){
        // add data if it doesnt exist and get index
        let i=-1;
        if(datalist.includes(data)){
            i=datalist.indexOf(data);
        } else {
            datalist.push(data);
            i=datalist.length-1;
        }

        // add block for that
        block("data_itemoflist",[i+1],["INDEX"],{"LIST":[listname,listid]}) // this is added by one since scratch doesnt do it automatically
    }

    function handleCharIndexOf(formula){
        //console.log(formula);
        if(!properties.rules.lists){
            console.error("Cannot fullfill a charIndexOf function because lists aren't allowed. Please edit the code to work without charIndexOf, or change the rules.lists element to true in data.json.");
            process.exit();
        }

        let listName="";
        let listID="";
        let foundExisting=charIndexOfLists.find(a=>a[1]==formula.value);
        if(foundExisting){
            listID=foundExisting[0];
            listName=foundExisting[2];
        } else {
            listID=makeAvailableListID(charIndexOfLists);
            listName="OLSPVirtualIndexArray"+Math.floor(Math.random()*10000000);
            charIndexOfLists.push([listID,formula.value,listName]);
        };

        block("data_itemnumoflist",[formula.search],["ITEM"],{"LIST":[listName,listID]});
    }

    if(typeof(formula)=="string"){
        handleData(formula);
        return [project,id];
    }

    switch(formula.operator){
        case "x":block("motion_xposition",[],[]);break;
        case "y":block("motion_yposition",[],[]);break;
        case "timer":block("sensing_timer",[],[]);break;
        case "mouseX":block("sensing_mousex",[],[]);break;
        case "mouseY":block("sensing_mousey",[],[]);break;
        case "+":block("operator_add",[formula.left,formula.right],["NUM1","NUM2"]);break;
        case "-":block("operator_subtract",[formula.left,formula.right],["NUM1","NUM2"]);break;
        case "*":block("operator_multiply",[formula.left,formula.right],["NUM1","NUM2"]);break;
        case "/":block("operator_divide",[formula.left,formula.right],["NUM1","NUM2"]);break;
        case "%":block("operator_mod",[formula.left,formula.right],["NUM1","NUM2"]);break;
        case "<":block("operator_lt",[formula.left,formula.right],["OPERAND1","OPERAND2"]);break;
        case ">":block("operator_gt",[formula.left,formula.right],["OPERAND1","OPERAND2"]);break;
        case "==":block("operator_equals",[formula.left,formula.right],["OPERAND1","OPERAND2"]);break;
        case "&&":block("operator_and",[formula.left,formula.right],["OPERAND1","OPERAND2"]);break;
        case "||":block("operator_or",[formula.left,formula.right],["OPERAND1","OPERAND2"]);break;
        case "not":block("operator_not",[formula.value],["OPERAND"]);break;
        case "round":block("operator_round",[formula.value],["NUM"]);break;
        case "abs":block("operator_mathop",[formula.value],["NUM"],{"OPERATOR":["abs",null]});break;
        case "floor":block("operator_mathop",[formula.value],["NUM"],{"OPERATOR":["floor",null]});break;
        case "ceil":block("operator_mathop",[formula.value],["NUM"],{"OPERATOR":["ceiling",null]});break;
        case "sqrt":block("operator_mathop",[formula.value],["NUM"],{"OPERATOR":["sqrt",null]});break;
        case "sin":block("operator_mathop",[formula.value],["NUM"],{"OPERATOR":["sin",null]});break;
        case "cos":block("operator_mathop",[formula.value],["NUM"],{"OPERATOR":["cos",null]});break;
        case "join":block("operator_join",[formula.left,formula.right],["STRING1","STRING2"]);break;
        case "letter":block("operator_letter_of",[formula.value,formula.idx],["STRING","LETTER"]);break;
        case "length":block("operator_length",[formula.value],["STRING"]);break;
        case "time":block("sensing_current",[],[],{"CURRENTMENU":[["YEAR","MONTH","DATE","DAYOFWEEK","HOUR","MINUTE","SECOND"][["year","month","date","dayOfWeek","hours","minutes","seconds"].indexOf(formula.value)],null]});break;
        case "charIndexOf":handleCharIndexOf(formula);break;
        case "data":handleData(formula.value);break;
        default:console.log(formula);throw new Error(`Unknown operator ${formula.operator}`);
    }
    return [project,id] // edited project
}

function generateProject(folder,formula,doneCallback){
    console.log("(3) Converting object formula into Scratch blocks");
    let properties = JSON.parse(fs.readFileSync(folder+"/data.json").toString("utf8"));
    changeProjectJSON(folder,(project,saveCallback)=>{
        if(properties.rules.lists){
            console.log("    Adding data list...");
            project=addDataList(project);
        }

        console.log("    Getting location of output variable...");
        let location=getOutputLocation(project.targets);
        if(!location) throw new Error("Cannot find any variabled named \"_OLSPOutput\" from a COLOR input. If it actually is there, please report this through GitHub Issues.");

        console.log("    Converting formula...")
        let formulaBlockID;
        [project, formulaBlockID] = addFormulaToProject(project,formula,location[0],location[1],properties);
        project.targets[location[0]].blocks[location[1]].inputs.COLOR=[3,formulaBlockID,[4,""]];

        if(properties.rules.lists){
            console.log("    Adding additional data to list...")
            project=addDataToDataList(project);

            console.log("    Adding Index Array List(s)...");
            project=addIndexArrayLists(project);
        }

        saveCallback(project);
    },()=>{
        doneCallback()
    })
}

module.exports = generateProject;