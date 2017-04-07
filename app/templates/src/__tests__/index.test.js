/* eslint-env jest */

const <%= camelModuleName %> = require('../');

describe('<%= camelModuleName %>', () => {
  it('should return argument', () => {
    expect(<%= camelModuleName %>('test')).toBe('test');
  });
});
