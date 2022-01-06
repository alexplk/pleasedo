#! /usr/bin/env node

const { spawn } = require('child_process');
const inquirer = require('inquirer');

const style = require('ansi-styles');
const AutocompletePrompt = require('inquirer-autocomplete-prompt');

const CommandFinder = require('./CommandFinder');

async function main() {
  const args = process.argv.slice(2);
  const commandFinder = new CommandFinder('.');
  let command = args.length > 0 ?
    await findNonInteractive(commandFinder, args.join(' ')) :
    await findInteractive(commandFinder);
  runCommand(command);
}

async function findInteractive(commandFinder) {
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
  return result.command;
}

async function findNonInteractive(commandFinder, pattern) {
  const commandGroups = await commandFinder.find(pattern);
  if (commandGroups && commandGroups.length > 0) {
    const group = commandGroups[0];
    if (group && group.commands.length > 0) {
      return group.commands[0];
    }
  }
  return null;
}

async function findCommandSource(commandFinder, pattern) {
  const commandGroups = await commandFinder.find(pattern);
  return [...commandGroups.flatMap(group => {
    return [
      new inquirer.Separator(`${style.gray.open}─ ${group.name || '/'} ${group.category} ─${style.gray.close}`),
      ...group.commands.map(command => ({
        name: command.match,
        value: command,
        short: pattern,
      }))
    ]
  }), new inquirer.Separator(' ')];
}

function runCommand(command) {
  if (!command) {
    console.error(style.red.open + 'No results' + style.red.close);
    return;
  }

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

main();
