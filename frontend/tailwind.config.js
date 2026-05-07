/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#182544',
        'on-primary': '#ffffff',
        'primary-container': '#2e3b5b',
        'on-primary-container': '#98a5cb',
        'primary-fixed': '#d9e2ff',
        'primary-fixed-dim': '#b9c6ed',
        'on-primary-fixed': '#0c1a39',
        'on-primary-fixed-variant': '#394667',

        secondary: '#775a19',
        'on-secondary': '#ffffff',
        'secondary-container': '#fed488',
        'on-secondary-container': '#785a1a',
        'secondary-fixed': '#ffdea5',
        'secondary-fixed-dim': '#e9c176',
        'on-secondary-fixed': '#261900',
        'on-secondary-fixed-variant': '#5d4201',

        tertiary: '#322400',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#4b390b',
        'on-tertiary-container': '#bda36b',
        'tertiary-fixed': '#fddfa2',
        'tertiary-fixed-dim': '#dfc389',
        'on-tertiary-fixed': '#251a00',
        'on-tertiary-fixed-variant': '#574416',

        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',

        background: '#faf9f5',
        'on-background': '#1b1c1a',
        surface: '#faf9f5',
        'on-surface': '#1b1c1a',
        'surface-variant': '#e3e2df',
        'on-surface-variant': '#45464e',

        'surface-dim': '#dbdad6',
        'surface-bright': '#faf9f5',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f4f4f0',
        'surface-container': '#efeeea',
        'surface-container-high': '#e9e8e4',
        'surface-container-highest': '#e3e2df',

        outline: '#75777e',
        'outline-variant': '#c5c6cf',

        'inverse-surface': '#2f312e',
        'inverse-on-surface': '#f2f1ed',
        'inverse-primary': '#b9c6ed',

        'surface-tint': '#515e80',
      },
      fontFamily: {
        display: ['Newsreader', 'Noto Serif SC', 'serif'],
        headline: ['Newsreader', 'Noto Serif SC', 'serif'],
        body: ['Manrope', 'sans-serif'],
        label: ['Manrope', 'sans-serif'],
        serif: ['Newsreader', 'Noto Serif SC', 'serif'],
      },
      borderRadius: {
        DEFAULT: '0.125rem',
        lg: '0.25rem',
        xl: '0.5rem',
        full: '0.75rem',
      },
      boxShadow: {
        ambient: '0px 20px 40px rgba(27, 28, 26, 0.06)',
      },
    },
  },
  plugins: [],
}
