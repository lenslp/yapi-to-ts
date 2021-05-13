import * as changeCase from 'change-case'
import _ from 'lodash'
import dayjs from 'dayjs'
import fs from 'fs-extra'
import got from 'got'
import path from 'path'
import prettier from 'prettier'
import {
  castArray,
  dedent,
  groupBy,
  isEmpty,
  isFunction,
  memoize,
  noop,
  omit,
  uniq,
  values,
} from 'vtils'
import {
  CategoryList,
  Config,
  ExtendedInterface,
  Interface,
  InterfaceList,
  Project,
  ProjectConfig,
  ServerConfig,
  SyntheticalConfig,
} from './types'
import { exec } from 'child_process'
import {
  getNormalizedRelativePath,
  getRequestBodyJsonSchema,
  getRequestParamsJsonSchema,
  getRequestQueryJsonSchema,
  getResponseDataJsonSchema,
  jsonSchemaToType,
  throwError,
} from './utils'
import { SwaggerToYApiServer } from './SwaggerToYApiServer'
interface OutputFileList {
  [outputFilePath: string]: {
    syntheticalConfig: SyntheticalConfig
    content: string[]
    requestFunctionFilePath: string
    requestHookMakerFilePath: string
  }
}

export class Generator {
  /** 配置 */
  private config: ServerConfig[] = []

  private disposes: Array<() => any> = []

  constructor(
    config: Config,
    private options: { cwd: string } = { cwd: process.cwd() },
  ) {
    // config 可能是对象或数组，统一为数组
    this.config = castArray(config)
  }

  async prepare(): Promise<void> {
    this.config = await Promise.all(
      // config 可能是对象或数组，统一为数组
      this.config.map(async item => {
        if (item.serverType === 'swagger') {
          const swaggerToYApiServer = new SwaggerToYApiServer({
            swaggerJsonUrl: item.serverUrl,
          })
          item.serverUrl = await swaggerToYApiServer.start()
          this.disposes.push(() => swaggerToYApiServer.stop())
        }
        if (item.serverUrl) {
          item.serverUrl = item.serverUrl.replace(/\/+$/, '')
        }
        return item
      }),
    )
  }

  async generate(): Promise<OutputFileList> {
    const outputFileList: OutputFileList = Object.create(null)

    await Promise.all(
      this.config.map(async (serverConfig, serverIndex) => {
        const projects = serverConfig.projects.reduce<ProjectConfig[]>(
          (projects, project) => {
            projects.push(
              ...castArray(project.token).map(token => ({
                ...project,
                token: token,
              })),
            )
            return projects
          },
          [],
        )
        return Promise.all(
          projects.map(async (projectConfig, projectIndex) => {
            const projectInfo = await this.fetchProjectInfo({
              ...serverConfig,
              ...projectConfig,
            })

            // 如果什么都不填，获取全部数据
            // 如果填了，只获取填写的数据
            let categories: ProjectConfig['categories'] = []
            if (projectConfig.categories.length) {
              categories = projectConfig.categories
            } else {
              categories = projectInfo.cats.map((cat: CategoryList[0]) => {
                return {
                  id: cat._id,
                }
              })
            }
            await Promise.all(
              categories.map(async (categoryConfig, categoryIndex) => {
                // 分类处理
                // 数组化
                let categoryIds = castArray(categoryConfig.id)
                // 全部分类
                if (categoryIds.includes(0)) {
                  categoryIds.push(...projectInfo.cats.map(cat => cat._id))
                }
                // 唯一化
                categoryIds = uniq(categoryIds)
                // 去掉被排除的分类
                const excludedCategoryIds = categoryIds
                  .filter(id => id < 0)
                  .map(Math.abs)
                categoryIds = categoryIds.filter(
                  id => !excludedCategoryIds.includes(Math.abs(id)),
                )
                // 删除不存在的分类
                categoryIds = categoryIds.filter(
                  id => !!projectInfo.cats.find(cat => cat._id === id),
                )
                // 顺序化
                categoryIds = categoryIds.sort()
                const codes = await Promise.all(
                  categoryIds.map<
                    Promise<{
                      outputFilePath: string
                      code: string
                      weights: number[]
                    }>
                  >(async (id, categoryIndex2) => {
                    categoryConfig = {
                      ...categoryConfig,
                      id: id,
                    }
                    const syntheticalConfig: SyntheticalConfig = {
                      ...serverConfig,
                      ...projectConfig,
                      ...categoryConfig,
                      mockUrl: projectInfo.getMockUrl(),
                    }
                    syntheticalConfig.target =
                      syntheticalConfig.target || 'typescript'
                    const interfaceList = (
                      await this.fetchInterfaceList(syntheticalConfig)
                    )
                      .map(interfaceInfo => {
                        // 实现 _project 字段
                        interfaceInfo._project = omit(projectInfo, [
                          'cats',
                          'getMockUrl',
                          'getDevUrl',
                          'getProdUrl',
                        ])
                        return interfaceInfo
                      })
                      .sort((a, b) => a._id - b._id)
                    const outputFilePath = path.resolve(
                      this.options.cwd,
                      syntheticalConfig.outputFilePath!,
                    )
                    // const categoryUID = `_${serverIndex}_${projectIndex}_${categoryIndex}_${categoryIndex2}`
                    const categoryCode =
                      interfaceList.length === 0
                        ? ''
                        : [
                            syntheticalConfig.typesOnly ? '' : dedent``,
                            ...(await Promise.all(
                              interfaceList.map(async interfaceInfo => {
                                interfaceInfo = isFunction(
                                  syntheticalConfig.preproccessInterface,
                                )
                                  ? syntheticalConfig.preproccessInterface(
                                      interfaceInfo,
                                      changeCase,
                                    )
                                  : interfaceInfo
                                return this.generateInterfaceCode(
                                  syntheticalConfig,
                                  interfaceInfo,
                                  // categoryUID,
                                )
                              }),
                            )),
                          ].join('\n\n')
                    if (!outputFileList[outputFilePath]) {
                      outputFileList[outputFilePath] = {
                        syntheticalConfig,
                        content: [],
                        requestFunctionFilePath: syntheticalConfig.requestFunctionFilePath
                          ? path.resolve(
                              this.options.cwd,
                              syntheticalConfig.requestFunctionFilePath,
                            )
                          : path.join(
                              path.dirname(outputFilePath),
                              'request.ts',
                            ),
                        requestHookMakerFilePath:
                          syntheticalConfig.reactHooks &&
                          syntheticalConfig.reactHooks.enabled
                            ? syntheticalConfig.reactHooks
                                .requestHookMakerFilePath
                              ? path.resolve(
                                  this.options.cwd,
                                  syntheticalConfig.reactHooks
                                    .requestHookMakerFilePath,
                                )
                              : path.join(
                                  path.dirname(outputFilePath),
                                  'makeRequestHook.ts',
                                )
                            : '',
                      }
                    }
                    return {
                      outputFilePath: outputFilePath,
                      code: categoryCode,
                      weights: [
                        serverIndex,
                        projectIndex,
                        categoryIndex,
                        categoryIndex2,
                      ],
                    }
                  }),
                )
                for (const groupedCodes of values(
                  groupBy(codes, item => item.outputFilePath),
                )) {
                  groupedCodes.sort((a, b) => {
                    const x = a.weights.length > b.weights.length ? b : a
                    const minLen = Math.min(a.weights.length, b.weights.length)
                    const maxLen = Math.max(a.weights.length, b.weights.length)
                    x.weights.push(...new Array(maxLen - minLen).fill(0))
                    const w = a.weights.reduce((w, _, i) => {
                      if (w === 0) {
                        w = a.weights[i] - b.weights[i]
                      }
                      return w
                    }, 0)
                    return w
                  })
                  outputFileList[groupedCodes[0].outputFilePath].content.push(
                    ...groupedCodes.map(item => item.code),
                  )
                }
              }),
            )
          }),
        )
      }),
    )

    return outputFileList
  }

  async write(outputFileList: OutputFileList) {
    return Promise.all(
      Object.keys(outputFileList).map(async outputFilePath => {
        let {
          // eslint-disable-next-line prefer-const
          content,
          requestFunctionFilePath,
          requestHookMakerFilePath,
          // eslint-disable-next-line prefer-const
          syntheticalConfig,
        } = outputFileList[outputFilePath]

        // const rawRequestFunctionFilePath = requestFunctionFilePath
        const rawRequestHookMakerFilePath = requestHookMakerFilePath

        // 支持 .jsx? 后缀
        outputFilePath = outputFilePath.replace(/\.js(x)?$/, '.ts$1')
        requestFunctionFilePath = requestFunctionFilePath.replace(
          /\.js(x)?$/,
          '.ts$1',
        )
        requestHookMakerFilePath = requestHookMakerFilePath.replace(
          /\.js(x)?$/,
          '.ts$1',
        )

        if (!syntheticalConfig.typesOnly) {
          if (
            syntheticalConfig.reactHooks &&
            syntheticalConfig.reactHooks.enabled &&
            !(await fs.pathExists(rawRequestHookMakerFilePath))
          ) {
            await fs.outputFile(
              requestHookMakerFilePath,
              dedent`
                import { useState, useEffect } from 'react'
                import { RequestConfig } from 'yapi-to-ts'
                import { Request } from ${JSON.stringify(
                  getNormalizedRelativePath(
                    requestHookMakerFilePath,
                    outputFilePath,
                  ),
                )}
                import baseRequest from ${JSON.stringify(
                  getNormalizedRelativePath(
                    requestHookMakerFilePath,
                    requestFunctionFilePath,
                  ),
                )}

                export default function makeRequestHook<TRequestData, TRequestConfig extends RequestConfig, TRequestResult extends ReturnType<typeof baseRequest>>(request: Request<TRequestData, TRequestConfig, TRequestResult>) {
                  type Data = TRequestResult extends Promise<infer R> ? R : TRequestResult
                  return function useRequest(requestData: TRequestData) {
                    // 一个简单的 Hook 实现，实际项目可结合其他库使用，比如：
                    // @umijs/hooks 的 useRequest (https://github.com/umijs/hooks)
                    // swr (https://github.com/zeit/swr)

                    const [loading, setLoading] = useState(true)
                    const [data, setData] = useState<Data>()

                    useEffect(() => {
                      request(requestData).then(data => {
                        setLoading(false)
                        setData(data as any)
                      })
                    }, [JSON.stringify(requestData)])

                    return {
                      loading,
                      data,
                    }
                  }
                }
              `,
            )
          }
        }

        // 始终写入主文件
        const rawOutputContent = dedent`
          /* eslint-disable */

          /* 该文件由 yapi-to-ts 自动生成，请勿直接修改！！！ */

          ${
            syntheticalConfig.typesOnly
              ? content.join('\n\n').trim()
              : dedent`
                // @ts-ignore
                // prettier-ignore
                import { Method, RequestBodyType, ResponseBodyType, RequestConfig, RequestFunctionRestArgs, FileData, prepare } from 'yapi-to-ts'
                import request from '@/utils/request';
                // @ts-ignore
                ${
                  !syntheticalConfig.reactHooks ||
                  !syntheticalConfig.reactHooks.enabled
                    ? ''
                    : dedent`
                      // @ts-ignore
                      import makeRequestHook from ${JSON.stringify(
                        getNormalizedRelativePath(
                          outputFilePath,
                          requestHookMakerFilePath,
                        ),
                      )}
                    `
                }
                ${content.join('\n\n').trim()}
              `
          }
        `
        // ref: https://prettier.io/docs/en/options.html
        const prettyOutputContent = prettier.format(rawOutputContent, {
          parser: 'typescript',
          printWidth: 120,
          tabWidth: 2,
          singleQuote: true,
          semi: false,
          trailingComma: 'all',
          bracketSpacing: false,
          endOfLine: 'lf',
        })
        const outputContent = `${dedent`
          /* prettier-ignore-start */
          ${prettyOutputContent}
          /* prettier-ignore-end */
        `}\n`
        await fs.outputFile(outputFilePath, outputContent)

        // 如果要生成 JavaScript 代码，
        // 则先对主文件进行 tsc 编译，主文件引用到的其他文件也会被编译，
        // 然后，删除原始的 .tsx? 文件。
        if (syntheticalConfig.target === 'javascript') {
          await this.tsc(outputFilePath)
          await Promise.all([
            fs.remove(requestFunctionFilePath).catch(noop),
            fs.remove(requestHookMakerFilePath).catch(noop),
            fs.remove(outputFilePath).catch(noop),
          ])
        }
      }),
    )
  }

  async tsc(file: string) {
    return new Promise(resolve => {
      exec(
        `${require.resolve(
          'typescript/bin/tsc',
        )} --target ES2019 --module ESNext --jsx preserve --declaration --esModuleInterop ${file}`,
        {
          cwd: this.options.cwd,
          env: process.env,
        },
        () => resolve(),
      )
    })
  }

  async fetchApi<T = any>(url: string, query: Record<string, any>): Promise<T> {
    const { body: res } = await got.get<{
      errcode: any
      errmsg: any
      data: any
    }>(url, {
      searchParams: query,
      responseType: 'json',
    })
    /* istanbul ignore next */
    if (res && res.errcode) {
      throwError(res.errmsg)
    }
    return res.data || res
  }

  fetchProject = memoize(
    async ({ serverUrl, token }: SyntheticalConfig) => {
      const projectInfo = await this.fetchApi<Project>(
        `${serverUrl}/api/project/get`,
        {
          token: token!,
        },
      )
      const basePath = `/${projectInfo.basepath || '/'}`
        .replace(/\/+$/, '')
        .replace(/^\/+/, '/')
      projectInfo.basepath = basePath
      return projectInfo
    },
    ({ serverUrl, token }: SyntheticalConfig) => `${serverUrl}|${token}`,
  )

  fetchExport = memoize(
    async ({ serverUrl, token }: SyntheticalConfig) => {
      const projectInfo = await this.fetchProject({ serverUrl, token })
      const categoryList = await this.fetchApi<CategoryList>(
        `${serverUrl}/api/plugin/export`,
        {
          type: 'json',
          status: 'all',
          isWiki: 'false',
          token: token!,
        },
      )
      return categoryList.map(cat => {
        cat.list = (cat.list || []).map(item => {
          item.path = `${projectInfo.basepath}${item.path}`
          return item
        })
        return cat
      })
    },
    ({ serverUrl, token }: SyntheticalConfig) => `${serverUrl}|${token}`,
  )

  /** 获取分类的接口列表 */
  async fetchInterfaceList({
    serverUrl,
    token,
    id,
  }: SyntheticalConfig): Promise<InterfaceList> {
    const category = (
      (await this.fetchExport({ serverUrl, token })) || []
    ).find(
      cat => !isEmpty(cat) && !isEmpty(cat.list) && cat.list[0].catid === id,
    )

    if (category) {
      category.list.forEach(interfaceInfo => {
        // 实现 _category 字段
        interfaceInfo._category = omit(category, ['list'])
      })
    }

    return category ? category.list : []
  }

  /** 获取项目信息 */
  async fetchProjectInfo(syntheticalConfig: SyntheticalConfig) {
    const projectInfo = await this.fetchProject(syntheticalConfig)
    const projectCats = await this.fetchApi<CategoryList>(
      `${syntheticalConfig.serverUrl}/api/interface/getCatMenu`,
      {
        token: syntheticalConfig.token!,
        project_id: projectInfo._id,
      },
    )

    return {
      ...projectInfo,
      cats: projectCats,
      getMockUrl: () =>
        `${syntheticalConfig.serverUrl}/mock/${projectInfo._id}`,
      getDevUrl: (devEnvName: string) => {
        const env = projectInfo.env.find(e => e.name === devEnvName)
        return (env && env.domain) /* istanbul ignore next */ || ''
      },
      getProdUrl: (prodEnvName: string) => {
        const env = projectInfo.env.find(e => e.name === prodEnvName)
        return (env && env.domain) /* istanbul ignore next */ || ''
      },
    }
  }

  /** 生成接口代码 */
  async generateInterfaceCode(
    syntheticalConfig: SyntheticalConfig,
    interfaceInfo: Interface,
    // categoryUID: string,
  ) {
    const extendedInterfaceInfo: ExtendedInterface = {
      ...interfaceInfo,
      parsedPath: path.parse(interfaceInfo.path),
    }

    let requestFunctionName = ''
    const originalPathArray = interfaceInfo.path.split('/')

    let pathArray = interfaceInfo.path.split('/')
    pathArray = _.filter(pathArray, function(o) {
      return o.indexOf('{') === -1 && o !== ''
    })
    const pathLength = pathArray.length
    const method = interfaceInfo.method
    const isNotEmptyQuery =
      Array.isArray(interfaceInfo.req_query) &&
      interfaceInfo.req_query.length > 0
    const isNotEmptyParams =
      Array.isArray(interfaceInfo.req_params) &&
      interfaceInfo.req_params.length > 0

    let parametersArray: string[] = []

    // 配置文件获取是否是restful风格\
    if (isFunction(syntheticalConfig.getRequestFunctionName)) {
      requestFunctionName = await syntheticalConfig.getRequestFunctionName(
        extendedInterfaceInfo,
        changeCase,
      )
    } else {
      if (isNotEmptyParams) {
        parametersArray = _.filter(originalPathArray, function(o) {
          return o.indexOf('{') !== -1
        }).map(item => item.replace(/[{}]/g, ''))

        // 补位
        if (syntheticalConfig.repeat) {
          if (syntheticalConfig.restful) {
            requestFunctionName = `${method}_${pathArray.join('_')}`
            if (parametersArray.length) {
              for (let i = 0; i < parametersArray.length; i++) {
                const element = parametersArray[i]
                requestFunctionName = `${requestFunctionName}_by_${element}`
              }
            }
          } else {
            requestFunctionName = pathArray[pathLength - 1]
          }
          requestFunctionName = changeCase.camelCase(requestFunctionName)
        } else {
          requestFunctionName = syntheticalConfig.restful
            ? changeCase.camelCase(`${method}_${pathArray[pathLength - 1]}`)
            : changeCase.camelCase(pathArray[pathLength - 1])
        }
      } else {
        // 补位
        if (syntheticalConfig.repeat) {
          requestFunctionName = syntheticalConfig.restful
            ? changeCase.camelCase(`${method}_${pathArray.join('_')}`)
            : changeCase.camelCase(extendedInterfaceInfo.parsedPath.name)
        } else {
          requestFunctionName = syntheticalConfig.restful
            ? changeCase.camelCase(
                `${method}_${extendedInterfaceInfo.parsedPath.name}`,
              )
            : changeCase.camelCase(extendedInterfaceInfo.parsedPath.name)
        }
      }
    }

    // Query
    const requestQueryTypeName = isFunction(
      syntheticalConfig.getRequestQueryTypeName,
    )
      ? await syntheticalConfig.getRequestQueryTypeName(
          extendedInterfaceInfo,
          changeCase,
        )
      : changeCase.pascalCase(`${requestFunctionName}Query`)
    const requestQueryJsonSchema = getRequestQueryJsonSchema(
      extendedInterfaceInfo,
      syntheticalConfig,
    )

    const requestQueryType = await jsonSchemaToType(
      requestQueryJsonSchema,
      requestQueryTypeName,
    )

    // Body
    const requestBodyTypeName = isFunction(
      syntheticalConfig.getRequestBodyTypeName,
    )
      ? await syntheticalConfig.getRequestBodyTypeName(
          extendedInterfaceInfo,
          changeCase,
        )
      : changeCase.pascalCase(`${requestFunctionName}Body`)
    const requestBodyJsonSchema = getRequestBodyJsonSchema(
      extendedInterfaceInfo,
    )

    const requestBodyType = await jsonSchemaToType(
      requestBodyJsonSchema,
      requestBodyTypeName,
    )

    const isNotEmptyBody =
      requestBodyJsonSchema &&
      ((requestBodyJsonSchema.type === 'object' &&
        requestBodyJsonSchema.properties &&
        Object.keys(requestBodyJsonSchema.properties).length > 0) ||
        requestBodyJsonSchema.type === 'array')

    // Params
    const requestParamsTypeName = isFunction(
      syntheticalConfig.getRequestParamsTypeName,
    )
      ? await syntheticalConfig.getRequestParamsTypeName(
          extendedInterfaceInfo,
          changeCase,
        )
      : changeCase.pascalCase(`${requestFunctionName}Params`)
    const requestParamsJsonSchema = getRequestParamsJsonSchema(
      extendedInterfaceInfo,
      syntheticalConfig,
    )
    const requestParamsType = await jsonSchemaToType(
      requestParamsJsonSchema,
      requestParamsTypeName,
    )

    const responseDataTypeName = isFunction(
      syntheticalConfig.getResponseDataTypeName,
    )
      ? await syntheticalConfig.getResponseDataTypeName(
          extendedInterfaceInfo,
          changeCase,
        )
      : changeCase.pascalCase(`${requestFunctionName}Response`)

    const responseDataJsonSchema = getResponseDataJsonSchema(
      extendedInterfaceInfo,
      syntheticalConfig.dataKey,
    )
    const responseDataType = await jsonSchemaToType(
      responseDataJsonSchema,
      responseDataTypeName,
    )
    // const isRequestDataOptional = /(\{\}|any)$/s.test(requestDataType)
    // const requestHookName =
    //   syntheticalConfig.reactHooks && syntheticalConfig.reactHooks.enabled
    //     ? isFunction(syntheticalConfig.reactHooks.getRequestHookName)
    //       ? /* istanbul ignore next */
    //         await syntheticalConfig.reactHooks.getRequestHookName(
    //           extendedInterfaceInfo,
    //           changeCase,
    //         )
    //       : `use${changeCase.pascalCase(requestFunctionName)}`
    //     : ''

    // 支持路径参数
    // const paramNames = (
    //   extendedInterfaceInfo.req_params /* istanbul ignore next */ || []
    // ).map(item => item.name)
    // const paramNamesLiteral = JSON.stringify(paramNames)
    // const paramNameType =
    //   paramNames.length === 0 ? 'string' : `'${paramNames.join("' | '")}'`

    // 支持查询参数
    // const queryNames = (
    //   extendedInterfaceInfo.req_query /* istanbul ignore next */ || []
    // ).map(item => item.name)
    // const queryNamesLiteral = JSON.stringify(queryNames)
    // const queryNameType =
    //   queryNames.length === 0 ? 'string' : `'${queryNames.join("' | '")}'`

    // 转义标题中的 /
    const escapedTitle = String(extendedInterfaceInfo.title).replace(
      /\//g,
      '\\/',
    )

    // 接口标题
    const interfaceTitle = `[${escapedTitle}↗](${syntheticalConfig.serverUrl}/project/${extendedInterfaceInfo.project_id}/interface/api/${extendedInterfaceInfo._id})`

    // 接口摘要
    const interfaceSummary: Array<{
      label: string
      value: string | string[]
    }> = [
      {
        label: '分类',
        value: `[${extendedInterfaceInfo._category.name}↗](${syntheticalConfig.serverUrl}/project/${extendedInterfaceInfo.project_id}/interface/api/cat_${extendedInterfaceInfo.catid})`,
      },
      {
        label: '标签',
        value: extendedInterfaceInfo.tag.map(tag => `\`${tag}\``),
      },
      {
        label: '请求头',
        value: `\`${extendedInterfaceInfo.method.toUpperCase()} ${
          extendedInterfaceInfo.path
        }\``,
      },
      {
        label: '更新时间',
        value: process.env.JEST_WORKER_ID // 测试时使用 unix 时间戳
          ? String(extendedInterfaceInfo.up_time)
          : /* istanbul ignore next */
            `\`${dayjs(extendedInterfaceInfo.up_time * 1000).format(
              'YYYY-MM-DD HH:mm:ss',
            )}\``,
      },
    ]
    const interfaceExtraComments: string = interfaceSummary
      .filter(item => !isEmpty(item.value))
      .map(item => `* @${item.label} ${castArray(item.value).join(', ')}`)
      .join('\n')

    let requestParameters = ''
    if (isNotEmptyQuery) {
      requestParameters += `query:${requestQueryTypeName},`
    }
    if (isNotEmptyBody) {
      requestParameters += `body:${requestBodyTypeName},`
    }
    if (isNotEmptyParams) {
      requestParameters += `params:${requestParamsTypeName},`
    }

    // 如果params不存在，直接是path，如果存在，需要组装
    let requestPath = ''

    if (isNotEmptyParams) {
      // const paramNames = (
      //   extendedInterfaceInfo.req_params.sort(compare) /* istanbul ignore next */ || []
      // ).map(item => item.name)

      requestPath = pathArray.join('/')
      if (parametersArray.length) {
        for (let i = 0; i < parametersArray.length; i++) {
          const element = parametersArray[i]
          requestPath = `${requestPath}/\${params.${element}}`
        }
      }
      requestPath = JSON.stringify(requestPath)
    } else {
      requestPath = JSON.stringify(extendedInterfaceInfo.path)
    }

    // 路径前缀
    const prefix = syntheticalConfig.prefix

    return dedent`
      /**
       * 接口 ${interfaceTitle} 
       *
       ${interfaceExtraComments}
       */

      ${isNotEmptyQuery ? '/* **请求query类型** */' : ''}
			${isNotEmptyQuery ? requestQueryType.trim() : ''}
			
			${isNotEmptyBody ? '/* **请求body类型** */' : ''}
			${isNotEmptyBody ? requestBodyType.trim() : ''}
			
			${isNotEmptyParams ? '/* **请求params类型** */' : ''}
      ${isNotEmptyParams ? requestParamsType.trim() : ''}

      /* **返回类型** */
      ${responseDataType.trim()}

      ${
        syntheticalConfig.typesOnly
          ? ''
          : dedent`
            /* **请求函数** */
            export async function ${requestFunctionName}(${requestParameters}): Promise<any> {
              return request(\`${
                prefix ? `${prefix}/` : ''
              }${requestPath.replace(/"/g, '')}\`, {
								method: Method.${extendedInterfaceInfo.method},
								${isNotEmptyQuery ? 'params: query,' : ''}
								${isNotEmptyBody ? 'data: body,' : ''}
              });
            }
          `
      }
    `
  }

  async destroy() {
    return Promise.all(this.disposes.map(async dispose => dispose()))
  }
}
