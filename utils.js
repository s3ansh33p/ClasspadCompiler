const fs = require('fs');

function fileParity(hexraw) {
    var cleaned_hex = clean_hex(hexraw, false);
    if (cleaned_hex.length % 2) {
        console.error("Cleaned hex string length is odd.");     
        return;
    }

    var binary = new Array();
    for (var i=0; i<cleaned_hex.length/2; i++) {
        var h = cleaned_hex.substr(i*2, 2);
        binary[i] = parseInt(h,16);        
    }
    const bytes = binary.reduce(function(p, c){
        return p + parseInt(c, 16);
    }, 0).toString(16);
    console.log(bytes);
    console.log(binary)
    
}

function hexSplitter(str) {
    return str.match(/.{1,2}/g).join().replaceAll(","," ");
}

function calcHex(stringHex) {
    let arrHex = stringHex.split(' ');
    let totalDec = 0; 
    for (let i=0; i<arrHex.length; i++) {
        totalDec = parseInt(arrHex[i], 16);
    }
    return `Hex: ${totalDec.toString(16)} | Dec: ${totalDec}`;
}

function asciiToHex(str) {
	var arr = [];
	for (var n = 0, l = str.length; n < l; n ++) 
     {
		var hex = Number(str.charCodeAt(n)).toString(16);
		arr.push(hex);
	 }
	return arr.join('');
}

// https://tomeko.net/online_tools/file_to_hex.php?lang=en

function clean_hex(input, remove_0x) {
    input = input.toUpperCase();
    
    if (remove_0x) {
        input = input.replace(/0x/gi, "");        
    }
    
    var orig_input = input;
    input = input.replace(/[^A-Fa-f0-9]/g, "");
    if (orig_input != input)
        console.warn("Non-hex characters (including newlines) in input string ignored.");
    return input;    
} 

function download(hexraw, filename) {
    var cleaned_hex = clean_hex(hexraw, false);
    if (cleaned_hex.length % 2) {
        console.error("Cleaned hex string length is odd.");     
        return;
    }

    var binary = new Array();
    for (var i=0; i<cleaned_hex.length/2; i++) {
    var h = cleaned_hex.substr(i*2, 2);
    binary[i] = parseInt(h,16);        
    }

    var byteArray = new Uint8Array(binary);
    var a = window.document.createElement('a');

    a.href = window.URL.createObjectURL(new Blob([byteArray], { type: 'application/octet-stream' }));
    a.download = filename;

    // Append anchor to body.
    document.body.appendChild(a)
    a.click();

    // Remove anchor from body
    document.body.removeChild(a)        
} 

function nodeDownload(hexraw, filename) {
    var cleaned_hex = clean_hex(hexraw, false);
    if (cleaned_hex.length % 2) {
        console.error("Cleaned hex string length is odd.");     
        return;
    }

    var binary = new Array();
    for (var i=0; i<cleaned_hex.length/2; i++) {
    var h = cleaned_hex.substr(i*2, 2);
    binary[i] = parseInt(h,16);        
    }

    var byteArray = new Uint8Array(binary);

    fs.open(filename, 'w', function(err, fd) {
        if (err) {
            throw 'error opening file: ' + err;
        }

        fs.write(fd, byteArray, 0, byteArray.length, null, function(err) {
            if (err) throw 'error writing file: ' + err;
            fs.close(fd, function() {
                console.log('File written');
            })
        });
    });
}

function generateHex() {
    // main\CEAN.xcp => Hello World
    const cpName = "CEAN"; // 4345414E
    const cpPath = "main"; // 6D61696E
    const content = "A";
    // needs to account for longer / short names
    const headerBytes = "5643502E58444154410035663464343335333035" +
    asciiToHex(cpPath) + // folder
    "0030" +
    "35" + // file name len
    asciiToHex(cpName) +
    "003030303030303331" +
    asciiToHex(cpPath) + // folder 
    "FFFFFFFFFFFFFFFFFFFFFFFF" +
    asciiToHex(cpName) +
    "FFFFFFFFFFFFFFFFFFFFFFFF" +
    "0000001C" + // filesize probs need to use content length
    "475551FFFFFFFFFFFFFFFFFFFF" +
    "3030303030303163" + // filesize
    "0E" + // content length
    "000000000000000000000000";
    let endBytes = "00FF1111";
    let filedata = `${headerBytes}${asciiToHex(content)}${endBytes}`;
    // fileParity(filedata);
    let parityBytes = evaluateParity(content)
    // Note that changing Hello World changes the parityBytes
    let filename = "c-converted.xcp";
    filedata += parityBytes;
    console.log(filedata)
    // download(filedata,filename);
    nodeDownload(filedata, filename);
}   

function evaluateLengthBytes(content) {
    const srcLength = content.length; // srcLength may also involve file name / path ?

    let contentLength = (srcLength+3).toString(16);
    if (contentLength.length % 2 === 1) contentLength = "0" + contentLength;

    const endBytes = "00FF" + "11".repeat(3 - ( (srcLength + 2) % 4)); // filler '11' bytes

    let outBytes = ((Math.round(srcLength / 4) * 4) + 16).toString(16);
    outBytes = "00".repeat( (8 - outBytes.length) / 2) + outBytes;

    console.log(`OutBytes: ${outBytes} | EndBytes: ${endBytes} | OutLength: ${contentLength}`)
    return [outBytes, endBytes, contentLength];
}

function evaluateParity(content) {
    // Fill probs need the entire filedata
    let modByte = 0x50;
    for (let i=0; i<content.length; i++) {
        let baseByte = content.charCodeAt(i);
        modByte -= baseByte;
    
        if (modByte < 0) {
            modByte += 0x100;
        }

        console.log(`ModByte: ${modByte} | BaseByte: ${baseByte} | Ascii: ${content.slice(i,i+1)}`)
    }

    let parityBytes = asciiToHex(modByte.toString(16));
    // Add padding 00
    if (parityBytes.length === 2) {
        parityBytes = `30${parityBytes}`;
    }
    console.log(`ParityBytes: ${parityBytes} | RotBase: ${0x50}`)
    return parityBytes;
}

// generateHex();

let a = evaluateLengthBytes("ABCDEF")
console.log(a)
