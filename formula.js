const images = require("./images.js");

let fs = require("fs");
let acorn = require("acorn");

let parsed;

function getFunction(funcName){
    return parsed.find(a=>a.type=="FunctionDeclaration"&&a.id.name==funcName);
}

function handleExpression(node,getVariable,data){
    if(node.type=="Identifier"){
        let varOut=getVariable(node.name);
        if(varOut===undefined){
            if(["timer","x","y","mouseX","mouseY"].includes(node.name)){
                return {operator:node.name}
            } else {
                throw new Error(`Unknown literal "${node.name}".`);
            }
        } else {
            return varOut;
        }
    }
    if(node.type=="MemberExpression"){
        if(node.object.name=="time"){
            return {
                operator:"time",
                value:node.property.name
            }
        }
    }
    if(node.type=="Literal") return node.value;
    if(node.type=="CallExpression"){
        if(node.callee.type=="Identifier"){
            let args=node.arguments.map(a=>handleExpression(a,getVariable,data)).map(a=>{
                if(typeof(a)=="string") return {operator:"data",value:a};
                return a;
            });
            if(node.callee.name=="letterOf"){
                return {operator:"letter",value:args[0],idx:args[1]};
            } else if(node.callee.name=="charIndexOf"){
                return {operator:"charIndexOf",value:args[0],search:args[1]};
            } else if(node.callee.name=="length"){
                return {operator:"length",value:args[0]};
            } else if(node.callee.name=="join"){
                return {operator:"join",left:args[0],right:args[1]};
            }
            // defined function inside script
            let functionNode=getFunction(node.callee.name);
            if(!functionNode) throw new Error(`Function "${node.callee.name}" does not exist`)
            return transformLoop(functionNode,node.arguments.map(a=>handleExpression(a,getVariable,data)),data);
        } else if(node.callee.type=="MemberExpression"){
            if(node.callee.object.name=="Math"){
                switch(node.callee.property.name){
                    case "sin":case "cos":case "tan":case "sqrt":case "abs":case "floor":case "round":case "ceil":{
                        return {
                            value:handleExpression(node.arguments[0],getVariable,data),
                            operator:node.callee.property.name
                        }
                    }
                    default:throw new Error(`Unknown Math object "${node.callee.property.name}"`);
                };
            } else if(node.callee.object.type=="MemberExpression") {
                if(node.callee.object.object.name=="images"){
                    return images.handleImageCall(node.callee.object.property.name,node.callee.property.name,node.arguments.map(a=>handleExpression(a,getVariable,data)),data);
                }
                console.log(node.callee.object);
            }
        }
    }
    if(node.type=="BinaryExpression"||node.type=="LogicalExpression"){
        switch(node.operator){
            case "+":case "-":case "*":case "/":case "%":case ">":case "<":case "&&":case "||":case "==":{
                return {
                    left:handleExpression(node.left,getVariable,data),
                    right:handleExpression(node.right,getVariable,data),
                    operator:node.operator
                };
            }
            case ">=":case "<=":{
                // its not natively supported but lets just fake it anyway ¯\_(ツ)_/¯
                let vleft={
                    left:node.left,
                    right:node.right,
                    operator:node.operator[0],
                    type:"BinaryExpression"
                };
                let vright={
                    left:node.left,
                    right:node.right,
                    operator:"==",
                    type:"BinaryExpression"
                };
                let out={operator:"||",
                    left:handleExpression(vleft,getVariable,data),
                    right:handleExpression(vright,getVariable,data),
                };
                //console.log(out);
                return out;
            }
            case "!=":{
                // yet again, not natively supported, but can be faked.
                let out={operator:"not",value:{
                    operator:"==",
                    left:handleExpression(node.left,getVariable,data),
                    right:handleExpression(node.right,getVariable,data)
                }};
                //console.log(out);
                return out
            }
            default:throw new Error(`Unsupported operation "${node.operator}"`);
        };
    };
    if(node.type=="UnaryExpression"){
        switch(node.operator){
            case "!": return {operator:"not",value:handleExpression(node.argument,getVariable,data)};
            default:throw new Error(`Unsupported unary operation "${node.operator}"`);
        }
    }
    console.log("COULD NOT FIGURE OUT NODE!");
    console.log(node);
    return node;
}

function handleAlgorithm(algo,args,data){
    //console.log(args);
    let unknownNode=algo.find(a=>!(["VariableDeclaration","ReturnStatement"].includes(a.type)));
    if(unknownNode){
        throw new Error("Expected VariableDeclaration or ReturnStatement, but got "+unknownNode.type)
    }
    //console.log(algo);

    let parsedVars = algo.filter(a=>a.type=="VariableDeclaration").map(a=>a.declarations).flat();
    let variables={};

    function getVariable(name){
        //console.log(name);
        if(args[name]!==undefined) return args[name];
        return variables[name];
    }

    parsedVars.forEach(a=>{
        variables[a.id.name] = handleExpression(a.init,getVariable,data);
    });

    //console.log(parsedVars);

    let returnStatement = algo.find(a=>a.type=="ReturnStatement");
    //console.log(returnStatement.argument);
    return handleExpression(returnStatement.argument,getVariable,data);
    //showObjectDetailed(variables);
}

function transformLoop(node,args,data){
    if(node.type=="FunctionDeclaration"){
        let argLabels=node.params.map(a=>a.name);
        let argObject={};
        for(let i=0;i<args.length;i++){
            argObject[argLabels[i]]=args[i];
        }
        return transformLoop(node.body,argObject,data);
    } else if(node.type=="BlockStatement"){
        return handleAlgorithm(node.body,args,data);
    }
}

function getProjectFormula(folder,callback){
    let data = JSON.parse(fs.readFileSync(folder+"/data.json").toString("utf8"));
    console.log("(1) Getting raw image contents");
    images.init(data,folder).then(()=>{
        console.log("(2) Converting JavaScript to object formula")
        console.log("    Concatenating code...")
        let jsFiles = fs.readdirSync(folder).filter(a=>a.endsWith(".js"));
        let jsConcat = jsFiles.map(a=>fs.readFileSync(folder+"/"+a)).join("\n");
        console.log("    Parsing...");
        parsed = acorn.parse(jsConcat, {ecmaVersion: 2020}).body;
        //console.log(parsed);
        console.log("    Converting parsed content...")
        callback( transformLoop(getFunction("main"),[],data) );
    })
};

module.exports = getProjectFormula;