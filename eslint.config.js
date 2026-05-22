import eslintConfigPrettier from 'eslint-config-prettier';
import vue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import prettier from 'eslint-plugin-prettier';
import globals from 'globals';

export default [
  {
    ignores: ['dist', 'node_modules'],
  },
  eslintConfigPrettier,
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        WeixinJSBridge: 'readonly',
        WebViewJavascriptBridge: 'readonly',
        WVJBCallbacks: 'readonly',
        __APP_VERSION__: 'readonly',
      },
    },
    plugins: { vue, prettier },
    rules: {
      ...vue.configs['flat/essential'].rules,
      'prettier/prettier': 'warn',
      quotes: ['warn', 'single', { avoidEscape: true }],
      'no-console': 'off',
      'no-unused-vars': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/html-self-closing': [
        'warn',
        {
          html: { void: 'always', normal: 'never', component: 'always' },
          svg: 'always',
          math: 'always',
        },
      ],
      'vue/require-v-for-key': 'warn',
      'vue/no-unused-components': 'warn',
      'vue/no-use-v-if-with-v-for': 'warn',
      'vue/no-mutating-props': 'warn',
      'vue/attributes-order': 'warn',
    },
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        WeixinJSBridge: 'readonly',
        WebViewJavascriptBridge: 'readonly',
        WVJBCallbacks: 'readonly',
        __APP_VERSION__: 'readonly',
      },
    },
    plugins: { prettier },
    rules: {
      'prettier/prettier': 'warn',
      quotes: ['warn', 'single', { avoidEscape: true }],
    },
  },
];
