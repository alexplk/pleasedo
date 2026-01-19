# PleaseDo - Agent Instructions

This document describes the architecture and implementation guidelines for the PleaseDo project.

## Overview

PleaseDo is a command aggregation tool that discovers, searches, and executes commands from multiple sources in a project. The architecture is designed to be extensible, with each command source cleanly separated.

## Command Sources

Command sources are responsible for discovering and providing commands from their respective sources. Each source must implement a consistent interface.

### 1. Shell Scripts (`ShellScriptRunner`)
- **Discovery**: Searches for `scripts/` directories starting from current directory and walking up the directory tree
- **Format**: Executable shell script files (`.sh`)
- **Metadata**: Extracted from script filename (used as command name) and optional comments in the script

### 2. npm Commands (`NpmRunner`)
- **Discovery**: Finds `package.json` in current directory and walks up the tree
- **Format**: Scripts defined in `package.json` under `scripts` field
- **Metadata**: Script name and optional description from `package.json`

### 3. Future Runners
The architecture supports additional command sources (Makefile, Docker commands, etc.) by implementing the runner interface.

## Architecture

### Core Components

1. **CommandFinder** - Main orchestrator
   - Coordinates discovery across all registered command sources
   - Aggregates results into a unified list
   - Handles caching and updates

2. **Command Runners** - Individual command source implementations
   - Each runner discovers commands from its source
   - Provides consistent interface for command metadata and execution
   - Returns commands in standardized format

3. **Command Interface**
   - `name` - Display name of the command
   - `description` - Human-readable description
   - `source` - Which runner provides this command
   - `execute()` - Runs the command

4. **UI/Search** - Interactive interface
   - Displays all available commands
   - Filters by search terms (name or description)
   - Executes selected command in current directory

## Key Design Principles

- **Uniform Access** - All commands (from any source) are searchable and executable using the same interface
- **Extensibility** - New command sources can be added by implementing the runner interface
- **Smart Discovery** - Commands are found by walking up directory tree from current location
- **No Configuration** - Works out of the box without configuration files
- **Works Anywhere** - Commands can be executed from any directory in the project

## Implementation Status

- [ ] Core CommandFinder implementation
- [ ] ShellScriptRunner implementation
- [ ] NpmRunner implementation
- [ ] Interactive UI/search
- [ ] CLI interface and entry point
- [ ] Testing
