// turn on headless mode when running with HEADLESS=true environment variable
// HEADLESS=true npx codecept run
const headless = process.env.HEADLESS;
const port = process.env.LSF_PORT ?? 3000;
const enableCoverage = process.env.COVERAGE === "true";
const fs = require("fs");
const FRAGMENTS_PATH = "./fragments/";

module.exports.config = {
  timeout: 60 * 40, // Time out after 40 minutes
  tests: "./tests/**/*.test.js",
  output: "./output",
  helpers: {
    // Puppeteer: {
    //   url: "http://localhost:3000",
    //   show: !headless,
    //   waitForAction: headless ? 100 : 1200,
    //   windowSize: "1200x900",
    // },
    Playwright: {
      url: `http://localhost:${port}`,
      show: !headless,
      restart: "context",
      timeout: 120000, // Increase timeout to 120 seconds
      waitForAction: headless ? 300 : 1200,
      windowSize: "1200x900",
      waitForNavigation: "networkidle",
      browser: "chromium",
      chromium: process.env.CHROMIUM_EXECUTABLE_PATH
        ? {
            executablePath: process.env.CHROMIUM_EXECUTABLE_PATH,
          }
        : {},
      timezoneId: "Europe/Paris",
      trace: false,
      keepTraceForPassedTests: false,
      launchOptions: {
        args: ["--disable-dev-shm-usage", "--no-sandbox"],
      },
      contextOptions: {
        viewport: { width: 1200, height: 900 },
        ignoreHTTPSErrors: true,
      },
    },
    PlaywrightAddon: {
      require: "./helpers/PlaywrightAddon.js",
    },
    MouseActions: {
      require: "./helpers/MouseActions.js",
    },
    Selection: {
      require: "./helpers/Selection.js",
    },
    Annotations: {
      require: "./helpers/Annotations.ts",
    },
    Assertion: {
      require: "./helpers/Assertion.js",
    },
  },
  include: {
    I: "./steps_file.js",
    ...Object.fromEntries(
      fs.readdirSync(FRAGMENTS_PATH).map((path) => {
        const name = path.split(".")[0];

        return [name, `${FRAGMENTS_PATH}${path}`];
      }),
    ),
  },
  bootstrap: null,
  mocha: {
    bail: true,
    reporterOptions: {
      mochaFile: "output/result.xml",
    },
  },
  name: "label-studio-frontend",
  plugins: {
    retryFailedStep: {
      enabled: true,
      minTimeout: 100,
      defaultIgnoredSteps: [
        //'amOnPage',
        //'wait*',
        "send*",
        "execute*",
        "run*",
        "have*",
      ],
    },
    // coverage: {
    //   enabled: true,
    //   coverageDir: 'output/coverage',
    // },
    disableDefaultInit: {
      require: "./plugins/disableDefaultInit.js",
      enabled: true,
    },
    featureFlags: {
      require: "./plugins/featureFlags.js",
      enabled: true,
      defaultFeatureFlags: require("./setup/feature-flags"),
    },
    istanbulCoverage: {
      require: "./plugins/istanbulСoverage.js",
      enabled: enableCoverage,
      uniqueFileName: true,
      coverageDir: "../coverage",
      actionCoverage: {
        enabled: false,
        include: ["**/src/**"],
        exclude: ["**/common/**", "**/components/**"],
      },
    },
    errorsCollector: {
      require: "./plugins/errorsCollector.js",
      enabled: true,
      uncaughtErrorFilter: {
        interrupt: true,
        ignore: [
          // @todo: solve the problems below
          /^TypeError: Cannot read properties of null \(reading 'getBoundingClientRect'\)/,
          /The play\(\) request was interrupted/,
        ],
      },
      consoleErrorFilter: {
        // @todo switch it on to feel the pain
        display: false,
      },
    },
    stepLogsModifier: {
      require: "./plugins/stepLogsModifier.js",
      enabled: true,
      modifyStepLogs: [
        {
          stepNameMatcher: "executeScript",
          rule: "hideFunction",
        },
      ],
    },
    screenshotOnFail: {
      enabled: true,
    },
    pauseOnFail: {},
  },
  require: ["ts-node/register"],
};
