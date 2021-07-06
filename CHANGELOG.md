# Change Log

All notable changes to `VS Code extension for Cerberus X` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.1.2

### Added
- Key bindings for
  - Build HTML game (F6)
  - Build & run HTML game (F5)
  - Show context help (F1)
- onTypeFormattingEditProvider for auto-capitalization
- Rebuild documentation command
- Tokenizer and Semanter for Cerberus X
- Back and forward navigation in the documentation panel "browser"

### Changed
- Whole source refactored - while the extension started out as a test whether the Cerberus X Documentation would be displayable in a VS Code webview panel, it's now built to be an actual language extension
- Single Cerberus X tools' paths are now derived from the configured CX installation path
- DocumentSymbolProvider now relies on the tokenizer (massive performance improvement)
- Cerberus X documentation style improved to match the original one-page-per-class style

### Fixed
- Syntax highlighter not accepting scope accessors after indexing expression
- Reopening the documentation creating additional webview panels

### Known Issues
- F1 help not context aware
- Documentation browser's address bar not fully functional
- Documentation browser's search shows first match only
- Semanter not scoping Select / Case statements correctly
- DocumentSymbolProvider level of detail not configurable
- DocumentSymbolProvider needs a filter

### To Dos
- Context recognition (for F1 context help and auto-complete)
- Build and run options for other targets

## 0.1.1

### Fixed
- Syntax highlighting for precompiler directives

### Changed
- `Run as HTML5` now also builds

## [Unreleased]

### Added
- Syntax highlighting (not semantic)
- Document symbol provider
- In-editor help panel