import { defineConfig } from './src'

export default defineConfig([
  {
    serverUrl: 'http://yapi.uniubi.com:3000/',
    typesOnly: false,
    restful: true,
    repeat: true,
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
          '6b75c91582ac37b26d4423983e12d9e03566c86f37953378cb7faa1f1421505c',
        categories: [
          {
            id: 724, // 这里是接口分类的id
          },
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
          // {
          //   id: 49, // 这里是接口分类的id
          //   // getRequestFunctionName(interfaceInfo, changeCase) {
          //   //   return changeCase.camelCase(interfaceInfo.parsedPath.name);
          //   // },
          // },
        ],
      },
    ],
  },
])
