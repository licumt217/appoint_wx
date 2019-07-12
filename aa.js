var Parser = require("fast-xml-parser").j2xParser;
//default options need not to set
var defaultOptions = {
    // attributeNamePrefix : "@_",
    // attrNodeName: "@", //default is false
    // textNodeName : "#text",
    // ignoreAttributes : true,
    // cdataTagName: "__cdata", //default is false
    // cdataPositionChar: "\\c",
    // format: false,
    // indentBy: "  ",
    // supressEmptyNode: false,
};
var parser = new Parser(defaultOptions);
var xml = parser.parse({
    "aa":33,
    "xx":44
});

console.log(xml)
