<p align="center">
  <img src="https://raw.githubusercontent.com/svg24/.github/main/collection.svg" alt="SVG24">
</p>

<p align="center">
  A collection SVG logos for your next beautiful project.<br>Available as <a href="#vanilla">vanilla</a> SVG content, <a href="#react">React</a> and <a href="#vue">Vue</a> components.
<p>

## Introduction

The first step is to optimize the logo using SVGO — this is necessary in order to make the subsequent manual work more comfortable. The next step is manual optimization in the vector editor of what was not processed in the previous step. And finally, the logo once again optimize using SVGO with more gentle plugins.

For each logo has own directory, in which can be stored several versions. The name is formed according to the following mask: `snake-case-vYEARMONTHDAY`. For convenience, the build process creates a symbolic link (or exported component) without specifying version to the latest version.

```sh
packages
├─ vanilla
│  └─ github
│     ├─ github-v2008.svg
│     ├─ github-v2013.svg
│     └─ github.svg
└─ react/vue
   ├─ Github
   │  ├─ GithubV2008.csj
   │  ├─ GithubV2008.d.ts
   │  ├─ GithubV2008.js
   │  ├─ GithubV2013.csj
   │  ├─ GithubV2013.d.ts
   │  ├─ GithubV2013.js
   │  ├─ index.cjs
   │  ├─ index.d.ts
   │  └─ index.js
   ├─ index.cjs
   ├─ index.d.ts
   └─ index.js
```

## Usage

### Vanilla

Install package via npm.

```sh
npm i --save @svg24/vanilla
```

The contents of the package are stored in `./packages/vanilla`. Also can be browse on [UNPKG](https://unpkg.com/browse/@svg24/vanilla/).

### React

Before using, please note that this package supports React from version 16.8.0.

**Step 1:** install package via npm.

```sh
npm i --save @svg24/react
```

**Step 2:** import any logo into your component.

```js
import { Github } from '@svg24/react';

function Component() {
  return <Github className="logo" />;
}
```

The contents of the package can be browse on [UNPKG](https://unpkg.com/browse/@svg24/react/).

### Vue

Before using, please note that this package supports Vue 3.

**Step 1:** install package via npm.

```sh
npm i --save @svg24/vue
```

**Step 2:** import any logo into your component.

```vue
<template>
  <Github className="logo" />
</template>

<script setup>
import { Github } from '@svg24/vue';
</script>
```

The contents of the package can be browse on [UNPKG](https://unpkg.com/browse/@svg24/vue/).

## Support

Feel free suggest any logos to add to the collection via [email](mailto:vanyauhalin@gmail.com?subject=SVG24%20|%20New%20idea) or [issue](https://github.com/svg24/collection/issues).

## Policy

[MIT License](./LICENSE). All logos are the property of their respective owners. If you believe that your copyright has been infringed, please [contact me](mailto:vanyauhalin@gmail.com?subject=SVG24%20|%20Copyright%20infringe).
