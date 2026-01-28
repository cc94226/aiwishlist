import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

export default [
  js.configs.recommended,
  ...vue.configs['flat/recommended'],
  prettier,
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        window: 'readonly',
        document: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        requestIdleCallback: 'readonly',
        cancelIdleCallback: 'readonly'
      }
    },
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'vue/multi-word-component-names': 'off'
    }
  },
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**']
  },
  {
    files: ['**/*.test.js', '**/__tests__/**/*.js', '**/test/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.vitest
      }
    }
  }
]
