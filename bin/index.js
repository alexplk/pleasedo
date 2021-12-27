#! /usr/bin/env node

const { spawn } = require('child_process');
const inquirer = require('inquirer');

const style = require('ansi-styles');
const AutocompletePrompt = require('inquirer-autocomplete-prompt');

const CommandFinder = require('./CommandFinder');

async function findCommandSource(commandFinder, pattern) {
  const commandGroups = await commandFinder.find(pattern);
  return [...commandGroups.flatMap(group => {
    return [
      new inquirer.Separator(`${style.gray.open}─ ${group.name || '/'} ${group.category} ${style.gray.close}─`), // ───
      ...group.commands.map(command => ({
        name: command.match,
        value: command,
        short: command.name,
      }))
    ]
  }), new inquirer.Separator(' ')];
}

function runCommand(command) {
  console.log(style.green.open + command.preview + style.green.close);
  const handleError = (error) => {
    console.error(error.message);
  };
  try {
    let commandStr = command.path;
    // A little cheat to run ps1.
    // TODO: Make this part of script discovery.
    if (commandStr.toLowerCase().endsWith('.ps1')) {
      commandStr = 'powershell ' + commandStr;
    }
    const proc = spawn(commandStr, { stdio: 'inherit', shell: true });
    proc.on('error', handleError);
  } catch (error) {
    handleError(error);
  }
}

async function main() {
  const commandFinder = new CommandFinder('.');
  inquirer.registerPrompt('commandsearch', AutocompletePrompt)
  const result = await inquirer.prompt([
    {
      type: 'commandsearch',
      name: 'command',
      pageSize: 15,
      source: (_, pattern) => findCommandSource(commandFinder, pattern),
      message: 'Command',
      suffix: ':',
      // prefix: '?',
      searchText: 'Searching...',
      emptyText: 'No results',
      default: '',
      suggestOnly: false,

    }
  ]);

  runCommand(result.command);
}

main();
