# End Type to Front Type

根据 [YApi](https://github.com/YMFE/yapi) 或 [Swagger](https://swagger.io/) 的接口定义生成 TypeScript/JavaScript 的接口类型及其请求函数代码。

## 特性

- 支持多服务器、多项目、多分类
- 支持预处理接口信息
- 可自定义类型或函数名称
- 完整的注释
- 支持生成 React Hooks 的请求代码
- 支持参数路径
- 支持上传文件
- 支持生成 JavaScript 代码
- 支持 Swagger

## 环境要求

- `Node >= 10.19.0`
- `YApi >= 1.5.12`

## 使用前提

切换内网源 http://npm.uniubi.com/

推荐使用`nrm`切换

## 安装

```bash
# yarn
yarn add end-type-to-front-type

# 或者，npm
npm i end-type-to-front-type --save
```

## 使用

`end-type-to-front-type` 基于当前目录下的 `moonPower.config.{ts,js}` 配置文件进行相关操作。

### 生成配置文件

为了方便记忆，初始化命令`moonPower makeup`来源于 :girl: 美少女战士变身时的口号，此处可以也理解为变身，生成`moonPower.config.{ts,js}`文件

使用命令 `moonPower makeup` 可在当前目录自动创建配置文件 `moonPower.config.{ts,js}`，如果配置文件已存在，将会询问你是否覆盖：

```bash
# yarn
yarn moonPower makeup

# 或者，npm
npx moonPower makeup
```

### 修改配置文件

打开当前目录下的 `moonPower.config.{ts,js}` 配置文件，直接修改即可。

### 生成代码

为了方便记忆，生成文件命令`moonPower`来源于 :girl: 美少女战士中的代表月亮消灭你，此处可以理解为发动终极技能，消灭了后端提供的接口文档，重生成为了前端的接口文档

直接执行命令 `moonPower` 即可抓取 `YApi` 的接口定义并生成相应的 `TypeScript`/`JavaScript` 代码：

```bash
# yarn
yarn moonPower

# 或者，npm
npx moonPower
```

## 配置

### 概论

从实质上而言，配置就是一个服务器列表，各个服务器又包含一个项目列表，各个项目下都有一个分类列表，其类型大致如此：

```ts
type Servers = Array<{
  projects: Array<{
    categories: Array<{
      // ...
    }>
  }>
}>

// 配置实质是一个服务器列表
type Config = Servers
```

因此，你可分别在 `服务器级别`、`项目级别`、`分类级别` 进行相关配置，如果不同级别存在相同的配置项，低级别的配置项会覆盖高级别的配置项，也就是说：

- 如果存在相同的配置项，`分类级别` 的配置会覆盖 `项目级别`、 `服务器级别` 的配置项；
- 如果存在相同的配置项，`项目级别` 的配置会覆盖 `服务器级别` 的配置项。

## V1.1.0 迭代

1. ⭐ 增加 params 参数接口
2. ⭐ 增加 restful 风格接口
3. 🌟 优化了 interface 逻辑
4. 🌟 优化了无入参时，无需填写参数

## V1.1.2 迭代

1. ⭐ 增加 query 和 params 的 number 和 boolean 类型指定

## V1.1.3 迭代

1. ⭐ 增加 restful 风格下请求函数名重复处理

## V1.1.4 迭代

1. ⭐ 增加 param 使用 by 连接
2. ⭐ 增加 prefix，使用于路径的前缀后端未填写的情况
3. 🌟 优化省略 param 参数，以及 repeat 为 true 时采取所有的路径拼接为函数名

## V1.1.5 迭代

1. 🌟 优化了识别 body 内容为数组的情况，无法生成的问题

## V1.1.6 迭代

1. 🌟 Response 内全部字段必然是存在的

## 许可

MIT (c) Zhao Yao
