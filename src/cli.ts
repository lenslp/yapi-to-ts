#!/usr/bin/env node
import * as TSNode from 'ts-node'
import consola from 'consola'
import fs from 'fs-extra'
import ora from 'ora'
import path from 'path'
import prompt from 'prompts'
import { Config, ServerConfig } from './types'
import { dedent } from 'vtils'
import { Defined } from 'vtils/types'
import { Generator } from './Generator'

TSNode.register({
  // 不加载本地的 tsconfig.json
  skipProject: true,
  // 仅转译，不做类型检查
  transpileOnly: true,
  // 自定义编译选项
  compilerOptions: {
    strict: false,
    target: 'es2017',
    module: 'commonjs',
    moduleResolution: 'node',
    declaration: false,
    removeComments: false,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    importHelpers: false,
    // 转换 js，支持在 moonPower.config.js 里使用最新语法
    allowJs: true,
    lib: ['es2017'],
  },
})

export async function run(
  /* istanbul ignore next */
  cwd: string = process.cwd(),
) {
  const configTSFile = path.join(cwd, 'moonPower.config.ts')
  const configJSFile = path.join(cwd, 'moonPower.config.js')
  const configTSFileExist = await fs.pathExists(configTSFile)
  const configJSFileExist =
    !configTSFileExist && (await fs.pathExists(configJSFile))
  const configFileExist = configTSFileExist || configJSFileExist
  const configFile = configTSFileExist ? configTSFile : configJSFile

  const cmd = process.argv[2]

  if (cmd === 'help') {
    console.log(
      `\n${dedent`
        # 用法
          初始化配置文件: moonPower makeUp
          生成代码: moonPower
          查看帮助: moonPower help
      `}\n`,
    )
  } else if (cmd === 'makeup') {
    if (configFileExist) {
      consola.info(`检测到配置文件: ${configFile}`)
      const answers = await prompt({
        message: '是否覆盖已有配置文件?',
        name: 'override',
        type: 'confirm',
      })
      if (!answers.override) return
    }
    const answers = await prompt({
      message: '选择配置文件类型?',
      name: 'configFileType',
      type: 'select',
      choices: [
        { title: 'TypeScript(moonPower.config.ts)', value: 'ts' },
        { title: 'JavaScript(moonPower.config.js)', value: 'js' },
      ],
    })
    await fs.outputFile(
      answers.configFileType === 'js' ? configJSFile : configTSFile,
      dedent`
        import { defineConfig } from 'end-type-to-front-type'

        export default defineConfig([
          {
            serverUrl: 'http://yapi.uniubi.com:3000/',
            typesOnly: false,
            prefix: '', // 路径前缀
            restful: true, // 是否是restful风格的接口
            repeat: false, // 如果restful风格的接口情况下导致了接口函数名重复，请开启repeat为true
            boolean: [], // 由于yapi的query和params暂时不支持类型，所以只能手动输入，将你碰到的boolean类型的key值传入数组
            number: ['pageSize', 'pageNumber'], // 由于yapi的query和params暂时不支持类型，所以只能手动输入，将你碰到的number类型的key值传入数组
            target: '${(answers.configFileType === 'js'
              ? 'javascript'
              : 'typescript') as Defined<ServerConfig['target']>}',
            reactHooks: {
              enabled: false,
            },
            prodEnvName: 'local',
            outputFilePath: 'src/api/index.${answers.configFileType}',
            requestFunctionFilePath: 'src/api/request.${
              answers.configFileType
            }',
            dataKey: 'data',
            projects: [
              {
                token: '从yapi项目内的设置->token配置，拷贝token',
                categories: [
                  {
                    id: 0, // 这里是分类的id，如果是空数组，那么将会执行所有的分类，如果填了，那么将执行填写的分类。如果无特殊要求，建议传空数组
                    prefix: '', // 路径前缀
                    getRequestFunctionName(interfaceInfo, changeCase) {
                      // 这里是可以设置请求函数的名称，interfaceInfo.path可以获取到'/api/group'。如果无需自定义配置，建议删除
                      return changeCase.camelCase(
                        interfaceInfo.parsedPath.name,
                      )
                    },
                  },
                ],
              },
            ],
          },
        ])
      `,
    )
    consola.success('写入配置文件完毕')
  } else {
    if (!configFileExist) {
      return consola.error(`找不到配置文件: ${configTSFile} 或 ${configJSFile}`)
    }
    consola.success(`找到配置文件: ${configFile}`)
    let generator: Generator | undefined
    let spinner: ora.Ora | undefined
    try {
      const config: Config = require(configFile).default
      generator = new Generator(config, { cwd })

      spinner = ora('正在获取数据并生成代码...').start()
      await generator.prepare()
      const output = await generator.generate()
      spinner.stop()
      consola.success('获取数据并生成代码完毕')

      await generator.write(output)
      consola.success('写入文件完毕')
      await generator.destroy()
    } catch (err) {
      spinner?.stop()
      await generator?.destroy()
      /* istanbul ignore next */
      return consola.error(err)
    }
  }
}

/* istanbul ignore next */
if (require.main === module) {
  run()
}
