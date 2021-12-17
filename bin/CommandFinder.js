
const fs = require('fs');
const path = require('path');

const scriptsDirNames = ['scripts'];
const npmPackageNames = ['package.json'];

async function checkPath(p, predicate) {
  try {
    const stat = await fs.promises.stat(p);
    return !!predicate(stat);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false;
    }
    throw err;
  }
}

function isFile(p) {
  return checkPath(p, stat => stat.isFile());
}

function isDirectory(p) {
  return checkPath(p, stat => stat.isDirectory());
}

function isExecutable(p) {
  return checkPath(p, stat => stat.isFile()); // currently any file
}

function sleep(ms) {
  return new Promise((resolve) =>
    setTimeout(() => {
      resolve();
    }, ms));
}

// Command source:
// {
//   name: 'project1',
//   category: 'scripts',
//   path: '/path/project1/scripts
//   commands: []
// }

// Command:
// {
//   name: 'run-local.sh',
//   path: '/path/project1/scripts/run-local.sh'
// }

async function getCommandsInDir(dir) {
  const nodes = await fs.promises.readdir(dir);
  const execAwaits = nodes.map(async (name) => {
    const scriptPath = path.join(dir, name);
    const isScript = await isExecutable(scriptPath);
    if (isScript) {
      return {
        name,
        path: scriptPath
      };
    } else {
      return null;
    }
  });
  const execCommands = await Promise.all(execAwaits);
  return execCommands.filter(x => x);
}

async function getCommandSourcesForScriptsDir(dir) {
  const dirname = path.basename(dir);
  const dirChecks = scriptsDirNames.map(async (scriptsName) => {
    const scriptsPath = path.join(dir, scriptsName);
    const exists = await isDirectory(scriptsPath);
    if (exists) {
      const commands = await getCommandsInDir(scriptsPath);
      return {
        name: dirname,
        category: scriptsName,
        path: scriptsPath,
        commands
      };
    } else {
      return null;
    }
  });
  const sources = await Promise.all(dirChecks);
  return sources.filter(x => x);
}

async function getCommandSourceForNpmPackage(dir) {
  return [];
}

async function getDirTree(startDir) {
  const result = [];
  let dir = startDir;
  let last = '';
  while (dir !== last && await isDirectory(dir)) {
    result.push(dir);
    last = dir;
    dir = path.dirname(dir);
  }
  return result;
}

async function getCommandSources(startDir) {
  const dirTree = await getDirTree(startDir);
  const sourcesPromises = dirTree.flatMap(dir => [
    getCommandSourcesForScriptsDir(dir),
    getCommandSourceForNpmPackage(dir)
  ]);
  const sources = await Promise.all(sourcesPromises);
  return sources.flatMap(x => x);
}

class CommandFinder {

  constructor(startPath) {
    this.startPath = startPath;
    this.discoverPromise = null;
  }

  discover() {
    if (!this.discoverPromise) {
      this.discoverPromise = this.doDiscover();
    }
    return this.discoverPromise;
  }

  async doDiscover() {
    this.startPath = path.resolve(this.startPath);
    this.commandSources = await getCommandSources(this.startPath);
  }

  async find(pattern) {
    await this.discover();
    return this.commandSources;
  }

}

module.exports = CommandFinder;
