/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './public/**/*.html',
    './public/**/*.js',
  ],
  safelist: [
    'bg-indigo-600',
    'border-indigo-600',
    'border-gray-200',
    'text-indigo-600',
    'text-white',
    'text-gray-600',
    'opacity-40',
    'opacity-50',
    'cursor-not-allowed',
    'hover:opacity-90',
    'hidden',
    'max-w-sm',
    'mx-auto',
    'px-10',
    'py-8',
    'lg:w-3/5',
    'lg:w-full',
    'lg:pr-8',
    'lg:border-r',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
