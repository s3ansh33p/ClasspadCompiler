const fs = require('fs');

function asciiToHex(str) {
	var arr = [];
	for (var n = 0, l = str.length; n < l; n ++) 
     {
		var hex = Number(str.charCodeAt(n)).toString(16);
		arr.push(hex);
	 }
	return arr.join('');
}

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

function generateHex(content, cpName, cpPath) {
    let file = {
        'vcp': '5643502E584441544100',
        'mcs': asciiToHex('5f4d4353'),
        'folname_len': '333' + (cpPath.length + 1),
        'folname': asciiToHex(cpPath)+"00",
        'varname_len': '333' + (cpName.length + 1),
        'varname': asciiToHex(cpName)+"00",
        'block31': asciiToHex('00000031'),
        'folname2': asciiToHex(cpPath) + "FF".repeat(16 - cpPath.length),
        'varname2': asciiToHex(cpName) + "FF".repeat(16 - cpName.length),
        'len': '',
        'var_type': '475551FFFFFFFFFFFFFFFFFFFF',
        'length_ascii': '',
        'data': {
            'text_len': '',
            'block_zero_8': '0000000000000000',
            'block_zero': '00',
            'text': asciiToHex(content),
            'eof': '00FF',
            'padding': "11".repeat(3 - ( (content.length + 2) % 4))
        },
        'checksum': ''
    }

    // Length Data
    let outBytes = ((Math.round(content.length / 4) * 4) + 16).toString(16);
    outBytes = "0".repeat(8 - outBytes.length) + outBytes;
    file.len = outBytes;

    // Length_Ascii Data
    file.length_ascii = asciiToHex(outBytes);

    // Text_Len Data
    let text_len = (content.length+3).toString(16);
    text_len += "0".repeat(8 - text_len.length);
    file.data.text_len = text_len;

    console.log(file)

    // join all data fields in order in the file and calculate checksum
    let file_data = "";
    for (let key in file) {
        if (key === "data") {
            file_data += file["data"].text_len;
            file_data += file["data"].block_zero_8;
            file_data += file["data"].block_zero;
            file_data += file["data"].text;
            file_data += file["data"].eof;
            file_data += file["data"].padding;
        } else if (key !== "checksum") {
            file_data += file[key];
        }
    }

    let checksum = 0;        
    let bytes = file_data.match(/.{1,2}/g);
    for (let i=0; i<bytes.length; i++) {
        checksum -= parseInt(bytes[i], 16);
        console.log(checksum)
    }

    while (checksum < -8192) {
        checksum += 8192;
    }
    while (checksum < -1024) {
        checksum += 1024;
    }
    while (checksum < 0) {
        checksum += 256;
    }

    file_data += asciiToHex(checksum.toString(16));
    
    console.log(checksum, asciiToHex(checksum.toString(16)))
    console.log(file_data.toUpperCase())

    nodeDownload(file_data, filename);
}   

const filename = "c-converted.xcp"
generateHex("Hello WorldS", "Sean", "McGinty")
