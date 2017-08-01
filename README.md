![LOGO](https://davecra.files.wordpress.com/2017/07/easyews.png?w=600)
# Introduction
This library makes performing EWS operations from Outlook Mail Web Add-ins via JavaScript much easier. EWS is quite difficult to perform from JavaScript because you have to format a specific SOAP message in order to submit the request using [makeEwsRequestAsync()](https://docs.microsoft.com/en-us/outlook/add-ins/web-services?product=outlook). However, this is complicated by the fact you then get a SOAP message back that you then have to parse in order to get your result (or error). This library limits your need to call makeEwsRequestAsync() by encapsulating the call in easy to use functions.

**NOTE:** Microsoft official guidance at this point is to no longer use EWS, but rather to use the REST API's. Some of this functionality (as of this writing: 8/1/2017), is available through REST and some is not. However, to get more informaiton, please see the following link:https://docs.microsoft.com/en-us/outlook/add-ins/use-rest-api

### Installation
To install this library, run the following command:

```
npm -install easyews
```

### Follow
Please follow my blog for the latest developments on easyEws. You can find my blog here:

![LOGO](https://davecra.files.wordpress.com/2017/07/blog-icon-large.png?w=20) http://theofficecontext.com

You can use this link to narrow the results only to those posts which relate to this library:

* https://theofficecontext.com/?s=easyews
  
![TWITTER](https://davecra.files.wordpress.com/2010/10/tlogo.png?w=20) You can also follow me on Twitter: [@davecra](http://twitter.com/davecra)

![LINKEDIN](https://davecra.files.wordpress.com/2014/02/inbug-60px-r.png?w=20) And also on LinkedIn: [davidcr](https://www.linkedin.com/in/davidcr/)

# Usage
This section is covers how to use easyEws. The following functions are available to call:

* easyEws.sendPlainTextEmailWithAttachment

