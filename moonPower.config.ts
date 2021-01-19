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
          '7653552845700e95aa556da860293d1e9221ac8ea9486d0d9947f3b73af61825',
        categories: [
          {
            id: 913, // 这里是接口分类的id
            prefix: 'app',
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
