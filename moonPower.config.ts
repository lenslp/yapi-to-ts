import { defineConfig } from './src'

export default defineConfig([
  {
    serverUrl: 'http://yapi.uniubi.com:3000/',
    typesOnly: false,
    restful: true,
    boolean: [],
    number: ['groupId', 'id', 'queryId'],
    target: 'typescript',
    reactHooks: {
      enabled: false,
    },
    prodEnvName: 'local',
    outputFilePath: 'api/index.ts',
    requestFunctionFilePath: 'api/request.ts',
    dataKey: 'data',
    projects: [
      {
        token:
          'a5bd581b9603509ecfa61402589ed48bd28a81b42b12998d6d9a0196d5856333',
        categories: [
          // {
          //   id: 31, // 这里是接口分类的id
          //   getRequestFunctionName(interfaceInfo, changeCase) {
          //     return changeCase.camelCase(interfaceInfo.parsedPath.name);
          //   },
          // },
          // {
          //   id: 34, // 这里是接口分类的id
          //   getRequestFunctionName(interfaceInfo, changeCase) {
          //     return changeCase.camelCase(interfaceInfo.parsedPath.name);
          //   },
          // },
          // {
          //   id: 37, // 这里是接口分类的id
          //   getRequestFunctionName(interfaceInfo, changeCase) {
          //     return changeCase.camelCase(interfaceInfo.parsedPath.name);
          //   },
          // },
          // {
          //   id: 40, // 这里是接口分类的id
          //   getRequestFunctionName(interfaceInfo, changeCase) {
          //     return changeCase.camelCase(interfaceInfo.parsedPath.name);
          //   },
          // },
          // {
          //   id: 43, // 这里是接口分类的id
          //   getRequestFunctionName(interfaceInfo, changeCase) {
          //     return changeCase.camelCase(interfaceInfo.parsedPath.name);
          //   },
          // },
          // {
          //   id: 46, // 这里是接口分类的id
          //   getRequestFunctionName(interfaceInfo, changeCase) {
          //     return changeCase.camelCase(interfaceInfo.parsedPath.name);
          //   },
          // },
          {
            id: 49, // 这里是接口分类的id
            // getRequestFunctionName(interfaceInfo, changeCase) {
            //   return changeCase.camelCase(interfaceInfo.parsedPath.name);
            // },
          },
        ],
      },
    ],
  },
])
