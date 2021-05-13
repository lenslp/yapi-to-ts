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

### 生成配置文件

```
yarn ytt makeUp
```

### 修改配置文件

打开当前目录下的 `ytt.config.{ts,js}` 配置文件，直接修改即可。

### 生成代码

```bash
# yarn
yarn ytt

#npm
npm ytt
```
