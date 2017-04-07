/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */
const path = require('path');
const isScoped = require('is-scoped');
const camelCase = require('camelcase');
const Generator = require('yeoman-generator');

// Inquirer validation helper
const required = msg => val => val.length > 0 ? true : msg;

// Returns name for the repo, handles organisations
const repoName = name => isScoped(name) ? path.basename(name) : name;

module.exports = class NodeModuleGenerator extends Generator {
  init() {
    const askQuestions = this.prompt([{
      name: 'moduleName',
      message: 'What do you want to name your module?',
      validate: required('You have to provide a name for your module'),
    }, {
      name: 'moduleDescription',
      message: 'What is your module description?'
    }, {
      name: 'githubUsername',
      message: 'What is your GitHub username / organisation?',
      store: true,
      validate: required('You have to provide a username or organisation name')
    }]);

    return askQuestions.then(props => {
      const tpl = {
        moduleName: props.moduleName,
        moduleDescription: props.moduleDescription,
        camelModuleName: camelCase(props.moduleName),
        githubUsername: props.githubUsername,
        repoName: repoName(props.moduleName),
        name: this.user.git.name(),
        email: this.user.git.email()
      };

      const mv = (from, to) => {
        this.fs.move(this.destinationPath(from), this.destinationPath(to));
      };

      this.fs.copyTpl([
        `${this.templatePath()}/**`,
      ], this.destinationPath(), tpl);

      mv('gitignore', '.gitignore');
      mv('ISSUE_TEMPLATE.md', '.github/ISSUE_TEMPLATE.md');
      mv('eslintignore', '.eslintignore');
      mv('flowconfig', '.flowconfig');
      mv('_package.json', 'package.json');
    });
  }
  git() {
    this.spawnCommandSync('git', ['init']);
  }
  install() {
    this.installDependencies({bower: false, npm: false, yarn: true});
  }
};
