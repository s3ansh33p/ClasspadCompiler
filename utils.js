const fs = require('fs');

function asciiToHex(str) {
    var arr = [];
    for (var n = 0, l = str.length; n < l; n++) {
        var hex = Number(str.charCodeAt(n)).toString(16);
        if (hex.length == 2) arr.push(hex);
        else arr.push('0' + hex)
    }
    return arr.join('');
}

function hexToAscii(hex) {
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
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
    if (content.length > 30720) {
        console.warn("[WARN] Content is over 30720 bytes. All data after 30720 bytes will be ignored")
        content = content.slice(0, 30720);
    }
    let file = {
        'vcp': '5643502E584441544100',
        'mcs': '5f4d4353', // ha
        'folname_len': '0' + (cpPath.length + 1), // ha
        'folname': asciiToHex(cpPath)+"00",
        'varname_len': '0' + (cpName.length + 1), // ha
        'varname': asciiToHex(cpName)+"00",
        'block31': '00000031', // ha
        'folname2': asciiToHex(cpPath) + "FF".repeat(16 - cpPath.length),
        'varname2': asciiToHex(cpName) + "FF".repeat(16 - cpName.length),
        'len': '',
        'var_type': '475551FFFFFFFFFFFFFFFFFFFF',
        'length_ascii': '', // ha
        'data': {
            'text_len': '',
            'block_zero_8': '0000000000000000',
            'block_zero': '00',
            'text': asciiToHex(content),
            'eof': '00FF',
            'padding': "11".repeat(3 - ( (content.length + 2) % 4))
        }
    }

    // Length Data
    let outBytes = ((Math.round(content.length / 4) * 4) + 16).toString(16);
    outBytes = "0".repeat(8 - outBytes.length) + outBytes;
    file.len = outBytes;

    // Length_Ascii Data
    file.length_ascii = outBytes;

    // Text_Len Data
    let text_len = (content.length+3).toString(16);
    text_len += "0".repeat(8 - text_len.length);
    file.data.text_len = text_len;

    // console.log(file)

    // join all data fields in order in the file and calculate checksum
    let file_data = "";
    let checksum = 0x00;
    const convertedKeys = ["mcs", "folname_len", "varname_len", "block31", "length_ascii"];
    for (let key in file) {
        if (key === "data") {
            let data = file["data"].text_len + 
            file["data"].block_zero_8 + 
            file["data"].block_zero + 
            file["data"].text + 
            file["data"].eof + 
            file["data"].padding;
            file_data += data
            checksum = updateChecksum(data, checksum)
        } else if (convertedKeys.indexOf(key) !== -1) {
            file_data += asciiToHex(file[key]);
            checksum = updateChecksum(file[key], checksum)
        } else {
            file_data += file[key];
            checksum = updateChecksum(file[key], checksum)
        }

    }
    
    checksum = checksum.toString(16);
    if (checksum.length == 1) checksum = "0" + checksum;
    file_data += asciiToHex(checksum);
    
    // console.log(file_data.toUpperCase())

    nodeDownload(file_data, filename);
}   

function updateChecksum(bytes, checksum) {
    bytes = bytes.match(/.{1,2}/g);
    for (let i=0; i<bytes.length; i++) {
        checksum -= parseInt(bytes[i], 16);
        checksum &= 0xFF;
    }
    return checksum;
}

// const filename = "c-converted.xcp"
// const filename = "a-(Mem).xcp"
// const filename = "b-(String).xcp"
const filename = "y-(Expression).xcp"
// const filename = "d-(Program).xcp"
// generateHex("Max 30720\nTest", "Sean", "McGinty")

async function readLocalFile() {
    fs.readFile(filename, 'utf8', (err, data) => {
        if (err) throw err;
        filedata = new Uint8Array(data.length);
        for (let i = 0; i < data.length; i++) {
            filedata[i] = data.charCodeAt(i);
        }
        // console.log(filedata)

        let folname_len = parseInt(hexToAscii(filedata[19].toString(16)));
        let folname = '';
        for (let i=0; i<folname_len - 1; i++) {
            folname += hexToAscii(filedata[20+i].toString(16));
        }
        let varname_len = parseInt(hexToAscii(filedata[21+folname_len].toString(16)));
        let varname = '';
        for (let i=0; i<varname_len - 1; i++) {
            varname += hexToAscii(filedata[22+folname_len+i].toString(16));
        }
        // metadata
        let meta = ''
        let min = 73;
        for (let i=min; i<min+3; i++) { // haven't found the edge case for 4 bytes
            meta += hexToAscii(filedata[i].toString(16));
        }
        meta = asciiToHex(meta).toUpperCase();
        console.log(meta)
        const lookup = [
            {
                'byte': '47',
                'info': "Program/Text",
            },
            {
                'byte': '4E',
                'info': "Memory",
            },
            {
                'byte': '05',
                'info': "String",
            },
            {
                'byte': '12',
                'info': "Expression",
            }
        ];
        // read first metadata byte and log info
        let metatype = lookup.find(x => x.byte == (meta[0]+""+meta[1]).toString(16)).info;

        // check if unlocked
        let unlocked = ((meta[2]+""+meta[3]).toString(16) == 0x55) ? true : false;

        let text = '';
        let index = 100+folname_len+varname_len;
        // check if string or expression as the have different index
        if (metatype == "String" || metatype == "Expression") {
            index = 100-15+folname_len+varname_len; // will need to confirm - will also need to look into expressions at some point
        }
        let raw = '';
        while (filedata[index] != 0x00) {
            text += hexToAscii(filedata[index].toString(16));
            raw += filedata[index].toString(16);
            index++;
        }
        console.log(`Reading file: ${filename} (${unlocked ? "Unlocked" : "Locked"}) | Type: ${metatype} | Varname: ${varname} | Folder: ${folname}`); 
        console.log(text)
        console.log(raw)
    });
}

readLocalFile()
