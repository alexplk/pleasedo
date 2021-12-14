#! /usr/bin/env node

const fs = require('fs');
const path = require('path');
const util = require('util');
const inquirer = require('inquirer');

const Choices = require('inquirer/lib/objects/choices');
const InquirerAutocomplete = require('inquirer-autocomplete-prompt');
const stripAnsi = require('strip-ansi');
const style = require('ansi-styles');
const fuzzy = require('fuzzy');

const readdir = util.promisify(fs.readdir);

function getPaths(
  rootPath,
  pattern,
  excludePath,
  excludeFilter,
  itemType,
  defaultItem,
  depthLimit,
) {
  const fuzzOptions = {
    pre: style.green.open,
    post: style.green.close,
  };

  async function listNodes(nodePath, level) {
    try {
      if (excludePath(nodePath)) {
        return [];
      }
      const nodes = await readdir(nodePath);
      const currentNode = (itemType !== 'file' ? [nodePath] : []);
      if (
        nodes.length > 0
        && (depthLimit === undefined || level >= 0)
      ) {
        const nodesWithPath = nodes.map(
          nodeName => listNodes(
            path.join(nodePath, nodeName),
            depthLimit ? level - 1 : undefined,
          ),
        );
        const subNodes = await Promise.all(nodesWithPath);
        return subNodes.reduce((acc, val) => acc.concat(val), currentNode);
      }
      return currentNode;
    } catch (err) {
      if (err.code === 'ENOTDIR') {
        return itemType !== 'directory' ? [nodePath] : [];
      }
      return [];
    }
  }

  const nodes = listNodes(rootPath, depthLimit);
  const filterPromise = nodes.then(
    (nodeList) => {
      const preFilteredNodes =
        !excludeFilter
        ? nodeList
        : nodeList.filter(node => !excludeFilter(node));

      const filteredNodes = fuzzy
        .filter(pattern || '', preFilteredNodes, fuzzOptions)
        .map(e => e.string);
      if (!pattern && defaultItem) {
        filteredNodes.unshift(defaultItem);
      }
      return filteredNodes;
    },
  );
  return filterPromise;
}

class InquirerFuzzyPath extends InquirerAutocomplete {
  constructor(question, rl, answers) {
    const {
      depthLimit,
      itemType = 'any',
      rootPath = '.',
      excludePath = () => false,
      excludeFilter = false
    } = question;
    const questionBase = Object.assign(
      {},
      question,
      {
        source: (_, pattern) => getPaths(
          rootPath,
          pattern,
          excludePath,
          excludeFilter,
          itemType,
          question.default,
          depthLimit,
        ),
      },
    );
    super(questionBase, rl, answers);
  }

  search(searchTerm) {
    return super.search(searchTerm).then(() => {
      this.currentChoices.getChoice = (choiceIndex) => {
        const choice = Choices.prototype.getChoice.call(this.currentChoices, choiceIndex);
        return {
          value: stripAnsi(choice.value),
          name: stripAnsi(choice.name),
          short: stripAnsi(choice.name),
        };
      };
    });
  }

  onSubmit(line) {
    super.onSubmit(stripAnsi(line));
  }
}

async function main() {
    inquirer.registerPrompt('fuzzypath', InquirerFuzzyPath)
    const result = await inquirer.prompt([
        {
          type: 'fuzzypath',
          name: 'path',
          excludePath: nodePath => nodePath.startsWith('node_modules'),
            // excludePath :: (String) -> Bool
            // excludePath to exclude some paths from the file-system scan
          excludeFilter: nodePath => nodePath == '.',
            // excludeFilter :: (String) -> Bool
            // excludeFilter to exclude some paths from the final list, e.g. '.'
          itemType: 'directory',
            // itemType :: 'any' | 'directory' | 'file'
            // specify the type of nodes to display
            // default value: 'any'
            // example: itemType: 'file' - hides directories from the item list
          rootPath: '.',
            // rootPath :: String
            // Root search directory
          message: 'Change dir:',
          default: '',
          suggestOnly: false,
            // suggestOnly :: Bool
            // Restrict prompt answer to available choices or use them as suggestions
          depthLimit: 0,
            // depthLimit :: integer >= 0
            // Limit the depth of sub-folders to scan
            // Defaults to infinite depth if undefined
        }
      ]);
      console.log(result);
}

main();

// module.exports = InquirerFuzzyPath;
