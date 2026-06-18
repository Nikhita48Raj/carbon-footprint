const JSDOMEnvironment = require('jest-environment-jsdom').default;

class CustomEnvironment extends JSDOMEnvironment {
  constructor(config, context) {
    super(config, context);
  }

  async setup() {
    await super.setup();
    
    // Copy native Web APIs from Node's global scope into the JSDOM sandbox global scope
    this.global.Request = global.Request;
    this.global.Response = global.Response;
    this.global.Headers = global.Headers;
    this.global.fetch = global.fetch;
    this.global.TextEncoder = global.TextEncoder;
    this.global.TextDecoder = global.TextDecoder;
    this.global.TextEncoderStream = global.TextEncoderStream;
    this.global.TextDecoderStream = global.TextDecoderStream;
    
    // Also polyfill crypto if needed
    if (global.crypto) {
      this.global.crypto = global.crypto;
    }
  }
}

module.exports = CustomEnvironment;
