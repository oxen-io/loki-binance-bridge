module.exports = {
    extends: "airbnb-base",
    rules: {
        "no-console": "off",
        "object-curly-newline": ["error", { "multiline": true }],
        "no-use-before-define": ["error", { "functions": false }],
        "arrow-parens": ["error", "as-needed"]
    }
};
