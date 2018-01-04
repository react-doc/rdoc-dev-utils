const color = require('colors-cli');
const loading = require('loading-cli');
const clearConsole = require('./clearConsole');
const formatWebpackMessages = require('webpack-hot-dev-clients/formatWebpackMessages');

const isInteractive = process.stdout.isTTY;
let handleCompile;
// You can safely remove this after ejecting.
// We only use this block for testing of Create React App itself:
const isSmokeTest = process.argv.some(arg => arg.indexOf('--smoke-test') > -1);
if (isSmokeTest) {
  handleCompile = (err, stats) => {
    if (err || stats.hasErrors() || stats.hasWarnings()) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  };
}


function printInstructions(appName, urls, useYarn) {
  console.log();
  console.log(`You can now view ${color.bold(appName)} in the browser.`);
  console.log();

  if (urls.lanUrlForTerminal) {
    console.log(
      `  ${color.bold('Local:')}            ${urls.localUrlForTerminal}`
    );
    console.log(
      `  ${color.bold('On Your Network:')}  ${urls.lanUrlForTerminal}`
    );
  } else {
    console.log(`  ${urls.localUrlForTerminal}`);
  }

  console.log();
  console.log('Note that the development build is not optimized.');
  console.log(
    `To create a production build, use ` +
    `${color.cyan(`${useYarn ? 'yarn' : 'npm run'} build`)}.`
  );
  console.log();
}

function printDoneMessage(stats, isInteractive, isFirstCompile, appName, urls, useYarn) {
  // We have switched off the default Webpack output in WebpackDevServer
  // options so we are going to "massage" the warnings and errors and present
  // them in a readable focused way.
  const messages = formatWebpackMessages(stats.toJson({}, true));
  const isSuccessful = !messages.errors.length && !messages.warnings.length;
  if (isSuccessful) {
    console.log(color.green('Compiled successfully!'));
  }
  if (isSuccessful && (isInteractive || isFirstCompile)) {
    printInstructions(appName, urls, useYarn);
  }
  isFirstCompile = false;

  // If errors exist, only show errors.
  if (messages.errors.length) {
    // Only keep the first error. Others are often indicative
    // of the same problem, but confuse the reader with noise.
    if (messages.errors.length > 1) {
      messages.errors.length = 1;
    }
    console.log(color.red('Failed to compile.\n'));
    console.log(messages.errors.join('\n\n'));
    return;
  }

  // Show warnings if no errors were found.
  if (messages.warnings.length) {
    console.log(color.yellow('Compiled with warnings.\n'));
    console.log(messages.warnings.join('\n\n'));

    // Teach some ESLint tricks.
    console.log(
      '\nSearch for the ' +
      color.underline(color.yellow('keywords')) +
      ' to learn more about each warning.'
    );
    console.log(
      'To ignore, add ' +
      color.cyan('// eslint-disable-next-line') +
      ' to the line before.\n'
    );
  }
}


let isloading = true;

function createCompiler(webpack, config, appName, urls, useYarn) {
  // "Compiler" is a low-level interface to Webpack.
  // It lets us listen to some events and provide our own custom messages.
  let compiler;
  try {
    compiler = webpack(config, handleCompile);
  } catch (err) {
    console.log(color.red('Failed to compile.'));
    console.log();
    console.log(err.message || err);
    console.log();
    process.exit(1);
  }
  const load = loading('Starting the development server...\n')
  if (isloading) {
    isloading = false;
  }

  // "invalid" event fires when you have changed a file, and Webpack is
  // recompiling a bundle. WebpackDevServer takes care to pause serving the
  // bundle, so if you refresh, it'll wait instead of serving the old one.
  // "invalid" is short for "bundle invalidated", it doesn't imply any errors.
  compiler.plugin('invalid', () => {
    if (isInteractive) {
      clearConsole();
    }
    load.start()
    load.text = ' Compiling...';
  });

  let isFirstCompile = true;
  // "done" event fires when Webpack has finished recompiling the bundle.
  // Whether or not you have warnings or errors, you will get this event.
  compiler.plugin('done', stats => {
    // if (isInteractive) {
    //   // clearConsole();
    // }
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      clearConsole();
      load.stop()
      printDoneMessage(stats, isInteractive, isFirstCompile, appName, urls, useYarn)
    },1000)

  });
  return compiler;
}

module.exports = createCompiler;
