# Yapi To Ts

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

## 安装

```bash
# yarn
yarn add yapi-to-ts

# 或者，npm
npm i yapi-to-ts --save
```

### 修改配置文件

打开当前目录下的 `ytt.config.{ts,js}` 配置文件，直接修改即可。

### 生成代码

```bash
# yarn
yarn ytt

# 或者，npm
npx ytt
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
