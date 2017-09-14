<% if (flow) { _%>/* @flow */<% } -%>

/**
 * <%= moduleDescription %>
 */
module.exports = function <%= camelModuleName %>(input<% if (flow) { _%>: string<% } -%>) {
  return input;
};
