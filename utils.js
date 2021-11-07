const fs = require('fs');

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
    let cpName = "CEAN"; // 4345414E
    // needs to account for longer / short names
    let headerBytes = "5643502E584441544100356634643433353330356D61696E003035" + asciiToHex(cpName) +
    "0030303030303033316D61696EFFFFFFFFFFFFFFFFFFFFFFFF" + asciiToHex(cpName) +
    "FFFFFFFFFFFFFFFFFFFFFFFF0000001C475551FFFFFFFFFFFFFFFFFFFF30303030303031630E000000000000000000000000";
    let endBytes = "00FF1111";
    let content = "Iello World";
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

function evaluateParity(content) {
    // Fill probs need the entire filedata
    const firstChar = content.slice(0,1)
    const charCodeModifier = firstChar.charCodeAt(0);
    // Need to convert someModifier to use base16 instead of 10
    const someModifier = 14 + (charCodeModifier - 72)*2 // starting at H; // modifier for first character in content - also why 14?
    const parityBytes = asciiToHex((asciiToHex(firstChar)-someModifier).toString());
    console.log(`ParityBytes: ${parityBytes} | ModByte: ${(asciiToHex(firstChar)-someModifier)} | CharCode: ${charCodeModifier} | SomeMod: ${someModifier} BaseByte: ${asciiToHex(firstChar)}`)
    return parityBytes;
}

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

// generateHex();
evaluateParity("C")
