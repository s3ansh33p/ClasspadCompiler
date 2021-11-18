# Reverse Engineering Classpad Files for CASIO Classpad II FX-CP400

## Breakdown of filedata


| **DATA**             | **HEX**                                    | **DESCRIPTION**                    |
|----------------------|--------------------------------------------|------------------------------------|
| VCP.XDATA.5f4d435305 | *5643502E58444154410035663464343335333035* | VCP Path                           |
| main                 | *6D61696E*                                 | Storage Path                       |
| .0                   | *0030*                                     | ??                                 |
| 5                    | *35*                                       | Filename length + 1, so max is 9   |
| AEAN                 | *4145414E*                                 | Filename                           |
| .00000031            | *003030303030303331*                       | ??                                 |
| main                 | *6D61696E*                                 | Storage Path                       |
|                      | *FFFFFFFF*                                 | 8 bytes - filename byte length     |
|                      | *FFFFFFFFFFFFFFFFFFFFFFFF*                 | ?? Space for longer file/path name |
| AEAN                 | *4145414E*                                 | Filename                           |
|                      | *FFFFFFFFFFFFFFFF*                         | ?? Space for longer file/path name |
| ....                 | *0000001C*                                 | FileSize decimal +20 in Classpad   |
| GUQ                  | *475551FFFFFFFFFFFFFFFFFFFF*               | ?? Header of some sorts            |
| 0000001c             | *3030303030303163*                         | FileSize in Classpad               |
| .                    | *0E*                                       | Content Length +3                  |
| ...........          | *000000000000000000000000*                 | ?? Space for longer header         |
| Hello World          | *48656C6C6F20576F726C64*                   | File Data                          |
| .                    | *00FF*                                     | End Indicator                      |
| ..                   | *1111*                                     | Length identifier?                 |
| 38                   | *3338*                                     | Parity Bytes                       |


## Raw bytes and testing

#### Changing the filename

AEAN-(Program).xcp

*5643502E584441544100356634643433353330356D61696E0030354145414E0030303030303033316D61696EFFFFFFFFFFFFFFFFFFFFFFFF4145414EFFFFFFFFFFFFFFFFFFFFFFFF0000001C475551FFFFFFFFFFFFFFFFFFFF30303030303031630E00000000000000000000000048656C6C6F20576F726C6400FF11113338*

VCP.XDATA.5f4d435305main.05**A**EAN.00000031main            **A**EAN            ....GUQ          0000001c.............Hello World. ..**38**


BEAN-(Program).xcp

*5643502E584441544100356634643433353330356D61696E0030352345414E0030303030303033316D61696EFFFFFFFFFFFFFFFFFFFFFFFF4345414EFFFFFFFFFFFFFFFFFFFFFFFF0000001C475551FFFFFFFFFFFFFFFFFFFF30303030303031630E00000000000000000000000048656C6C6F20576F726C6400FF11113336*

VCP.XDATA.5f4d435305main.05**B**EAN.00000031main            **B**EAN            ....GUQ          0000001c.............Hello World. ..**36**


CEAN-(Program).xcp

*5643502E584441544100356634643433353330356D61696E0030354345414E0030303030303033316D61696EFFFFFFFFFFFFFFFFFFFFFFFF4345414EFFFFFFFFFFFFFFFFFFFFFFFF0000001C475551FFFFFFFFFFFFFFFFFFFF30303030303031630E00000000000000000000000048656C6C6F20576F726C6400FF11113334*

VCP.XDATA.5f4d435305main.05**C**EAN.00000031main            **C**EAN            ....GUQ          0000001c.............Hello World. ..**34**


#### Changing the filename length

AEAN-(Program).xcp

*5643502E584441544100356634643433353330356D61696E0030354145414E0030303030303033316D61696EFFFFFFFFFFFFFFFFFFFFFFFF4145414EFFFFFFFFFFFFFFFFFFFFFFFF0000001C475551FFFFFFFFFFFFFFFFFFFF30303030303031630E00000000000000000000000048656C6C6F20576F726C6400FF11113338*

VCP.XDATA.5f4d435305main.05**A**EAN.00000031main            **A**EAN            ....GUQ          0000001c.............Hello World. ..**38**


AAEAN-(Program).xcp

*5643502E584441544100356634643433353330356D61696E003036414145414E0030303030303033316D61696EFFFFFFFFFFFFFFFFFFFFFFFF414145414EFFFFFFFFFFFFFFFFFFFFFF0000001C475551FFFFFFFFFFFFFFFFFFFF30303030303031630E00000000000000000000000048656C6C6F20576F726C6400FF11116234*

VCP.XDATA.5f4d435305main.06**AA**EAN.00000031main            **AA**EAN            ....GUQ          0000001c.............Hello World. ..**b4**


AAAAAEAN-(Program).xcp

*5643502E584441544100356634643433353330356D61696E003039414141414145414E0030303030303033316D61696EFFFFFFFFFFFFFFFFFFFFFFFF414141414145414EFFFFFFFFFFFFFFFF0000001C475551FFFFFFFFFFFFFFFFFFFF30303030303031630E00000000000000000000000048656C6C6F20576F726C6400FF11113238*

VCP.XDATA.5f4d435305main.06**AAAAA**EAN.00000031main            **AAAAA**EAN            ....GUQ          0000001c.............Hello World. ..**28**


#### Changing the file data

CEAN-(Program).xcp

VCP.XDATA.5f4d435305main.05CEAN.00000031main            CEAN            ....GUQ          0000001c.............**H**ello World. ..**34**


CEAN-(Program).xcp

VCP.XDATA.5f4d435305main.05CEAN.00000031main            CEAN            ....GUQ          0000001c.............**G**ello World. ..**35**


CEAN-(Program).xcp

VCP.XDATA.5f4d435305main.05CEAN.00000031main            CEAN            ....GUQ          0000001c.............**J**ello World. ..**32**


CEAN-(Program).xcp

VCP.XDATA.5f4d435305main.05CEAN.00000031main            CEAN            ....GUQ          0000001c.............**A**ello World. ..**3b**


4D 65 6C 6C 6F 20 57 6F 72 6C 64 = Mello World => 2f


CEAN.xcp

Filedata = 41 => A

Parity Bytes = 35 33 => 53

VCP.XDATA.5f4d435305main.05CEAN.00000031main            CEAN            ....GUQ          0000001c.............**A**. **53**


#### Changing the file contents

Clearly by altering the contents length, the number of endbytes changes such that filler bytes '11' are included.

Additionally, the length bytes are determined by the content length.
```
Content: 'NULL'
Content Length: 0
End Bytes: 00 FF 11
Length Bytes: 00 00 00 10

Content: A
Content Length: 1
End Bytes: 00 FF
Length Bytes: 00 00 00 10

Content: AA
Content Length: 2
End Bytes: 00 FF 11 11 11
Length Bytes: 00 00 00 14

Content: AAA
Content Length: 3
End Bytes: 00 FF 11 11
Length Bytes: 00 00 00 14

Content: AAAA
Content Length: 4
End Bytes: 00 FF 11
Length Bytes: 00 00 00 14

Content: AAAAA
Content Length: 5
End Bytes: 00 FF
Length Bytes: 00 00 00 14

Content: AAAAAA
Content Length: 6
End Bytes: 00 FF 11 11 11
Length Bytes: 00 00 00 18
```

```q
Changing first byte in Hello World => Parity

Appears to be like the ascii table but in reverse and shited by an amount

Classpad Manual Pages 295-298 has classpad ascii table from 32 to 924 (in decimal)

124 - charCodeAt(0) or 7c - hex = parity
-2 for ~ which wraps around to fe from 00
```


Special

| **DATA** | **HEX** |
|----------|---------|
|    ~     |   fe    |
|    }     |   ff    |
|   \|     |   00    |
|    {     |   01    |
|    z     |   02    |
|    a     |   1b    |
|    `     |   1c    |
|    _     |   1d    |
|    ^     |   1e    |
|    ]     |   1f    |
|    \     |   20    |
|    [     |   21    |
|    Z     |   22    |
|    Y     |   23    |
|    X     |   24    |
|    W     |   25    |
|    V     |   26    |
|    U     |   27    |
|    T     |   28    |
|    S     |   29    |
|    R     |   2a    |
|    Q     |   2b    |
|    P     |   2c    |
|    O     |   2d    |
|    N     |   2e    |
|    M     |   2f    |
|    L     |   30    |
|    K     |   31    |
|    J     |   32    |
|    I     |   33    |
|    H     |   34    |
|    G     |   35    |
|    F     |   36    |
|    E     |   37    |
|    D     |   38    |
|    C     |   39    |
|    B     |   3a    |
|    A     |   3b    |
|    @     |   3c    |
|    ?     |   3d    |
|    >     |   3e    |
|    =     |   3f    |
|    <     |   40    |
|    ;     |   41    |
|    :     |   42    |
|    9     |   43    |
|    8     |   44    |
|    7     |   45    |
|    6     |   46    |
|    5     |   47    |
|    4     |   48    |
|    3     |   49    |
|    2     |   4a    |
|    1     |   4b    |
|    0     |   4c    |
|    /     |   4d    |
|    .     |   4e    |
|    -     |   4f    |
|    ,     |   50    |
|    +     |   51    |
|    *     |   52    |
|    )     |   53    |
|    (     |   54    |
|    '     |   55    |
|    &     |   56    |
|    %     |   57    |
|    $     |   58    |
|    #     |   59    |
|    "     |   5a    |
|    !     |   5b    |
|   ' '    |   5c    |


#### End Length Parity
Not accounting for length byte parity

```js
 ["0000001c","00FF11","0f"]
 => Hello World| = b8
 => Should be = c8

 ["0000001c","00FF","10"]
 => Hello World|| = 3c
 => Should be = 5c

 ["00000020","00FF111111","11"]
 => Hello World||| = c0
 => Should be = a4
```

```js
The difference is 0x10 for each extra "11" byte taken off.
Assuming that this is true, then jump from two "|" to three "|" must be 0x30
However, I will ignore the 0x30 for now.
0xC0 - 0xA4 = 0x1C
Therefore rolling over to a new multiple of 4 has a modifier of 0x1C, at least in this case
```

```js
 ["00000020","00FF1111","12"]
 => Hello World|||| = 44
 => Should be = 38

 ["00000020","00FF11","13"]
 => Hello World||||| = d8
 => Should be = cc

 ["00000020","00FF","14"]
 => Hello World|||||| = 6c
 => Should be = 60
```

```js
Exploring further with 0x10 differences accounted for, clearly something else is impacting the results.
There is a constant difference of 0x0C now. Maybe the "00000020" is the cause?
```

```js
 ["00000024","00FF111111","15"]
 => 7x | = b4
 => Should be = a8

 ["00000024","00FF1111","16"]
 => 8x | = 54
 => Should be = 3c

 ["00000024","00FF11","17"]
 => 9x | = e8
 => Should be = d0
```

```js
With 7x |, the output is still 0x0C off.
Though when this is changed to 8x |, it adds another 0x0C, => 0x18
9x | also follows this, so I assume 10x and 11x will, then 12x will be another 0x0C?
```

```js
 ["00000024","00FF","18"]
 => 10x | = 7c
 => Should be = 64

 ["00000028","00FF111111","19"]
 => 11x | = c4
 => Should be = ac

 ["00000028","00FF1111","1a"]
 => 12x | = 64
 => Should be = 40
```

```js
As expected, the constant stayed the same at 0x18, and went to 0x24.
We can now use the length and modifiy it to be val / 4 * 0x0C, in which we manipulate the length to get the val.
```
