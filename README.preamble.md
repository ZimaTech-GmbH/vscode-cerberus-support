# VS Code extension for Cerberus X #

`VS Code extension for Cerberus X` enables programming Cerberus X in Visual Studio Code. The goal of this extension is to provide basic and more sophisticated features necessary and useful for working with Cerberus X.

## Involved Parties ##

`VS Code extension for Cerberus X` was created by Olivier Stuker inspired by Adamredwoods' `Visual Studio Code extension for Cerberus Programming Language` and Hezkore's `BlitzMax Language Basics for Visual Studio Code`.

POC: [Olivier "Holzchopf" Stuker](https://cerberus-x.com/community/members/holzchopf.49/)

## License ##

See `LICENSE.md`

## Testing the extension ##

From within VS Code, just hit `F5` to start a testing instance with `VS Code extension for Cerberus X` loaded. Then load any `.cxs` file to activate the extension.

Automatic testing is not yet set up.

## Building the extension ##

Run
```
vsce package
```

Needs `vsce` (see https://code.visualstudio.com/api/working-with-extensions/publishing-extension )

## Code Scaffolding ##

This extension was initialised with `Yeoman` and `VS Code Extension Generator`.

Features are provided by singleton classes. To add features, create a new `.ts` file in `src/features` containing not more than the features' singleton class and - optionally, and these may even be outsourced - definitions strongly linked to that feature (like type definitions, enumerations, interfaces).

To keep the project folder tidy, we use the following structure:

```
src/              # entry point (extension.ts)
  assets/         # assets (to be compiled into the extension)
  features/       # features
  test/           # test suite
syntaxes/         # Cerberus X syntax definition
```

## Documentation ##

This project is documented using `zdoccer.sh` - a script that creates the `README.md` from a `README.preamble.md`, the documented source in the `src` folder and a `README.termination.md`.

To document any feature of your project, precede it with a block comment of the following form:
```
/*zdoc
markdown for your feature goes here
zdoc*/
<line of code to be documented>
```

Or a single line comment of the following form:
```
//zdoc markdown goes here
<line of code to be documented>
```

If `<line of code to be documented>` is not empty, it will be prepended to the markdown block.

To update the `README.md`, run the `zdoccer.sh` script.

## Architecture Documentation ##

`VS Code extension for Cerberus X` is split into multiple singleton classes, grouping similar functionalities or features of same context.

## Feature Documentation ##
