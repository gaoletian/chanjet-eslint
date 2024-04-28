import { createESlint } from '../testUtil';
describe('i18n-extract-chinese =====> 测试用例', () => {
  const linter = createESlint({
    '@chanjet/i18n-extract-chinese': 'error',
  });
  it('[apidoc-1] 测试翻译重构html类型 简单类型', async () => {
    const codeWithChinese = `
        <div>
          欢迎使用应用程序
          <p>这是一段中文文本</p>
          <span>更多中文内容</span>
        </div>
      `;

    const expectedCode = `
        <div>
          {i18n.cjtT('欢迎使用应用程序')}
          <p>{i18n.cjtT('这是一段中文文本')}</p>
          <span>{i18n.cjtT('更多中文内容')}</span>
        </div>
      `;

    const result = await linter.lintText(codeWithChinese, { filePath: '/root/src/example.js' });
    console.log(result[0].output);
    expect(result[0].output).toEqual(expectedCode);
  });

  it('[apidoc-2] 测试翻译重构html类型 带变量 {} 或者 `${}`', async () => {
    const codeWithChinese = `
        <div>
          欢迎使用应用程序{name}
          <p>这是一段中文文本</p>
          <span>更多中文内容</span>
        </div>
      `;

    const expectedCode = `
        <div>
          {i18n.cjtT('欢迎使用应用程序')}{i18n.cjtT(name)}
          <p>{i18n.cjtT('这是一段中文文本')}</p>
          <span>{i18n.cjtT('更多中文内容')}</span>
        </div>
      `;

    const result = await linter.lintText(codeWithChinese, { filePath: '/root/src/example.js' });
    console.log(result[0].output);
    expect(result[0].output).toEqual(expectedCode);
  });

  it('[apidoc-3] 测试翻译重构html类型 更高级带特殊符号 &gt; &nbsp;', async () => {
    const codeWithChinese = `
        <div>
          欢迎使用应用程序&gt;&nbsp;
          <p>这是一段中文文本</p>&nbsp;
          <span>更多中文内容&nbsp;</span>
        </div>
      `;

    const expectedCode = `
        <div>
          {i18n.cjtT('欢迎使用应用程序')}
          <p>{i18n.cjtT('这是一段中文文本')}</p>&nbsp;
          <span>{i18n.cjtT('更多中文内容')}</span>
        </div>
      `;

    const result = await linter.lintText(codeWithChinese, { filePath: '/root/src/example.js' });
    console.log(result[0].output);
    expect(result[0].output).toEqual(expectedCode);
  });

  it('[apidoc-5] 测试翻译重构html类型 带注释的不替换', async () => {
    const codeWithChinese = `
        <div>
        {/* 你好<div></div>
                                    <div></div> */}
          欢迎使用应用程序
          <p>这是一段中文文本</p>
          <span>更多中文内容</span>
        </div>
      `;

    const expectedCode = `
        <div>
        {/* 你好<div></div>
                                    <div></div> */}
          {i18n.cjtT('欢迎使用应用程序')}
          <p>{i18n.cjtT('这是一段中文文本')}</p>
          <span>{i18n.cjtT('更多中文内容')}</span>
        </div>
      `;

    const result = await linter.lintText(codeWithChinese, { filePath: '/root/src/example.js' });
    console.log(result[0].output);
    expect(result[0].output).toEqual(expectedCode);
  });

  it('[apidoc-6] 测试翻译重构html类型 更高级带特殊符号 > < ==', async () => {
    const codeWithChinese = `
        <div>
        {111 > 0 ? '你好':''}
          <p>这是一段中文文本</p>
          <div>{this.status == 4 ? '已认证' : '认证中'}</div>
          <span>更多中文内容</span>
        </div>
      `;

    const expectedCode = `
        <div>
        {111 > 0 ? i18n.cjtT('你好'):''}
          <p>{i18n.cjtT('这是一段中文文本')}</p>
          <div>{this.status == 4 ? i18n.cjtT('已认证') : i18n.cjtT('认证中')}</div>
          <span>{i18n.cjtT('更多中文内容')}</span>
        </div>
      `;

    const result = await linter.lintText(codeWithChinese, { filePath: '/root/src/example.js' });
    console.log(result[0].output);
    expect(result[0].output).toEqual(expectedCode);
  });

  it('[apidoc-7] 测试翻译重构html类型 Button 或者 Checkbox 中的label补重构', async () => {
    const codeWithChinese = `
          <div>
          {111 < 0 ? '你好':''}
            <p>这是一段中文文本</p>
            <span>更多中文内容</span>
            <Button label={'按钮'}></Button>
            <Checkbox label={'复选'}></Checkbox>
          </div>
        `;

    const expectedCode = `
          <div>
          {111 < 0 ? i18n.cjtT('你好'):''}
            <p>{i18n.cjtT('这是一段中文文本')}</p>
            <span>{i18n.cjtT('更多中文内容')}</span>
            <Button label={'按钮'}></Button>
            <Checkbox label={'复选'}></Checkbox>
          </div>
        `;

    const result = await linter.lintText(codeWithChinese, { filePath: '/root/src/example.js' });
    console.log(result[0].output);
    expect(result[0].output).toEqual(expectedCode);
  });

  it('[apidoc-8] 测试翻译重构html类型 && 、 ||  符号', async () => {
    const codeWithChinese = `
          <div>
            {true && '你好'}
            <p>这是一段"符号干扰"中文文本</p>
            这是中文文本，加个应为“符号干扰”一下
            <p>{name ||  '这是一段,中文文本'}</p>
            <div>{true && bbb}</div>
            <span>更多中文内容</span>
          </div>
        `;

    const expectedCode = `
          <div>
            {true && i18n.cjtT('你好')}
            <p>{i18n.cjtT('这是一段"符号干扰"中文文本')}</p>
            {i18n.cjtT('这是中文文本，加个应为“符号干扰”一下')}
            <p>{name ||  i18n.cjtT('这是一段,中文文本')}</p>
            <div>{true && bbb}</div>
            <span>{i18n.cjtT('更多中文内容')}</span>
          </div>
        `;

    const linter = createESlint({
      '@chanjet/i18n-extract-chinese': 'error',
    });

    const result = await linter.lintText(codeWithChinese, { filePath: '/root/src/example.js' });
    console.log(result[0].output);
    expect(result[0].output).toEqual(expectedCode);
  });
  it('[apidoc-9] 测试翻译重构html类型 测试更复杂类型', async () => {
    const codeWithChinese = `
          <div>
            <div>{appName == 'cc' && '你好'}</div>
            <p>这是一段中文文本。</p>
            <span>更多中文内容。</span>
            <div>
              {item.label.replace(
                  /消费品模式|工业品模式|机械设备模式/,
                  item.label + '销售模式'
              )}
            </div>
            {isActive && <div>你好啊</div>}
            {isActive && <div>你好啊，我是小明！</div>}
            {isActive && <div>{isActive ? '你好': '大哥'}</div>}
            {isActive && <div>{isActive && '大哥'}</div>}
          </div>
        `;

    const expectedCode = `
          <div>
            <div>{appName == 'cc' && i18n.cjtT('你好')}</div>
            <p>{i18n.cjtT('这是一段中文文本。')}</p>
            <span>{i18n.cjtT('更多中文内容。')}</span>
            <div>
              {item.label.replace(
                  /消费品模式|工业品模式|机械设备模式/,
                  item.label + '销售模式'
              )}
            </div>
            {isActive && <div>{i18n.cjtT('你好啊')}</div>}
            {isActive && <div>{i18n.cjtT('你好啊，我是小明！')}</div>}
            {isActive && <div>{isActive ? i18n.cjtT('你好'): i18n.cjtT('大哥')}</div>}
            {isActive && <div>{isActive && i18n.cjtT('大哥')}</div>}
          </div>
        `;

    const linter = createESlint({
      '@chanjet/i18n-extract-chinese': 'error',
    });

    const result = await linter.lintText(codeWithChinese, { filePath: '/root/src/example.js' });
    console.log(result[0].output);
    expect(result[0].output).toEqual(expectedCode);
  });

  it('[apidoc-10] 测试翻译重构html类型 带标点符号', async () => {
    const codeWithChinese = `
          <div>
            欢迎使用应用程序！
            <p>这是一段中文文本。</p>
            <span>更多中文内容。</span>
          </div>
        `;

    const expectedCode = `
          <div>
            {i18n.cjtT('欢迎使用应用程序！')}
            <p>{i18n.cjtT('这是一段中文文本。')}</p>
            <span>{i18n.cjtT('更多中文内容。')}</span>
          </div>
        `;

    const linter = createESlint({
      '@chanjet/i18n-extract-chinese': 'error',
    });

    const result = await linter.lintText(codeWithChinese, { filePath: '/root/src/example.js' });
    console.log(result[0].output);
    expect(result[0].output).toEqual(expectedCode);
  });

  it('[apidoc-11] 测试翻译重构html类型 函数声明变量不替换', async () => {
    const codeWithChinese = `
          <div>
            欢迎使用应用程序！
            <div>{renderGrid()}</div>
            <p>这是一段中文文本。</p>
            <span>更多中文内容。</span>
          </div>
        `;

    const expectedCode = `
          <div>
            {i18n.cjtT('欢迎使用应用程序！')}
            <div>{renderGrid()}</div>
            <p>{i18n.cjtT('这是一段中文文本。')}</p>
            <span>{i18n.cjtT('更多中文内容。')}</span>
          </div>
        `;

    const linter = createESlint({
      '@chanjet/i18n-extract-chinese': 'error',
    });

    const result = await linter.lintText(codeWithChinese, { filePath: '/root/src/example.js' });
    console.log(result[0].output);
    expect(result[0].output).toEqual(expectedCode);
  });
});
