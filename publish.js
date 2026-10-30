import { publish } from 'gh-pages'

console.log('正在发布，记得先运行 `npm run build`')
publish('dist', console.error)
