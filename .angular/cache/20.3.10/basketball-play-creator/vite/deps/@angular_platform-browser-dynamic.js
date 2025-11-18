import {
  platformBrowser
} from "./chunk-5R7JYBP6.js";
import {
  COMPILER_OPTIONS,
  Compiler,
  CompilerFactory,
  Injectable,
  Injector,
  Version,
  ViewEncapsulation,
  createPlatformFactory,
  setClassMetadata,
  ɵɵdefineInjectable,
  ɵɵgetInheritedFactory
} from "./chunk-XZGEIBNF.js";
import "./chunk-Y72XGDAT.js";
import "./chunk-HSWANC32.js";
import {
  CompilerConfig,
  ResourceLoader
} from "./chunk-K2EPVRAW.js";
import "./chunk-GOMI4DH3.js";

// node_modules/@angular/platform-browser-dynamic/fesm2022/platform-browser-dynamic.mjs
var VERSION = new Version("20.3.11");
var COMPILER_PROVIDERS = [{
  provide: Compiler,
  useFactory: () => new Compiler()
}];
var JitCompilerFactory = class {
  _defaultOptions;
  /** @internal */
  constructor(defaultOptions) {
    const compilerOptions = {
      defaultEncapsulation: ViewEncapsulation.Emulated
    };
    this._defaultOptions = [compilerOptions, ...defaultOptions];
  }
  createCompiler(options = []) {
    const opts = _mergeOptions(this._defaultOptions.concat(options));
    const injector = Injector.create({
      providers: [COMPILER_PROVIDERS, {
        provide: CompilerConfig,
        useFactory: () => {
          return new CompilerConfig({
            defaultEncapsulation: opts.defaultEncapsulation,
            preserveWhitespaces: opts.preserveWhitespaces
          });
        },
        deps: []
      }, opts.providers]
    });
    return injector.get(Compiler);
  }
};
function _mergeOptions(optionsArr) {
  return {
    defaultEncapsulation: _lastDefined(optionsArr.map((options) => options.defaultEncapsulation)),
    providers: _mergeArrays(optionsArr.map((options) => options.providers)),
    preserveWhitespaces: _lastDefined(optionsArr.map((options) => options.preserveWhitespaces))
  };
}
function _lastDefined(args) {
  for (let i = args.length - 1; i >= 0; i--) {
    if (args[i] !== void 0) {
      return args[i];
    }
  }
  return void 0;
}
function _mergeArrays(parts) {
  const result = [];
  parts.forEach((part) => part && result.push(...part));
  return result;
}
var ResourceLoaderImpl = class _ResourceLoaderImpl extends ResourceLoader {
  get(url) {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "text";
    xhr.onload = function() {
      const response = xhr.response;
      let status = xhr.status;
      if (status === 0) {
        status = response ? 200 : 0;
      }
      if (200 <= status && status <= 300) {
        resolve(response);
      } else {
        reject(`Failed to load ${url}`);
      }
    };
    xhr.onerror = function() {
      reject(`Failed to load ${url}`);
    };
    xhr.send();
    return promise;
  }
  static ɵfac = /* @__PURE__ */ (() => {
    let ɵResourceLoaderImpl_BaseFactory;
    return function ResourceLoaderImpl_Factory(__ngFactoryType__) {
      return (ɵResourceLoaderImpl_BaseFactory || (ɵResourceLoaderImpl_BaseFactory = ɵɵgetInheritedFactory(_ResourceLoaderImpl)))(__ngFactoryType__ || _ResourceLoaderImpl);
    };
  })();
  static ɵprov = ɵɵdefineInjectable({
    token: _ResourceLoaderImpl,
    factory: _ResourceLoaderImpl.ɵfac
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ResourceLoaderImpl, [{
    type: Injectable
  }], null, null);
})();
var INTERNAL_BROWSER_DYNAMIC_PLATFORM_PROVIDERS = [{
  provide: COMPILER_OPTIONS,
  useValue: {
    providers: [{
      provide: ResourceLoader,
      useClass: ResourceLoaderImpl,
      deps: []
    }]
  },
  multi: true
}, {
  provide: CompilerFactory,
  useClass: JitCompilerFactory,
  deps: [COMPILER_OPTIONS]
}];
var platformBrowserDynamic = createPlatformFactory(platformBrowser, "browserDynamic", INTERNAL_BROWSER_DYNAMIC_PLATFORM_PROVIDERS);
export {
  JitCompilerFactory,
  VERSION,
  platformBrowserDynamic
};
/*! Bundled license information:

@angular/platform-browser-dynamic/fesm2022/platform-browser-dynamic.mjs:
  (**
   * @license Angular v20.3.11
   * (c) 2010-2025 Google LLC. https://angular.dev/
   * License: MIT
   *)
*/
//# sourceMappingURL=@angular_platform-browser-dynamic.js.map
