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

function generateHex(content) {
    // main\CEAN.xcp => Hello World
    const cpName = "CEAN"; // 4345414E
    const cpPath = "main"; // 6D61696E

    let lengthData = evaluateLengthBytes(content);

    console.log(JSON.stringify(lengthData))

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
    lengthData[0] + //"0000001C" + // filesize probs need to use content length
    "475551FFFFFFFFFFFFFFFFFFFF" +
    asciiToHex(lengthData[0]) + // "3030303030303163" + // filesize
    lengthData[2] + //"0E" + // content length
    "000000000000000000000000";
    // let endBytes = "00FF1111";
    let endBytes = lengthData[1];
    let filedata = `${headerBytes}${asciiToHex(content)}${endBytes}`;
    // fileParity(filedata);
    let parityBytes = evaluateParity(content, endBytes, lengthData[2]); // for 00FF1111 etc.
    // Note that changing Hello World changes the parityBytes
    let filename = "c-converted.xcp";
    filedata += parityBytes;
    console.log(filedata.toUpperCase())
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

function evaluateParity(content, endBytes, contentLength) {
    // Fill probs need the entire filedata
    let modByte = 0x50;
    for (let i=0; i<content.length; i++) {
        let baseByte = content.charCodeAt(i);
        modByte -= baseByte;
    
        if (modByte < 0) {
            modByte += 0x100;
        } else if (modByte > 0x100) {
            modByte -= 0x100
        }

        // console.log(`ModByte: ${modByte} | BaseByte: ${baseByte} | Ascii: ${content.slice(i,i+1)}`)
    }

    // 00FF => + 0x20
    // 00FF11 => + 0x10
    // 00FF1111 => + 0x00
    // 00FF111111 => - 0x1C
    if (endBytes.length == 10) {
        modByte -= 0x1C;
    } else if (endBytes.length == 6) {
        modByte += 0x10;
    } else if (endBytes.length == 4) {
        modByte += 0x20;
    }

    // divide 4 byte constant
    const decimalContentLength = parseInt( contentLength, 16 ) ;
    const byteContentLength = parseInt( ( decimalContentLength - 14) / 4 );
    modByte -= 0x0C * byteContentLength;

    // check for char lengths under 7 | contentLength -3 is actual length
    if (decimalContentLength < 10) {
        modByte += 0x0C
        if (decimalContentLength == 6) {
            modByte -= 0x0C // revert change
        } else if (decimalContentLength == 9) {
            modByte -= 0xF4 // for some reason this works?
        }
    }

    // Final check to wrapping around hex values
    if (modByte < 0) {
        modByte += 0x100;
    } else if (modByte > 0x100) {
        modByte -= 0x100
    }

    let parityBytes = asciiToHex(modByte.toString(16));
    // Add padding 00
    if (parityBytes.length === 2) {
        parityBytes = `30${parityBytes}`;
    }
    console.log(`ParityBytes: ${parityBytes} | ModByte: ${"0x" + modByte.toString(16).toUpperCase()} (${modByte}) | ContentLengthByte: ${byteContentLength} | RotBase: ${0x50}`)
    return parityBytes;
}

// generateHex();

const body = "Sean"

// console.log(evaluateLengthBytes(body))
// evaluateParity(body, true)
generateHex(body)

