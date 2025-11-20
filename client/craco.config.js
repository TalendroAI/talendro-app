module.exports = {
  devServer: {
    historyApiFallback: true,
    allowedHosts: 'all'
  },
  style: {
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
      ],
    },
  },
};

