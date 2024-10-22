# Introduction
OLSP, or "One-Line Scratch Programming" is a tool created by Ponali that converts Javascript code into Scratch blocks that form one line. This is made to be particularily helpful in "1-line challenges" like the [1-line challenge by Scratch-Minion](https://scratch.mit.edu/projects/114926871/), or [the movie challenge](https://scratch.mit.edu/projects/608772342/) ([full screen version here](https://scratch.mit.edu/projects/611319974)).

You can also import images into this program, and it will automatically be resized and converted into raw pixels so that it can be interpreted into a valid formula.

This program, project, or repo is not affiliated with Scratch in any way. This has only been made for educational, experimentation and demonstrational purposes.

*This README is in work in progress! Please come back later when everything has been explained to its fullest.*
# Setting up
Setting it up works as any Node.JS repo:
```
$ git clone https://github.com/Ponali/OLSP.git
$ cd OLSP
$ npm install
```
# How to use
## Project files
A project is a folder inside of the OLSP program that is not `node_modules`.
A project must have the following files:
- One or more JavaScript (.js) files
- data.json (Defines a bunch of settings)
- project.sb3 (The project to edit)
- All required media defined by data.json
## Pseudo-javascript
The JavaScript used is not exactly the JavaScript you write on the daily - only mathematical operations, functions, constant variable declarations and return statements are allowed.

**WARNING:** Consider this common practice when writing code for this: Do not copy variable names, function parameters, image invoking, and anything that seem related. If you call a variable (etc.) more than once, its value is going to be duplicated, effectively bloating the final result.

The program first merges all javascript files into one, so no import/require statements are required, but if you make a function with the same name into two files at once, one is going to overwrite the other.

It is required to have a function with the name `main()`, and every function must atleast return a value.

Time and date isn't handled by the `Date` element, but with the `time` and `timer` elements. `time` contains the properties `"year","month","date","dayOfWeek","hours","minutes","seconds"` which are self-explanatory, and `timer` is the timer operator in Scratch, which returns the amount of seconds that has passed since the green flag has been clicked.

Because of technical limitations with the parser and the need for specifying adding numbers and joining strings: the `+` operator will only work for adding numbers, and a new function called `join` for joining strings.

Anything related to invoking something from an element that is built-in to Javascript (e.g. `myNumber.toString(16)` or `myString.length`) wasn't easy to handle, so these has been replaced with regular functions:
- `myString.length` turns into `length(myString)`
- `myString[3]` turns into `character(myString,3)`
- `myCharacterList.indexOf("e")` turns into `charIndexOf(myCharacterList,"e")` (Scratch does not natively support an actual indexOf for substrings as operators, so this cannot be done.)

### Invoking images
Images can be invoked by using this syntax: `images.[name].pixel[format]([x],[y])`

Image names are defined in data.json, so make sure it is not left empty.

Pixel formats are defined with the color channel and the overall bit depth returned. Color channels supported are R (red), G (green), B (blue), and M (monochrome).
Currently supported pixel formats are `RGB24, R8, G8, B8, M8, and M1`.

**WARNINGS**:
- No dithering will take place in any context, even `M1`. Please dither your image before trying to load it in your pixel format.
- Do not reuse image invoking when it is on the same image. If you want to handle the Red, Green, and Blue channel seperately, instead of parsing them from an `RGB24` result, invoke the image as `R8`, `G8`, and `B8`.
- Invoking an image pixel will return a value between 0 and 2^[bitDepth]-1. It will not return a value between -1 and 1 or anything else, so you will have to edit the value to your liking for it to work.

## data.json
This file defines all the rules and images to use when converting all code and data into a Scratch project.

### `images` property
This property is an Object that contains all images to be imported and used.

Any image must have the following property:

- `file` (String): The filename of the image to import.
- `width` (Number): The width to resize to when storing the image.
- `height` (Number): The height to resize to when storing the image.

### `rules` property
This property is an Object that contains all the rules the program has to obey when it comes to converting to Scratch blocks.
Here are all the properties used:

- `lists` (Boolean): Whether to store all the data in a list. If true, this adds more room for debugging, and saves space on the final result.
- `dataListMinimumLength` (Number): Minimum cap for if a string of data should be put in the data folder or not.

## project.sb3

This is the project that will get taken by the program in which it will put all the scratch blocks.
For it to know *where* to put those scratch blocks, you have to make a variable called "_OLSPOutput" and put it in a "set pen color" block.

### OK, but which "set pen color" block?
There actually are two blocks that sets the pen color, but here is a table that can differenciate between the two:

| The text "color" isn't a drop-down menu | The text "color" is a drop-down menu and the input is a number |
| --- | --- |
| The block is using "real color" (RGB24) and has no issues when used. | The block only controls the "hue" value, and does not work with anything related to lightness and saturation, unless if it is repeated. Will not work with images. |

Choosing between these blocks is important, because the first one listed has support for basically any color, and images look fine. The ladder though, will only work with anything completely saturated and on average brightness, and because of the limited colors this gives, it isn't possible to simply use an image with this method.

## Running the program

Once you're finally done with all the coding and handling data, you need to run the program to convert all your code into Scratch blocks.

The main program script is located at `index.js`, and simply running `node index.js [projectFolder]` will automatically convert your code for you.

Once it's done, it will output its final result into `generated.sb3`.

This is currently bland right now, but there may be more features related to terminal arguments soon.
