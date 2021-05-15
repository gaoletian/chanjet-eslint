// 首行注解
import { api, httpContext } from 'src/api';
const api2 = api.foo;

class foo {
  get api() {}
  async ttt() {
    const api = await import('src/api');
    const api1 = api;
    api.foo.get();
    this.api.foo.get();
    const appCode = httpContext.appCode;
  }
}
