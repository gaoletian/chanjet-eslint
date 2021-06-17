module.exports = {
  '@chanjet/prefer-alias-path': [
    'error',
    {
      from: /\/src\/(api|utils|stores|models|service|routers2|routers|config|metadata|data-sources|AppPresenter)/,
      target: /\/src\/(components|common|modules|hkj)\//,
      aliasName: 'apphub',
    },
  ],
};
