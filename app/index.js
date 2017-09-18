/**
 * Copyright 2017-present, Callstack.
 * All rights reserved.
 */
const path = require('path');
const isScoped = require('is-scoped');
const camelCase = require('camelcase');
const Generator = require('yeoman-generator');

// Inquirer validation helper
const required = msg => val => (val.length > 0 ? true : msg);

// Returns name for the repo, handles organisations
const repoName = name => (isScoped(name) ? path.basename(name) : name);

module.exports = class NodeModuleGenerator extends Generator {
  initialize() {
    this.log(`
  
    Every setting has babel transpiler included.

    Config types explained:
      - Basic: Prettier, Eslint, Jest, Flow, precommit hook included.
      - Custom: Add or remove features.
    
    `);
    const questionConfigType = [
      {
        type: 'list',
        name: 'configType',
        message: 'Please choose type of a config',
        choices: ['Basic', 'Custom'],
      },
    ];

    return this.prompt(questionConfigType).then(answer => {
      this._askBasicQuestions(answer.configType);
    });
  }

  _askBasicQuestions(configType) {
    const questionToAsk = this.prompt([
      {
        name: 'moduleName',
        message: 'What do you want to name your module?',
        validate: required('You have to provide a name for your module'),
      },
      {
        name: 'moduleDescription',
        message: 'What is your module description?',
      },
      {
        name: 'githubUsername',
        message: 'What is your GitHub username / organisation?',
        store: true,
        validate: required(
          'You have to provide a username or organisation name'
        ),
      },
    ]);

    return questionToAsk.then(answers => {
      const tpl = {
        moduleName: answers.moduleName,
        moduleDescription: answers.moduleDescription,
        camelModuleName: camelCase(answers.moduleName),
        githubUsername: answers.githubUsername,
        repoName: repoName(answers.moduleName),
        name: this.user.git.name(),
        email: this.user.git.email(),
      };
      configType === 'Basic'
        ? this._createBasicConfig(tpl)
        : this._createCustomConfig(tpl);
    });
  }

  _createBasicConfig(template) {
    const tpl = Object.assign({}, template, {
      eslint: true,
      jest: true,
      prettier: true,
      flow: true,
      precommit: true,
      testCase: '"npm run flow && npm run eslint && npm run jest"',
    });

    this._processFiles(tpl);
  }

  _createCustomConfig(template) {
    const questionToAsk = this.prompt([
      {
        name: 'features',
        type: 'checkbox',
        message: 'Please choose desired features',
        choices: [
          {
            name: 'Eslint',
            value: 'eslint',
          },
          {
            name: 'Prettier',
            value: 'prettier',
          },
          {
            name: 'Flow',
            value: 'flow',
          },
          {
            name: 'Jest',
            value: 'jest',
          },
          {
            name: 'Husky + Lint Staged as precommit hook',
            value: 'precommit',
            short: 'Precommit hook',
          },
        ],
      },
    ]);

    return questionToAsk.then(answers => {
      const features = {
        flow: {
          value: false,
          testable: true,
        },
        eslint: {
          value: false,
          testable: true,
        },
        prettier: {
          value: false,
          testable: true,
        },
        jest: {
          value: false,
          testable: true,
        },
        precommit: {
          value: false,
          testable: false,
        },
        testCase: {
          value: '',
          testable: false,
        },
      };

      let testCase = '';
      for (const feature of answers.features) {
        features[feature].value = feature;

        if (features[feature].testable) {
          testCase += testCase
            ? ` && npm run ${feature}`
            : `npm run ${feature}`;
        }
      }
      features.testCase.value = testCase ? `"${testCase}"` : '"echo No tests!"';

      const configuredTemplate = Object.entries(
        features
      ).reduce((a, [name, config]) => {
        // eslint-disable-next-line
        a[name] = config.value;
        return a;
      }, {});

      const tpl = { ...template, ...configuredTemplate };

      this._processFiles(tpl);
    });
  }

  _processFiles(tpl) {
    const mv = (from, to) => {
      this.fs.move(this.destinationPath(from), this.destinationPath(to));
    };
    const rm = file => this.fs.delete(this.destinationPath(file));

    /*
     * Process template
     */
    this.fs.copyTpl([`${this.templatePath()}/**`], this.destinationPath(), tpl);

    /*
     * Format package.json file
     */
    const jsonUnformated = this.fs.readJSON(
      this.destinationPath('_package.json')
    );
    this.fs.writeJSON(this.destinationPath('package.json'), jsonUnformated);
    rm('_package.json');

    /*
     * Add/remove files
     */
    tpl.eslint ? mv('eslintignore', '.eslintignore') : rm('eslintignore');
    tpl.flow ? mv('flowconfig', '.flowconfig') : rm('flowconfig');

    /*
     * Change name of the rest
     */
    mv('gitignore', '.gitignore');
    mv('ISSUE_TEMPLATE.md', '.github/ISSUE_TEMPLATE.md');
    mv('editorconfig', '.editorconfig');

    /*
     * Proceed with git and deps install
     */
    this._git();
    this._install();
  }

  _git() {
    this.spawnCommandSync('git', ['init']);
  }

  _install() {
    this.installDependencies({ bower: false, npm: false, yarn: true });
  }
};
