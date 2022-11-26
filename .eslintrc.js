module.exports = {
    root: true,
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
    extends: [
        "eslint:recommended", "prettier","plugin:sonarjs/recommended",
    ],
    env: {
        commonjs: true,
        es2022: true,
        node: true,
    },
    rules: {
        "sonarjs/cognitive-complexity": ["error", 60],
        "no-console": "error",
        "quotes": [2, "double", { "avoidEscape": true, "allowTemplateLiterals": true }]
    },
    "plugins": ["sonarjs"]
}
