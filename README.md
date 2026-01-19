# PleaseDo

Run project commands from anywhere, with unified access to all command sources.

PleaseDo aggregates commands from multiple sources (shell scripts, npm commands, and other runners) in your project and makes them easily accessible from any directory. Search and execute commands interactively by name or description.

<img width="659" alt="image" src="https://user-images.githubusercontent.com/17112406/146663485-37a917de-f2a8-48c5-bbf1-8b0937b068d3.png">

## Supported Command Sources

- **Shell scripts** - Scripts in `scripts/` directories (searched up the directory tree)
- **npm commands** - npm scripts defined in `package.json`
- **Extensible** - Architecture supports additional command runners in the future

All commands are presented uniformly—search, filter, and execute work identically regardless of source.

## Install

```bash
npm i -g pleasedo
```

## Usage

### Interactive Mode

```bash
pls
```

Launches an interactive search where you can:
- Browse all available commands from all sources
- Search by command name or description
- Select and execute commands

### Direct Search

```bash
pls <search terms>
```

Filter commands by search terms and execute.

## Features

- **Unified Interface** - All command sources accessible through a single tool
- **Smart Discovery** - Finds commands in current directory and up the project tree
- **Interactive Search** - Filter by name or description
- **Works Anywhere** - Run commands from any directory in your project
