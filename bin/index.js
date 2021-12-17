#! /usr/bin/env node

const fs = require('fs');
const path = require('path');
const util = require('util');
const inquirer = require('inquirer');

const Choices = require('inquirer/lib/objects/choices');
const stripAnsi = require('strip-ansi');
const style = require('ansi-styles');
// const chalk = require('chalk');
const fuzzy = require('fuzzy');
const AutocompletePrompt = require('inquirer-autocomplete-prompt');

const CommandFinder = require('./CommandFinder');

// const readdir = util.promisify(fs.readdir);

// const commandFinder = new CommandFinder();

// function getPaths(
//   rootPath,
//   pattern,
//   excludePath,
//   excludeFilter,
//   itemType,
//   defaultItem,
//   depthLimit,
// ) {
//   const fuzzOptions = {
//     pre: green.open,
//     post: green.close,
//   };

//   async function listNodes(nodePath, level) {
//     try {
//       if (excludePath(nodePath)) {
//         return [];
//       }
//       const nodes = await readdir(nodePath);
//       const currentNode = (itemType !== 'file' ? [nodePath] : []);
//       if (
//         nodes.length > 0
//         && (depthLimit === undefined || level >= 0)
//       ) {
//         const nodesWithPath = nodes.map(
//           nodeName => listNodes(
//             join(nodePath, nodeName),
//             depthLimit ? level - 1 : undefined,
//           ),
//         );
//         const subNodes = await Promise.all(nodesWithPath);
//         return subNodes.reduce((acc, val) => acc.concat(val), currentNode);
//       }
//       return currentNode;
//     } catch (err) {
//       if (err.code === 'ENOTDIR') {
//         return itemType !== 'directory' ? [nodePath] : [];
//       }
//       return [];
//     }
//   }

//   const nodes = listNodes(rootPath, depthLimit);
//   const filterPromise = nodes.then(
//     (nodeList) => {
//       const preFilteredNodes =
//         !excludeFilter
//         ? nodeList
//         : nodeList.filter(node => !excludeFilter(node));

//       const filteredNodes = filter(pattern || '', preFilteredNodes, fuzzOptions)
//         .map(e => e.string);
//       if (!pattern && defaultItem) {
//         filteredNodes.unshift(defaultItem);
//       }
//       return filteredNodes;
//     },
//   );
//   return filterPromise;
// }

// async function getCommands(startPath, pattern) {
//   return [
//     pattern,
//     'run ' + pattern,
//     'run ' + pattern + ' local',
//     'debug ' + pattern
//   ]
// }

class InquirerCommandSearch extends AutocompletePrompt {
  constructor(question, rl, answers) {
    this.commandFinder = new CommandFinder(rootPath);
    const {
      // depthLimit,
      // itemType = 'any',
      rootPath = '.',
      // excludePath = () => false,
      // excludeFilter = false
    } = question;
    const questionBase = {
      ...question,
      source: (_, pattern) => this.findCommandSource(pattern),
      // source: (_, pattern) => getCommands(
      //   rootPath,
      //   pattern,
      // ),
    };
    super(questionBase, rl, answers);
  }

  async findCommandSource(pattern) {
    const commandGroups = await this.commandFinder.find(pattern);
    return commandGroups.map(group => {
      return [
        new inquirer.Separator(`${group.name} ${group.category}`),
        ...group.commands.map(command => `${command.name}`)
      ]
    })
  }

  async search(searchTerm) {
    await super.search(searchTerm);
    this.currentChoices.getChoice = (choiceIndex) => {
      const choice = prototype.getChoice.call(this.currentChoices, choiceIndex);
      return {
        value: stripAnsi(choice.value),
        name: stripAnsi(choice.name),
        short: stripAnsi(choice.name),
      };
    };
  }

  onSubmit(line) {
    super.onSubmit(stripAnsi(line));
  }
}

function sleep(ms) {
  return new Promise((resolve) =>
    setTimeout(() => {
      resolve();
    }, ms));
}


async function findCommandSource(commandFinder, pattern) {
  const commandGroups = await commandFinder.find(pattern);
  return commandGroups.flatMap(group => {
    return [
      new inquirer.Separator(`${group.name} ${group.category}`),
      ...group.commands.map(command => `${command.name}`)
    ]
  })
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
      // source: async (_, pattern) => {
      //   const commands = await getCommands(
      //     '.',
      //     pattern,
      //   );
      //   await sleep(300);

      //   return [
      //     new inquirer.Separator('──── npm ────'),
      //     ...commands,
      //     new inquirer.Separator('──── npm ────'),
      //     ...commands,
      //     new inquirer.Separator(),
      //     ...commands].map(x => (
      //       x instanceof inquirer.Separator ? x : {
      //         // name: x,
      //         name: `${(x || '').padEnd(25, ' ')} ${style.italic.open} ../ARI > npm${style.italic.close}`,
      //         // value: `${style.green.open}${x}${style.green.close}`,
      //         value: x,
      //         short: x //`${style.green.open}${x}${style.green.close}`
      //       }))
      // },
      message: 'Command:',
      default: '',
      suggestOnly: false,

    }
  ]);
  console.log(result);
}

main();

// module.exports = InquirerFuzzyPath;
