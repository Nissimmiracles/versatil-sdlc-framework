// Preserve source-file URLs when Jest runs the repository's ESM TypeScript as CJS.
const { pathToFileURL } = require('node:url');
exports.name = 'source-import-meta';
exports.version = 1;
exports.factory = ({ configSet }) => {
  const ts = configSet.compilerModule;
  return context => source => {
    const declared = new Set();
    for (const statement of source.statements) {
      if (ts.isVariableStatement(statement)) for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && ['__filename', '__dirname'].includes(declaration.name.text)) declared.add(declaration.name.text);
      }
    }
    const visit = node => {
      if (ts.isPropertyAccessExpression(node) && node.name.text === 'url' &&
          ts.isMetaProperty(node.expression) && node.expression.keywordToken === ts.SyntaxKind.ImportKeyword) {
        return ts.factory.createStringLiteral(pathToFileURL(source.fileName).href);
      }
      if (ts.isIdentifier(node) && declared.has(node.text)) return ts.factory.createIdentifier(`__source_${node.text}`);
      return ts.visitEachChild(node, visit, context);
    };
    return ts.visitNode(source, visit);
  };
};
