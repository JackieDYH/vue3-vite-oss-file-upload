# vue3-vite-file-upload

- 阿里云 OSS 文件上传 速度限制 demo

## 插件安装

```
1、tailwindcss
  npm install -D tailwindcss postcss autoprefixer
  npx tailwindcss init -p
  配置转ts版本 tailwind.config
  npm install -D typescript @types/node

  npm install sass --save-dev

2、阿里云OSS插件
  npm install ali-oss
  npm install @types/ali-oss --save-dev
  - cdn链接https://gosspublic.alicdn.com/aliyun-oss-sdk-6.20.0.min.js

  [客户端直传](https://help.aliyun.com/zh/oss/use-cases/add-signatures-on-the-client-by-using-javascript-and-upload-data-to-oss?spm=a2c4g.11186623.0.i3#749191e1046mh)
  [速度限制](https://help.aliyun.com/zh/oss/developer-reference/single-connection-bandwidth-throttling-7?spm=a2c4g.11186623.0.i12)
  [速度限制2](https://www.alibabacloud.com/help/zh/oss/developer-reference/single-connection-bandwidth-throttling-3)


  [两种办法](https://github.com/ali-sdk/ali-oss/issues/1258)
  第一种：让ali-oss参与构建过程，这样就能将ts编译成js。

  export default defineNuxtConfig({
    build: {
      transpile: ['ali-oss']
    }
  })
  第二种，使用CDN window.OSS

  export default defineNuxtConfig({
    app: {
      head: {
        script: [
          { src: "http://gosspublic.alicdn.com/aliyun-oss-sdk-6.18.1.min.js" }
        ]
      },
  })
```

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```
