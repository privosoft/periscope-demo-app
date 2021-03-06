var configForDevelopment = {
  loginRedirect: '#/registration',
  baseUrl:'http://localhost:5000',
  loginUrl:'/auth/login',
  signupUrl: '/auth/signup',
  loginRoute: '/',
  signupRoute: '/signup',
  providers: {
    identSrv : {
      name: 'jetbrains',
      url: 'auth/jetbrains',
      authorizationEndpoint: 'http://localhost:8080/hub/api/rest/oauth2/auth', //if this ends with slash --> game over
      redirectUri: window.location.origin || window.location.protocol + '//' + window.location.host,
	    scope: ['2c078eb0-7109-4357-b6da-40992837ecfb','0-0-0-0-0'],
      responseType :'code',
      scopePrefix: '',
      scopeDelimiter: ' ',
      requiredUrlParams: ['scope', 'nonce'],
      optionalUrlParams: ['display', 'state'],
      display: 'popup',
      type: '2.0',
      clientId: '2c078eb0-7109-4357-b6da-40992837ecfb',
      popupOptions: { width: 452, height: 633 }
    },
    github:{
      clientId:'02a9ea70fa4093aebaeb',
      //redirectUri:window.location.origin || window.location.protocol + '//' + window.location.host + '/sign-up',
    },
    facebook:{
      clientId:'482058595322377'
    }
  }
};

var configForProduction = {
  providers: {
    google: {
      clientId: '239531826023-3ludu3934rmcra3oqscc1gid3l9o497i.apps.googleusercontent.com'
    }
    ,
    linkedin:{
      clientId:'7561959vdub4x1'
    },
    facebook:{
      clientId:'482058595322377'
    }

  }
};
var config ;
if (window.location.hostname==='localhost') {
  config = configForDevelopment;
}
else{
  config = configForProduction;
}


export default config;
